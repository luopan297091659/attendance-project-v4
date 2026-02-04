const axios = require('axios');
(async()=>{
  try{
    const api = axios.create({ baseURL: 'http://localhost:3000' });

    console.log('1) Login as admin...');
    const loginRes = await api.post('/api/admin/login', { username: 'admin', password: 'admin123' });
    console.log('Login response:', loginRes.data);
    const token = loginRes.data.token;
    api.defaults.headers.common['Authorization'] = token;

    console.log('\n2) GET /api/admin/today');
    const today = await api.get('/api/admin/today');
    console.log('today:', today.data);

    console.log('\n3) GET /api/admin/employees');
    const list = await api.get('/api/admin/employees');
    console.log('employees:', list.data);

    console.log('\n4) Create a new employee Bob...');
    const create = await api.post('/api/admin/employees', { name: 'Bob', gender: '男', age: 28, phone: '13911112222', address: '办公楼' });
    console.log('create response:', create.data);

    console.log('\n5) Fetch employees to find Bob id');
    const after = await api.get('/api/admin/employees');
    const bob = after.data.find(e=>e.name==='Bob');
    console.log('Bob:', bob);

    console.log('\n6) Update Bob age to 29');
    await api.put('/api/admin/employees/'+bob.id, { name:'Bob', gender:'男', age:29, phone:'13911112222', address:'办公楼' });
    const updated = (await api.get('/api/admin/employees')).data.find(e=>e.id===bob.id);
    console.log('Updated Bob:', updated);

    console.log('\n7) Delete Bob');
    await api.delete('/api/admin/employees/'+bob.id);
    const finalList = await api.get('/api/admin/employees');
    console.log('Final employees:', finalList.data.map(e=>e.name));

    console.log('\nAPI tests completed successfully.');
  }catch(err){
    console.error('ERROR during API tests:');
    console.error('Message:', err.message);
    if (err.response){
      console.error('Status:', err.response.status);
      try{ console.error('Data:', JSON.stringify(err.response.data)); }catch(e){ console.error('Data (raw):', err.response.data); }
    }
    process.exitCode = 1;
  }
})();