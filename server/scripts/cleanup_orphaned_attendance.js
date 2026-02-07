/**
 * 清理孤立的签到记录（员工被删除但签到记录仍然存在的情况）
 * 
 * 使用方法: node scripts/cleanup_orphaned_attendance.js
 */

const db = require('../db');

(async () => {
  try {
    console.log('开始清理孤立的签到记录...');
    
    // 查找所有孤立的attendance记录（对应的employee不存在）
    const [orphaned] = await db.query(`
      SELECT a.id, a.employee_id, a.company_id, a.sign_date 
      FROM attendance a
      LEFT JOIN employees e ON a.employee_id = e.id AND a.company_id = e.company_id
      WHERE e.id IS NULL
    `);
    
    if (orphaned.length === 0) {
      console.log('✓ 没有孤立的签到记录');
      process.exit(0);
    }
    
    console.log(`发现 ${orphaned.length} 条孤立的签到记录`);
    console.log('即将删除的记录：');
    orphaned.forEach((record, index) => {
      console.log(`  ${index + 1}. 员工ID: ${record.employee_id}, 公司ID: ${record.company_id}, 日期: ${record.sign_date}`);
    });
    
    // 删除孤立记录
    const [result] = await db.query(`
      DELETE FROM attendance
      WHERE id IN (
        SELECT a.id FROM attendance a
        LEFT JOIN employees e ON a.employee_id = e.id AND a.company_id = e.company_id
        WHERE e.id IS NULL
      )
    `);
    
    console.log(`✓ 成功删除 ${result.affectedRows} 条孤立的签到记录`);
    process.exit(0);
  } catch (err) {
    console.error('清理失败:', err);
    process.exit(1);
  }
})();
