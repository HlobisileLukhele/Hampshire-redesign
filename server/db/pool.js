const mysql = require("mysql2/promise");
const env = require("../config/env");

const databaseConfig = {
  host: env.DB_HOST,
  port: env.DB_PORT,
  database: env.DB_NAME,
  user: env.DB_USER,
  password: env.DB_PASSWORD,
  waitForConnections: true,
  connectionLimit: env.DB_CONNECTION_LIMIT,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
  ...(env.DB_SSL ? { ssl: { rejectUnauthorized: true } } : {})
};

const pool = mysql.createPool(databaseConfig);

module.exports = { pool };
