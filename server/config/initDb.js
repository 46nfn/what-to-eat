/**
 * 数据库初始化脚本
 * 运行: node config/initDb.js
 */
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

async function initDatabase() {
  // 先连接不指定数据库，创建数据库
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    port: parseInt(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
  });

  const dbName = process.env.DB_NAME || 'what_to_eat';

  console.log(`📦 创建数据库 \`${dbName}\`（如不存在）...`);
  await conn.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
  await conn.query(`USE \`${dbName}\``);

  // 读取并执行 SQL 文件
  const sqlPath = path.join(__dirname, '..', 'models', 'init.sql');
  const sql = fs.readFileSync(sqlPath, 'utf8');

  // 按分号分割 SQL 语句（忽略注释和空行）
  const statements = sql
    .replace(/--.*$/gm, '')       // 去除单行注释
    .replace(/\/\*[\s\S]*?\*\//g, '') // 去除多行注释
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0);

  for (const stmt of statements) {
    try {
      await conn.query(stmt);
    } catch (err) {
      console.error('⚠️  SQL 执行警告:', err.message);
    }
  }

  console.log('✅ 数据库表初始化完成');
  await conn.end();
  process.exit(0);
}

initDatabase().catch(err => {
  console.error('❌ 初始化失败:', err);
  process.exit(1);
});
