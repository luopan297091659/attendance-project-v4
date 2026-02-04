# 考勤签到系统 - 部署指南

## 项目概述
- **前端**：Vue 3 + Vite（已构建到 `client/dist`）
- **后端**：Node.js + Express + MySQL
- **数据库**：MySQL 8.0+

## 部署前准备

### 1. 系统要求
- Node.js >= 16.0
- npm >= 8.0
- MySQL >= 8.0
- 2GB 内存
- 20GB 磁盘空间

### 2. 前端构建状态
✅ **前端已构建**
- 构建输出目录：`client/dist/`
- 构建大小：
  - CSS: 376.72 kB (gzip: 51.53 kB)
  - JS: 2,249.35 kB (gzip: 745.71 kB)
  - HTML: 0.41 kB (gzip: 0.27 kB)

### 3. 文件结构
```
├── server/
│   ├── app.js                 # 后端主入口
│   ├── db.js                  # 数据库连接
│   ├── package.json
│   └── sql/
│       └── init.sql           # 数据库初始化脚本
├── client/
│   └── dist/                  # 前端构建文件（部署时使用）
│       ├── index.html
│       └── assets/
│           ├── index-*.css
│           └── index-*.js
└── DEPLOYMENT_GUIDE.md        # 本文件
```

## 部署步骤

### 方案 1：在服务器上部署（推荐）

#### 1.1 服务器准备
```bash
# 安装 Node.js
curl -sL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 安装 MySQL
sudo apt-get install -y mysql-server

# 创建项目目录
mkdir -p /var/www/attendance-system
cd /var/www/attendance-system
```

#### 1.2 上传项目文件
```bash
# 上传方式 1：使用 git
git clone <your-repo-url> .

# 上传方式 2：使用 scp
scp -r /d/PROJECT/attendance-project-v4 user@server:/var/www/
```

#### 1.3 数据库初始化
```bash
# 连接 MySQL
mysql -u root -p

# 在 MySQL 中执行初始化脚本
source server/sql/init.sql;
```

#### 1.4 安装依赖
```bash
cd /var/www/attendance-system/server
npm install
```

#### 1.5 配置环境变量
创建 `.env` 文件或设置环境变量：
```bash
# Linux/Mac
export DB_HOST=localhost
export DB_USER=root
export DB_PASSWORD=your_password
export DB_NAME=church_db
export NODE_ENV=production
export PORT=3000
```

```cmd
# Windows
setx DB_HOST localhost
setx DB_USER root
setx DB_PASSWORD your_password
setx DB_NAME church_db
setx NODE_ENV production
setx PORT 3000
```

#### 1.6 启动后端服务
```bash
# 使用 Node 直接运行
node app.js

# 或使用 pm2（推荐用于生产环境）
npm install -g pm2
pm2 start app.js --name "attendance-server"
pm2 startup
pm2 save
```

#### 1.7 配置前端服务（使用 Nginx）
```nginx
server {
    listen 80;
    server_name your-domain.com;

    # 前端静态文件
    location / {
        root /var/www/attendance-system/client/dist;
        try_files $uri $uri/ /index.html;
        expires 30d;
    }

    # 后端 API
    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        
        # CORS 支持
        add_header Access-Control-Allow-Origin * always;
        add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS" always;
        add_header Access-Control-Allow-Headers "Content-Type, Authorization" always;
    }

    # HTTPS 配置（可选但推荐）
    listen 443 ssl;
    ssl_certificate /etc/ssl/certs/cert.pem;
    ssl_certificate_key /etc/ssl/private/key.pem;
}
```

### 方案 2：使用 Docker 部署

#### 2.1 创建 Dockerfile（后端）
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY server/package*.json ./
RUN npm install --production

COPY server/ ./

EXPOSE 3000

ENV NODE_ENV=production

CMD ["node", "app.js"]
```

#### 2.2 创建 Docker Compose 文件
```yaml
version: '3.8'

