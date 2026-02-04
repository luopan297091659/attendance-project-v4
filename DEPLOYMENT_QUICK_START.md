# 考勤签到系统 - 部署准备清单

## 📦 部署包内容

本部署包包含以下文件：

```
attendance-project-v4/
├── client/
│   └── dist/                      # ✅ 已构建的前端文件（生产版本）
│       ├── index.html
│       └── assets/
│           ├── index-*.css
│           └── index-*.js
├── server/
│   ├── app.js                     # 后端主程序
│   ├── db.js                      # 数据库配置
│   ├── package.json               # 后端依赖
│   └── sql/
│       └── init.sql               # 数据库初始化脚本
├── deploy-rocky.sh                # 🚀 Rocky Linux 8.5 一键部署脚本（推荐）
├── DEPLOYMENT_ROCKY_GUIDE.md      # 📚 详细部署指南（Rocky Linux）
├── DEPLOYMENT_GUIDE.md            # 📚 通用部署指南
└── README.md                       # 项目说明
```

## 🚀 Rocky Linux 8.5 快速部署

### 前置条件

- ✅ Rocky Linux 8.5 服务器
- ✅ root 或 sudo 权限
- ✅ 网络连接（用于下载依赖）
- ✅ 至少 2GB 内存、20GB 磁盘

### 部署步骤（3 分钟完成）

#### 步骤 1：连接服务器

```bash
# 使用 SSH 连接
ssh root@your-server-ip

# 或使用 root 用户
sudo -i
```

#### 步骤 2：上传项目文件

有三种方式上传项目：

**方式 A：使用 SCP（推荐）**
```bash
# 在本地计算机运行
scp -r d:\PROJECT\attendance-project-v4 root@your-server-ip:/root/

# 或
scp -r ./attendance-project-v4 root@your-server-ip:/root/
```

**方式 B：使用 Git（服务器需要 Git）**
```bash
cd /root
git clone <你的仓库地址> attendance-project-v4
cd attendance-project-v4
```

**方式 C：使用 FTP/SFTP 工具**
- 使用 WinSCP、FileZilla 等工具上传整个文件夹

#### 步骤 3：运行部署脚本

```bash
# 进入项目目录
cd /root/attendance-project-v4

# 给脚本执行权限
chmod +x deploy-rocky.sh

# 运行脚本（需要 root 权限）
sudo bash deploy-rocky.sh
```

#### 步骤 4：按提示输入配置

脚本会要求你输入：

1. **MySQL root 密码**（首次设置）
   - 示例：`attendance@2024`
   - 安全建议：使用强密码

2. **域名或 IP**（用于 Nginx 配置）
   - 示例：`123.45.67.89` 或 `attendance.example.com`

#### 步骤 5：验证部署

脚本完成后会显示：

```
━━━ 部署完成！🎉 ━━━

🚀 服务状态
  Active (running)
  
📍 访问地址
  🌐 前端: http://your-domain-or-ip
  🔌 后端: http://your-domain-or-ip/api
  
⚙️ 常用命令
  查看后端日志: journalctl -u attendance-server -f
  重启服务: systemctl restart attendance-server
```

**验证访问：**
```bash
# 1. 从服务器本地访问
curl http://localhost

# 2. 从你的计算机访问
# 在浏览器输入：http://your-server-ip
```

## 📋 部署检查清单

在部署前，请确保：

- [ ] Rocky Linux 8.5 服务器可用
- [ ] 有 root 或 sudo 权限
- [ ] 至少 2GB 可用内存
- [ ] 至少 20GB 可用磁盘空间
- [ ] 网络连接正常（能访问外网）
- [ ] 防火墙允许 22（SSH）、80（HTTP）、443（HTTPS）端口

## 🔧 部署后的必做项

### 1. 修改 MySQL 密码（强烈推荐）

```bash
# 连接 MySQL
mysql -u root -p

# 输入当前密码（部署脚本中设置的）

# 在 MySQL 中执行
ALTER USER 'root'@'localhost' IDENTIFIED BY 'your_new_strong_password';
FLUSH PRIVILEGES;
EXIT;
```

### 2. 配置 SSL 证书（推荐）

```bash
# 安装 Certbot
dnf install certbot certbot-nginx -y

# 获取证书（需要有效的域名）
certbot --nginx -d your-domain.com
```

