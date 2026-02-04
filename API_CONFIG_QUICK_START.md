# 快速配置指南 - 前端后端地址设置

## 💡 最快的方式（运行时配置）

**不需要修改代码，不需要重新构建！**

### 三步完成：

1. **打开浏览器访问前端**
   ```
   http://你的-服务器-IP
   ```

2. **点击登录页右下角的 "⚙️ API 配置" 按钮**

3. **输入后端地址并保存**
   ```
   输入框: http://后端-服务器-IP:3000
   点击: 确认保存
   ```

**完成！** ✅ 配置立即生效，无需重新加载

---

## 📝 详细配置地址

如果你需要通过修改文件来配置，编辑这个文件：

**文件路径**: `client/.env.production`

### 根据你的部署场景选择：

#### 情况 1: 前后端在同一个服务器上（推荐）
```bash
# client/.env.production
VITE_API_BASE_URL=
```
💡 留空表示使用相对路径，自动适应任何域名

#### 情况 2: 后端在不同的服务器（IP 地址）
```bash
# client/.env.production
VITE_API_BASE_URL=http://192.168.1.100:3000
```

#### 情况 3: 后端在不同的服务器（域名）
```bash
# client/.env.production
VITE_API_BASE_URL=http://api.example.com:3000
```

#### 情况 4: 开发环境（本地调试）
```bash
# client/.env
VITE_API_BASE_URL=http://localhost:3000
```

---

## 🔄 修改后需要重新构建

编辑了 `.env.production` 后，执行：

```bash
cd client
npm run build
```

然后重新上传 `dist/` 目录到服务器

---

## 🔍 如何验证配置是否生效

### 方法 1: 看网络请求
1. 打开浏览器开发者工具 (F12)
2. 点击 "Network" 标签
3. 尝试登录
4. 查看 API 请求的完整 URL
   - 应该显示: `http://后端-IP:3000/api/admin/login`

### 方法 2: 检查浏览器存储
1. 打开浏览器开发者工具 (F12)
2. 点击 "Application" 或 "Storage" 标签
3. 找到 "Local Storage"
4. 查看 `api_base_url` 的值

---

## 📊 配置方式对比

| 方式 | 位置 | 何时生效 | 优点 | 缺点 |
|------|------|---------|------|------|
| **运行时配置** | 登录页"⚙️" | 立即生效 | 无需重新构建 | 依赖浏览器存储 |
| **编译时配置** | `.env.production` | 构建时 | 写入代码中 | 需重新构建上传 |
| **默认值** | `api.js` | 编译时 | 无需配置 | 不够灵活 |

**推荐**: 先用运行时配置测试，确认无误后再用编译时配置部署

---

## 🚀 完整部署流程

### 步骤 1: 本地构建前端
```bash
cd client
npm run build
# 生成 dist/ 目录
```

### 步骤 2: 上传到服务器
```bash
scp -r client/dist/* root@192.168.1.100:/var/www/attendance-system/
```

### 步骤 3: 访问并配置
```
1. 浏览器访问: http://192.168.1.100
2. 点击: ⚙️ API 配置
3. 输入后端地址（如需）
4. 点击: 确认保存
```

### 步骤 4: 测试登录
```
用户名: admin
密码: admin123
点击: 登录
```

---

## 🔧 文件位置速查

```
attendance-project-v4/
├── client/
│   ├── .env                    ← 开发环境配置
│   ├── .env.production         ← 生产环境配置（部署时）
│   ├── src/
│   │   └── api.js             ← API 配置代码
│   └── dist/                   ← 构建输出（部署这个）
└── server/                     ← 后端代码
```

---

## ⚡ 常用命令

```bash
# 开发（本地调试）
cd client
npm run dev
# 访问: http://localhost:5173

# 生产构建
cd client
npm run build

# 上传前端
scp -r client/dist/* root@服务器IP:/var/www/attendance-system/

# 查看当前配置
# 浏览器 F12 → Console → localStorage.getItem('api_base_url')
```

---

## ✨ 关键点总结

✅ **推荐做法**：
1. 本地开发用 `http://localhost:3000`
2. 生产部署用相对路径（留空）
3. 如需调整，用运行时配置（登录页的 API 配置按钮）

❌ **避免做法**：
1. 在代码中硬编码内网 IP（不够灵活）
2. 混淆生产和开发配置
3. 忘记重新构建（修改 .env 后必须 npm run build）

---

**有问题？** 查看详细指南: [FRONTEND_API_CONFIG.md](./FRONTEND_API_CONFIG.md)
