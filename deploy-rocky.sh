#!/bin/bash

# 考勤签到系统 - Rocky Linux 8.5 部署脚本
# 使用方式：sudo bash deploy-rocky.sh

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 检查是否以 root 运行
if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}❌ 本脚本需要 root 权限，请使用 sudo 运行${NC}"
    exit 1
fi

# 打印标题
echo -e "${BLUE}"
echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║  考勤签到系统 - Rocky Linux 8.5 部署脚本 v4.0               ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# 错误处理
error_exit() {
    echo -e "${RED}❌ 错误: $1${NC}"
    exit 1
}

success() {
    echo -e "${GREEN}✓ $1${NC}"
}

info() {
    echo -e "${YELLOW}ℹ $1${NC}"
}

# 步骤 1: 系统环境检查和更新
echo ""
echo -e "${BLUE}━━━ 步骤 1/7: 系统检查和更新 ━━━${NC}"

if [ -f /etc/rocky-release ]; then
    ROCKY_VERSION=$(cat /etc/rocky-release)
    success "检测到 Rocky Linux: $ROCKY_VERSION"
else
    error_exit "本脚本仅适用于 Rocky Linux 系统"
fi

info "更新系统包..."
dnf update -y > /dev/null 2>&1
success "系统已更新"

# 步骤 2: 安装依赖
echo ""
echo -e "${BLUE}━━━ 步骤 2/7: 安装依赖软件 ━━━${NC}"

info "安装 Node.js 18..."
dnf module enable nodejs:18 -y > /dev/null 2>&1
dnf install nodejs -y > /dev/null 2>&1
success "Node.js $(node -v) 已安装"

info "安装 MySQL Server..."
dnf install mysql-server -y > /dev/null 2>&1
systemctl start mysqld
systemctl enable mysqld
success "MySQL 已安装并启动"

info "安装 Nginx..."
dnf install nginx -y > /dev/null 2>&1
systemctl enable nginx
success "Nginx 已安装"

info "安装其他工具..."
dnf install git curl wget -y > /dev/null 2>&1
success "工具已安装"

# 步骤 3: 创建应用目录
echo ""
echo -e "${BLUE}━━━ 步骤 3/7: 创建应用目录 ━━━${NC}"

APP_DIR="/opt/attendance-system"
if [ ! -d "$APP_DIR" ]; then
    mkdir -p "$APP_DIR"
    success "应用目录已创建: $APP_DIR"
else
    info "应用目录已存在"
fi

# 步骤 4: 配置 MySQL
echo ""
echo -e "${BLUE}━━━ 步骤 4/7: 配置数据库 ━━━${NC}"

read -sp "请输入 MySQL root 密码（留空使用默认密码 'attendance2024'）: " MYSQL_PASS
MYSQL_PASS=${MYSQL_PASS:-attendance2024}
echo ""

# 设置 MySQL root 密码
mysqladmin -u root password "$MYSQL_PASS" 2>/dev/null || info "密码已设置"

info "初始化数据库..."
mysql -u root -p"$MYSQL_PASS" -e "
DROP DATABASE IF EXISTS church_db;
CREATE DATABASE church_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE church_db;
" || error_exit "数据库创建失败"

# 导入初始化脚本（假设在当前目录）
if [ -f "./server/sql/init.sql" ]; then
    mysql -u root -p"$MYSQL_PASS" church_db < ./server/sql/init.sql
    success "数据库已初始化"
else
    error_exit "找不到 init.sql 文件，请在项目根目录运行此脚本"
fi

# 步骤 5: 部署后端
echo ""
echo -e "${BLUE}━━━ 步骤 5/7: 部署后端应用 ━━━${NC}"

info "复制应用文件..."
cp -r server "$APP_DIR/"
success "后端文件已复制"

cd "$APP_DIR/server"

info "安装 Node.js 依赖..."
npm install --production > /dev/null 2>&1
success "依赖已安装"

info "创建环境配置..."
cat > .env << EOF
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=6586156
DB_NAME=church_db
NODE_ENV=production
PORT=8000
EOF
success "环境变量已配置"

# 步骤 6: 配置 systemd 服务
echo ""
echo -e "${BLUE}━━━ 步骤 6/7: 配置系统服务 ━━━${NC}"

info "创建 systemd 服务文件..."
cat > /etc/systemd/system/attendance-server.service << 'EOF'
[Unit]
Description=Attendance System Backend
After=network.target mysql.service
Wants=mysql.service

[Service]
Type=simple
User=nobody
WorkingDirectory=/opt/attendance-system/server
ExecStart=/usr/bin/node app.js
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal
SyslogIdentifier=attendance-server

# 资源限制
LimitNOFILE=65535
LimitNPROC=4096

# 环保设置
Environment="NODE_ENV=production"

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable attendance-server
systemctl start attendance-server
success "systemd 服务已配置"

info "检查服务状态..."
sleep 2
if systemctl is-active --quiet attendance-server; then
    success "后端服务运行正常"
else
    error_exit "后端服务启动失败，请检查日志: journalctl -u attendance-server -n 50"
fi

# 步骤 7: 配置 Nginx
echo ""
echo -e "${BLUE}━━━ 步骤 7/7: 配置 Web 服务器 ━━━${NC}"

