const db = require('../db');
(async()=>{
  try{
    console.log('SHOW TABLES:');
    const [t] = await db.query('SHOW TABLES');
    console.log(t.map(r=>Object.values(r)[0]).join(', '));

    console.log('\nDESCRIBE employees:');
    const [d] = await db.query('DESCRIBE employees');
    console.log(d.map(r=>`${r.Field} ${r.Type}`).join('\n'));

    console.log('\nSELECT COUNT(*) FROM employees:');
    const [c] = await db.query('SELECT COUNT(*) as c FROM employees');
    console.log(c[0].c);
  }catch(e){
    console.error('ERROR', e.message);
  }finally{ process.exit(0); }
})();