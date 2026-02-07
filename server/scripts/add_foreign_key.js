/**
 * 添加外键约束到attendance表
 * 确保当删除员工时，相关的签到记录也会被自动删除
 * 
 * 使用方法: node scripts/add_foreign_key.js
 */

const db = require('../db');

(async () => {
  try {
    console.log('检查外键约束...');
    
    // 检查是否已经存在外键约束
    const [constraints] = await db.query(`
      SELECT CONSTRAINT_NAME 
      FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
      WHERE TABLE_NAME = 'attendance' 
      AND COLUMN_NAME = 'employee_id'
      AND REFERENCED_TABLE_NAME IS NOT NULL
    `);
    
    if (constraints.length > 0) {
      console.log('✓ 外键约束已存在:', constraints[0].CONSTRAINT_NAME);
      process.exit(0);
    }
    
    console.log('添加外键约束: attendance.employee_id -> employees.id');
    
    // 添加外键约束，使用 CASCADE DELETE
    // 如果employees表中的记录被删除，相关的attendance记录也会被删除
    try {
      await db.query(`
        ALTER TABLE attendance 
        ADD CONSTRAINT fk_attendance_employee 
        FOREIGN KEY (employee_id) 
        REFERENCES employees(id) 
        ON DELETE CASCADE
      `);
      console.log('✓ 外键约束添加成功');
    } catch (err) {
      if (err.code === 'ER_FK_DUP_NAME') {
        console.log('✓ 外键约束已经存在');
      } else {
        throw err;
      }
    }
    
    process.exit(0);
  } catch (err) {
    console.error('❌ 失败:', err.message);
    process.exit(1);
  }
})();
