
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const dayjs = require('dayjs');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const ExcelJS = require('exceljs');
const db = require('./db');

const app = express();
const SECRET = 'attendance_v4_secret';

app.use(cors());
app.use(express.json());

// Frontend static hosting (no Nginx required)
// Default path: ../client/dist (can be overridden by FRONTEND_DIR)
const FRONTEND_DIR = process.env.FRONTEND_DIR || path.resolve(__dirname, '../client/dist');
const frontendIndex = path.join(FRONTEND_DIR, 'index.html');

if (fs.existsSync(frontendIndex)) {
  app.use(express.static(FRONTEND_DIR));
  console.log('Frontend static hosting enabled:', FRONTEND_DIR);
} else {
  console.log('Frontend static hosting disabled (index.html not found):', FRONTEND_DIR);
}

// Improve error visibility in terminal during development
process.on('unhandledRejection', (err) => {
  console.error('UnhandledRejection:', err && err.stack ? err.stack : err);
});
process.on('uncaughtException', (err) => {
  console.error('UncaughtException:', err && err.stack ? err.stack : err);
});

const auth = (req, res, next) => {
  const token = req.headers.authorization;
  if (!token) return res.sendStatus(401);
  try { req.user = jwt.verify(token, SECRET); next(); }
  catch { res.sendStatus(401); }
};

app.post('/api/admin/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const [rows] = await db.query('SELECT * FROM admins WHERE username=?', [username]);
    if (!rows.length) return res.status(401).send({ msg:'no user' });
    // Defensive: ensure rows[0].password exists
    if (!rows[0].password || !bcrypt.compareSync(password, rows[0].password))
      return res.status(401).send({ msg:'wrong password' });
    
    // 获取该管理员管理的所有教会
    const [churches] = await db.query(`
      SELECT c.id, c.name, c.code FROM companies c
      INNER JOIN church_admins ca ON c.id = ca.church_id
      WHERE ca.admin_id = ?
      ORDER BY c.name
    `, [rows[0].id]);

    // 默认选择第一个教会，如果没有则使用 company_id
    const defaultChurch = churches.length > 0 ? churches[0] : { id: rows[0].company_id };

    res.send({
      token: jwt.sign({ id: rows[0].id, companyId: defaultChurch.id, isSuper: rows[0].is_super }, SECRET),
      companyId: defaultChurch.id,
      adminId: rows[0].id,
      churches: churches,
      isSuper: rows[0].is_super || false
    });
  } catch (err) {
    console.error('Login error (full):', err && err.stack ? err.stack : err);
    // give minimal info to client but full details in terminal
    res.status(500).send({ msg:'login failed', error: err && err.message ? err.message : 'unknown' });
  }
});

app.get('/api/admin/today', auth, async (req, res) => {
  try {
    // 支持通过查询参数指定日期，默认为今天
    const date = req.query.date || dayjs().format('YYYY-MM-DD');
    const cid = req.user.companyId;

    const [signed] = await db.query(
      'SELECT e.id,e.name,e.gender,e.age,e.phone,e.address,a.sign_time as signTime FROM attendance a JOIN employees e ON a.employee_id=e.id WHERE a.company_id=? AND a.sign_date=? ORDER BY a.sign_time DESC',
      [cid, date]
    );

    const [absent] = await db.query(
      'SELECT id,name,gender,age,phone,address FROM employees WHERE company_id=? AND id NOT IN (SELECT employee_id FROM attendance WHERE sign_date=? AND company_id=?)',
      [cid, date, cid]
    );

    res.send({ signed, absent, date });
  } catch (err) {
    console.error('Today report error:', err.message);
    res.status(500).send({ msg:'query failed' });
  }
});

// Employee management (Admin)
app.get('/api/admin/employees', auth, async (req, res) => {
  try {
    const cid = req.user.companyId;
    const [rows] = await db.query('SELECT id,name,gender,age,phone,address,remark FROM employees WHERE company_id=?', [cid]);
    res.send(rows);
  } catch (err) {
    console.error('Employees list error:', err.message);
    res.status(500).send({ msg:'query failed' });
  }
});

app.post('/api/admin/employees', auth, async (req, res) => {
  try {
    const cid = req.user.companyId;
    const { name, gender, age, phone, address, remark } = req.body;
    await db.query('INSERT INTO employees (company_id,name,gender,age,phone,address,remark) VALUES (?,?,?,?,?,?,?)', [cid, name, gender, age, phone, address, remark || null]);
    res.send({ success:true });
  } catch (err) {
    console.error('Create employee error:', err.message);
    res.status(500).send({ msg:'create failed' });
  }
});

