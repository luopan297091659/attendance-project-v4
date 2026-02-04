-- Active: 1769860933004@@139.196.44.6@3306@church_db;
const db = require('../db');
(async()=>{
  try{
    await db.query("ALTER TABLE employees ADD COLUMN IF NOT EXISTS gender VARCHAR(10) AFTER name");
    await db.query("ALTER TABLE employees ADD COLUMN IF NOT EXISTS age INT AFTER gender");
    console.log('ALTER OK');
    process.exit(0);
  }catch(e){
    console.error('ALTER ERROR', e.message);
    process.exit(1);
  }
})();