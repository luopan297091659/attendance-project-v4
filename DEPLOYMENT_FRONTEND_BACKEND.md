# 考勤签到系统 v4.0 - 前后端一体化部署指南

## 📋 部署架构

本应用采用 **前后端同机部署** 的架构：

```
Rocky Linux 8.5 服务器
├── Nginx (端口 80/443)
│   ├── 提供前端静态文件 (/)
│   └── 代理 API 请求到后端 (/api)
├── Node.js 后端服务 (端口 3000，仅内部访问)
│   └── 处理业务逻辑、数据库操作
└── MySQL 数据库 (端口 3306，仅本地访问)
    └── 存储所有应用数据
```

### 网络流量流程

```
用户浏览器
    ↓
Nginx (公网可访问 80/443)
    ├→ 静态文件请求 → 前端 HTML/CSS/JS
    └→ /api 请求 → 代理到 localhost:3000
         ↓
    Node.js 后端 (仅限本地访问)
         ↓
    MySQL 数据库
```

## 🚀 部署步骤（3 步）

### 第 1 步：准备项目文件

**在本地计算机上执行：**

```bash
# 1.1 确保前端已构建（如果还没有）
cd attendance-project-v4/client
npm run build

# 1.2 结果应该包含 dist 目录
ls client/dist/
# 输出: index.html, assets/

# 1.3 确认后端代码完整
ls server/
# 应包含: app.js, db.js, package.json, sql/
```

### 第 2 步：上传项目到服务器

**方式 A：使用 SCP 上传（推荐）**

```bash
# 上传整个项目
scp -r attendance-project-v4 root@你的-服务器-IP:/root/

# 验证上传
ssh root@你的-服务器-IP
ls /root/attendance-project-v4/
```

**方式 B：使用 Git 克隆**

```bash
ssh root@你的-服务器-IP
cd /root
git clone <你的仓库地址> attendance-project-v4
cd attendance-project-v4
```

### 第 3 步：运行部署脚本

**在服务器上执行：**

```bash
# 3.1 连接到服务器
ssh root@你的-服务器-IP

# 3.2 进入项目目录
cd /root/attendance-project-v4

# 3.3 赋予脚本执行权限
chmod +x deploy-rocky.sh

# 3.4 运行部署脚本
sudo ./deploy-rocky.sh

# 脚本会提示你输入：
#   1. MySQL root 密码（默认: attendance2024）
#   2. 域名或 IP 地址（如: example.com 或 192.168.1.100）
```

## ⏱️ 预期耗时

| 阶段 | 耗时 |
|------|------|
| 上传文件 | 1-2 分钟 |
| 运行脚本 | 5-8 分钟 |
| **总计** | **7-10 分钟** |

## 📊 部署过程详解

部署脚本自动执行以下操作：

```
步骤 1/7: 系统检查和更新
  └─ 验证 Rocky Linux 8.5
  └─ 更新系统包

步骤 2/7: 安装依赖
  └─ Node.js 18 (npm)
  └─ MySQL Server 8.0
  └─ Nginx Web 服务器
  └─ Git, curl, wget

步骤 3/7: 创建应用目录
  └─ /opt/attendance-system (后端应用)
  └─ /var/www/attendance-system (前端文件)

步骤 4/7: 配置数据库
  └─ 创建数据库: church_db
  └─ 导入初始数据: init.sql
  └─ 设置 root 密码

步骤 5/7: 部署后端
  └─ 复制 server/ 到 /opt/attendance-system/
  └─ npm install (安装依赖)
  └─ 创建 .env 环境配置

步骤 6/7: 配置系统服务
  └─ 创建 systemd 服务文件
  └─ 配置自动重启
  └─ 启动后端服务

步骤 7/7: 配置 Web 服务器
  └─ 部署前端文件到 /var/www/attendance-system/
  └─ 配置 Nginx 反向代理
  └─ 启用 Gzip 压缩
  └─ 配置防火墙规则
```

## ✅ 验证部署

### 访问应用

```bash
# 方式 1: 在本地计算机浏览器打开
http://你的-服务器-IP

# 方式 2: 使用 curl 测试
curl http://你的-服务器-IP

# 方式 3: 测试 API
curl http://你的-服务器-IP/api/health
```

### 检查各组件状态

**在服务器上执行：**

```bash
# 1. 检查后端服务
systemctl status attendance-server

# 2. 检查 Nginx
systemctl status nginx

# 3. 检查 MySQL
systemctl status mysqld

# 4. 查看后端日志
journalctl -u attendance-server -n 20 -f

# 5. 测试后端连接
curl http://localhost:3000/api

# 6. 测试数据库连接
mysql -u root -p -e "SELECT VERSION();"
```

### 登录测试

1. 打开浏览器访问：`http://你的-服务器-IP`
2. 使用默认账户登录：
   - **用户名**: `admin`
   - **密码**: `admin123`

## 📁 部署后的文件位置

