# 非 Docker 环境 - 前端后端地址配置指南

## 📍 配置位置速查表

| 场景 | 配置文件 | 说明 |
|------|---------|------|
| **开发环境** | `client/.env` | 本地开发调试 |
| **生产环境** | `client/.env.production` | 部署到服务器 |
| **运行时修改** | 登录页面 "⚙️ API 配置" | 无需重新构建 |
| **浏览器存储** | localStorage | 自动保存用户配置 |

---

## 🔧 配置方法 1: 编译时配置（推荐部署时使用）

### 步骤 1: 编辑环境变量文件

#### 开发环境 `client/.env`

```bash
# 用于本地开发，连接本地后端
VITE_API_BASE_URL=http://localhost:3000
```

#### 生产环境 `client/.env.production`

```bash
# 生产部署 - 三种选择任选其一：

# 选项 A: 前后端在同一台服务器（推荐）
# 留空表示使用相对路径，自动适应任何域名/IP
VITE_API_BASE_URL=

# 选项 B: 后端在不同服务器（具体 IP）
VITE_API_BASE_URL=http://192.168.1.100:3000

# 选项 C: 后端在不同服务器（域名）
VITE_API_BASE_URL=https://api.example.com:3000
```

### 步骤 2: 重新构建前端

```bash
cd client

# 开发环境
npm run dev

# 生产环境（自动使用 .env.production）
npm run build
```

### 步骤 3: 验证配置

访问 http://localhost:5173（开发）或部署的前端地址，打开浏览器开发者工具（F12）：

```javascript
// 在控制台查看当前 API 地址
console.log(window.localStorage.getItem('api_base_url'))
```

---

## 🖱️ 配置方法 2: 运行时配置（推荐生产使用）

### 不需要重新构建！

1. **打开登录页面**
   - 访问: `http://你的-服务器-IP`

2. **点击右下角的 "⚙️ API 配置" 按钮**

3. **在弹窗中输入后端地址**

   ```
   ┌───────────────────────────────────────┐
   │  API 服务器配置                        │
   ├───────────────────────────────────────┤
   │  服务器地址:                           │
   │  [                                  ] │
   │                                       │
   │  说明:                                │
   │  • 默认: http://localhost:3000        │
   │  • 生产: 留空使用相对路径             │
   │  • 自定义: http://IP:端口            │
   │  • 当前: ________________________      │
   │                                       │
   │  [重置为默认] [确认保存] [取消]       │
   └───────────────────────────────────────┘
   ```

4. **点击 "确认保存"**
   - 配置自动保存到浏览器 localStorage
   - 刷新页面立即生效
   - 不需要重新构建！

---

## 🎯 不同部署场景

### 场景 1: 本地开发（前后端分离）

**后端地址**: `http://localhost:3000`

**配置文件**: `client/.env`
```bash
VITE_API_BASE_URL=http://localhost:3000
```

**启动方式**:
```bash
# 终端 1: 启动后端
cd server
npm start

# 终端 2: 启动前端开发服务器
cd client
npm run dev

# 访问: http://localhost:5173
```

---

### 场景 2: Rocky Linux 服务器（前后端同机）

**最简单的方式！**

**构建前端**:
```bash
cd client
npm run build
# 使用默认的 .env.production（VITE_API_BASE_URL 为空）
```

**上传到服务器**:
```bash
scp -r client/dist/* root@服务器IP:/var/www/attendance-system/
```

**前端会自动**:
- 使用相对路径 `/api`
- 自动连接到当前域名的后端
- 无论你用什么 IP 或域名访问都能正常工作

**验证**:
- 访问: `http://服务器IP`
- 登录: `admin / admin123`

---

### 场景 3: 后端在不同的 IP 地址

**假设**:
- 前端服务器: `192.168.1.100`
- 后端服务器: `192.168.1.200:3000`

**方式 A: 修改 .env.production（需要重新构建）**

```bash
# client/.env.production
VITE_API_BASE_URL=http://192.168.1.200:3000
```

然后重新构建并部署

**方式 B: 运行时配置（推荐！不需要重新构建）**

1. 前端已部署到 `192.168.1.100`
2. 访问前端登录页面
3. 点击 "⚙️ API 配置"
4. 输入: `http://192.168.1.200:3000`
5. 点击保存

---

### 场景 4: 使用域名和 HTTPS

**假设**:
- 前端: `https://app.example.com`
- 后端: `https://api.example.com:3000`

**方式 A: 修改 .env.production（需要重新构建）**

```bash
# client/.env.production
VITE_API_BASE_URL=https://api.example.com:3000
```

**方式 B: 运行时配置（推荐！**

1. 访问: `https://app.example.com`
2. 点击 "⚙️ API 配置"
3. 输入: `https://api.example.com:3000`
4. 保存

---

## 📋 配置优先级

系统会按以下顺序选择 API 地址：

```
1️⃣  用户在登录页配置的地址 (localStorage 中的 api_base_url)
    ↓ 如果没有
    
2️⃣  编译时的环境变量 (VITE_API_BASE_URL)
    ↓ 如果没有
    
3️⃣  默认值：相对路径 (相对于当前域名)
```