app.put('/api/admin/employees/:id', auth, async (req, res) => {
  try {
    const cid = req.user.companyId;
    const id = req.params.id;
    const { name, gender, age, phone, address, remark } = req.body;
    await db.query('UPDATE employees SET name=?,gender=?,age=?,phone=?,address=?,remark=? WHERE id=? AND company_id=?', [name, gender, age, phone, address, remark || null, id, cid]);
    res.send({ success:true });
  } catch (err) {
    console.error('Update employee error:', err.message);
    res.status(500).send({ msg:'update failed' });
  }
});

app.delete('/api/admin/employees/:id', auth, async (req, res) => {
  try {
    const cid = req.user.companyId;
    const id = req.params.id;
    // 先删除该员工的所有签到记录，再删除员工
    await db.query('DELETE FROM attendance WHERE employee_id=? AND company_id=?', [id, cid]);
    await db.query('DELETE FROM employees WHERE id=? AND company_id=?', [id, cid]);
    res.send({ success:true });
  } catch (err) {
    console.error('Delete employee error:', err.message);
    res.status(500).send({ msg:'delete failed' });
  }
});

// Admin sign-in for employee (代签到)
app.post('/api/admin/sign-for-employee/:employeeId', auth, async (req, res) => {
  try {
    const cid = req.user.companyId;
    const employeeId = req.params.employeeId;
    
    // 验证员工是否属于当前教会
    const [employee] = await db.query(
      'SELECT id, name FROM employees WHERE id=? AND company_id=?',
      [employeeId, cid]
    );
    
    if (!employee.length) {
      return res.status(404).send({ msg: '员工不存在' });
    }
    
    // 检查该员工今天是否已签到
    const today = dayjs().format('YYYY-MM-DD');
    const [existingSign] = await db.query(
      'SELECT id FROM attendance WHERE employee_id=? AND sign_date=? AND company_id=?',
      [employeeId, today, cid]
    );
    
    if (existingSign.length) {
      return res.status(400).send({ code: 'SIGNED', msg: '今日已签到' });
    }
    
    // 执行签到
    const signTime = dayjs().format('YYYY-MM-DD HH:mm:ss');
    await db.query(
      'INSERT INTO attendance (employee_id, company_id, sign_date, sign_time, sign_ip) VALUES (?,?,?,?,?)',
      [employeeId, cid, today, signTime, 'admin-sign']
    );
    
    res.send({ 
      success: true, 
      msg: '签到成功',
      employeeName: employee[0].name,
      signTime 
    });
  } catch (err) {
    console.error('Admin sign for employee error:', err && err.stack ? err.stack : err);
    res.status(500).send({ msg: '签到失败' });
  }
});

