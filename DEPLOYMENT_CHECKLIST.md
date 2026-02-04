# 🚀 考勤签到系统 v4.0 - 部署包完整清单

## 📦 打包完成

**构建时间**：2026-02-02  
**版本**：v4.0.0  
**状态**：✅ 生产就绪

### 文件清单

#### 核心应用文件

```
✅ client/dist/                          # 前端生产版本（已构建）
   ├── index.html (410 bytes)
   ├── assets/
   │   ├── index-B-sx1eIc.css (376 KB, gzip: 52 KB)
   │   └── index-DzR90gU8.js (2.2 MB, gzip: 746 KB)
   └── [部署就绪，无需额外构建]

✅ server/                               # 后端应用程序
   ├── app.js                           # 主程序
   ├── db.js                            # 数据库连接
   ├── package.json                     # 依赖声明
   ├── package-lock.json
   ├── node_modules/                    # 已安装依赖（可选打包）
   └── sql/
       └── init.sql                     # 数据库初始化脚本
```

#### 部署文档和脚本

```
📚 DEPLOYMENT_QUICK_START.md            # ⭐ 开始阅读（3 分钟快速开始）
📚 DEPLOYMENT_ROCKY_GUIDE.md            # 📖 Rocky Linux 8.5 详细指南
📚 DEPLOYMENT_GUIDE.md                  # 📖 通用部署指南（所有系统）
📚 README_NEW.md                        # 项目说明文档

🚀 deploy-rocky.sh                      # ⭐ Rocky Linux 8.5 一键部署（推荐）
🚀 deploy.sh                            # Linux/Mac 通用部署脚本
🚀 deploy.bat                           # Windows 部署脚本（不适用于 Rocky）
```

## 🎯 Rocky Linux 8.5 部署流程

### 📋 前置检查清单

在开始部署前，请确保：

- [ ] 有一台 Rocky Linux 8.5 服务器
- [ ] 拥有 root 或 sudo 权限的账户
- [ ] 服务器有 2GB+ 内存
- [ ] 服务器有 20GB+ 可用磁盘
- [ ] 网络可以访问公网（下载依赖）
- [ ] 防火墙允许 SSH（22）、HTTP（80）、HTTPS（443）

### 🚀 部署步骤（总耗时 5-10 分钟）

#### 第 1 步：连接服务器 (1 分钟)

```bash
# 使用 SSH 连接
ssh root@your-server-ip

# 或如果是普通用户，使用 sudo
ssh user@your-server-ip
sudo -i
```

#### 第 2 步：上传项目 (2 分钟)

从你的本地计算机执行：

```bash
# 方式 A：使用 SCP（最简单）
scp -r d:\PROJECT\attendance-project-v4 root@your-server-ip:/root/

# 方式 B：在服务器上使用 Git（需要 Git）
cd /root
git clone https://github.com/your-username/attendance-system.git
cd attendance-system
```

#### 第 3 步：运行部署脚本 (5-10 分钟)

在服务器上执行：

```bash
# 进入项目目录
cd /root/attendance-project-v4

# 给脚本执行权限
chmod +x deploy-rocky.sh

# ⭐ 关键：使用 sudo 或 root 权限运行
sudo bash deploy-rocky.sh
# 或
bash deploy-rocky.sh  # 如果已是 root
```

#### 第 4 步：按提示配置 (2 分钟)

脚本会交互式地要求输入：

**1. MySQL root 密码**
```
请输入 MySQL root 密码（留空使用默认密码 'attendance2024'）: 
```
- 输入你的密码或按 Enter 使用默认
- 此密码将保存在 `/opt/attendance-system/server/.env`

**2. 域名或 IP 地址**
```
请输入你的域名（或 IP 地址）: 
```
- 输入：`123.45.67.89` 或 `attendance.example.com`
- 用于 Nginx 配置

#### 第 5 步：验证部署 (1 分钟)

脚本完成后，你会看到：

```
╔═══════════════════════════════════════════════════════════════╗
║                  部署完成！🎉                                 ║
╚═══════════════════════════════════════════════════════════════╝

🚀 服务状态
  ✓ attendance-server (Active - running)
  ✓ nginx (Active - running)
  ✓ mysqld (Active - running)

📍 访问地址
  🌐 前端: http://123.45.67.89
  🔌 后端 API: http://123.45.67.89/api
  📊 直连后端: http://123.45.67.89:3000
```

### ✅ 验证访问

在你的浏览器中：

1. **访问前端**：`http://123.45.67.89`
   - 看到登录页面 ✅

2. **管理员登录**
   - 用户名：`admin`
   - 密码：`admin123`

3. **验证后端**
   ```bash
   curl http://123.45.67.89/api/admin/login
   ```

## 📂 部署后的文件位置

部署完成后，文件将位于：

```
/opt/attendance-system/           # 应用主目录
├── server/                       # 后端应用
│   ├── app.js                    # 运行中的程序
│   ├── .env                      # 环境配置（已创建）
│   └── node_modules/             # Node.js 依赖

/var/www/attendance-system/       # 前端文件
└── dist/                         # 静态文件（由 Nginx 提供）

/etc/nginx/conf.d/attendance.conf # Nginx 配置
/etc/systemd/system/attendance-server.service # 服务配置
/var/log/nginx/                   # Nginx 日志
/var/log/mysql/                   # MySQL 日志
```

## 🔧 部署后必做项