read -p "请输入你的域名（或 IP 地址）: " DOMAIN

info "部署前端文件..."
FRONT_DIR="/var/www/attendance-system"
mkdir -p "$FRONT_DIR"
cp -r client/dist/* "$FRONT_DIR/" 2>/dev/null || info "前端文件暂未部署，请稍后手动上传"

info "创建 Nginx 配置..."
cat > /etc/nginx/conf.d/attendance.conf << EOF
# Attendance System - Nginx Configuration

# HTTP 重定向到 HTTPS（可选）
# server {
#     listen 80;
#     server_name $DOMAIN;
#     return 301 https://\$server_name\$request_uri;
# }

# 主服务器块
server {
    listen 80;
    server_name $DOMAIN;
    
    # 客户端最大请求体大小
    client_max_body_size 10M;
    
    # 前端静态文件
    location / {
        root $FRONT_DIR;
        try_files \$uri \$uri/ /index.html;
        
        # 静态文件缓存
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 30d;
            add_header Cache-Control "public, immutable";
        }
    }
    
    # API 代理
    location /api {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        
        # WebSocket 支持
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        
        # HTTP 头部
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        
        # 超时设置
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
        
        # 缓冲设置
        proxy_buffering on;
        proxy_buffer_size 4k;
        proxy_buffers 8 4k;
    }
    
    # Gzip 压缩
    gzip on;
    gzip_types text/plain text/css text/javascript application/json application/javascript text/xml application/xml;
    gzip_min_length 1000;
    gzip_level 6;
}
EOF

info "测试 Nginx 配置..."
nginx -t > /dev/null 2>&1 || error_exit "Nginx 配置有误"

systemctl reload nginx
success "Nginx 已配置并重载"

# 步骤 8: 配置防火墙
echo ""
echo -e "${BLUE}━━━ 额外步骤: 配置防火墙 ━━━${NC}"

info "配置 firewalld..."
firewall-cmd --permanent --add-service=http > /dev/null 2>&1
firewall-cmd --permanent --add-service=https > /dev/null 2>&1
firewall-cmd --reload > /dev/null 2>&1
success "防火墙已配置"

info "开放必要的端口..."
firewall-cmd --permanent --add-port=3000/tcp > /dev/null 2>&1 || true
firewall-cmd --reload > /dev/null 2>&1
success "端口已开放"

# 输出总结
echo ""
echo -e "${BLUE}"
echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║                  部署完成！🎉                                 ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

echo ""
echo -e "${GREEN}📊 系统信息${NC}"
echo "  Rocky Linux: $(cat /etc/rocky-release)"
echo "  Node.js: $(node -v)"
echo "  npm: $(npm -v)"
echo "  MySQL: $(mysql --version)"
echo "  Nginx: $(nginx -v 2>&1 | cut -d' ' -f3)"

echo ""
echo -e "${GREEN}🚀 服务状态${NC}"
systemctl status attendance-server --no-pager | grep -E "Active|running" || echo "  [待检查]"
systemctl status nginx --no-pager | grep -E "Active|running" || echo "  [待检查]"
systemctl status mysqld --no-pager | grep -E "Active|running" || echo "  [待检查]"

echo ""
echo -e "${GREEN}📍 访问地址${NC}"
echo "  🌐 前端: http://$DOMAIN"
echo "  🔌 后端: http://$DOMAIN/api"
echo "  📊 直连后端: http://$(hostname -I | awk '{print $1}'):3000"

echo ""
echo -e "${GREEN}⚙️  常用命令${NC}"
echo "  查看后端日志:"
echo "    journalctl -u attendance-server -f"
echo ""
echo "  重启后端服务:"
echo "    systemctl restart attendance-server"
echo ""
echo "  查看 Nginx 日志:"
echo "    tail -f /var/log/nginx/access.log"
echo "    tail -f /var/log/nginx/error.log"
echo ""
echo "  MySQL 管理:"
echo "    mysql -u root -p"
echo ""
echo "  更新前端文件:"
echo "    cp -r /path/to/client/dist/* $FRONT_DIR/"
echo ""

echo -e "${GREEN}📝 重要配置文件${NC}"
echo "  后端: $APP_DIR/server"
echo "  前端: $FRONT_DIR"
echo "  Nginx: /etc/nginx/conf.d/attendance.conf"
echo "  systemd: /etc/systemd/system/attendance-server.service"
echo "  MySQL: /var/lib/mysql"

echo ""
echo -e "${GREEN}🔐 安全建议${NC}"
echo "  1. 立即修改 MySQL root 密码"
echo "  2. 配置 SSL 证书 (Let's Encrypt):"
echo "     dnf install certbot certbot-nginx"
echo "     certbot --nginx -d $DOMAIN"
echo "  3. 启用 SELinux 保护"
echo "  4. 定期备份数据库"
echo "  5. 配置日志轮转"

echo ""
echo -e "${YELLOW}⚠️  下一步${NC}"
echo "  1. 上传前端文件到 $FRONT_DIR"
echo "  2. 配置 SSL 证书（推荐）"
echo "  3. 测试应用访问: http://$DOMAIN"
echo "  4. 查看日志: journalctl -u attendance-server -f"

echo ""
echo "✨ 部署完成！详见: /opt/attendance-system"
echo ""
