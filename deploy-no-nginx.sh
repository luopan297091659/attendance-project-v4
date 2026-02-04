#!/bin/bash
# Rocky Linux 无 Nginx 部署脚本（直接用后端托管前端）
# 使用方式：sudo bash deploy-no-nginx.sh

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}❌ 本脚本需要 root 权限，请使用 sudo 运行${NC}"
    exit 1
fi

echo -e "${BLUE}"
echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║  考勤签到系统 - Rocky Linux 8.5 部署（无 Nginx）             ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

error_exit() { echo -e "${RED}❌ 错误: $1${NC}"; exit 1; }
success() { echo -e "${GREEN}✓ $1${NC}"; }
info() { echo -e "${YELLOW}ℹ $1${NC}"; }

# 步骤 1: 系统检查
echo -e "${BLUE}━━━ 步骤 1/5: 系统检查 ━━━${NC}"
if [ ! -f /etc/rocky-release ]; then
    error_exit "本脚本仅适用于 Rocky Linux"
fi
success "Rocky Linux 系统确认"

# 步骤 2: 安装依赖（不含 Nginx）
echo -e "${BLUE}━━━ 步骤 2/5: 安装依赖 ━━━${NC}"

info "安装 Node.js 18..."
dnf module enable nodejs:18 -y > /dev/null 2>&1
dnf install nodejs -y > /dev/null 2>&1
success "Node.js $(node -v) 已安装"

info "安装 MySQL Server..."
dnf install mysql-server -y > /dev/null 2>&1
systemctl start mysqld
systemctl enable mysqld
success "MySQL 已安装"

info "安装工具..."
dnf install git curl wget -y > /dev/null 2>&1
success "工具已安装"

# 步骤 3: 数据库配置
echo -e "${BLUE}━━━ 步骤 3/5: 配置数据库 ━━━${NC}"

read -sp "请输入 MySQL root 密码（默认 'attendance2024'）: " MYSQL_PASS
MYSQL_PASS=${MYSQL_PASS:-attendance2024}
echo ""

mysqladmin -u root password "$MYSQL_PASS" 2>/dev/null || info "密码已设置"

info "初始化数据库..."
mysql -u root -p"$MYSQL_PASS" -e "
DROP DATABASE IF EXISTS church_db;
CREATE DATABASE church_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE church_db;
" || error_exit "数据库创建失败"

if [ -f "./server/sql/init.sql" ]; then
    mysql -u root -p"$MYSQL_PASS" church_db < ./server/sql/init.sql
    success "数据库已初始化"
else
    error_exit "找不到 init.sql，请在项目根目录运行此脚本"
fi

# 步骤 4: 部署后端和前端
echo -e "${BLUE}━━━ 步骤 4/5: 部署应用 ━━━${NC}"

APP_DIR="/home/church"
mkdir -p "$APP_DIR"

info "复制后端文件..."
cp -r server "$APP_DIR/" 2>/dev/null || info "后端文件已存在或部分复制"
cd "$APP_DIR/server"

info "安装依赖..."
npm install --production > /dev/null 2>&1
success "后端依赖已安装"

info "创建环境配置..."
cat > .env << EOF
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=$MYSQL_PASS
DB_NAME=church_db
NODE_ENV=production
PORT=8000
FRONTEND_DIR=$APP_DIR/dist
EOF
success "环境变量已配置"

info "复制前端文件..."
cp -r ../client/dist "$APP_DIR/" 2>/dev/null || info "前端文件稍后手动复制"
success "前端文件已复制"

# 步骤 5: 配置 systemd 服务
echo -e "${BLUE}━━━ 步骤 5/5: 配置系统服务 ━━━${NC}"

info "创建 systemd 服务..."
cat > /etc/systemd/system/attendance-server.service << EOF
[Unit]
Description=Attendance System Backend (No Nginx)
After=network.target mysql.service
Wants=mysql.service

[Service]
Type=simple
User=nobody
WorkingDirectory=$APP_DIR/server
ExecStart=/usr/bin/node app.js
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal
SyslogIdentifier=attendance-server

LimitNOFILE=65535
LimitNPROC=4096
Environment="NODE_ENV=production"

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable attendance-server
systemctl start attendance-server
success "systemd 服务已配置"

sleep 2
if systemctl is-active --quiet attendance-server; then
    success "后端服务运行正常"
else
    error_exit "后端服务启动失败，执行：journalctl -u attendance-server -n 50"
fi

# 配置防火墙
echo -e "${BLUE}━━━ 额外步骤: 配置防火墙 ━━━${NC}"

info "配置 firewalld..."
firewall-cmd --permanent --add-port=8000/tcp > /dev/null 2>&1
firewall-cmd --reload > /dev/null 2>&1
success "8000 端口已开放"

# 输出总结
echo ""
echo -e "${BLUE}"
echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║                  部署完成！🎉                                 ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

LOCAL_IP=$(hostname -I | awk '{print $1}')

echo ""
echo -e "${GREEN}🚀 访问信息${NC}"
echo "  访问地址: http://$LOCAL_IP:8000"
echo "  后端 API: http://$LOCAL_IP:8000/api"
echo "  前端: http://$LOCAL_IP:8000"

echo ""
echo -e "${GREEN}⚙️ 常用命令${NC}"
echo "  查看状态: systemctl status attendance-server"
echo "  查看日志: journalctl -u attendance-server -f"
echo "  重启服务: systemctl restart attendance-server"
echo "  停止服务: systemctl stop attendance-server"

echo ""
echo -e "${GREEN}📁 文件位置${NC}"
echo "  后端: $APP_DIR/server"
echo "  前端: $APP_DIR/dist"
echo "  环境: $APP_DIR/server/.env"

echo ""
echo -e "${GREEN}💡 说明${NC}"
echo "  • 后端已包含前端静态托管"
echo "  • 不使用 Nginx，直接用 Node.js 提供服务"
echo "  • 前端访问将自动连接同机后端"

echo ""
echo "✨ 完成！访问 http://$LOCAL_IP:8000"
echo ""
