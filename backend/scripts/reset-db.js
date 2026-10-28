// Recreates all tables from db/schema.sql and loads realistic test data.
// Usage: npm run db:reset   (uses DATABASE_URL from .env)
const fs = require('fs');
const path = require('path');
const { pool } = require('../src/db');
const { hashPassword } = require('../src/passwords');

// Small seeded random generator, so every run gives the same data
let seed = 42;
const rnd = () => ((seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648);
const randInt = (a, b) => a + Math.floor(rnd() * (b - a + 1));
const pick = (arr) => arr[Math.floor(rnd() * arr.length)];

const CATEGORIES = ['Roads & Potholes', 'Lighting', 'Landscaping', 'Trash'];
const STREETS = ['Abay Ave', 'Mangilik El Ave', 'Turan Ave', 'Kabanbay Batyr Ave', 'Syganak St',
  'Tauelsizdik Ave', 'Kenesary St', 'Respublika Ave', 'Dostyk St'];
const TEMPLATES = {
  1: ['Deep pothole on {s}, cars swerve to avoid it', 'Cracked asphalt near the crossing on {s}',
    'Sunken manhole cover on {s}'],
  2: ['Streetlight not working on {s}, dark at night', 'Flickering lamp near the bus stop on {s}'],
  3: ['Broken bench in the courtyard on {s}', 'Fallen tree branch blocking the path on {s}'],
  4: ['Overflowing trash bin near {s}', 'Illegal dump behind the building on {s}'],
};
const STATUS_LABEL = { in_progress: 'In Progress', resolved: 'Resolved' };

async function main() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(fs.readFileSync(path.join(__dirname, '..', 'db', 'schema.sql'), 'utf8'));

    for (const name of CATEGORIES) await client.query('INSERT INTO categories (name) VALUES ($1)', [name]);

    // user1 is the admin, user2..user15 are residents. Password for all: Pass1234!
    const hash = hashPassword('Pass1234!');
    for (let i = 1; i <= 15; i++) {
      await client.query(
        'INSERT INTO users (email, password_hash, display_name, role) VALUES ($1, $2, $3, $4)',
        [`user${i}@example.kz`, hash, i === 1 ? 'City Admin' : `Resident ${i}`, i === 1 ? 'admin' : 'resident'],
      );
    }

    const now = Date.now();
    for (let i = 0; i < 120; i++) {
      const categoryId = randInt(1, 4);
      const r = rnd();
      const status = r < 0.5 ? 'under_review' : r < 0.8 ? 'in_progress' : 'resolved';
      const createdAt = new Date(now - randInt(1, 60 * 24) * 60 * 60 * 1000); // last 60 days
      const userId = randInt(2, 15);
      const { rows } = await client.query(
        `INSERT INTO reports (user_id, category_id, description, lat, lng, status, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
        [userId, categoryId, pick(TEMPLATES[categoryId]).replace('{s}', pick(STREETS)),
          +(51.10 + rnd() * 0.08).toFixed(6), +(71.38 + rnd() * 0.10).toFixed(6), status, createdAt],
      );
      if (status !== 'under_review') {
        const changedAt = new Date(createdAt.getTime() + 24 * 60 * 60 * 1000);
        await client.query(
          `INSERT INTO status_log (report_id, changed_by, old_status, new_status, changed_at)
           VALUES ($1, 1, 'under_review', $2, $3)`,
          [rows[0].id, status, changedAt],
        );
        await client.query(
          'INSERT INTO notifications (user_id, report_id, message, new_status, is_read, created_at) VALUES ($1, $2, $3, $4, true, $5)',
          [userId, rows[0].id, `Your report #${rows[0].id} is now "${STATUS_LABEL[status]}"`, status, changedAt],
        );
      }
    }

    // 250 likes from residents; nobody likes their own report
    let votes = 0;
    while (votes < 250) {
      const res = await client.query(
        `INSERT INTO votes (user_id, report_id)
         SELECT $1, id FROM reports WHERE id = $2 AND user_id <> $1
         ON CONFLICT DO NOTHING`,
        [randInt(2, 15), randInt(1, 120)],
      );
      votes += res.rowCount;
    }

    await client.query('COMMIT');
    const counts = await client.query(
      `SELECT (SELECT COUNT(*) FROM users) u, (SELECT COUNT(*) FROM categories) c, (SELECT COUNT(*) FROM reports) r,
              (SELECT COUNT(*) FROM votes) v, (SELECT COUNT(*) FROM status_log) s, (SELECT COUNT(*) FROM notifications) n`,
    );
    const c = counts.rows[0];
    console.log(`Database ready: ${c.u} users, ${c.c} categories, ${c.r} reports, ${c.v} votes, ${c.s} status changes, ${c.n} notifications`);
    console.log('Admin: user1@example.kz / Pass1234!   Resident: user2@example.kz / Pass1234!');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