### 1️⃣ 修改 MySQL 密码（强烈推荐）

```bash
# 连接 MySQL
mysql -u root -p

# 输入部署时设置的密码，然后执行：
ALTER USER 'root'@'localhost' IDENTIFIED BY 'your_very_strong_password';
FLUSH PRIVILEGES;
EXIT;
```

### 2️⃣ 配置 SSL 证书（推荐）

使用 Let's Encrypt 免费证书：

```bash
# 安装 Certbot
sudo dnf install certbot certbot-nginx -y

# 获取证书
sudo certbot --nginx -d your-domain.com
```

### 3️⃣ 上传前端文件（如果脚本未自动上传）

```bash
# 从本地计算机
scp -r client/dist/* root@your-server-ip:/var/www/attendance-system/

# 在服务器上设置权限
sudo chown -R nobody:nobody /var/www/attendance-system
sudo chmod -R 755 /var/www/attendance-system
```

### 4️⃣ 测试应用功能

```bash
# 1. 访问前端：http://你的服务器IP或域名
# 2. 使用 admin/admin123 登录
# 3. 查看签到数据、生成二维码等
# 4. 检查后端日志：journalctl -u attendance-server -f
```

## 📊 系统架构

```
用户浏览器
    ↓
 Nginx (端口 80/443)  ← HTTP/HTTPS 请求
    ├─ /              → /var/www/attendance-system/dist (前端 Vue 应用)
    └─ /api/*         → localhost:3000 (后端 API)
    ↓
Node.js 应用 (端口 3000)
    ├─ Express 服务器
    └─ 数据库驱动
    ↓
MySQL 数据库 (端口 3306)
    └─ church_db
```

## 🎮 常用命令速查

### 服务管理

```bash
# 后端服务
systemctl status attendance-server         # 查看状态
systemctl restart attendance-server        # 重启服务
systemctl stop attendance-server           # 停止服务
journalctl -u attendance-server -f         # 查看日志

# Nginx
systemctl status nginx
systemctl restart nginx
systemctl reload nginx                     # 重新加载配置

# MySQL
systemctl status mysqld
systemctl restart mysqld
```

### 数据库备份

```bash
# 备份
mysqldump -u root -p church_db > backup_$(date +%Y%m%d_%H%M%S).sql

# 恢复
mysql -u root -p church_db < backup.sql
```

### 日志查看

```bash
# 后端日志
journalctl -u attendance-server -f -n 50

# Nginx 日志
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log

# MySQL 日志
tail -f /var/log/mysql/error.log
```

### 系统监控

```bash
# 资源使用
top                                        # CPU、内存
df -h                                      # 磁盘空间
netstat -tlnp | grep 3000                  # 检查端口
```

## 🆘 故障排查快速指南

### 问题：无法连接到服务器

```bash
# 1. 检查防火墙
sudo firewall-cmd --list-all

# 2. 开放端口
sudo firewall-cmd --permanent --add-port=80/tcp
sudo firewall-cmd --permanent --add-port=443/tcp
sudo firewall-cmd --reload

# 3. 检查服务
systemctl status nginx attendance-server
```

### 问题：后端服务不运行

```bash
# 1. 查看错误
journalctl -u attendance-server -n 100

# 2. 检查依赖
cd /opt/attendance-system/server
npm install --production

# 3. 重启服务
systemctl restart attendance-server
```

### 问题：数据库连接失败

```bash
# 1. 检查 MySQL
systemctl status mysqld

# 2. 验证连接
mysql -u root -p -e "SELECT 1;"

# 3. 检查配置
cat /opt/attendance-system/server/.env

# 4. 重启 MySQL
systemctl restart mysqld
```

## 📞 技术支持

遇到问题时：

1. **查看详细日志**
   ```bash
   journalctl -u attendance-server -n 100
   tail -f /var/log/nginx/error.log
   ```

2. **参考文档**
   - 快速开始：`DEPLOYMENT_QUICK_START.md`
   - Rocky 指南：`DEPLOYMENT_ROCKY_GUIDE.md`
   - 通用指南：`DEPLOYMENT_GUIDE.md`

3. **联系支持**
   - 📧 邮件：support@example.com
   - 📞 电话：+86-xxxx-xxxx-xxxx
   - 💬 论坛：https://forum.example.com

## 📈 下一步优化

部署完成后，建议进行：

- [ ] 配置 SSL 证书（HTTPS）
- [ ] 设置日志轮转
- [ ] 配置每日数据库备份
- [ ] 优化数据库索引
- [ ] 配置监控告警
- [ ] 制定灾难恢复计划

## ✨ 部署完成清单

- [x] 前端已构建到 `client/dist/`
- [x] 后端程序准备就绪
- [x] 数据库初始化脚本已准备
- [x] Rocky Linux 部署脚本已创建
- [x] 详细部署文档已编写
- [x] 故障排查指南已准备
- [x] 部署包已完整打包

---

**现在你已经准备好部署了！** 🚀

**下一步**：
1. 阅读 `DEPLOYMENT_QUICK_START.md`
2. 连接到你的 Rocky Linux 8.5 服务器
3. 运行 `deploy-rocky.sh` 脚本
4. 按提示配置和验证

**祝部署顺利！** 🎉

---

**版本**：v4.0.0  
**发布日期**：2026-02-02  
**兼容性**：Rocky Linux 8.5+ / RHEL 8.5+ / CentOS 8+
