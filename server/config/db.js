/**
 * MySQL 连接池配置
 * 使用 mysql2/promise 支持 async/await 与预编译语句防注入
 */
const mysql = require('mysql2/promise');
const path = require('path');

try { require('dotenv').config({ path: path.join(__dirname, '..', '.env') }); } catch { /* 无 .env 也不报错 */ }

const pool = mysql.createPool({
  host: process.env.DB_HOST || '127.0.0.1',
  port: parseInt(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'what_to_eat',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: 'utf8mb4',
});

// 测试连接
pool.getConnection()
  .then(conn => {
    console.log('✅ MySQL 数据库连接成功');
    conn.release();
  })
  .catch(err => {
    console.error('❌ MySQL 数据库连接失败:', err.message);
  });

module.exports = pool;
