const axios = require('axios');
(async()=>{
  try{
    const r = await axios.post('http://localhost:3000/api/admin/login', { username:'admin', password:'admin123' }, { timeout:5000 });
    console.log('STATUS', r.status); console.log(r.data);
  }catch(err){
    console.error('ERROR during login test:');
    console.error('Message:', err.message);
    if (err.response) {
      console.error('Status:', err.response.status);
      try { console.error('Data:', JSON.stringify(err.response.data)); } catch(e){ console.error('Data (raw):', err.response.data); }
    }
    if (err.request && !err.response) console.error('No response received (timeout or network error)');
  }
})();