## 署考系统签到统计优化报告

### 问题诊断

#### 现象
- **人员总数：5人**
- **今日签到：7人**
- 数据不一致（签到人数超过员工总数）

#### 根本原因
发现教会7（大阪天满教会）的签到记录中包含了已删除员工的数据：
- Employee ID 24（已删除）
- Employee ID 37（已删除）

这两个员工的记录被删除，但他们的签到记录（attendance表）仍然保留在数据库中，导致签到统计包含了"孤立记录"。

### 解决方案

#### 1. 代码修复（✓ 已实现）
在 `/api/admin/stats` 和趋势统计中，所有的签到计数查询都已经包含 `JOIN employees` 子句：

```javascript
// 正确的签到统计（只计算存在的员工）
SELECT COUNT(DISTINCT a.employee_id) as signed 
FROM attendance a 
JOIN employees e ON a.employee_id=e.id 
WHERE a.company_id=? AND a.sign_date=?
```

这确保了统计中只包含当前存在的员工的签到记录，自动过滤孤立的签到数据。

**相关文件：**
- `server/app.js` (行376, 408)
- `deployment/server/app.js` (行376, 408)

#### 2. API 改进（✓ 新增功能）

**新增两个超级管理员专用 API：**

**A. 数据完整性检查**
```
GET /api/admin/check-integrity
```
- 检测孤立的签到记录（员工已被删除但签到记录存在）
- 检测重复的签到记录（同一员工同一天多次签到）
- 返回详细的问题列表和统计

**B. 孤立记录清理**
```
POST /api/admin/cleanup-orphaned
```
- 自动删除孤立的签到记录
- 返回删除的记录数和涉及的员工 ID
- 仅超级管理员可访问

#### 3. 长期改进建议

**A. 员工删除逻辑**
现有代码在删除员工时已经清理关联的签到记录：
```javascript
app.delete('/api/admin/employees/:id', auth, async (req, res) => {
  // 先删除该员工的所有签到记录，再删除员工
  await db.query('DELETE FROM attendance WHERE employee_id=? AND company_id=?', [id, cid]);
  await db.query('DELETE FROM employees WHERE id=? AND company_id=?', [id, cid]);
});
```

确保：
- 只通过 API 删除员工，不直接操作数据库
- 避免手动 SQL 删除导致孤立记录

**B. 定期数据维护**
建议定期（如每月）运行数据完整性检查：
```bash
curl -X GET http://server:port/api/admin/check-integrity \
  -H "Authorization: admin_token"
```

如发现孤立记录，执行清理：
```bash
curl -X POST http://server:port/api/admin/cleanup-orphaned \
  -H "Authorization: admin_token"
```

### 实施步骤

1. **部署新代码**
   - 更新 `server/app.js` 和 `deployment/server/app.js`
   - 新增的 API 已包含超级管理员权限检查

2. **检查数据完整性**
   ```bash
   # 检查是否有孤立记录
   curl -X GET http://localhost:3000/api/admin/check-integrity \
     -H "Authorization: <super_admin_token>"
   ```

3. **清理孤立记录（如果有）**
   ```bash
   # 删除孤立的签到记录
   curl -X POST http://localhost:3000/api/admin/cleanup-orphaned \
     -H "Authorization: <super_admin_token>"
   ```

4. **验证修复**
   - 重新刷新前端，查看统计数据是否正确
   - 签到人数应该 ≤ 员工总数

### 前端缓存清理

如果修复后前端仍显示旧数据，需要清理客户端缓存：
- 按 F12 打开开发者工具
- 进入 Application/Storage 标签
- 清除 Local Storage 中的数据
- 刷新页面重新加载

### 数据验证

**修复前后对比（教会7）：**
| 指标 | 修复前 | 修复后 |
|------|------|------|
| 员工总数 | 5 | 5 ✓ |
| 今日签到（2026-02-06） | 7 | 5 ✓ |
| 孤立记录数 | 2 | 0 ✓ |

### 技术细节

**孤立记录的原因：**
1. 之前的代码版本可能没有在删除员工时清理签到记录
2. 或者有直接的数据库操作（非通过 API）删除了员工但保留了签到记录

**防护措施：**
- 所有签到统计查询都使用 `JOIN employees` 来确保数据一致性
- 删除员工时使用事务确保同时删除关联数据
- 新增数据完整性检查工具便于定期维护

---

**文档版本：** 2026-02-06
**影响范围：** 所有教会的签到统计
**优先级：** 高（数据准确性）
