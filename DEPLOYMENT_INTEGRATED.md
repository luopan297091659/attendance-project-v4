# 考勤签到系统 v4.0 - 一体化部署方案

## 🎯 部署目标

将考勤签到系统的 **前端和后端都部署到同一台 Rocky Linux 8.5 服务器上**。

---

## 📦 应用组成

```
attendance-project-v4/
├── client/                    前端应用（Vue 3）
│   ├── dist/                 ✅ 已构建的生产版本
│   ├── src/                  源代码
│   ├── package.json
│   └── vite.config.js
├── server/                    后端应用（Node.js）
│   ├── app.js                主程序
│   ├── db.js                 数据库连接
│   ├── package.json          依赖声明
│   └── sql/
│       └── init.sql          数据库初始化脚本
├── deploy-rocky.sh           一键部署脚本 ⭐
├── DEPLOYMENT_FRONTEND_BACKEND.md   详细指南
└── DEPLOYMENT_QUICK_CARD.md  快速参考

```

### 应用技术栈

| 组件 | 技术 | 版本 |
|------|------|------|
| **前端框架** | Vue.js | 3.4.0 |
| **前端打包** | Vite | 5.0.0 |
| **前端 UI** | Element Plus | 2.4.4 |
| **后端框架** | Express.js | 4.18.2 |
| **运行环境** | Node.js | 18 LTS |
| **数据库** | MySQL | 8.0+ |
| **Web 服务器** | Nginx | 1.20+ |
| **操作系统** | Rocky Linux | 8.5 |

---

## 🚀 一键部署（推荐）

最简单的方式，只需 3 个命令：

### 步骤 1：上传项目到服务器

```bash
scp -r attendance-project-v4 root@你的-服务器-IP:/root/
```

### 步骤 2：运行部署脚本

```bash
ssh root@你的-服务器-IP
cd /root/attendance-project-v4
chmod +x deploy-rocky.sh
sudo ./deploy-rocky.sh
```

### 步骤 3：输入配置信息

脚本会提示你输入：
1. **MySQL root 密码**（默认: `attendance2024`，建议修改）
2. **域名或 IP 地址**（如: `192.168.1.100` 或 `example.com`）

**完成！** ✅ 脚本会自动：
- 检查系统环境
- 安装 Node.js、MySQL、Nginx
- 创建数据库和导入初始数据
- 部署后端应用
- 部署前端文件
- 配置服务和防火墙

---

## 📊 部署架构详解

### 网络拓扑图

```
┌──────────────────────────────────────────────────────────┐
│                    Rocky Linux 8.5 服务器                 │
│                                                            │
│  ┌──────────────────────────────────────────────────┐   │
│  │  Nginx Web 服务器 (公网可访问 80, 443)           │   │
│  │                                                    │   │
│  │  ┌─ 请求 / ──→ 提供前端文件                       │   │
│  │  └─ 请求 /api ──→ 代理到 localhost:3000          │   │
│  └──────────────────────────────────────────────────┘   │
│             ↓                                              │
│  ┌──────────────────────────────────────────────────┐   │
│  │  Node.js 后端服务 (仅限内部访问 3000)            │   │
│  │  /opt/attendance-system/server                    │   │
│  │  - Express.js 服务器                              │   │
│  │  - 业务逻辑处理                                   │   │
│  │  - 数据验证                                       │   │
│  │  - QR 码生成                                      │   │
│  └──────────────────────────────────────────────────┘   │
│             ↓                                              │
│  ┌──────────────────────────────────────────────────┐   │
│  │  MySQL 数据库 (仅限本地访问 3306)                │   │
│  │  church_db 数据库                                │   │
│  │  - 用户表                                        │   │
│  │  - 签到记录                                      │   │
│  │  - 教会管理数据                                  │   │
│  └──────────────────────────────────────────────────┘   │
│                                                            │
└──────────────────────────────────────────────────────────┘

用户访问: http://服务器IP 或 http://域名
         ↓
        Nginx
         ↓
      前端+API
         ↓
    Node.js 后端
         ↓
      MySQL 数据库
```

