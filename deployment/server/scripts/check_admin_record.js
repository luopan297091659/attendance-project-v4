const mysql = require('mysql2/promise');
(async()=>{
  try{
    const conn = await mysql.createConnection({host:'139.196.44.6', user:'root', password:'6586156', database:'church_db'});
    const [rows] = await conn.query('SELECT id,username,password,company_id FROM admins WHERE username=?', ['admin']);
    console.log(rows);
    await conn.end();
  }catch(e){ console.error('ERR',e.message); process.exit(1) }
})();