const fs = require('fs');
const path = require('path');
const app = require('./app');
const config = require('./config');
const db = require('./db');
const { resetDatabase } = require('../scripts/reset-db');
const { hashPassword } = require('./passwords');

async function start() {
  // First start on a new (cloud) database: create the tables and test data automatically
  const { rows } = await db.query("SELECT to_regclass('public.users') AS t");
  if (!rows[0].t) {
    console.log('Empty database: creating tables and test data...');
    await resetDatabase();
  }
  // Tables added after the first release (moderation); does nothing when they already exist
  await db.query(fs.readFileSync(path.join(__dirname, '..', 'db', 'moderation.sql'), 'utf8'));
  // Test data uses a password everyone knows. For the store version set ADMIN_PASSWORD on Render:
  // every admin account gets it on start, so the demo admin login stops working for strangers
  if (config.adminPassword) {
    const { rowCount } = await db.query("UPDATE users SET password_hash = $1 WHERE role = 'admin'", [hashPassword(config.adminPassword)]);
    console.log(`Admin password set from ADMIN_PASSWORD for ${rowCount} account(s)`);
  }
  app.listen(config.port, '0.0.0.0', () => {
    console.log(`API running on http://localhost:${config.port}`);
  });
}

start().catch((err) => {
  console.error('Could not start:', err.message);
  process.exit(1);
});
