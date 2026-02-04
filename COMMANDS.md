# 命令速查表

快速查看和复制本项目的常用命令。

## 🚀 快速启动（完整流程）

```bash
# 终端1：运行数据库迁移和后端服务
cd server
npm install
node scripts/migrate_church_system.js
node scripts/init_test_data.js
node app.js

# 终端2：运行前端开发服务
cd client
npm install
npm run dev
```

然后访问 `http://localhost:5173/admin/login`

---

## 📦 安装命令

### 后端依赖安装
```bash
cd server
npm install
```

### 前端依赖安装
```bash
cd client
npm install
```

### 安装特定包
```bash
# 后端
cd server
npm install qrcode bcryptjs express cors dayjs jwt exceljs

# 前端
cd client
npm install qrcode element-plus vue-router axios echarts xlsx
```

---

## 🗄️ 数据库命令

### 运行迁移脚本
```bash
cd server
node scripts/migrate_church_system.js
```

### 初始化测试数据
```bash
cd server
node scripts/init_test_data.js
```

### 测试数据库连接
```bash
cd server
node scripts/test_db.js
```

### 手动备份数据库
```bash
mysqldump -h 139.196.44.6 -u church_user -p church_db > backup.sql
```

### 手动恢复数据库
```bash
mysql -h 139.196.44.6 -u church_user -p church_db < backup.sql
```

### 直接连接数据库
```bash
mysql -h 139.196.44.6 -u church_user -p -D church_db
```

---

## 🔧 开发命令

### 后端

启动开发服务器：
```bash
cd server
node app.js
```

运行脚本（示例）：
```bash
cd server
node scripts/check_columns.js
node scripts/test_login_simple.js
```

### 前端

启动开发服务器：
```bash
cd client
npm run dev
```

生产构建：
```bash
cd client
npm run build
```

预览构建结果：
```bash
cd client
npm run preview
```

---

## 📝 文件编辑

### 查看关键文件

**后端路由**：
```bash
cat server/app.js
```

**数据库配置**：
```bash
cat server/db.js
```

**前端API客户端**：
```bash
cat client/src/api.js
```

**Dashboard组件**：
```bash
cat client/src/views/admin/Dashboard.vue
```

---

## 🔍 调试命令

### 查看后端错误日志
```bash
cd server
node app.js 2>&1 | tee app.log
```

### 测试特定API端点
```bash
# 登录
curl -X POST http://localhost:3000/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'

# 获取员工列表（需要token）
curl -H "Authorization: YOUR_TOKEN" \
  http://localhost:3000/api/admin/employees

# 获取签到二维码
curl -H "Authorization: YOUR_TOKEN" \
  http://localhost:3000/api/admin/qrcode
```

### 查看前端构建警告
```bash
cd client
npm run build 2>&1 | grep warning
```

---

## 🧹 清理命令

### 清除npm缓存
```bash
npm cache clean --force
```

### 删除node_modules重新安装
```bash
# 后端
cd server
rm -rf node_modules package-lock.json
npm install

# 前端
cd client
rm -rf node_modules package-lock.json
npm install
```

### 清除前端构建产物
```bash
cd client
rm -rf dist
```

---

## 📊 性能检查

### 检查后端性能
```bash
cd server
time node app.js
```

### 查看数据库表大小
```bash
mysql -h 139.196.44.6 -u church_user -p -e \
  "SELECT table_name, ROUND(((data_length + index_length) / 1024 / 1024), 2) AS size_mb 
   FROM information_schema.TABLES 
   WHERE table_schema = 'church_db';"
```

### 查看慢查询日志
```bash
# MySQL配置中启用慢查询日志后
tail -f /var/log/mysql/slow.log
```

---

## 🔐 安全命令

### 生成密码hash（用于创建新管理员）
```bash
cd server
node -e "const bcrypt = require('bcryptjs'); console.log(bcrypt.hashSync('password123', 10))"
```

### 手动创建管理员
```bash
# 先生成密码hash（见上）
mysql -h 139.196.44.6 -u church_user -p church_db -e \
  "INSERT INTO admins (username, password, company_id) 
   VALUES ('newadmin', 'HASHED_PASSWORD', 1);"
```

---

## 📱 移动测试

### 在其他设备上访问本机服务

获取本机IP：
```bash
# Windows
ipconfig

# Mac/Linux
ifconfig
```

然后在其他设备访问：
```
http://<YOUR_IP>:5173/admin/login
```

---

## 📚 查看文档

打开各种文档：
```bash
# 快速启动指南
cat QUICK_START.md

# 升级详细说明
cat UPGRADE_GUIDE.md

# 实现总结
cat IMPLEMENTATION_SUMMARY.md

# 本命令速查表
cat COMMANDS.md
```

---

## 🆘 常见问题快速解决

### 端口被占用
```bash
# 查看占用端口的进程
# Windows
netstat -ano | findstr :3000

# Mac/Linux
lsof -i :3000

# 杀死进程（获取PID后）
# Windows
taskkill /PID <PID> /F

# Mac/Linux
kill -9 <PID>
```

### 数据库连接失败
```bash
cd server
node scripts/test_db.js
```

### 前端包冲突
```bash
cd client
npm ci  # 清洁安装，使用 package-lock.json
```

### 重置为初始状态
```bash
# 清空所有依赖
cd server && rm -rf node_modules && cd ../client && rm -rf node_modules

# 重新安装所有依赖
cd ../server && npm install && cd ../client && npm install

# 重新运行迁移
cd ../server && node scripts/migrate_church_system.js

# 初始化测试数据
node scripts/init_test_data.js
```

---

## 📋 生产部署快速清单

```bash
# 1. 准备
npm ci --production

# 2. 构建前端
cd client && npm run build && cd ..

# 3. 备份数据库
mysqldump -h 139.196.44.6 -u church_user -p church_db > backup_$(date +%Y%m%d_%H%M%S).sql

# 4. 运行迁移
cd server && node scripts/migrate_church_system.js && cd ..

# 5. 启动服务（使用PM2）
pm2 start server/app.js --name attendance-server
pm2 save

# 6. 启动前端（使用nginx或其他）
# 配置nginx指向 client/dist 目录

# 7. 验证
curl http://localhost:3000/api/admin/login
```

---

## 🎯 Git相关命令

### 查看变更
```bash
git status
git diff
git log --oneline -10
```

### 提交变更
```bash
git add .
git commit -m "feat: 多教会系统升级"
git push origin main
```

### 查看特定文件历史
```bash
git log --follow -- client/src/components/ChurchManagement.vue
```

---

## 💡 快速记住

最常用的三个命令：

```bash
# 启动后端
cd server && npm install && node scripts/migrate_church_system.js && node app.js

# 启动前端（新终端）
cd client && npm install && npm run dev

# 初始化测试数据（可选，新终端）
cd server && node scripts/init_test_data.js
```

---

**提示**：将常用命令保存到 `.bash_aliases` 或 PowerShell Profile 中以加快输入速度！