services:
  mysql:
    image: mysql:8.0
    environment:
      MYSQL_ROOT_PASSWORD: your_password
      MYSQL_DATABASE: church_db
    volumes:
      - mysql_data:/var/lib/mysql
      - ./server/sql/init.sql:/docker-entrypoint-initdb.d/init.sql
    ports:
      - "3306:3306"

  backend:
    build: .
    environment:
      DB_HOST: mysql
      DB_USER: root
      DB_PASSWORD: your_password
      DB_NAME: church_db
      PORT: 3000
    ports:
      - "3000:3000"
    depends_on:
      - mysql

  frontend:
    image: nginx:alpine
    volumes:
      - ./client/dist:/usr/share/nginx/html
      - ./nginx.conf:/etc/nginx/nginx.conf
    ports:
      - "80:80"
    depends_on:
      - backend

volumes:
  mysql_data:
```

#### 2.3 启动 Docker 容器
```bash
docker-compose up -d
```

## 配置说明

### 数据库配置
默认配置在 `server/db.js`：
```javascript
{
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '6586156',
  database: process.env.DB_NAME || 'church_db'
}
```

### 签到 URL 配置
- 登录后在"超级管理"标签页配置签到 URL
- 配置示例：`https://your-domain.com/sign`
- 该 URL 会生成在二维码中，供成员扫描或手动访问

### API 端点
| 功能 | 方法 | 端点 |
|------|------|------|
| 管理员登录 | POST | /api/admin/login |
| 获取今日签到 | GET | /api/admin/today |
| 获取统计数据 | GET | /api/admin/stats |
| 获取二维码 | GET | /api/admin/qrcode |
| 公开签到 | POST | /api/public/sign |

## 常见问题

### Q1: 数据库连接失败？
```bash
# 检查 MySQL 是否运行
sudo systemctl status mysql

# 重启 MySQL
sudo systemctl restart mysql

# 检查凭证
mysql -u root -p -h localhost
```

### Q2: 前端无法连接后端？
- 检查后端是否运行在正确的端口
- 检查防火墙是否开放端口
- 检查 API 代理配置（Nginx 或 Apache）

### Q3: 签到二维码无法扫描？
- 确保签到 URL 配置正确
- 检查 URL 是否可从手机访问
- 测试 URL：`https://your-domain.com/sign`

## 性能优化

### 1. 前端优化
- ✅ 代码已压缩和混淆
- 建议启用 GZIP 压缩
- 设置合理的缓存策略

### 2. 后端优化
- 增加 MySQL 连接池大小
- 启用 API 缓存
- 使用 Redis 存储会话

### 3. 数据库优化
```sql
-- 创建必要的索引
CREATE INDEX idx_employee_phone ON employees(phone);
CREATE INDEX idx_attendance_church ON attendance(church_id);
CREATE INDEX idx_attendance_date ON attendance(sign_time);
```

## 监控和日志

### 使用 PM2 监控
```bash
# 查看实时日志
pm2 logs attendance-server

# 查看应用状态
pm2 status

# 查看应用详情
pm2 info attendance-server
```

### Nginx 日志
```bash
# 访问日志
tail -f /var/log/nginx/access.log

# 错误日志
tail -f /var/log/nginx/error.log
```

## 备份和恢复

### 数据库备份
```bash
# 完整备份
mysqldump -u root -p church_db > backup.sql

# 定期备份（使用 cron）
0 2 * * * mysqldump -u root -p church_db > /backups/church_db_$(date +\%Y\%m\%d).sql
```

### 数据库恢复
```bash
mysql -u root -p church_db < backup.sql
```

## 安全建议

1. **更改默认密码**
   - 修改 MySQL root 密码
   - 修改管理员账号密码

2. **SSL/TLS 配置**
   - 使用 Let's Encrypt 获取免费证书
   - 配置 HTTPS

3. **防火墙设置**
   - 只开放必要的端口（80, 443, 3306 仅本地）
   - 限制 API 访问速率

4. **定期备份**
   - 设置每日备份计划
   - 定期测试恢复流程

## 支持和反馈

- 📧 邮件：support@example.com
- 📞 电话：+86-xxxx-xxxx-xxxx
- 💬 在线客服：www.example.com/support

---

**最后更新**：2026-02-02
**版本**：v4.0.0