app.post('/api/public/sign', async (req, res) => {
  try {
    const { companyCode, name, phone } = req.body;
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

    // 验证公司代码是否提供
    if (!companyCode) return res.status(400).send({ code: 'MISSING_COMPANY', msg: '缺少公司代码' });

    const [company] = await db.query('SELECT * FROM companies WHERE code=?', [companyCode]);
    if (!company.length) return res.status(400).send({ code: 'INVALID_COMPANY', msg: '公司代码无效' });

    const cid = company[0].id;

    // Flexible matching based on what was input
    const nameInputted = name && name.trim().length > 0;
    const phoneInputted = phone && phone.trim().length > 0;

    let emp = [];
    let errorInfo = { nameError: false, phoneError: false };

    if (nameInputted && phoneInputted) {
      // Both provided - both must match
      const [rows] = await db.query(
        'SELECT * FROM employees WHERE company_id=? AND name=? AND phone=?',
        [cid, name.trim(), phone.trim()]
      );
      emp = rows;
      if (!emp.length) {
        // Check which field doesn't match
        const [nameCheck] = await db.query(
          'SELECT * FROM employees WHERE company_id=? AND name=?',
          [cid, name.trim()]
        );
        const [phoneCheck] = await db.query(
          'SELECT * FROM employees WHERE company_id=? AND phone=?',
          [cid, phone.trim()]
        );
        errorInfo.nameError = !nameCheck.length;
        errorInfo.phoneError = !phoneCheck.length;
      }
    } else if (nameInputted && !phoneInputted) {
      // Only name provided
      const [rows] = await db.query(
        'SELECT * FROM employees WHERE company_id=? AND name=?',
        [cid, name.trim()]
      );
      emp = rows;
      if (!emp.length) errorInfo.nameError = true;
    } else if (phoneInputted && !nameInputted) {
      // Only phone provided
      const [rows] = await db.query(
        'SELECT id,name,phone,gender,age FROM employees WHERE company_id=? AND phone=?',
        [cid, phone.trim()]
      );
      emp = rows;
      if (!emp.length) {
        errorInfo.phoneError = true;
      } else if (emp.length > 1) {
        // Multiple employees with same phone - ask user to select
        return res.status(400).send({
          code: 'MULTIPLE_EMPLOYEES',
          employees: emp,
          msg: '该手机号对应多个员工，请选择具体的人员'
        });
      }
    }

    if (!emp.length) {
      return res.status(400).send({ 
        code:'NOT_MATCH',
        nameError: errorInfo.nameError,
        phoneError: errorInfo.phoneError
      });
    }

    // 检查该员工今天是否已签到过
    const today = dayjs().format('YYYY-MM-DD');
    const [todayCheck] = await db.query(
      'SELECT * FROM attendance WHERE employee_id=? AND sign_date=?',
      [emp[0].id, today]
    );
    if (todayCheck.length) {
      return res.status(400).send({ code:'SIGNED' });
    }

    try {
      await db.query(
        'INSERT INTO attendance (employee_id,company_id,sign_date,sign_time,sign_ip) VALUES (?,?,?,?,?)',
        [emp[0].id, cid, dayjs().format('YYYY-MM-DD'), dayjs().format('YYYY-MM-DD HH:mm:ss'), ip]
      );
      res.send({ success:true });
    } catch {
      res.status(400).send({ code:'SIGNED' });
    }
  } catch (err) {
    console.error('Sign error:', err.message);
    res.status(500).send({ msg:'sign failed' });
  }
});

app.post('/api/public/register', async (req, res) => {
  try {
    const { companyCode, name, phone, address, gender, age } = req.body;
    
    // 参数验证
    if (!companyCode) return res.status(400).send({ msg:'缺少公司代码' });
    if (!name || !name.trim()) return res.status(400).send({ msg:'姓名不能为空' });
    // 年龄为选填，但若填写需在合理范围内
    if (age !== undefined && age !== null && age !== '') {
      if (isNaN(age) || age < 5 || age > 100) return res.status(400).send({ msg:'年龄应在5-100岁之间' });
    }
    // 支持中国手机号（1开头，11位）和日本手机号（0开头，10-11位）
    if (!phone || !/^(1[3-9]\d{9}|0\d{9,10})$/.test(phone)) return res.status(400).send({ msg:'手机号格式错误' });

    // 查询公司
    const [companies] = await db.query('SELECT * FROM companies WHERE code=?', [companyCode]);
    if (!companies.length) return res.status(400).send({ msg:'公司代码无效' });
    const company = companies[0];

    // 直接插入新员工（完全允许同一手机号对应多个人员）
    const result = await db.query(
      'INSERT INTO employees (company_id,name,gender,age,phone,address) VALUES (?,?,?,?,?,?)',
      [company.id, name.trim(), gender || null, (age !== undefined && age !== null && age !== '') ? age : null, phone, address || '']
    );
    
    console.log(`New employee registered: ${name}, Phone: ${phone}, Company: ${company.id}`);
    res.send({ success: true, msg: '登记成功', id: result[0].insertId });
  } catch (err) {
    console.error('Register error:', err && err.stack ? err.stack : err);
    res.status(500).send({ msg: '登记失败，请稍后重试' });
  }
});

// Public: get company info by code
app.get('/api/public/company', async (req, res) => {
  try {
    const { code } = req.query;
    if (!code) return res.status(400).send({ msg:'missing code' });
    const [rows] = await db.query('SELECT id,name,code FROM companies WHERE code=?', [code]);
    if (!rows.length) return res.status(404).send({ msg:'not found' });
    res.send(rows[0]);
  } catch (err) {
    console.error('Company lookup error:', err && err.stack ? err.stack : err);
    res.status(500).send({ msg:'query failed' });
  }
});

