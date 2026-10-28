const { Pool, types } = require('pg');
const config = require('./config');

// COUNT(*) comes back as a string by default; vote counts are small, so parse them as numbers
types.setTypeParser(20, (v) => parseInt(v, 10));

const pool = new Pool({
  connectionString: config.databaseUrl,
  ssl: config.databaseSsl ? { rejectUnauthorized: false } : false,
  max: 10,
});

module.exports = {
  pool,
  query: (text, params) => pool.query(text, params),
};
