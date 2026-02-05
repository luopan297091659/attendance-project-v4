
const mysql = require('mysql2');
// Use environment variables for credentials. Defaults kept for convenience but
// it's recommended to set DB_HOST/DB_USER/DB_PASSWORD/DB_NAME in your environment
// and rotate passwords after any changes.
module.exports = mysql.createPool({
  // host: process.env.DB_HOST || '139.196.44.6',
  host: process.env.DB_HOST || '127.0.0.1',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '6586156',
  database: process.env.DB_NAME || 'church_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  connectTimeout: 10000
}).promise();