### 请求流程

```
用户浏览器
  ↓
[GET] http://服务器IP/
  ↓
Nginx
  ↓
[200 OK] index.html (前端应用)
  ↓
前端应用加载后，发送 API 请求
  ↓
[POST] http://服务器IP/api/auth/login
  ↓
Nginx 代理到 localhost:3000
  ↓
Node.js 后端处理
  ↓
验证用户 → 查询 MySQL 数据库
  ↓
[200 OK] { token: "...", user: {...} }
  ↓
前端收到响应，保存 token，跳转 Dashboard
```

---

## 📁 部署后的文件位置

| 用途 | 路径 | 所有者 | 权限 |
|------|------|--------|------|
| **前端文件** | `/var/www/attendance-system/` | nobody | 755 |
| **后端应用** | `/opt/attendance-system/server/` | nobody | 755 |
| **后端代码** | `/opt/attendance-system/server/app.js` | nobody | 755 |
| **环境配置** | `/opt/attendance-system/server/.env` | nobody | 600 |
| **数据库数据** | `/var/lib/mysql/church_db/` | mysql | 700 |
| **Nginx 配置** | `/etc/nginx/conf.d/attendance.conf` | root | 644 |
| **systemd 服务** | `/etc/systemd/system/attendance-server.service` | root | 644 |
| **访问日志** | `/var/log/nginx/access.log` | root | 644 |
| **错误日志** | `/var/log/nginx/error.log` | root | 644 |
| **MySQL 日志** | `/var/log/mysql/error.log` | mysql | 660 |

---

## 🔧 部署流程详解

### 自动部署脚本做了什么

```bash
deploy-rocky.sh 的 7 个步骤：

1️⃣  系统检查和更新
    └─ 检查 Rocky Linux 8.5 系统
    └─ 更新系统包到最新版本
    └─ 安装基础工具 (git, curl, wget)

2️⃣  安装依赖软件
    └─ Node.js 18 LTS (npm)
    └─ MySQL Server 8.0
    └─ Nginx 1.20
    └─ 其他必要工具

3️⃣  创建应用目录
    └─ /opt/attendance-system (后端)
    └─ /var/www/attendance-system (前端)

4️⃣  配置数据库
    └─ 创建数据库: church_db
    └─ 设置 MySQL root 密码
    └─ 导入初始数据 (init.sql)
    └─ 初始化表结构

5️⃣  部署后端应用
    └─ 复制 server/ 到 /opt/attendance-system/
    └─ npm install (安装依赖)
    └─ 创建 .env 环境配置文件
    └─ 设置数据库连接信息

6️⃣  配置系统服务
    └─ 创建 systemd 服务文件
    └─ 配置自动重启
    └─ 设置开机自启
    └─ 启动后端服务

7️⃣  配置 Web 服务器
    └─ 部署前端文件到 /var/www/attendance-system/
    └─ 配置 Nginx 反向代理
    └─ 启用 Gzip 压缩
    └─ 配置 HTTP 请求处理
    └─ 配置防火墙规则 (firewalld)
```

---

## ✅ 验证部署成功

### 1. 检查应用是否在线

```bash
# 在本地计算机上打开浏览器
http://你的-服务器-IP

# 应该看到考勤系统的登录界面
```

### 2. 检查各服务状态

```bash
ssh root@你的-服务器-IP

# 查看后端服务
systemctl status attendance-server

# 查看 Nginx
systemctl status nginx

# 查看 MySQL
systemctl status mysqld
```

### 3. 测试登录

```
用户名: admin
密码: admin123

点击登录 → 应该进入 Dashboard
```

### 4. 查看日志（排查问题）

```bash
# 后端日志
journalctl -u attendance-server -f

# Nginx 错误日志
tail -f /var/log/nginx/error.log

# MySQL 日志
tail -f /var/log/mysql/error.log
```

---

## 🔄 配置和管理

### 修改 MySQL 密码

