const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
const fs = require('fs');

dotenv.config();

let pool = null;

function getPool() {
  if (pool) return pool;

  const config = {
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'medifind_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    decimalNumbers: true
  };

  // Check if socket path exists (common on macOS/Linux), else use host:port
  const socketPath = process.env.DB_SOCKET_PATH || '/tmp/mysql.sock';
  if (fs.existsSync(socketPath)) {
    config.socketPath = socketPath;
  } else {
    config.host = process.env.DB_HOST || '127.0.0.1';
    config.port = parseInt(process.env.DB_PORT || '3306', 10);
  }

  pool = mysql.createPool(config);
  return pool;
}

// Helper query function that unwraps rows
async function query(sql, params = []) {
  const p = getPool();
  const [rows, fields] = await p.execute(sql, params);
  return rows;
}

// Helper to get connection for transactions
async function getConnection() {
  const p = getPool();
  return await p.getConnection();
}

module.exports = {
  getPool,
  query,
  getConnection
};
