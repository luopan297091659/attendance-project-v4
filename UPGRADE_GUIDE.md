# 多教会系统升级指南

## 功能概览

本次更新为签到系统添加了完整的多教会管理功能：

### 1. 人员信息管理 ✓
- **新增员工**：管理员可创建新员工
- **编辑员工**：支持修改员工信息（姓名、性别、年龄、手机号、住址）
- **删除员工**：支持删除员工记录
- **搜索功能**：按姓名或手机号搜索员工

### 2. 签到曲线图 ✓
- **7天趋势图**：显示最近7天的签到人数趋势
- **实时数据**：从数据库查询真实的签到数据
- **教会隔离**：每个教会独立查看自己的统计数据

### 3. 教会管理 ✓
- **创建教会**：管理员可创建新教会，并指定教会代码
- **分配管理员**：为每个教会分配管理员账号
- **多教会支持**：一个超级管理员可管理多个教会

### 4. 教会切换 ✓
- **快速切换**：在Dashboard中切换当前工作教会
- **数据隔离**：员工列表、曲线图等按教会隔离显示
- **二维码生成**：每个教会都能生成独有的签到二维码

---

## 部署步骤

### 第一步：安装依赖

```bash
# 进入前端目录
cd client
npm install

# 进入后端目录
cd ../server
npm install
```

### 第二步：运行数据库迁移

```bash
cd server
node scripts/migrate_church_system.js
```

该脚本会：
- 为 `companies` 表添加 `created_by` 和 `created_at` 字段
- 为 `admins` 表添加 `church_id` 字段
- 创建 `church_admins` 映射表（支持一对多关系）
- 添加必要的数据库索引

### 第三步：启动后端服务

```bash
cd server
node app.js
```

服务将运行在 `http://localhost:3000`

### 第四步：启动前端开发服务

```bash
cd client
npm run dev
```

前端将运行在 `http://localhost:5173`

---

## 使用说明

### 管理员登录

1. 访问 `http://localhost:5173/admin/login`
2. 输入用户名和密码
3. 登录后将进入Dashboard，显示该管理员管理的所有教会

### Dashboard 功能

#### 今日签到选项卡
- **教会选择器**：快速切换教会
- **签到二维码按钮**：生成签到二维码，员工扫描可进行签到
- **统计卡片**：显示今日已签到、缺席人数
- **签到列表**：显示今日已签到的员工详情
- **趋势图**：7天签到趋势曲线图

#### 员工管理选项卡
- **员工列表**：显示当前教会的所有员工
- **搜索功能**：按姓名或手机号搜索
- **新增员工**：添加新员工
- **编辑员工**：修改员工信息
- **删除员工**：删除员工记录
- **导出功能**：导出为 CSV 或 Excel 格式

#### 教会管理选项卡
- **教会列表**：显示管理员管理的所有教会
- **创建教会**：创建新教会
- **分配管理员**：为教会分配管理员账号

---

## API 端点说明

### 教会相关

#### 获取管理员的所有教会
```
GET /api/admin/churches
Authorization: <token>
```

响应：
```json
[
  {"id": 1, "name": "第一教会", "code": "church001"},
  {"id": 2, "name": "第二教会", "code": "church002"}
]
```

#### 切换教会
```
POST /api/admin/switch-church
Authorization: <token>
Body: {"churchId": 1}
```

响应：
```json
{
  "token": "new_jwt_token",
  "companyId": 1
}
```

#### 创建教会（超级管理员）
```
POST /api/admin/churches
Authorization: <token>
Body: {"name": "教会名称", "code": "unique_code"}
```

#### 分配管理员
```
POST /api/admin/churches/:churchId/admins
Authorization: <token>
Body: {"username": "admin1", "password": "pwd123", "role": "manager"}
```

### 员工相关

#### 获取员工列表（当前教会）
```
GET /api/admin/employees
Authorization: <token>
```

响应：
```json
[
  {"id": 1, "name": "张三", "gender": "男", "age": 30, "phone": "13800000000", "address": "地址1"},
  ...
]
```

