const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || 'database',
  port: parseInt(process.env.DB_PORT || '5432'),
  user: process.env.DB_USER || 'devops_user',
  password: process.env.DB_PASSWORD || 'devops_pass123',
  database: process.env.DB_NAME || 'devops_db',
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

module.exports = pool;
