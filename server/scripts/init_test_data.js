/**
 * 初始化测试数据脚本
 * 执行: node scripts/init_test_data.js
 */

const db = require('../db');
const bcrypt = require('bcryptjs');

async function initTestData() {
  try {
    console.log('开始初始化测试数据...\n');

    // 1. 创建测试教会
    console.log('1. 创建测试教会...');
    let church1Id = 1, church2Id = 2;
    
    try {
      const [churchResult1] = await db.query(
        'INSERT INTO companies (name, code, created_by) VALUES (?, ?, ?)',
        ['第一教会', 'church_001', 1]
      );
      if (churchResult1 && churchResult1.insertId) {
        church1Id = churchResult1.insertId;
      }
    } catch (e) {
      console.log('  教会1可能已存在，使用默认ID');
    }

    try {
      const [churchResult2] = await db.query(
        'INSERT INTO companies (name, code, created_by) VALUES (?, ?, ?)',
        ['第二教会', 'church_002', 1]
      );
      if (churchResult2 && churchResult2.insertId) {
        church2Id = churchResult2.insertId;
      }
    } catch (e) {
      console.log('  教会2可能已存在，使用默认ID');
    }

    console.log(`✓ 教会创建完成: church1=${church1Id}, church2=${church2Id}\n`);

    // 2. 创建测试管理员
    console.log('2. 创建测试管理员...');
    const hashedPwd = bcrypt.hashSync('admin123', 10);
    let adminId = 1;
    
    try {
      const [adminResult] = await db.query(
        'INSERT INTO admins (username, password, company_id, church_id) VALUES (?, ?, ?, ?)',
        ['admin', hashedPwd, church1Id, church1Id]
      );
      if (adminResult && adminResult.insertId) {
        adminId = adminResult.insertId;
      }
    } catch (e) {
      console.log('  管理员可能已存在，使用默认ID');
    }

    console.log(`✓ 管理员创建完成: adminId=${adminId}\n`);

    // 3. 创建管理员与教会的关联
    console.log('3. 创建管理员与教会关联...');
    try {
      await db.query(
        'INSERT INTO church_admins (admin_id, church_id, role) VALUES (?, ?, ?)',
        [adminId, church1Id, 'owner']
      );
    } catch (e) {
      if (e.code !== 'ER_DUP_ENTRY') throw e;
    }

    try {
      await db.query(
        'INSERT INTO church_admins (admin_id, church_id, role) VALUES (?, ?, ?)',
        [adminId, church2Id, 'manager']
      );
    } catch (e) {
      if (e.code !== 'ER_DUP_ENTRY') throw e;
    }
    console.log(`✓ 关联创建完成\n`);

    // 4. 创建测试员工
    console.log('4. 创建测试员工...');
    const employees = [
      { name: '张三', gender: '男', age: 30, phone: '13800000001', address: '北京市朝阳区' },
      { name: '李四', gender: '女', age: 28, phone: '13800000002', address: '北京市朝阳区' },
      { name: '王五', gender: '男', age: 35, phone: '13800000003', address: '北京市朝阳区' },
      { name: '赵六', gender: '女', age: 26, phone: '13800000004', address: '北京市朝阳区' },
      { name: '孙七', gender: '男', age: 32, phone: '13800000005', address: '北京市朝阳区' },
    ];

    for (const emp of employees) {
      try {
        await db.query(
          'INSERT INTO employees (company_id, name, gender, age, phone, address) VALUES (?, ?, ?, ?, ?, ?)',
          [church1Id, emp.name, emp.gender, emp.age, emp.phone, emp.address]
        );
      } catch (e) {
        if (e.code !== 'ER_DUP_ENTRY') console.warn(`员工 ${emp.name} 创建失败:`, e.message);
      }
    }
    console.log(`✓ 创建了 ${employees.length} 个测试员工\n`);

    // 5. 创建测试签到记录
    console.log('5. 创建测试签到记录...');
    const [employeesList] = await db.query(
      'SELECT id FROM employees WHERE company_id = ? LIMIT 4',
      [church1Id]
    );

    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];

      for (const emp of employeesList) {
        try {
          await db.query(
            'INSERT INTO attendance (employee_id, company_id, sign_date, sign_time, sign_ip) VALUES (?, ?, ?, ?, ?)',
            [emp.id, church1Id, dateStr, `${dateStr} 08:${30 + Math.random() * 30}:00`, '127.0.0.1']
          );
        } catch (e) {
          // 忽略重复签到
          if (e.code !== 'ER_DUP_ENTRY') console.warn(`签到记录创建失败:`, e.message);
        }
      }
    }
    console.log(`✓ 创建了测试签到记录\n`);

    console.log('========== 初始化完成 ==========\n');
    console.log('测试账号信息：');
    console.log('用户名: admin');
    console.log('密码: admin123');
    console.log('');
    console.log('教会信息：');
    console.log(`- 第一教会 (代码: church_001)`);
    console.log(`- 第二教会 (代码: church_002)`);
    console.log('\n访问地址: http://localhost:5173/admin/login');

    process.exit(0);

  } catch (err) {
    console.error('❌ 初始化失败:', err.message);
    process.exit(1);
  }
}

initTestData();
