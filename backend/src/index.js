const app = require('./app');
const config = require('./config');
const db = require('./db');
const { resetDatabase } = require('../scripts/reset-db');

async function start() {
  // First start on a new (cloud) database: create the tables and test data automatically
  const { rows } = await db.query("SELECT to_regclass('public.users') AS t");
  if (!rows[0].t) {
    console.log('Empty database: creating tables and test data...');
    await resetDatabase();
  }
  app.listen(config.port, '0.0.0.0', () => {
    console.log(`API running on http://localhost:${config.port}`);
  });
}

start().catch((err) => {
  console.error('Could not start:', err.message);
  process.exit(1);
});