// Public: list companies (for frontend selector)
app.get('/api/public/companies', async (req, res) => {
  try {
    const q = req.query.q || '';
    if (q) {
      const like = `%${q}%`;
      const [rows] = await db.query('SELECT id,name,code FROM companies WHERE name LIKE ? OR code LIKE ? ORDER BY name', [like, like]);
      return res.send(rows);
    }
    const [rows] = await db.query('SELECT id,name,code FROM companies ORDER BY name');
    res.send(rows);
  } catch (err) {
    console.error('Companies list error:', err && err.stack ? err.stack : err);
    res.status(500).send({ msg:'query failed' });
  }
});

// Admin: stats - total employees, today signed, and last 7 days counts
app.get('/api/admin/stats', auth, async (req, res) => {
  try {
    const cid = req.user.companyId;
    const today = dayjs().format('YYYY-MM-DD');
    
    // 获取查询参数中的时间范围（可选）
    const startDate = req.query.startDate;
    const endDate = req.query.endDate;

    const [[{ total }]] = await db.query('SELECT COUNT(*) as total FROM employees WHERE company_id=?', [cid]);
    // 只统计当前活跃员工（未删除）的签到记录
    const [[{ signed }]] = await db.query(
      'SELECT COUNT(DISTINCT a.employee_id) as signed FROM attendance a JOIN employees e ON a.employee_id=e.id WHERE a.company_id=? AND a.sign_date=?',
      [cid, today]
    );
    const absent = total - signed;

    // 确定时间范围
    let days = [];
    let dayLabels = [];
    
    if (startDate && endDate) {
      // 使用提供的时间范围
      const start = dayjs(startDate);
      const end = dayjs(endDate);
      const diff = end.diff(start, 'day');
      
      for (let i = 0; i <= diff; i++) {
        const d = start.add(i, 'day');
        days.push(d.format('YYYY-MM-DD'));
        dayLabels.push(d.format('MM-DD'));
      }
    } else {
      // 默认显示最后 7 天的数据
      for (let i = 6; i >= 0; i--) {
        const d = dayjs().subtract(i, 'day');
        days.push(d.format('YYYY-MM-DD'));
        dayLabels.push(d.format('MM-DD'));
      }
    }

    const placeholders = days.map(() => '?').join(',');
    // 只统计当前活跃员工（未删除）的签到记录，排除已删除员工的签到数据
    const [rows] = await db.query(
      `SELECT a.sign_date, COUNT(DISTINCT a.employee_id) as cnt FROM attendance a JOIN employees e ON a.employee_id=e.id WHERE a.company_id=? AND a.sign_date IN (${placeholders}) GROUP BY a.sign_date`,
      [cid, ...days]
    );

    const countsMap = {};
    rows.forEach(r => {
      const dateStr = dayjs(r.sign_date).format('YYYY-MM-DD');
      countsMap[dateStr] = r.cnt;
    });

    const series = days.map(d => countsMap[d] || 0);
    const trend = days.map((d, i) => ({ date: d, count: series[i] }));

    res.send({
      totalEmployees: total,
      todaySigned: signed,
      absent: absent,
      days: dayLabels,
      series: series,
      trend: trend
    });
  } catch (err) {
    console.error('Stats error:', err.message);
    res.status(500).send({ msg: 'query failed' });
  }
});

// Admin: employees with search and pagination
app.get('/api/admin/employees', auth, async (req, res) => {
  try {
    const cid = req.user.companyId;
    const q = req.query.q || '';
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 10;
    const offset = (page-1)*pageSize;

    const searchQuery = q ? `AND (name LIKE ? OR phone LIKE ?)` : '';
    const paramsCount = q ? [cid, `%${q}%`, `%${q}%`] : [cid];
    const [countRows] = await db.query(`SELECT COUNT(*) as total FROM employees WHERE company_id=? ${searchQuery}`, paramsCount);
    const total = countRows[0].total;

    const params = q ? [cid, `%${q}%`, `%${q}%`, pageSize, offset] : [cid, pageSize, offset];
    const [rows] = await db.query(
      `SELECT id,name,gender,age,phone,address FROM employees WHERE company_id=? ${searchQuery} LIMIT ? OFFSET ?`,
      params
    );

    res.send({ total, page, pageSize, rows });
  } catch (err) {
    console.error('Employees list error (paged):', err && err.stack ? err.stack : err);
    res.status(500).send({ msg:'query failed' });
  }
});

// Public: get company by code (used by client to show company name)
app.get('/api/public/company', async (req, res) => {
  try {
    const { code } = req.query;
    const [companies] = await db.query('SELECT id,name,code FROM companies WHERE code=?', [code]);
    if (!companies.length) return res.status(404).send({ msg:'not found' });
    res.send(companies[0]);
  } catch (err) {
    console.error('Get company error:', err.message);
    res.status(500).send({ msg:'query failed' });
  }
});

