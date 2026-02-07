/**
 * 数据库迁移脚本：支持多教会系统
 * 执行: node migrate_church_system.js
 */

const db = require('../db');

async function migrate() {
  try {
    console.log('开始数据库迁移...');

    // 1. 为 companies 表添加 created_by 字段（谁创建了这个教会）
    console.log('1. 升级 companies 表...');
    await db.query(`
      ALTER TABLE companies 
      ADD COLUMN IF NOT EXISTS created_by INT,
      ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    `);
    console.log('✓ companies 表已升级');

    // 2. 为 admins 表添加 church_id 字段（管理员所属教会）
    console.log('2. 升级 admins 表...');
    await db.query(`
      ALTER TABLE admins 
      ADD COLUMN IF NOT EXISTS church_id INT
    `);
    // 将现有的 company_id 作为 church_id
    await db.query(`
      UPDATE admins SET church_id = company_id WHERE church_id IS NULL
    `);
    console.log('✓ admins 表已升级');

    // 3. 创建 church_admins 映射表（支持一个管理员管理多个教会）
    console.log('3. 创建 church_admins 映射表...');
    await db.query(`
      CREATE TABLE IF NOT EXISTS church_admins (
        id INT PRIMARY KEY AUTO_INCREMENT,
        admin_id INT NOT NULL,
        church_id INT NOT NULL,
        role VARCHAR(50) DEFAULT 'manager',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY unique_admin_church (admin_id, church_id),
        FOREIGN KEY (admin_id) REFERENCES admins(id) ON DELETE CASCADE,
        FOREIGN KEY (church_id) REFERENCES companies(id) ON DELETE CASCADE
      )
    `);
    console.log('✓ church_admins 映射表已创建');

    // 4. 为 employees 表添加索引以提高查询性能
    console.log('4. 为 employees 表添加索引...');
    await db.query(`
      ALTER TABLE employees 
      ADD INDEX IF NOT EXISTS idx_company_id (company_id),
      ADD INDEX IF NOT EXISTS idx_company_phone (company_id, phone)
    `);
    console.log('✓ employees 表索引已添加');

    // 5. 为 attendance 表添加索引
    console.log('5. 为 attendance 表添加索引...');
    await db.query(`
      ALTER TABLE attendance 
      ADD INDEX IF NOT EXISTS idx_company_date (company_id, sign_date),
      ADD INDEX IF NOT EXISTS idx_employee_date (employee_id, sign_date)
    `);
    console.log('✓ attendance 表索引已添加');

    console.log('✅ 数据库迁移完成！');
    process.exit(0);

  } catch (err) {
    console.error('❌ 迁移失败:', err.message);
    process.exit(1);
  }
}

migrate();