### 3. 上传前端文件（如果脚本跳过了）

```bash
# 从你的计算机上传
scp -r ./client/dist/* root@your-server-ip:/var/www/attendance-system/

# 设置正确的权限
ssh root@your-server-ip
chown -R nobody:nobody /var/www/attendance-system
chmod -R 755 /var/www/attendance-system
```

### 4. 测试应用

```bash
# 1. 访问前端
# 在浏览器打开：http://your-domain-or-ip

# 2. 测试登录
# 用户名：admin
# 密码：admin123（或你自己创建的账户）

# 3. 检查后端 API
curl http://your-domain-or-ip/api/admin/login
```

## 📞 常见问题快速解决

### 问题 1：脚本执行失败

**症状：** `Permission denied` 或 `command not found`

**解决：**
```bash
# 确保以 root 或 sudo 运行
sudo bash deploy-rocky.sh

# 给脚本执行权限
chmod +x deploy-rocky.sh
sudo ./deploy-rocky.sh
```

### 问题 2：无法访问服务器

**症状：** `Connection refused` 或超时

**解决：**
```bash
# 检查防火墙
firewall-cmd --list-all

# 开放端口
sudo firewall-cmd --permanent --add-port=80/tcp
sudo firewall-cmd --permanent --add-port=443/tcp
sudo firewall-cmd --reload

# 检查服务状态
systemctl status nginx
systemctl status attendance-server
```

### 问题 3：数据库连接失败

**症状：** `Error: connect ECONNREFUSED 127.0.0.1:3306`

**解决：**
```bash
# 检查 MySQL 状态
systemctl status mysqld

# 重启 MySQL
systemctl restart mysqld

# 检查错误日志
journalctl -u mysqld -n 50
```

### 问题 4：登录失败

**症状：** `401 Unauthorized` 或 `Invalid credentials`

**解决：**
```bash
# 检查管理员账户
mysql -u root -p -e "USE church_db; SELECT * FROM admins;"

# 确认账户和密码
# 默认账户：admin / admin123
```

## 📖 详细文档

- 📚 **Rocky Linux 部署详指南**：[DEPLOYMENT_ROCKY_GUIDE.md](DEPLOYMENT_ROCKY_GUIDE.md)
- 📚 **通用部署指南**：[DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)
- 📚 **项目说明**：[README.md](README.md)

## 🎓 部署后的维护

### 日常监控

```bash
# 查看后端运行状态
systemctl status attendance-server

# 查看最近的日志
journalctl -u attendance-server -n 20

# 查看系统资源使用
top
# 或
htop
```

### 定期备份

```bash
# 备份数据库
mysqldump -u root -p church_db > backup_$(date +%Y%m%d).sql

# 建议每天自动备份
# 使用 cron：0 2 * * * mysqldump -u root -p church_db > /backups/backup_$(date +\%Y\%m\%d).sql
```

### 升级和更新

```bash
# 更新系统
dnf update -y

# 更新 Node.js 依赖
cd /opt/attendance-system/server
npm update
systemctl restart attendance-server

# 更新前端
# 重新构建并上传 dist 文件
```

## 🆘 获取帮助

如果遇到问题：

1. **查看日志**：
   ```bash
   journalctl -u attendance-server -f
   tail -f /var/log/nginx/error.log
   tail -f /var/log/mysql/error.log
   ```

2. **检查配置**：
   - 后端：`/opt/attendance-system/server/.env`
   - Nginx：`/etc/nginx/conf.d/attendance.conf`
   - MySQL：`mysql -u root -p`

3. **寻求帮助**：
   - 📧 邮件：support@example.com
   - 💬 论坛：https://forum.example.com
   - 📞 电话：+86-xxxx-xxxx-xxxx

## ✅ 部署完成确认

部署成功后，你应该能够：

- ✅ 访问前端应用：`http://your-domain-or-ip`
- ✅ 使用管理员账号登录（admin/admin123）
- ✅ 查看今日签到数据
- ✅ 生成签到二维码
- ✅ 访问后端 API：`http://your-domain-or-ip/api`
- ✅ 查看数据库数据（通过 MySQL）

---

**部署指南版本**：v4.0.0  
**最后更新**：2026-02-02  
**兼容性**：Rocky Linux 8.5+ / RHEL 8.5+ / CentOS 8+

如有问题，请参考详细部署指南或联系技术支持。
