# Rocky Linux 8.5 部署指南

## 系统要求
- **操作系统**：Rocky Linux 8.5+ / RHEL 8.5+
- **CPU**：2 核心或以上
- **内存**：2GB 或以上
- **磁盘**：20GB 或以上
- **网络**：静态 IP 地址（推荐）

## 快速部署

### 方法 1：一键部署脚本（推荐）

```bash
# 1. 以 root 身份登录或使用 sudo
sudo -i

# 2. 下载项目（如果还未上传）
git clone <your-repo> /root/attendance-project
cd /root/attendance-project

# 3. 运行部署脚本
chmod +x deploy-rocky.sh
./deploy-rocky.sh
```

脚本会自动完成以下操作：
- ✅ 更新系统
- ✅ 安装 Node.js 18、MySQL、Nginx
- ✅ 初始化数据库
- ✅ 部署后端应用
- ✅ 配置 systemd 服务
- ✅ 配置 Nginx 反向代理
- ✅ 配置防火墙

### 方法 2：手动部署

#### 2.1 系统准备

```bash
# 以 root 身份运行
sudo -i

# 更新系统
dnf update -y

# 安装 Node.js 18
dnf module enable nodejs:18 -y
dnf install nodejs -y

# 验证安装
node -v  # v18.x.x
npm -v   # 9.x.x
```

#### 2.2 数据库安装

```bash
# 安装 MySQL Server
dnf install mysql-server -y

# 启动并启用 MySQL
systemctl start mysqld
systemctl enable mysqld

# 设置 root 密码
mysqladmin -u root password 'your_secure_password'

# 测试连接
mysql -u root -p -e "SELECT VERSION();"
```

#### 2.3 初始化数据库

```bash
# 创建数据库
mysql -u root -p << EOF
CREATE DATABASE church_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
EXIT;
EOF

# 导入初始化脚本
mysql -u root -p church_db < /path/to/server/sql/init.sql
```

#### 2.4 部署后端

```bash
# 创建应用目录
mkdir -p /opt/attendance-system
cd /opt/attendance-system

# 复制后端代码
cp -r /path/to/server /opt/attendance-system/

cd /opt/attendance-system/server

# 安装 Node.js 依赖
npm install --production

# 创建环境配置文件
cat > .env << EOF
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_secure_password
DB_NAME=church_db
NODE_ENV=production
PORT=3000
EOF

# 修改权限
chown -R nobody:nobody /opt/attendance-system
chmod -R 755 /opt/attendance-system
```

#### 2.5 配置 systemd 服务

```bash
# 创建服务文件
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

LimitNOFILE=65535
LimitNPROC=4096

Environment="NODE_ENV=production"

[Install]
WantedBy=multi-user.target
EOF

# 启用并启动服务
systemctl daemon-reload
systemctl enable attendance-server
systemctl start attendance-server

# 检查状态
systemctl status attendance-server
```

#### 2.6 安装和配置 Nginx

```bash
# 安装 Nginx
dnf install nginx -y

# 创建前端目录
mkdir -p /var/www/attendance-system

# 上传前端文件
# cp -r /path/to/client/dist/* /var/www/attendance-system/

# 创建 Nginx 配置
cat > /etc/nginx/conf.d/attendance.conf << 'EOF'
server {
    listen 80;
    server_name your-domain.com;
    
    client_max_body_size 10M;
    
    # 前端
    location / {
        root /var/www/attendance-system;
        try_files $uri $uri/ /index.html;
        
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 30d;
            add_header Cache-Control "public, immutable";
        }
    }
    
    # API 代理
    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    gzip on;
    gzip_types text/plain text/css text/javascript application/json;
    gzip_min_length 1000;
}
EOF

# 测试配置
nginx -t

# 启用并启动
systemctl enable nginx
systemctl start nginx
```

#### 2.7 配置防火墙

```bash
# 启用防火墙
systemctl enable firewalld
systemctl start firewalld

# 开放 HTTP/HTTPS
firewall-cmd --permanent --add-service=http
firewall-cmd --permanent --add-service=https

# 开放后端端口（可选，仅内部访问）
firewall-cmd --permanent --add-port=3000/tcp

# 重载防火墙
firewall-cmd --reload

# 验证开放的端口
firewall-cmd --list-all
```

## SSL 证书配置（可选但推荐）

### 使用 Let's Encrypt 和 Certbot

```bash
# 安装 Certbot
dnf install certbot certbot-nginx -y

# 获取证书
certbot --nginx -d your-domain.com

# 自动续期
systemctl enable certbot-renew
systemctl start certbot-renew
```

### 手动更新 Nginx 配置

```bash
cat >> /etc/nginx/conf.d/attendance.conf << 'EOF'

# HTTPS 重定向
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;
    
    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
    
    # ... 其他配置
}
EOF

nginx -t && systemctl reload nginx
```

## 日志和监控

### 查看后端日志