```bash
mysql -u root -p

# 输入旧密码后，执行：
ALTER USER 'root'@'localhost' IDENTIFIED BY '新密码';
FLUSH PRIVILEGES;

# 然后更新后端配置文件
nano /opt/attendance-system/server/.env

# 修改 DB_PASSWORD=新密码

# 重启后端服务
systemctl restart attendance-server
```

### 添加新用户

```bash
mysql -u root -p church_db

# 插入新管理员
INSERT INTO users (username, password, role) 
VALUES ('username', '密码哈希', 'admin');

# 或使用后端 API 添加
```

### 更新前端文件

```bash
# 1. 本地构建
cd client
npm run build

# 2. 上传到服务器
scp -r client/dist/* root@服务器IP:/var/www/attendance-system/

# 3. 浏览器清空缓存重新加载
```

### 更新后端代码

```bash
# 1. 上传新的 server 目录
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

## 📋 部署清单

### 部署前

- [ ] Rocky Linux 8.5 服务器已准备
- [ ] 拥有 root 或 sudo 权限
- [ ] 网络连接正常
- [ ] 至少 2GB 可用内存
- [ ] 至少 20GB 可用磁盘空间
- [ ] 项目文件完整（client 和 server）
- [ ] client/dist/ 中已有构建的前端文件

### 部署中

- [ ] 使用 SCP 成功上传项目
- [ ] 脚本可执行权限已设置 (chmod +x)
- [ ] 脚本运行无错误
- [ ] 输入了正确的 MySQL 密码
- [ ] 输入了正确的域名或 IP

### 部署后

- [ ] 能访问 http://服务器IP
- [ ] 登录页面显示正常
- [ ] 能用 admin/admin123 登录
- [ ] Dashboard 可以加载
- [ ] systemctl status 显示所有服务运行正常
- [ ] MySQL 数据库可连接
- [ ] 后端 API 正常响应

---

## 🆘 常见问题

### Q1: 无法访问前端

**症状**：浏览器显示 `无法连接` 或 `ERR_CONNECTION_REFUSED`

**排查步骤**：
```bash
# 1. 检查 Nginx 是否运行
systemctl status nginx

# 2. 检查 Nginx 是否在监听 80 端口
netstat -tlnp | grep nginx

# 3. 检查防火墙规则
firewall-cmd --list-all

# 4. 尝试本地连接
curl http://localhost

# 5. 查看 Nginx 错误日志
tail -f /var/log/nginx/error.log
```

### Q2: 登录失败

**症状**：输入 admin/admin123 后显示登录失败

**排查步骤**：
```bash
# 1. 检查后端服务
systemctl status attendance-server

# 2. 查看后端日志
journalctl -u attendance-server -n 50 -f

# 3. 验证数据库连接
mysql -u root -p -e "USE church_db; SELECT COUNT(*) FROM users;"

# 4. 检查 .env 配置
cat /opt/attendance-system/server/.env

# 5. 重启后端服务
systemctl restart attendance-server
```

### Q3: API 返回 502/503 错误

**症状**：前端加载成功，但 API 调用显示 502 Bad Gateway

**排查步骤**：
```bash
# 1. 检查后端服务
systemctl status attendance-server

# 2. 检查后端是否在监听 3000
netstat -tlnp | grep 3000

# 3. 查看后端日志中的错误
journalctl -u attendance-server -f

# 4. 测试直连后端
curl http://localhost:3000/api

# 5. 重启后端和 Nginx
systemctl restart attendance-server
systemctl reload nginx
```

### Q4: 数据库连接失败

**症状**：后端日志显示 `ECONNREFUSED` 或 `ER_ACCESS_DENIED_FOR_USER`

**排查步骤**：
```bash
# 1. 检查 MySQL 运行状态
systemctl status mysqld

# 2. 验证数据库和用户
mysql -u root -p -e "USE church_db; SHOW TABLES;"

# 3. 检查 .env 中的数据库密码是否正确
cat /opt/attendance-system/server/.env

# 4. 测试手动连接
mysql -u root -p'你的密码' church_db -e "SELECT VERSION();"

