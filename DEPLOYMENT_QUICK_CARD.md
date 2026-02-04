# 部署快速参考卡片

## 三步快速部署

### 📤 第 1 步：上传项目（本地执行）

```bash
scp -r attendance-project-v4 root@服务器IP:/root/
```

### 🚀 第 2 步：运行脚本（服务器执行）

```bash
ssh root@服务器IP
cd /root/attendance-project-v4
chmod +x deploy-rocky.sh
sudo ./deploy-rocky.sh
```

**脚本会询问：**
1. MySQL 密码（默认: `attendance2024`）
2. 域名或 IP 地址（例: `192.168.1.100`）

### ✅ 第 3 步：验证部署

```bash
# 方式 1: 浏览器访问
http://你的-服务器-IP

# 方式 2: 命令行测试
ssh root@服务器IP
systemctl status attendance-server
systemctl status nginx
systemctl status mysqld
```

---

## 部署架构

```
┌─────────────────────────────────────────┐
│  用户浏览器 http://服务器IP              │
└────────────┬────────────────────────────┘
             │
             ↓
┌─────────────────────────────────────────┐
│  Nginx Web 服务器 (端口 80)             │
│  ├─ 提供前端: /var/www/attendance-system│
│  └─ 代理 API: → localhost:3000          │
└────────────┬────────────────────────────┘
             │
             ↓
┌─────────────────────────────────────────┐
│  Node.js 后端 (端口 3000, 仅内部)      │
│  /opt/attendance-system/server          │
└────────────┬────────────────────────────┘
             │
             ↓
┌─────────────────────────────────────────┐
│  MySQL 数据库 (端口 3306, 仅本地)      │
│  DATABASE: church_db                    │
└─────────────────────────────────────────┘
```

---

## 部署文件位置

| 组件 | 位置 |
|------|------|
| **前端文件** | `/var/www/attendance-system/` |
| **后端应用** | `/opt/attendance-system/server/` |
| **数据库文件** | `/var/lib/mysql/church_db` |
| **Nginx 配置** | `/etc/nginx/conf.d/attendance.conf` |
| **systemd 服务** | `/etc/systemd/system/attendance-server.service` |

---

## 服务管理命令

### 查看状态

```bash
# 后端服务
systemctl status attendance-server

# Nginx
systemctl status nginx

# MySQL
systemctl status mysqld

# 全部状态
systemctl status attendance-server nginx mysqld
```

### 启动/停止/重启

```bash
# 重启后端
systemctl restart attendance-server

# 重启 Nginx
systemctl restart nginx

# 重启 MySQL
systemctl restart mysqld

# 重启所有
systemctl restart attendance-server nginx mysqld
```

### 查看日志

```bash
# 后端日志（实时）
journalctl -u attendance-server -f

# 后端日志（最近 50 条）
journalctl -u attendance-server -n 50

# Nginx 错误日志
tail -f /var/log/nginx/error.log

# Nginx 访问日志
tail -f /var/log/nginx/access.log

# MySQL 日志
tail -f /var/log/mysql/error.log
```

---

## 默认登录账户

| 项目 | 值 |
|------|------|
| **用户名** | `admin` |
| **密码** | `admin123` |
| **URL** | `http://你的-服务器-IP` |

---

## 常见问题快速检查

| 问题 | 检查命令 |
|------|---------|
| 无法访问前端 | `curl http://localhost` |
| API 返回 502 | `systemctl status attendance-server` |
| 数据库连接失败 | `mysql -u root -p -e "USE church_db;"` |
| Nginx 配置错误 | `nginx -t` |
| 端口被占用 | `netstat -tlnp \| grep 3000` |

---

## 防火墙规则

部署脚本已自动配置，但可以手动检查：

```bash
# 查看防火墙规则
firewall-cmd --list-all

# 手动打开 HTTP
firewall-cmd --permanent --add-service=http
firewall-cmd --reload

# 手动打开 HTTPS（如需）
firewall-cmd --permanent --add-service=https
firewall-cmd --reload
```

---