| 组件 | 位置 | 说明 |
|------|------|------|
| **前端文件** | `/var/www/attendance-system/` | 静态 HTML/CSS/JS |
| **后端应用** | `/opt/attendance-system/server/` | Node.js 应用程序 |
| **数据库** | `/var/lib/mysql/` | MySQL 数据目录 |
| **Nginx 配置** | `/etc/nginx/conf.d/attendance.conf` | Web 服务器配置 |
| **systemd 服务** | `/etc/systemd/system/attendance-server.service` | 后端服务管理 |
| **日志** | `/var/log/nginx/` | Nginx 访问和错误日志 |
| **后端日志** | `journalctl` | systemd 日志 |

## 🔧 常用管理命令

### 后端服务管理

```bash
# 查看状态
systemctl status attendance-server

# 启动
systemctl start attendance-server

# 停止
systemctl stop attendance-server

# 重启
systemctl restart attendance-server

# 查看实时日志
journalctl -u attendance-server -f

# 查看最近 50 条日志
journalctl -u attendance-server -n 50

# 查看错误日志
journalctl -u attendance-server -p err
```

### 前端更新

```bash
# 1. 在本地构建新版本
cd client
npm run build

# 2. 上传新的 dist 文件
scp -r client/dist/* root@你的-服务器-IP:/var/www/attendance-system/

# 3. 清除浏览器缓存并刷新
# (在浏览器中按 Ctrl+Shift+Delete)
```

### Nginx 管理

```bash
# 检查配置语法
nginx -t

# 重载配置（不中断连接）
systemctl reload nginx

# 完整重启（会中断连接）
systemctl restart nginx

# 查看访问日志
tail -f /var/log/nginx/access.log

# 查看错误日志
tail -f /var/log/nginx/error.log
```

### MySQL 管理

```bash
# 连接数据库
mysql -u root -p

# 查看数据库列表
mysql -u root -p -e "SHOW DATABASES;"

# 数据库备份
mysqldump -u root -p church_db > backup.sql

# 数据库恢复
mysql -u root -p church_db < backup.sql

# 检查连接数
mysql -u root -p -e "SHOW PROCESSLIST;"
```

## 🔐 安全建议

### 必须做的事项

```bash
# 1. 立即修改 MySQL root 密码
mysql -u root -p
ALTER USER 'root'@'localhost' IDENTIFIED BY '你的-新-密码';

# 2. 创建专用应用数据库用户（可选但推荐）
mysql -u root -p
CREATE USER 'attendance'@'localhost' IDENTIFIED BY '密码';
GRANT ALL PRIVILEGES ON church_db.* TO 'attendance'@'localhost';
FLUSH PRIVILEGES;

# 3. 禁用 MySQL 外部访问
mysql -u root -p -e "SELECT user, host FROM mysql.user;"
```

### 推荐的安全配置

```bash
# 1. 安装 SSL 证书
dnf install certbot certbot-nginx -y
certbot --nginx -d 你的-域名.com

# 2. 启用防火墙
firewall-cmd --permanent --add-service=http
firewall-cmd --permanent --add-service=https
firewall-cmd --permanent --remove-port=3000/tcp
firewall-cmd --reload

# 3. 配置 SELinux（如适用）
semanage fcontext -a -t httpd_sys_rw_content_t "/opt/attendance-system(/.*)?"
restorecon -Rv /opt/attendance-system

# 4. 配置日志轮转
# 编辑 /etc/logrotate.d/nginx (已默认配置)

# 5. 定期备份数据库
crontab -e
# 添加: 0 2 * * * mysqldump -u root -p'密码' church_db > /backup/church_$(date +\%Y\%m\%d).sql
```

## 🐛 常见问题排查

### 无法访问前端页面

```bash
# 1. 检查 Nginx 是否运行
systemctl status nginx

# 2. 检查防火墙
firewall-cmd --list-all

# 3. 检查 Nginx 配置
nginx -t

# 4. 查看 Nginx 错误日志
tail -f /var/log/nginx/error.log

# 5. 测试 Nginx 本地连接
curl http://localhost
```

### 后端 API 返回 502/503

```bash
# 1. 检查后端服务
systemctl status attendance-server

# 2. 查看后端日志
journalctl -u attendance-server -n 50 -f

# 3. 检查后端是否在监听端口 3000
netstat -tlnp | grep 3000

# 4. 重启后端服务
systemctl restart attendance-server

# 5. 检查数据库连接
# 查看后端日志中的连接错误
```

### 数据库连接失败

```bash
# 1. 检查 MySQL 运行状态
systemctl status mysqld

# 2. 验证数据库是否存在
mysql -u root -p -e "SHOW DATABASES;"

# 3. 检查数据库用户权限
mysql -u root -p -e "SELECT user, host FROM mysql.user;"

# 4. 测试连接
mysql -u root -p church_db -e "SELECT VERSION();"

# 5. 查看 MySQL 错误日志
tail -f /var/log/mysql/error.log
```