```bash
# 实时日志
journalctl -u attendance-server -f

# 查看最后 50 行
journalctl -u attendance-server -n 50

# 查看指定时间的日志
journalctl -u attendance-server --since "2024-02-01 08:00:00"
```

### 查看 Nginx 日志

```bash
# 访问日志
tail -f /var/log/nginx/access.log

# 错误日志
tail -f /var/log/nginx/error.log
```

### 查看 MySQL 日志

```bash
# 错误日志
tail -f /var/log/mysql/error.log

# 常用命令
mysql -u root -p -e "SHOW VARIABLES LIKE 'log%';"
```

## 数据库备份

### 自动备份脚本

```bash
# 创建备份脚本
cat > /usr/local/bin/backup-db.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/var/backups/mysql"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR
mysqldump -u root -p'password' church_db > $BACKUP_DIR/church_db_$DATE.sql
gzip $BACKUP_DIR/church_db_$DATE.sql

# 保留 30 天的备份
find $BACKUP_DIR -name "*.sql.gz" -mtime +30 -delete

echo "Backup completed at $(date)" >> /var/log/backup.log
EOF

chmod +x /usr/local/bin/backup-db.sh

# 配置 cron 定时备份（每天凌晨 2 点）
echo "0 2 * * * /usr/local/bin/backup-db.sh" | crontab -
```

### 手动备份

```bash
# 完整备份
mysqldump -u root -p church_db > church_db_backup.sql

# 带时间戳
mysqldump -u root -p church_db > church_db_$(date +%Y%m%d_%H%M%S).sql

# 恢复备份
mysql -u root -p church_db < church_db_backup.sql
```

## 常见问题排查

### 后端服务无法启动

```bash
# 查看详细错误
journalctl -u attendance-server -n 100

# 手动运行以查看错误
cd /opt/attendance-system/server
node app.js

# 检查端口占用
netstat -tlnp | grep 3000
# 或
ss -tlnp | grep 3000

# 杀死占用进程
kill -9 <PID>
```

### 数据库连接失败

```bash
# 检查 MySQL 状态
systemctl status mysqld

# 重启 MySQL
systemctl restart mysqld

# 检查连接
mysql -u root -p -e "SELECT VERSION();"

# 检查用户和权限
mysql -u root -p -e "SELECT User, Host FROM mysql.user;"
```

### Nginx 无法反向代理

```bash
# 检查 Nginx 配置
nginx -t

# 重载 Nginx
systemctl reload nginx

# 检查 SELinux（如果启用）
setsebool httpd_can_network_relay on -P

# 查看 SELinux 错误
tail -f /var/log/audit/audit.log | grep nginx
```

### SELinux 问题

```bash
# 查看 SELinux 状态
getenforce

# 暂时禁用 SELinux（仅用于测试）
setenforce 0

# 永久禁用（不推荐）
# 编辑 /etc/selinux/config 并设置 SELINUX=disabled

# 为应用配置 SELinux 权限
semanage fcontext -a -t httpd_sys_rw_content_t "/opt/attendance-system(/.*)?"
restorecon -Rv /opt/attendance-system
```

## 性能优化

### MySQL 优化

```sql
-- 创建索引
CREATE INDEX idx_employee_phone ON employees(phone);
CREATE INDEX idx_attendance_church ON attendance(church_id);
CREATE INDEX idx_attendance_date ON attendance(sign_time);

-- 查看索引
SHOW INDEXES FROM attendance;

-- 优化表
OPTIMIZE TABLE employees, attendance, companies;
```

### Nginx 优化

```nginx
# 在 /etc/nginx/nginx.conf 中修改

worker_processes auto;
worker_connections 2048;

# 启用缓存
proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=cache:10m max_size=1g;

location /api {
    proxy_cache cache;
    proxy_cache_valid 200 1h;
}
```

### Node.js 优化

```bash
# 在 systemd 服务中增加

ExecStart=/usr/bin/node --max-old-space-size=2048 app.js
```

## 升级和维护

### 更新 Node.js

```bash
# 安装新版本
dnf module enable nodejs:20 -y
dnf install nodejs -y

# 重启后端服务
systemctl restart attendance-server
```

### 更新前端

```bash
# 构建新版本
cd /path/to/client
npm install
npm run build

# 部署
rm -rf /var/www/attendance-system/*
cp -r dist/* /var/www/attendance-system/

# 清除浏览器缓存指导
echo "部署完成，请清除浏览器缓存"
```

## 监控和告警

### 使用 systemd-analyze 检查启动时间

```bash
systemd-analyze
systemd-analyze blame
```

### 使用 top/htop 监控资源

```bash
# 实时监控
top

# 或使用友好的 htop（需安装）
dnf install htop -y
htop
```

## 支持和反馈

- 📧 邮件：support@example.com
- 🌐 文档：https://docs.example.com
- 💬 论坛：https://forum.example.com

---

**最后更新**：2026-02-02  
**版本**：v4.0.0  
**兼容性**：Rocky Linux 8.5+，RHEL 8.5+，CentOS 8+