// ========== 教会管理相关 API ==========

// 获取当前管理员管理的所有教会
app.get('/api/admin/churches', auth, async (req, res) => {
  try {
    const adminId = req.user.id;
    const [churches] = await db.query(`
      SELECT 
        c.id, 
        c.name, 
        c.code,
        c.created_at,
        COUNT(e.id) as memberCount
      FROM companies c
      INNER JOIN church_admins ca ON c.id = ca.church_id
      LEFT JOIN employees e ON c.id = e.company_id
      WHERE ca.admin_id = ?
      GROUP BY c.id
      ORDER BY c.name
    `, [adminId]);
    res.send(churches);
  } catch (err) {
    console.error('Get churches error:', err.message);
    res.status(500).send({ msg:'query failed' });
  }
});

// 切换当前工作的教会
app.post('/api/admin/switch-church', auth, async (req, res) => {
  try {
    const { churchId } = req.body;
    const adminId = req.user.id;

    // 验证该管理员是否有权限访问此教会
    const [permission] = await db.query(`
      SELECT id FROM church_admins 
      WHERE admin_id = ? AND church_id = ?
    `, [adminId, churchId]);

    if (!permission.length) {
      return res.status(403).send({ msg:'no permission' });
    }

    // 更新 token 中的 companyId
    const newToken = jwt.sign({ id: adminId, companyId: churchId }, SECRET);
    res.send({ token: newToken, companyId: churchId });
  } catch (err) {
    console.error('Switch church error:', err.message);
    res.status(500).send({ msg:'switch failed' });
  }
});

// 修改管理员密码
app.post('/api/admin/change-password', auth, async (req, res) => {
  try {
    const adminId = req.user.id;
    const { oldPassword, newPassword } = req.body;

    // 验证输入
    if (!oldPassword || !newPassword) {
      return res.status(400).send({ msg:'missing password' });
    }

    if (newPassword.length < 6) {
      return res.status(400).send({ msg:'password too short' });
    }

    // 获取当前管理员信息
    const [rows] = await db.query('SELECT * FROM admins WHERE id=?', [adminId]);
    
    if (!rows.length) {
      return res.status(404).send({ msg:'admin not found' });
    }

    const admin = rows[0];

    // 验证旧密码
    if (!admin.password || !bcrypt.compareSync(oldPassword, admin.password)) {
      return res.status(401).send({ msg:'wrong old password' });
    }

    // 检查新密码是否与旧密码相同
    if (bcrypt.compareSync(newPassword, admin.password)) {
      return res.status(400).send({ msg:'new password same as old' });
    }

    // 加密新密码并更新
    const hashedPassword = bcrypt.hashSync(newPassword, 10);
    await db.query('UPDATE admins SET password=? WHERE id=?', [hashedPassword, adminId]);

    res.send({ success: true, msg: 'password changed successfully' });
  } catch (err) {
    console.error('Change password error:', err.message);
    res.status(500).send({ msg:'change password failed' });
  }
});

// 创建新教会（仅超级管理员）
app.post('/api/admin/churches', auth, async (req, res) => {
  try {
    const { name, code } = req.body;
    const createdBy = req.user.id;

    if (!name || !code) {
      return res.status(400).send({ msg:'name and code required' });
    }

    // 检查代码是否唯一
    const [existing] = await db.query(
      'SELECT id FROM companies WHERE code=?',
      [code]
    );
    if (existing.length) {
      return res.status(400).send({ msg:'code already exists' });
    }

    const result = await db.query(
      'INSERT INTO companies (name, code, created_by) VALUES (?, ?, ?)',
      [name, code, createdBy]
    );

    const churchId = result[0].insertId;

    // 将创建者作为该教会的管理员
    await db.query(
      'INSERT INTO church_admins (admin_id, church_id, role) VALUES (?, ?, ?)',
      [createdBy, churchId, 'owner']
    );

    res.send({ success: true, churchId, name, code });
  } catch (err) {
    console.error('Create church error:', err.message);
    res.status(500).send({ msg:'create failed' });
  }
});