### 前端样式或资源加载不完整

```bash
# 1. 清除浏览器缓存
# (Ctrl+Shift+Delete 或浏览器菜单)

# 2. 检查文件是否正确上传
ls -la /var/www/attendance-system/

# 3. 检查文件权限
chmod -R 755 /var/www/attendance-system/

# 4. 查看 Nginx 访问日志
tail -f /var/log/nginx/access.log

# 5. 验证 Gzip 压缩
curl -I -H "Accept-Encoding: gzip" http://你的-服务器/
```

## 📊 性能优化

### 后端优化

```bash
# 1. 增加 Node.js 内存限制
# 编辑 /etc/systemd/system/attendance-server.service
Environment="NODE_OPTIONS=--max-old-space-size=512"

# 2. 配置连接池（已在 db.js 中实现）
# 默认连接数: 10，可根据需求调整

# 3. 启用生产模式
NODE_ENV=production systemctl restart attendance-server
```

### 数据库优化

```bash
# 1. 创建常用查询的索引
mysql -u root -p church_db
CREATE INDEX idx_user_id ON users(id);
CREATE INDEX idx_sign_date ON sign_records(created_at);

# 2. 优化表结构
ANALYZE TABLE users;
OPTIMIZE TABLE sign_records;

# 3. 定期清理历史数据
DELETE FROM sign_records WHERE created_at < DATE_SUB(NOW(), INTERVAL 1 YEAR);
```

### 前端优化（已在构建中实现）

- ✅ Gzip 压缩（Nginx 配置）
- ✅ CSS/JS 最小化和打包
- ✅ 静态资源缓存 30 天
- ✅ 懒加载和代码分割

## 🔄 更新流程

### 更新后端代码

```bash
# 1. 在本地修改代码
# ... 编辑文件 ...

# 2. 上传到服务器
scp -r server/ root@你的-服务器-IP:/opt/attendance-system/new-server

# 3. 备份旧版本
ssh root@你的-服务器-IP
cp -r /opt/attendance-system/server /opt/attendance-system/server.bak

# 4. 替换新版本
rm -rf /opt/attendance-system/server
mv /opt/attendance-system/new-server /opt/attendance-system/server

# 5. 安装新依赖
cd /opt/attendance-system/server
npm install --production

# 6. 重启服务
systemctl restart attendance-server

# 7. 验证更新
systemctl status attendance-server
journalctl -u attendance-server -n 20
```

### 更新前端代码

```bash
# 1. 在本地修改代码
# ... 编辑文件 ...

# 2. 构建新版本
npm run build

# 3. 上传到服务器
scp -r client/dist/* root@你的-服务器-IP:/var/www/attendance-system/

# 4. 浏览器清空缓存刷新即可
```

## 📋 部署检查清单

### 部署前

- [ ] 项目代码完整（包含 client/ 和 server/）
- [ ] 前端已构建到 client/dist/
- [ ] server/package.json 中的依赖配置完整
- [ ] 服务器是 Rocky Linux 8.5
- [ ] 服务器有 root 或 sudo 权限
- [ ] 网络连接稳定
- [ ] 有 2GB+ 可用内存
- [ ] 有 20GB+ 可用磁盘空间

### 部署中

- [ ] 脚本运行无错误
- [ ] 输入了正确的 MySQL 密码
- [ ] 输入了正确的域名或 IP
- [ ] 所有步骤都显示 ✓ 完成标记

### 部署后

- [ ] 能访问 http://你的-服务器
- [ ] 默认账户可以登录（admin/admin123）
- [ ] 前端页面样式正常显示
- [ ] 能正常提交签到数据
- [ ] 后端服务运行正常（systemctl status attendance-server）
- [ ] MySQL 数据库正常运行（systemctl status mysqld）
- [ ] Nginx 正常运行（systemctl status nginx）

## 🆘 获取帮助

如遇到问题，请按以下顺序排查：

1. **查看日志**
   ```bash
   # 后端日志
   journalctl -u attendance-server -f
   
   # Nginx 日志
   tail -f /var/log/nginx/error.log
   
   # MySQL 日志
   tail -f /var/log/mysql/error.log
   ```

2. **检查服务状态**
   ```bash
   systemctl status attendance-server
   systemctl status nginx
   systemctl status mysqld
   ```

3. **查看配置文件**
   ```bash
   cat /etc/nginx/conf.d/attendance.conf
   cat /opt/attendance-system/server/.env
   ```

4. **测试连接**
   ```bash
   curl http://localhost
   curl http://localhost:3000
   mysql -u root -p church_db
   ```

## 📞 技术支持

- 查看 [DEPLOYMENT_ROCKY_GUIDE.md](./DEPLOYMENT_ROCKY_GUIDE.md) 了解更多细节
- 查看 [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md) 完整检查清单
- 查看服务器日志获取更多诊断信息

---

**祝部署顺利！** 🎉
