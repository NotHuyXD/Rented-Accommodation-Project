// ============================================================
// MySQL Connection Pool Configuration
// ============================================================
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'phongtro_db',
  charset: 'utf8mb4',
  waitForConnections: true,
  connectionLimit: 20,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
  // Return dates as strings instead of JS Date objects
  dateStrings: true,
  // Support multiple statements for complex queries
  multipleStatements: false,
});

/**
 * Test database connection
 */
async function testConnection() {
  const connection = await pool.getConnection();
  try {
    await connection.query('SELECT 1');
  } finally {
    connection.release();
  }
}

/**
 * Execute a query with parameters
 * Uses pool.query() instead of pool.execute() to avoid
 * mysql2 prepared statement issues with LIMIT/OFFSET params
 * @param {string} sql - SQL query
 * @param {Array} params - Query parameters
 * @returns {Promise<Array>} Query results
 */
async function query(sql, params = []) {
  const [rows] = await pool.query(sql, params);
  return rows;
}

/**
 * Get a connection from the pool (for transactions)
 * Wraps the connection to use .query() instead of .execute()
 * to avoid prepared statement issues across the entire app.
 * @returns {Promise<mysql.PoolConnection>}
 */
async function getConnection() {
  const conn = await pool.getConnection();
  // Save original execute as _execute, override execute with query
  // This ensures all conn.execute() calls in controllers use query() internally
  conn._execute = conn.execute.bind(conn);
  conn.execute = conn.query.bind(conn);
  return conn;
}

module.exports = {
  pool,
  query,
  getConnection,
  testConnection,
};