**优势**：
- 用户自定义配置 > 编译时配置 > 默认值
- 可以先用默认值，后期灵活调整

---

## 🔍 查看当前配置

### 方法 1: 浏览器控制台

```javascript
// 打开浏览器 F12 → 控制台，输入：

// 查看保存的配置
localStorage.getItem('api_base_url')
// 输出: "http://192.168.1.100:3000" 或 null

// 查看当前使用的 API 基础 URL
// (需要在应用中调用)
```

### 方法 2: 网络标签查看实际请求

```
F12 → Network 标签 → 发起任何 API 请求
查看请求 URL，例如：
  http://192.168.1.100:3000/api/admin/login
```

---

## ⚙️ 特殊配置

### 配置 1: 强制使用相对路径

编辑 `client/.env.production`：
```bash
VITE_API_BASE_URL=
```

重新构建：
```bash
npm run build
```

效果：前端会使用 `/api` 相对路径，自动适应任何域名

### 配置 2: 强制使用特定地址

编辑 `client/.env.production`：
```bash
VITE_API_BASE_URL=http://specific-server.com:3000
```

重新构建：
```bash
npm run build
```

效果：无论用户从哪里访问，都会连接到这个特定地址

### 配置 3: 隐藏 API 配置按钮

编辑 `client/src/views/admin/AdminLogin.vue`，找到这行：

```vue
<el-link type="primary" @click="showApiConfig = true" :underline="false">
  ⚙️ API 配置
</el-link>
```

注释掉这行，然后重新构建

---

## 🚀 完整部署流程

### 部署到同机服务器（推荐）

```bash
# 1. 本地构建
cd client
npm run build

# 2. 上传前端文件
scp -r dist/* root@192.168.1.100:/var/www/attendance-system/

# 3. 完成！
# 前端会自动使用 /api 相对路径连接后端
# 访问: http://192.168.1.100
```

### 部署到异机服务器

```bash
# 1. 修改配置
# 编辑 client/.env.production
VITE_API_BASE_URL=http://192.168.1.200:3000

# 2. 构建
npm run build

# 3. 上传
scp -r dist/* root@192.168.1.100:/var/www/attendance-system/

# 4. 完成！
# 前端会连接到 192.168.1.200:3000
```

---

## 🐛 常见问题

### Q: 前端无法连接后端？

**排查步骤**:

1. 打开浏览器 F12 → Network 标签
2. 尝试登录，查看 API 请求 URL
3. 确认 URL 是否正确：
   - 应该是: `http://你的-后端:3000/api/admin/login`
4. 如果 URL 不对，使用 API 配置功能修改

### Q: 修改了 .env.production 但没生效？

**原因**: 需要重新构建和上传

```bash
# 1. 修改配置
nano client/.env.production

# 2. 重新构建
npm run build

# 3. 重新上传
scp -r client/dist/* root@server:/var/www/attendance-system/

# 4. 刷新浏览器
# Ctrl+Shift+Delete 清空缓存
```

### Q: 不想重新构建，怎么改配置？

**答**: 使用运行时配置！

1. 打开登录页面
2. 点击 "⚙️ API 配置"
3. 输入新地址
4. 保存
5. 刷新

**无需重新构建！**

### Q: 如何清除保存的配置？

**浏览器中执行**:
```javascript
localStorage.removeItem('api_base_url')
location.reload()
```

或点击 API 配置窗口中的 "重置为默认" 按钮

### Q: HTTPS 环境下无法连接 HTTP 后端？

**解决**: 后端也需要使用 HTTPS

```bash
# 或使用相同的协议
VITE_API_BASE_URL=https://your-backend:3000
```

### Q: 如何在生产环境自动检测后端地址？

编辑 `client/src/api.js` 中的 `getApiBaseUrl()` 函数，添加自动检测逻辑

---

## 📂 相关文件位置

```
client/
├── .env                    # 开发环境配置
├── .env.production         # 生产环境配置（部署时用这个）
├── .env.example            # 配置示例
├── src/
│   ├── api.js             # API 配置的核心文件
│   └── views/admin/
│       └── AdminLogin.vue  # 登录页面（包含 API 配置界面）
└── dist/                   # 构建后的前端文件（部署时用这个）
```

---

## ✅ 检查清单

部署前确认：

- [ ] `client/.env.production` 中的 `VITE_API_BASE_URL` 已正确设置
- [ ] 已执行 `npm run build`
- [ ] `client/dist/` 目录已生成
- [ ] 前端文件已上传到服务器
- [ ] 后端服务已启动
- [ ] 防火墙已允许通过（或 Nginx 代理已配置）

部署后验证：

- [ ] 能访问前端: `http://服务器-IP`
- [ ] 点击 API 配置，查看当前地址
- [ ] 能成功登录（测试 API 连接）
- [ ] 浏览器 F12 查看 API 请求 URL 是否正确

---

**总结**: 前端有两种配置后端地址的方式：
1. **编译时** - 编辑 `.env.production` 然后 `npm run build`
2. **运行时** - 登录页面点击 "⚙️ API 配置"（推荐！无需重新构建）