#### 新增员工
```
POST /api/admin/employees
Authorization: <token>
Body: {"name": "李四", "gender": "女", "age": 28, "phone": "13800000001", "address": "地址2"}
```

#### 更新员工
```
PUT /api/admin/employees/:id
Authorization: <token>
Body: {"name": "李四", "gender": "女", "age": 29, "phone": "13800000001", "address": "地址2"}
```

#### 删除员工
```
DELETE /api/admin/employees/:id
Authorization: <token>
```

### 统计相关

#### 获取统计数据（7天趋势）
```
GET /api/admin/stats
Authorization: <token>
```

响应：
```json
{
  "totalEmployees": 50,
  "todaySigned": 45,
  "absent": 5,
  "days": ["2024-01-01", "2024-01-02", ...],
  "series": [42, 44, 45, 43, 44, 45, 45],
  "trend": [
    {"date": "2024-01-01", "count": 42},
    ...
  ]
}
```

#### 获取签到二维码
```
GET /api/admin/qrcode
Authorization: <token>
```

响应：
```json
{
  "content": "http://localhost:5173/sign?code=church001",
  "churchCode": "church001"
}
```

---

## 数据库结构

### 主要表

#### companies（教会表）
```sql
CREATE TABLE companies (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100),
  code VARCHAR(50) UNIQUE,
  created_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### admins（管理员表）
```sql
CREATE TABLE admins (
  id INT PRIMARY KEY AUTO_INCREMENT,
  username VARCHAR(50),
  password VARCHAR(255),
  company_id INT,
  church_id INT
);
```

#### church_admins（管理员-教会映射表）
```sql
CREATE TABLE church_admins (
  id INT PRIMARY KEY AUTO_INCREMENT,
  admin_id INT NOT NULL,
  church_id INT NOT NULL,
  role VARCHAR(50) DEFAULT 'manager',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_admin_church (admin_id, church_id)
);
```

#### employees（员工表）
```sql
CREATE TABLE employees (
  id INT PRIMARY KEY AUTO_INCREMENT,
  company_id INT,
  name VARCHAR(50),
  gender VARCHAR(10),
  age INT,
  phone VARCHAR(20),
  address VARCHAR(255)
);
```

#### attendance（签到表）
```sql
CREATE TABLE attendance (
  id INT PRIMARY KEY AUTO_INCREMENT,
  employee_id INT,
  company_id INT,
  sign_date DATE,
  sign_time DATETIME,
  sign_ip VARCHAR(50),
  UNIQUE(employee_id, sign_date)
);
```

---

## 测试清单

- [ ] 运行迁移脚本成功
- [ ] 管理员能正常登录
- [ ] 可以查看和切换教会
- [ ] 员工列表能正确显示（按教会隔离）
- [ ] 可以新增、编辑、删除员工
- [ ] 签到曲线图显示正确数据
- [ ] 能生成签到二维码
- [ ] 能创建新教会
- [ ] 能分配管理员给教会
- [ ] 切换教会后数据正确更新

---

## 常见问题

### 1. 运行迁移脚本失败

检查数据库连接信息是否正确。确保在 `db.js` 中配置的数据库连接参数有效。

### 2. 登录后看不到教会列表

可能原因：
- 数据库中该管理员在 `church_admins` 表中没有记录
- 执行 SQL：`INSERT INTO church_admins (admin_id, church_id, role) VALUES (管理员ID, 教会ID, 'owner')`

### 3. 员工列表为空

确保：
- 已切换到正确的教会
- 该教会的 `company_id` 与数据库中一致
- 员工表中该 `company_id` 有相应记录

### 4. 二维码显示失败

检查浏览器控制台日志，确保：
- `qrcode` 库已正确安装
- `/api/admin/qrcode` API 返回了正确的数据

---

## 后续改进方向

- [ ] 添加用户权限管理（按角色控制功能访问）
- [ ] 教会的更多统计分析
- [ ] 签到时段分析
- [ ] 员工签到历史查询
- [ ] 批量导入员工功能
- [ ] 打印签到报表

