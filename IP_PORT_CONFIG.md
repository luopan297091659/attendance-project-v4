# IP和端口配置指南

本文档说明如何配置考勤签到系统的IP地址和端口。

## 📋 目录结构

```
attendance-project-v4/
├── client/              # 前端项目
│   ├── .env            # 前端环境变量（开发）
│   ├── .env.development # 开发环境配置
│   ├── .env.production  # 生产环境配置
│   ├── .env.example     # 配置示例
│   └── vite.config.js   # Vite配置
└── server/              # 后端项目
    ├── .env            # 后端环境变量
    ├── .env.example    # 配置示例
    └── app.js          # 服务器入口
```

## 🎯 快速配置

### 1️⃣ 前端配置

编辑 `client/.env` 文件：

```env
# 后端API地址（根据实际情况修改）
VITE_API_BASE_URL=http://127.0.0.1:8000

# 前端开发服务器配置
VITE_DEV_HOST=0.0.0.0
VITE_DEV_PORT=5173
```

**常用配置场景：**

- **本地开发**：`VITE_API_BASE_URL=http://127.0.0.1:8000`
- **局域网测试**：`VITE_API_BASE_URL=http://192.168.x.x:8000`
- **远程服务器**：`VITE_API_BASE_URL=http://your-server-ip:8000`
- **生产环境（同机）**：`VITE_API_BASE_URL=` （留空）

### 2️⃣ 后端配置

编辑 `server/.env` 文件：

```env
# 服务器端口
PORT=8000

# 服务器监听地址
HOST=0.0.0.0

# 数据库配置
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=church_db
```

## 🔧 详细配置说明

### 前端配置项

| 配置项 | 说明 | 默认值 | 示例 |
|--------|------|--------|------|
| `VITE_API_BASE_URL` | 后端API完整地址 | `http://127.0.0.1:8000` | `http://192.168.1.100:8000` |
| `VITE_DEV_HOST` | 前端服务器监听地址 | `0.0.0.0` | `0.0.0.0` 或 `127.0.0.1` |
| `VITE_DEV_PORT` | 前端服务器端口 | `5173` | `5173` 或其他端口 |
| `VITE_PREVIEW_HOST` | 预览服务器监听地址 | `0.0.0.0` | `0.0.0.0` |
| `VITE_PREVIEW_PORT` | 预览服务器端口 | `4173` | `4173` |

### 后端配置项

| 配置项 | 说明 | 默认值 | 示例 |
|--------|------|--------|------|
| `PORT` | 后端服务器端口 | `8000` | `8000` 或其他端口 |
| `HOST` | 服务器监听地址 | `0.0.0.0` | `0.0.0.0` 允许外部访问 |
| `DB_HOST` | 数据库地址 | `127.0.0.1` | `127.0.0.1` 或远程IP |
| `DB_PORT` | 数据库端口 | `3306` | `3306` |
| `DB_USER` | 数据库用户 | `root` | 实际用户名 |
| `DB_PASSWORD` | 数据库密码 | - | 实际密码 |
| `DB_NAME` | 数据库名 | `church_db` | `church_db` |
| `FRONTEND_DIR` | 前端构建目录 | `../client/dist` | 相对或绝对路径 |

## 🌐 常见部署场景

### 场景1: 本地开发（前后端同机）

**前端 `.env`:**
```env
VITE_API_BASE_URL=http://127.0.0.1:8000
VITE_DEV_PORT=5173
```

**后端 `.env`:**
```env
PORT=8000
DB_HOST=127.0.0.1
```

**访问地址:**
- 前端: http://localhost:5173
- 后端: http://localhost:8000

---

### 场景2: 局域网测试（手机访问电脑）

**前端 `.env`:**
```env
VITE_API_BASE_URL=http://192.168.1.100:8000
VITE_DEV_HOST=0.0.0.0
VITE_DEV_PORT=5173
```

**后端 `.env`:**
```env
PORT=8000
HOST=0.0.0.0
DB_HOST=127.0.0.1
```

**访问地址:**
- 电脑浏览器: http://localhost:5173 或 http://192.168.1.100:5173
- 手机浏览器: http://192.168.1.100:5173

---

### 场景3: 生产部署（前后端同服务器）

**前端 `.env.production`:**
```env
VITE_API_BASE_URL=
# 留空使用相对路径
```

**后端 `.env`:**
```env
PORT=8000
HOST=0.0.0.0
DB_HOST=127.0.0.1
DB_PASSWORD=安全密码
```

**部署步骤:**
1. 构建前端: `cd client && npm run build`
2. 后端托管静态文件: 后端会自动从 `../client/dist` 加载前端
3. 启动后端: `cd server && npm start`
4. 访问: http://your-domain.com:8000

---

### 场景4: 前后端分离部署

**前端 `.env.production`:**
```env
VITE_API_BASE_URL=http://api.your-domain.com:8000
```

**后端 `.env`:**
```env
PORT=8000
HOST=0.0.0.0
DB_HOST=数据库服务器IP
DB_PASSWORD=安全密码
```

**访问地址:**
- 前端: http://www.your-domain.com
- 后端: http://api.your-domain.com:8000

---

## 🚀 启动命令

### 开发环境

```bash
# 启动后端（先启动）
cd server
npm start

# 启动前端（新终端）
cd client
npm run dev
```

### 生产环境

```bash
# 构建前端
cd client
npm run build

# 启动后端（会自动托管前端静态文件）
cd server
npm start
```

## ⚙️ Vite配置说明

`client/vite.config.js` 文件从环境变量读取配置：

```javascript
server: {
  host: process.env.VITE_DEV_HOST || '0.0.0.0',
  port: parseInt(process.env.VITE_DEV_PORT) || 5173,
  proxy: {
    '/api': {
      target: process.env.VITE_API_BASE_URL || 'http://localhost:8000',
      changeOrigin: true,
    }
  }
}
```

## 🔒 安全建议

1. ✅ **不要提交 `.env` 文件到Git**（已在 `.gitignore` 中）
2. ✅ **生产环境使用强密码**（数据库密码、JWT密钥）
3. ✅ **使用环境变量**而非硬编码配置
4. ✅ **定期更换密码**
5. ✅ **使用HTTPS**（生产环境）

## 🐛 常见问题

### Q1: 前端无法连接后端？

**检查清单:**
- [ ] 后端是否已启动？
- [ ] 后端端口是否正确（默认8000）？
- [ ] `VITE_API_BASE_URL` 配置是否正确？
- [ ] 防火墙是否允许该端口？
- [ ] 跨域配置是否正确？

### Q2: 手机无法访问前端？

**解决方案:**
1. 确保 `VITE_DEV_HOST=0.0.0.0`
2. 确保电脑和手机在同一局域网
3. 使用电脑的局域网IP（如 `192.168.1.100:5173`）
4. 关闭电脑防火墙或添加端口例外

### Q3: 端口被占用？

**解决方案:**
```bash
# 修改端口配置
# 前端: 修改 VITE_DEV_PORT=5174
# 后端: 修改 PORT=8001
```

或者使用 `strictPort: false` 自动选择可用端口（已配置）。

### Q4: 生产环境API调用失败？

**检查:**
1. `.env.production` 中 `VITE_API_BASE_URL` 配置
2. 如果前后端同机部署，留空使用相对路径
3. 检查后端CORS配置

## 📞 技术支持

如有问题，请检查：
1. 环境变量配置是否正确
2. 端口是否被占用
3. 网络连接是否正常
4. 浏览器控制台是否有错误信息

---

**最后更新:** 2026年2月7日