# 5. 重启 MySQL
systemctl restart mysqld
```

### Q5: 前端样式缺失

**症状**：页面加载但没有样式，只显示纯 HTML

**排查步骤**：
```bash
# 1. 检查文件是否正确上传
ls -la /var/www/attendance-system/

# 2. 检查文件权限
chmod -R 755 /var/www/attendance-system/

# 3. 浏览器清空缓存
# Ctrl+Shift+Delete 或浏览器菜单

# 4. 查看浏览器控制台错误 (F12)

# 5. 查看 Nginx 访问日志
tail -f /var/log/nginx/access.log
```

---

## 🔐 安全加固

### 立即做的事

```bash
# 1. 修改 MySQL root 密码
mysql -u root -p
ALTER USER 'root'@'localhost' IDENTIFIED BY '强密码';

# 2. 禁用 MySQL 外部访问
firewall-cmd --permanent --remove-port=3306/tcp
firewall-cmd --reload

# 3. 禁止直接访问后端
firewall-cmd --permanent --remove-port=3000/tcp
firewall-cmd --reload

# 4. 仅允许 SSH、HTTP、HTTPS
firewall-cmd --list-all
```

### 推荐做的事

```bash
# 1. 配置 SSL 证书（HTTPS）
dnf install certbot certbot-nginx -y
certbot --nginx -d 你的-域名.com

# 2. 创建数据库备份脚本
cat > /usr/local/bin/backup-db.sh << 'EOF'
#!/bin/bash
mysqldump -u root -p'密码' church_db > /backup/church_$(date +%Y%m%d).sql
EOF
chmod +x /usr/local/bin/backup-db.sh

# 3. 自动备份（每天凌晨 2 点）
crontab -e
# 添加: 0 2 * * * /usr/local/bin/backup-db.sh

# 4. 配置日志轮转
# (已在 Nginx 中自动配置)

# 5. 启用 SELinux（如适用）
semanage fcontext -a -t httpd_sys_rw_content_t "/opt/attendance-system(/.*)?"
restorecon -Rv /opt/attendance-system
```

---

## 📚 文档导航

| 文档 | 用途 | 何时阅读 |
|------|------|---------|
| **DEPLOYMENT_FRONTEND_BACKEND.md** | 详细的前后端部署指南 | 部署前或遇到问题时 |
| **DEPLOYMENT_QUICK_CARD.md** | 快速参考卡片 | 需要快速查阅命令时 |
| **DEPLOYMENT_CHECKLIST.md** | 完整的部署检查清单 | 部署前后验证时 |
| **DEPLOYMENT_ROCKY_GUIDE.md** | Rocky Linux 专用指南 | 深入了解系统配置时 |
| **DEPLOYMENT_GUIDE.md** | 通用部署指南 | 部署其他系统时 |

---

## 🎯 下一步

1. **阅读** [DEPLOYMENT_QUICK_CARD.md](./DEPLOYMENT_QUICK_CARD.md) - 2 分钟快速了解
2. **准备** 你的 Rocky Linux 8.5 服务器和登录凭据
3. **上传** 项目文件：`scp -r attendance-project-v4 root@IP:/root/`
4. **运行** 部署脚本：`bash deploy-rocky.sh`
5. **验证** 部署是否成功：访问 `http://你的-服务器-IP`
6. **登录** 使用 `admin/admin123`
7. **配置** 根据需要修改密码和域名设置

---

## 📞 获取帮助

1. **查看日志** - 大多数问题都能通过日志解决
   ```bash
   journalctl -u attendance-server -f
   tail -f /var/log/nginx/error.log
   ```

2. **检查服务** - 确保所有服务都在运行
   ```bash
   systemctl status attendance-server nginx mysqld
   ```

3. **查阅文档** - 特定问题请参考相关文档

4. **搜索日志** - 日志中通常有详细的错误信息

---

**祝你部署顺利！** 🎉

有任何问题，请查看相关文档或查看日志获取更多信息。