## 更新前端代码

```bash
# 1. 本地构建
cd client
npm run build

# 2. 上传新文件
scp -r client/dist/* root@服务器IP:/var/www/attendance-system/

# 3. 浏览器清缓存刷新（Ctrl+Shift+Delete）
```

---

## 更新后端代码

```bash
# 1. 上传新文件
scp -r server/ root@服务器IP:/tmp/new-server

# 2. 备份旧版本
ssh root@服务器IP
cp -r /opt/attendance-system/server /opt/attendance-system/server.bak

# 3. 替换
rm -rf /opt/attendance-system/server
mv /tmp/new-server /opt/attendance-system/server

# 4. 安装依赖并重启
cd /opt/attendance-system/server
npm install --production
systemctl restart attendance-server
```

---

## 环境配置

后端环境变量位置：`/opt/attendance-system/server/.env`

```bash
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=（你的-MySQL-密码）
DB_NAME=church_db
NODE_ENV=production
PORT=3000
```

修改后需重启服务：
```bash
systemctl restart attendance-server
```

---

## 备份数据库

```bash
# 手动备份
mysqldump -u root -p church_db > church_db_backup.sql

# 恢复
mysql -u root -p church_db < church_db_backup.sql

# 自动备份（每天凌晨 2 点）
crontab -e
# 添加: 0 2 * * * mysqldump -u root -p'密码' church_db > /backup/church_$(date +\%Y\%m\%d).sql
```

---

## SSL/HTTPS 配置（可选）

```bash
# 1. 安装 Certbot
dnf install certbot certbot-nginx -y

# 2. 申请证书
certbot --nginx -d 你的-域名.com

# 3. 自动更新证书（已启用）
systemctl enable certbot-renew.timer
systemctl start certbot-renew.timer
```

---

## 安全建议

```bash
# 1. 修改 MySQL root 密码
mysql -u root -p
ALTER USER 'root'@'localhost' IDENTIFIED BY '新密码';

# 2. 创建应用专用用户（推荐）
mysql -u root -p
CREATE USER 'attendance'@'localhost' IDENTIFIED BY '密码';
GRANT ALL ON church_db.* TO 'attendance'@'localhost';

# 3. 禁用 MySQL 外部访问（默认已禁用）
firewall-cmd --permanent --remove-port=3306/tcp

# 4. 启用 SELinux（如适用）
semanage fcontext -a -t httpd_sys_rw_content_t "/opt/attendance-system(/.*)?"
restorecon -Rv /opt/attendance-system
```

---

## 性能监控

```bash
# CPU 和内存使用
top

# 查看进程
ps aux | grep -E "node|nginx|mysql"

# 查看开放端口
netstat -tlnp

# 查看磁盘使用
df -h

# 数据库连接数
mysql -u root -p -e "SHOW PROCESSLIST;"
```

---

## 快速诊断脚本

保存为 `health-check.sh` 并运行：

```bash
#!/bin/bash
echo "=== 系统健康检查 ==="
echo ""
echo "1. 服务状态"
systemctl status attendance-server --no-pager | head -3
echo ""
echo "2. Nginx 状态"
systemctl status nginx --no-pager | head -3
echo ""
echo "3. MySQL 状态"
systemctl status mysqld --no-pager | head -3
echo ""
echo "4. 前端可访问性"
curl -s http://localhost | head -c 100
echo ""
echo "5. 后端可访问性"
curl -s http://localhost:3000 | head -c 100
echo ""
echo "6. 数据库连接"
mysql -u root -p'密码' -e "SELECT VERSION();"
echo ""
echo "=== 检查完成 ==="
```

运行：
```bash
chmod +x health-check.sh
./health-check.sh
```

---

**更多详情请参考：**
- 📖 [DEPLOYMENT_FRONTEND_BACKEND.md](./DEPLOYMENT_FRONTEND_BACKEND.md)
- 🚀 [DEPLOYMENT_ROCKY_GUIDE.md](./DEPLOYMENT_ROCKY_GUIDE.md)
- ✅ [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md)

