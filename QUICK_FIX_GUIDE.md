# 签到统计优化 - 快速实施指南

## 问题摘要
教会7（大阪天满教会）显示：
- 人员总数：5
- **今日签到：7** ❌ （应该 ≤ 5）

**根因：** 已删除员工的签到记录仍在数据库中（孤立记录）

---

## 快速修复步骤

### Step 1: 部署更新的代码 ✅
代码已在以下文件中修复和扩展：
- `server/app.js` - 已添加 JOIN 和新的检查/清理 API
- `deployment/server/app.js` - 同上

**无需额外修改，直接部署即可。**

### Step 2: 重启服务（重要！）
```bash
# 杀死旧的进程
taskkill /PID <server_pid> /F

# 重新启动服务
cd d:\PROJECT\attendance-project-v4\server
npm start
```

### Step 3: 验证修复（可选）
打开浏览器控制台，执行查询：
```javascript
// 获取认证 token（在浏览器 localStorage 中）
const token = localStorage.getItem('token');

// 检查数据完整性
fetch('/api/admin/check-integrity', {
  headers: { 'Authorization': token }
})
.then(r => r.json())
.then(data => console.log(data));
```

### Step 4: 清理孤立记录（如有）
如果 Step 3 中发现 `hasIssues: true`，执行清理：
```javascript
fetch('/api/admin/cleanup-orphaned', {
  method: 'POST',
  headers: { 'Authorization': token }
})
.then(r => r.json())
.then(data => console.log('清理结果:', data));
```

### Step 5: 清空前端缓存
- 打开浏览器开发者工具（F12）
- 进入 Application → Local Storage
- 删除页面的所有数据
- 刷新页面（Ctrl+Shift+R 强制刷新）

---

## 验证结果
刷新后检查仪表板：
- ✓ 人员总数：5
- ✓ 今日签到：≤ 5（而不是 7）

---

## 技术变更说明

### 代码修复
所有签到统计现在都使用正确的 SQL 查询：
```sql
-- ✓ 正确：只统计存在的员工的签到
SELECT COUNT(DISTINCT a.employee_id) 
FROM attendance a 
JOIN employees e ON a.employee_id=e.id
WHERE a.company_id=? AND a.sign_date=?

-- ❌ 错误的做法（旧代码）：包含孤立记录
SELECT COUNT(DISTINCT a.employee_id) 
FROM attendance
WHERE company_id=? AND sign_date=?
```

### 新增 API

| API | 方法 | 说明 | 权限 |
|-----|------|------|------|
| `/api/admin/check-integrity` | GET | 查看数据完整性 | 超级管理员 |
| `/api/admin/cleanup-orphaned` | POST | 清理孤立记录 | 超级管理员 |

---

## 故障排除

### 问题：修复后仍显示错误数据
**解决：** 清空浏览器缓存（Step 5）

### 问题：API 返回 403 错误
**原因：** 非超级管理员账户
**解决：** 使用超级管理员账户

### 问题：清理 API 报错
**解决：** 检查服务器是否成功重启，查看服务器日志

---

## 后续维护

建议定期（每月）检查数据完整性：
```bash
# 使用 curl 或 Postman 定期执行
curl -X GET http://server:3000/api/admin/check-integrity \
  -H "Authorization: $(cat token.txt)"
```

---

**需要帮助？** 参考详细的 OPTIMIZATION_REPORT.md 文档
