const db = require('../db');
(async()=>{
  try{
    const [rows] = await db.query("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA='church_db' AND TABLE_NAME='employees'");
    console.log(rows.map(r=>r.COLUMN_NAME).join(', '));
  }catch(e){
    console.error('ERROR', e.message);
  }finally{ process.exit(0); }
})();