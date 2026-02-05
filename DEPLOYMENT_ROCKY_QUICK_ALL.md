# Rocky Linux 快速部署（前端 + 后端 + MySQL）合并版

> 说明：本文件合并原有部署文档内容（快速开始 / 详细指南 / 一体化部署 / 前后端一体化 / 快速卡片 / 部署清单）。所有部署相关信息统一以本文件为准。

---

## 0. 一句话快速部署

```bash
ssh root@你的服务器IP
cd /root/attendance-project-v4
chmod +x deploy-rocky.sh
sudo ./deploy-rocky.sh
```

脚本会自动安装 Node.js / MySQL / Nginx、初始化数据库、部署前后端并配置防火墙。

---

## 1. 快速开始（3 步）

### 1.1 上传项目（本地执行）

```bash
scp -r attendance-project-v4 root@服务器IP:/root/
```

### 1.2 运行脚本（服务器执行）

```bash
ssh root@服务器IP
cd /root/attendance-project-v4
chmod +x deploy-rocky.sh
sudo ./deploy-rocky.sh
```

脚本会询问：
1. MySQL root 密码（默认：attendance2024）
2. 域名或 IP（例：192.168.1.100）

### 1.3 验证部署

```bash
# 浏览器访问
http://你的服务器IP

# 服务状态
systemctl status attendance-server nginx mysqld
```

默认账号：admin / admin123

---

## 2. 部署架构（同机一体化）

```
Rocky Linux 8.5 服务器
├── Nginx (端口 80/443)
│   ├── 前端静态文件
│   └── /api 反向代理到后端
├── Node.js 后端 (端口 3000，仅内部访问)
└── MySQL 数据库 (端口 3306，仅本地访问)
```

---

## 3. 手动部署（不使用脚本）

### 3.1 系统准备

```bash
sudo -i
dnf update -y

dnf module enable nodejs:18 -y
dnf install -y nodejs nginx mysql-server git curl wget
node -v
npm -v
```

### 3.2 启动并配置 MySQL

```bash
systemctl enable --now mysqld
mysqladmin -u root password '你的密码'
```

创建数据库与用户：

```bash
mysql -u root -p << EOF
CREATE DATABASE church_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'church_user'@'%' IDENTIFIED BY 'App@2026#Pwd';
GRANT ALL PRIVILEGES ON church_db.* TO 'church_user'@'%';
FLUSH PRIVILEGES;
EOF
```

初始化表结构：

```bash
mysql -u root -p church_db < /root/attendance-project-v4/server/sql/init.sql
```

### 3.3 部署后端

```bash
mkdir -p /opt/attendance-system
cp -r /root/attendance-project-v4/server /opt/attendance-system/
cd /opt/attendance-system/server
npm install --production
```

创建 .env：

```bash
cat > /opt/attendance-system/server/.env << EOF
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=你的密码
DB_NAME=church_db
NODE_ENV=production
PORT=3000
EOF
```

### 3.4 systemd 服务

```bash
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
Environment="NODE_ENV=production"

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable --now attendance-server
systemctl status attendance-server
```

### 3.5 部署前端

```bash
mkdir -p /var/www/attendance-system
# 直接复制构建产物
cp -r /root/attendance-project-v4/client/dist/* /var/www/attendance-system/
chown -R nobody:nobody /var/www/attendance-system
chmod -R 755 /var/www/attendance-system
```

### 3.6 配置 Nginx

```bash
cat > /etc/nginx/conf.d/attendance.conf << 'EOF'
server {
    listen 80;
    server_name your-domain.com;

    location / {
        root /var/www/attendance-system;
        try_files $uri $uri/ /index.html;
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 30d;
            add_header Cache-Control "public, immutable";
        }
    }

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

nginx -t
systemctl enable --now nginx
```

### 3.7 防火墙

```bash
systemctl enable --now firewalld
firewall-cmd --permanent --add-service=http
firewall-cmd --permanent --add-service=https
firewall-cmd --reload
```

---

## 4. 验证与排查

### 4.1 验证

```bash
curl http://localhost
curl http://localhost/api/admin/login
systemctl status attendance-server nginx mysqld
```

### 4.2 常见问题

- **前端无法访问**：检查 Nginx、防火墙、/var/www/attendance-system 是否有文件
- **API 502**：检查后端服务、端口 3000、日志
- **数据库连接失败**：检查 MySQL 状态与后端 .env

常用日志：

```bash
journalctl -u attendance-server -f
journalctl -u mysqld -n 50
 tail -f /var/log/nginx/error.log
```

---

## 5. SSL（可选）

```bash
dnf install certbot certbot-nginx -y
certbot --nginx -d your-domain.com
```

---

## 6. 备份与维护

### 数据库备份

```bash
mysqldump -u root -p church_db > backup_$(date +%F).sql
```

### 更新前端

```bash
cd client
npm run build
scp -r client/dist/* root@服务器IP:/var/www/attendance-system/
```

### 更新后端

```bash
scp -r server/ root@服务器IP:/tmp/new-server
ssh root@服务器IP
cp -r /opt/attendance-system/server /opt/attendance-system/server.bak
rm -rf /opt/attendance-system/server
mv /tmp/new-server /opt/attendance-system/server
cd /opt/attendance-system/server
npm install --production
systemctl restart attendance-server
```

---

## 7. 部署清单（简版）

- [ ] Rocky Linux 8.5+ 可用
- [ ] 2GB+ 内存、20GB+ 磁盘
- [ ] 端口 80/443 开放
- [ ] MySQL 正常运行
- [ ] 后端服务运行
- [ ] Nginx 代理正常
- [ ] 前端可访问

---

## 8. 说明

本文件已合并以下文档内容并统一维护：
- DEPLOYMENT_QUICK_START.md
- DEPLOYMENT_GUIDE.md
- DEPLOYMENT_INTEGRATED.md
- DEPLOYMENT_FRONTEND_BACKEND.md
- DEPLOYMENT_ROCKY_GUIDE.md
- DEPLOYMENT_QUICK_CARD.md
- DEPLOYMENT_CHECKLIST.md
- DEPLOYMENT_ROCKY_ALL_IN_ONE.md

如需更细节信息，请直接在本文件内搜索对应关键字。