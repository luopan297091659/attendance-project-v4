# 教会签到系统 v4.0 - 部署指南

## 📦 部署包内容

```
deployment/
├── server/                    # 后端服务
│   ├── app.js                # Express 主应用
│   ├── db.js                 # 数据库连接配置
│   ├── package.json          # 依赖配置
│   └── scripts/              # 数据库迁移脚本
│       └── add_remark_column.js
└── client-dist/              # 前端编译文件（已构建）
    ├── index.html
    ├── assets/
    └── ...
```

## 🚀 快速开始

### 前置条件
- Node.js 14+ 
- MySQL 5.7+
- npm 或 yarn

### 步骤 1: 部署后端

```bash
cd server
npm install
```

### 步骤 2: 配置数据库

确保MySQL正在运行，然后执行初始化脚本：

```bash
# 创建数据库（使用你的MySQL凭证）
mysql -u root -p < ../path/to/init.sql

# 或使用下面的app.js自动连接
```

编辑 `db.js` 配置数据库连接信息：

```javascript
const pool = mysql.createPool({
  host: 'localhost',      // MySQL主机
  user: 'root',           // MySQL用户
  password: 'password',   // MySQL密码
  database: 'church_db',  // 数据库名称
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});
```

### 步骤 3: 运行数据库迁移

```bash
node scripts/add_remark_column.js
```

### 步骤 4: 启动后端服务

```bash
npm start
# 服务将在 http://localhost:3000 启动
```

### 步骤 5: 配置前端

前端已编译完成，后端会自动提供静态文件。

如需更改前端API地址，可以在运行时指定：

```bash
# Linux/Mac
FRONTEND_DIR=/path/to/client-dist npm start

# Windows PowerShell
$env:FRONTEND_DIR="D:\path\to\client-dist"; npm start
```

## 📋 环境变量配置

创建 `.env` 文件（可选）：

```env
# 数据库配置
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=church_db

# API服务器
API_PORT=3000
API_URL=http://localhost:3000

# 前端目录
FRONTEND_DIR=./client-dist
```

## 🔐 安全建议

1. **修改默认密码**
   - 默认管理员账号：`admin`
   - 需要修改默认密码

2. **HTTPS配置**
   - 生产环境使用HTTPS
   - 配合Nginx进行反向代理

3. **数据库安全**
   - 使用强密码
   - 只允许本地连接或信任的IP访问

## 🔄 升级步骤

如果是从旧版本升级：

1. 备份现有数据库
   ```bash
   mysqldump -u root -p church_db > church_db_backup.sql
   ```

2. 停止现有服务

3. 使用新的部署包替换

4. 运行迁移脚本
   ```bash
   node scripts/add_remark_column.js
   ```

5. 重启服务

## 🐛 故障排查

### 数据库连接失败
- 检查MySQL是否正在运行
- 验证数据库凭证
- 检查数据库是否存在

### 前端404错误
- 确保 `FRONTEND_DIR` 指向正确的位置
- 确保 `client-dist` 文件夹存在且包含 `index.html`

### 端口被占用
```bash
# Windows 查找占用端口的进程
netstat -ano | findstr :3000

# Kill 进程
taskkill /PID <PID> /F
```

## 📊 系统新增功能

本版本新增功能：

### ✨ 备注管理
- 员工列表新增"备注"字段
- 支持在列表中直接编辑备注

### 🔄 多人同号处理
- 支持一个手机号对应多个员工（如家庭成员）
- 签到时如存在多人会弹出选择对话框
- 注册时允许同号注册多人

### 🎨 UI优化
- 管理员登录页图标边框修复（圆形样式）
- 更友好的错误提示

## 📞 支持

如有问题，请检查：
1. 服务器日志（console输出）
2. 浏览器开发者工具（F12）
3. MySQL错误日志

---

**最后更新**: 2026-02-06