// 修改教会名称（仅教会所有者）
app.put('/api/admin/churches/:churchId', auth, async (req, res) => {
  try {
    const { churchId } = req.params;
    const { name } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).send({ msg:'name required' });
    }

    // 超级管理员或教会所有者可修改
    const [adminRows] = await db.query('SELECT is_super FROM admins WHERE id = ?', [req.user.id]);
    const isSuper = adminRows.length ? !!adminRows[0].is_super : false;

    if (!isSuper) {
      const [permission] = await db.query(`
        SELECT id FROM church_admins 
        WHERE admin_id = ? AND church_id = ? AND role = 'owner'
      `, [req.user.id, churchId]);

      if (!permission.length) {
        return res.status(403).send({ msg:'only owner can edit church' });
      }
    }

    const [result] = await db.query(
      'UPDATE companies SET name=? WHERE id=?',
      [name.trim(), churchId]
    );

    if (!result.affectedRows) {
      return res.status(404).send({ msg:'church not found' });
    }

    res.send({ success: true, churchId, name: name.trim() });
  } catch (err) {
    console.error('Update church error:', err && err.stack ? err.stack : err);
    res.status(500).send({ msg:'update failed', error: err && err.message ? err.message : 'unknown' });
  }
});

// 为教会分配管理员
app.post('/api/admin/churches/:churchId/admins', auth, async (req, res) => {
  try {
    const { churchId } = req.params;
    const { username, password, role } = req.body;

    // 验证当前管理员是否是该教会的所有者
    const [permission] = await db.query(`
      SELECT id FROM church_admins 
      WHERE admin_id = ? AND church_id = ? AND role = 'owner'
    `, [req.user.id, churchId]);

    if (!permission.length) {
      return res.status(403).send({ msg:'only owner can assign admins' });
    }

    // 检查管理员是否已存在
    const [existing] = await db.query(
      'SELECT id FROM admins WHERE username=?',
      [username]
    );

    let adminId;
    if (existing.length) {
      adminId = existing[0].id;
    } else {
      // 创建新管理员
      const hashedPwd = bcrypt.hashSync(password, 10);
      const result = await db.query(
        'INSERT INTO admins (username, password, company_id) VALUES (?, ?, ?)',
        [username, hashedPwd, churchId]
      );
      adminId = result[0].insertId;
    }

    // 创建管理员与教会的关联
    try {
      await db.query(
        'INSERT INTO church_admins (admin_id, church_id, role) VALUES (?, ?, ?)',
        [adminId, churchId, role || 'manager']
      );
    } catch (e) {
      // 如果已存在关联，忽略错误
      if (e.code !== 'ER_DUP_ENTRY') {
        throw e;
      }
    }

    res.send({ success: true, adminId, username });
  } catch (err) {
    console.error('Assign admin error:', err.message);
    res.status(500).send({ msg:'assign failed' });
  }
});

// 获取二维码（签到用）
app.get('/api/admin/qrcode', auth, async (req, res) => {
  try {
    const cid = req.user.companyId;

    // 获取教会信息
    const [church] = await db.query(
      'SELECT code FROM companies WHERE id=?',
      [cid]
    );

    if (!church.length) {
      return res.status(404).send({ msg:'church not found' });
    }

    // 从数据库获取配置的签到URL
    const [config] = await db.query(
      "SELECT config_value FROM system_config WHERE config_key = 'sign_url'"
    );
    const baseUrl = config.length > 0 ? config[0].config_value : (process.env.SIGN_URL || 'http://localhost:5173/sign');

    // 二维码内容：包含教会代码的签到链接
    // 使用 code 参数（同时兼容旧的 company 参数）
    const qrcodeContent = `${baseUrl}?code=${church[0].code}`;

    res.send({
      content: qrcodeContent,
      churchCode: church[0].code,
      url: qrcodeContent
    });
  } catch (err) {
    console.error('QR code error:', err.message);
    res.status(500).send({ msg:'query failed' });
  }
});

// ==================== 超级管理员功能 ====================

// 获取系统配置（仅超级管理员）
app.get('/api/super/config', auth, async (req, res) => {
  try {
    // 检查是否是超级管理员
    const [admin] = await db.query('SELECT is_super FROM admins WHERE id = ?', [req.user.id]);
    if (!admin.length || !admin[0].is_super) {
      return res.status(403).send({ msg: '无权限访问' });
    }

    const [configs] = await db.query('SELECT * FROM system_config');
    res.send(configs);
  } catch (err) {
    console.error('Get config error:', err.message);
    res.status(500).send({ msg: '获取配置失败' });
  }
});

