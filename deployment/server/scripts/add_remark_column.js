const db = require('../db');

async function addRemarkColumn() {
  try {
    console.log('Adding remark column to employees table...');
    
    await db.query(`
      ALTER TABLE employees 
      ADD COLUMN IF NOT EXISTS remark TEXT AFTER address
    `);
    
    console.log('✓ Remark column added successfully');
    process.exit(0);
  } catch (err) {
    console.error('Error adding remark column:', err);
    process.exit(1);
  }
}

addRemarkColumn();
