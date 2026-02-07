const axios = require('axios')
const db = require('../db')

const BASE = 'http://127.0.0.1:3000'

async function run() {
  try {
    const name = 'E2E_User_' + Date.now()
    const phone = '199' + Math.floor(Math.random()*1e8).toString().padStart(8,'0')

    console.log('Trying sign with', name, phone)
    try {
      const r = await axios.post(BASE + '/api/public/sign', { companyCode: 'demo001', name, phone })
      console.log('Sign response:', r.data)
      return
    } catch (e) {
      const resp = e.response && e.response.data
      console.log('Sign failed status:', e.response && e.response.status, 'data:', resp)
      if (resp && resp.code === 'NOT_MATCH') {
        console.log('NOT_MATCH detected, proceeding to register')
        const reg = await axios.post(BASE + '/api/public/register', { companyCode: 'demo001', name, phone, gender: '男', age: 30, address: '自动地址' })
        console.log('Register response:', reg.data)
        // verify DB
        const [rows] = await db.query('SELECT * FROM employees WHERE phone=? ORDER BY id DESC LIMIT 1', [phone])
        console.log('DB lookup result:', rows)
      } else {
        console.log('Sign failed with other reason, aborting')
      }
    }
  } catch (err) {
    console.error('E2E script error:', err && err.response ? err.response.data : err.message)
  }
}

run()