// 更新系统配置（仅超级管理员）
app.put('/api/super/config', auth, async (req, res) => {
  try {
    // 检查是否是超级管理员
    const [admin] = await db.query('SELECT is_super FROM admins WHERE id = ?', [req.user.id]);
    if (!admin.length || !admin[0].is_super) {
      return res.status(403).send({ msg: '无权限访问' });
    }

    const { configKey, configValue } = req.body;
    
    await db.query(
      'UPDATE system_config SET config_value = ? WHERE config_key = ?',
      [configValue, configKey]
    );

    res.send({ msg: '配置更新成功' });
  } catch (err) {
    console.error('Update config error:', err.message);
    res.status(500).send({ msg: '更新配置失败' });
  }
});

// 获取所有管理员列表（仅超级管理员）
app.get('/api/super/admins', auth, async (req, res) => {
  try {
    // 检查是否是超级管理员
    const [admin] = await db.query('SELECT is_super FROM admins WHERE id = ?', [req.user.id]);
    if (!admin.length || !admin[0].is_super) {
      return res.status(403).send({ msg: '无权限访问' });
    }

    const [admins] = await db.query(`
      SELECT 
        a.id, 
        a.username, 
        a.is_super,
        a.company_id,
        GROUP_CONCAT(DISTINCT c.name SEPARATOR ', ') as churches
      FROM admins a
      LEFT JOIN church_admins ca ON a.id = ca.admin_id
      LEFT JOIN companies c ON ca.church_id = c.id
      GROUP BY a.id, a.username, a.is_super, a.company_id
      ORDER BY a.is_super DESC, a.id
    `);

    res.send(admins);
  } catch (err) {
    console.error('Get admins error:', err.message);
    res.status(500).send({ msg: '获取管理员列表失败' });
  }
});

// 创建管理员（仅超级管理员）
app.post('/api/super/admins', auth, async (req, res) => {
  try {
    // 检查是否是超级管理员
    const [admin] = await db.query('SELECT is_super FROM admins WHERE id = ?', [req.user.id]);
    if (!admin.length || !admin[0].is_super) {
      return res.status(403).send({ msg: '无权限访问' });
    }

    const { username, password, churchIds } = req.body;

    // 检查用户名是否已存在
    const [existing] = await db.query('SELECT id FROM admins WHERE username = ?', [username]);
    if (existing.length > 0) {
      return res.status(400).send({ msg: '用户名已存在' });
    }

    // 创建管理员
    const hashedPassword = bcrypt.hashSync(password, 10);
    const [result] = await db.query(
      'INSERT INTO admins (username, password, is_super) VALUES (?, ?, FALSE)',
      [username, hashedPassword]
    );

    const adminId = result.insertId;

    // 关联教会
    if (churchIds && churchIds.length > 0) {
      for (const churchId of churchIds) {
        await db.query(
          'INSERT INTO church_admins (admin_id, church_id, role) VALUES (?, ?, ?)',
          [adminId, churchId, 'manager']
        );
      }
    }

    res.send({ msg: '管理员创建成功', adminId });
  } catch (err) {
    console.error('Create admin error:', err.message);
    res.status(500).send({ msg: '创建管理员失败' });
  }
});

// 删除管理员（仅超级管理员）
app.delete('/api/super/admins/:id', auth, async (req, res) => {
  try {
    // 检查是否是超级管理员
    const [admin] = await db.query('SELECT is_super FROM admins WHERE id = ?', [req.user.id]);
    if (!admin.length || !admin[0].is_super) {
      return res.status(403).send({ msg: '无权限访问' });
    }

    const adminId = req.params.id;

    // 不能删除自己
    if (parseInt(adminId) === req.user.id) {
      return res.status(400).send({ msg: '不能删除自己' });
    }

    // 检查是否是超级管理员
    const [targetAdmin] = await db.query('SELECT is_super FROM admins WHERE id = ?', [adminId]);
    if (targetAdmin.length > 0 && targetAdmin[0].is_super) {
      return res.status(400).send({ msg: '不能删除超级管理员' });
    }

    // 删除关联
    await db.query('DELETE FROM church_admins WHERE admin_id = ?', [adminId]);
    
    // 删除管理员
    await db.query('DELETE FROM admins WHERE id = ?', [adminId]);

    res.send({ msg: '管理员删除成功' });
  } catch (err) {
    console.error('Delete admin error:', err.message);
    res.status(500).send({ msg: '删除管理员失败' });
  }
});

