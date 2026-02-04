const db = require('../db');

async function migrate() {
  try {
    console.log('开始迁移数据库...');

    // 1. 在 admins 表添加 is_super 字段
    console.log('1. 添加超级管理员标识字段...');
    await db.query(`
      ALTER TABLE admins 
      ADD COLUMN IF NOT EXISTS is_super BOOLEAN DEFAULT FALSE
    `);
    console.log('✓ is_super 字段已添加');

    // 2. 创建系统配置表
    console.log('2. 创建系统配置表...');
    await db.query(`
      CREATE TABLE IF NOT EXISTS system_config (
        id INT PRIMARY KEY AUTO_INCREMENT,
        config_key VARCHAR(100) UNIQUE NOT NULL,
        config_value TEXT,
        description VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    console.log('✓ system_config 表已创建');

    // 3. 插入默认签到URL配置
    console.log('3. 插入默认配置...');
    await db.query(`
      INSERT INTO system_config (config_key, config_value, description)
      VALUES ('sign_url', 'http://localhost:5173/sign', '签到页面URL')
      ON DUPLICATE KEY UPDATE config_value = config_value
    `);
    console.log('✓ 默认配置已插入');

    // 4. 设置第一个管理员为超级管理员
    console.log('4. 设置超级管理员...');
    const [admins] = await db.query('SELECT id, username FROM admins ORDER BY id LIMIT 1');
    if (admins.length > 0) {
      await db.query('UPDATE admins SET is_super = TRUE WHERE id = ?', [admins[0].id]);
      console.log(`✓ ${admins[0].username} 已设置为超级管理员`);
    }

    console.log('\n✅ 数据库迁移完成！');
    process.exit(0);
  } catch (err) {
    console.error('❌ 迁移失败:', err.message);
    process.exit(1);
  }
}

migrate();