// 更新管理员教会关联（仅超级管理员）
app.put('/api/super/admins/:id/churches', auth, async (req, res) => {
  try {
    // 检查是否是超级管理员
    const [admin] = await db.query('SELECT is_super FROM admins WHERE id = ?', [req.user.id]);
    if (!admin.length || !admin[0].is_super) {
      return res.status(403).send({ msg: '无权限访问' });
    }

    const adminId = req.params.id;
    const { churchIds } = req.body;

    // 删除现有关联
    await db.query('DELETE FROM church_admins WHERE admin_id = ?', [adminId]);

    // 添加新关联
    if (churchIds && churchIds.length > 0) {
      for (const churchId of churchIds) {
        await db.query(
          'INSERT INTO church_admins (admin_id, church_id, role) VALUES (?, ?, ?)',
          [adminId, churchId, 'manager']
        );
      }
    }

    res.send({ msg: '管理员教会关联更新成功' });
  } catch (err) {
    console.error('Update admin churches error:', err.message);
    res.status(500).send({ msg: '更新关联失败' });
  }
});

// Check DB connection on startup and give clear logs
(async function verifyDB(){
  try {
    await db.query('SELECT 1');
    console.log('DB connection OK');
  } catch (err) {
    console.error('DB connection error on startup:', err && err.message ? err.message : err);
  }
})();

// SPA fallback: Serve index.html for all non-API routes
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api')) {
    if (fs.existsSync(frontendIndex)) {
      return res.sendFile(frontendIndex);
    } else {
      console.error('Frontend index.html not found at:', frontendIndex);
      return res.status(404).send({ msg: 'Frontend not found', path: frontendIndex });
    }
  }
  res.status(404).send({ msg: 'Not found' });
});

// Admin: check data integrity (super admin only)
app.get('/api/admin/check-integrity', auth, async (req, res) => {
  try {
    if (!req.user.isSuper) {
      return res.status(403).send({ msg: '仅超级管理员可访问' });
    }

    const [orphaned] = await db.query(`
      SELECT DISTINCT a.employee_id, COUNT(*) as record_count
      FROM attendance a
      WHERE a.employee_id NOT IN (SELECT id FROM employees)
      GROUP BY a.employee_id
    `);

    const [duplicates] = await db.query(`
      SELECT employee_id, sign_date, COUNT(*) as cnt
      FROM attendance
      GROUP BY employee_id, sign_date
      HAVING cnt > 1
    `);

    res.send({
      orphanedRecords: orphaned.length > 0 ? orphaned : [],
      duplicateSignins: duplicates.length > 0 ? duplicates : [],
      hasIssues: orphaned.length > 0 || duplicates.length > 0,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error('Integrity check error:', err.message);
    res.status(500).send({ msg: '检查失败' });
  }
});

// Admin: cleanup orphaned records (super admin only)
app.post('/api/admin/cleanup-orphaned', auth, async (req, res) => {
  try {
    if (!req.user.isSuper) {
      return res.status(403).send({ msg: '仅超级管理员可访问' });
    }

    // 获取孤立的签到记录
    const [orphaned] = await db.query(`
      SELECT DISTINCT a.employee_id
      FROM attendance a
      WHERE a.employee_id NOT IN (SELECT id FROM employees)
    `);

    if (orphaned.length === 0) {
      return res.send({ 
        success: true, 
        message: '没有孤立记录需要清理',
        deletedCount: 0 
      });
    }

    // 删除孤立的签到记录
    const orphanedIds = orphaned.map(r => r.employee_id);
    const placeholders = orphanedIds.map(() => '?').join(',');
    const result = await db.query(
      `DELETE FROM attendance WHERE employee_id IN (${placeholders})`,
      orphanedIds
    );

    console.log(`Cleaned up ${result[0].affectedRows} orphaned attendance records for ${orphanedIds.length} deleted employees`);

    res.send({
      success: true,
      message: '清理完成',
      deletedEmployeeIds: orphanedIds,
      recordsDeleted: result[0].affectedRows
    });
  } catch (err) {
    console.error('Cleanup error:', err.message);
    res.status(500).send({ msg: '清理失败' });
  }
});

const PORT = process.env.PORT || 8000;
const HOST = process.env.HOST || '0.0.0.0';

app.listen(PORT, HOST, () => {
  console.log(`Attendance Server running on http://${HOST}:${PORT}`);
  console.log('API endpoints ready');
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Frontend hosting: ${FRONTEND_DIR}`);
});
