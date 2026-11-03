// End-to-end API tests against a real PostgreSQL test database.
// Run: TEST_DATABASE_URL=postgresql://... npm test   (the test database is wiped!)
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { execFileSync } = require('child_process');
const path = require('path');

const TEST_DB = process.env.TEST_DATABASE_URL || 'postgresql://app:app@localhost:5432/astana_test';
process.env.DATABASE_URL = TEST_DB;
execFileSync('node', [path.join(__dirname, '..', 'scripts', 'reset-db.js')], {
  env: { ...process.env, DATABASE_URL: TEST_DB },
  stdio: 'ignore',
});

const request = require('supertest');
const app = require('../src/app');
const db = require('../src/db');

// Smallest valid PNG (1x1 pixel)
const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64');

let resident; let admin; let other;

async function login(email) {
  const res = await request(app).post('/api/auth/login').send({ email, password: 'Pass1234!' });
  assert.equal(res.status, 200, res.text);
  return res.body.token;
}
const auth = (t) => ({ Authorization: `Bearer ${t}` });

before(async () => {
  resident = await login('user2@example.kz');
  other = await login('user3@example.kz');
  admin = await login('user1@example.kz');
});
after(() => db.pool.end());

test('register: creates a resident, rejects duplicates and weak input', async () => {
  const ok = await request(app).post('/api/auth/register')
    .send({ email: 'New@Example.kz ', password: 'longpassword', display_name: 'Aibar', role: 'admin' });
  assert.equal(ok.status, 201);
  assert.equal(ok.body.user.role, 'resident', 'role from the request must be ignored');
  assert.equal(ok.body.user.email, 'new@example.kz');

  const dup = await request(app).post('/api/auth/register')
    .send({ email: 'new@example.kz', password: 'longpassword', display_name: 'Aibar' });
  assert.equal(dup.status, 409);
  assert.equal((await request(app).post('/api/auth/register').send({ email: 'x@y.kz', password: 'short', display_name: 'Ab' })).status, 400);
  assert.equal((await request(app).post('/api/auth/register').send({ email: 'bad', password: 'longpassword', display_name: 'Ab' })).status, 400);
});

test('R11: passwords are stored hashed, login checks them', async () => {
  const { rows } = await db.query("SELECT password_hash FROM users WHERE email = 'new@example.kz'");
  assert.match(rows[0].password_hash, /^pbkdf2_sha256\$100000\$[0-9a-f]{32}\$[0-9a-f]{64}$/);
  assert.ok(!rows[0].password_hash.includes('longpassword'));
  const bad = await request(app).post('/api/auth/login').send({ email: 'user2@example.kz', password: 'nope' });
  assert.equal(bad.status, 401);
});

test('protected routes need a valid token', async () => {
  assert.equal((await request(app).get('/api/reports')).status, 401);
  assert.equal((await request(app).get('/api/reports').set(auth('garbage'))).status, 401);
  const me = await request(app).get('/api/auth/me').set(auth(resident));
  assert.equal(me.body.user.email, 'user2@example.kz');
});

test('R10 + criterion 3: list returns 100+ markers sorted by votes', async () => {
  const t0 = Date.now();
  const res = await request(app).get('/api/reports').set(auth(resident));
  const ms = Date.now() - t0;
  assert.equal(res.status, 200);
  assert.ok(res.body.length >= 100);
  assert.ok(ms < 1000, `list took ${ms} ms`);
  for (let i = 1; i < res.body.length; i++) {
    assert.ok(res.body[i - 1].vote_count >= res.body[i].vote_count, 'not sorted by votes');
  }
  assert.equal(typeof res.body[0].vote_count, 'number');
});

test('filters: status, category, mine, sort=new', async () => {
  const s = await request(app).get('/api/reports?status=resolved').set(auth(resident));
  assert.ok(s.body.length > 0 && s.body.every((r) => r.status === 'resolved'));
  const c = await request(app).get('/api/reports?category_id=2').set(auth(resident));
  assert.ok(c.body.length > 0 && c.body.every((r) => r.category === 'Lighting'));
  const me = await request(app).get('/api/auth/me').set(auth(resident));
  const mine = await request(app).get('/api/reports?mine=1').set(auth(resident));
  assert.ok(mine.body.every((r) => r.user_id === me.body.user.id));
  const sql = await request(app).get("/api/reports?status=x' OR '1'='1").set(auth(resident));
  assert.equal(sql.body.length, 120, 'unknown status is ignored, not injected');
  const n = await request(app).get('/api/reports?sort=new').set(auth(resident));
  assert.ok(new Date(n.body[0].created_at) >= new Date(n.body[1].created_at));
});

let newId;
test('R1 R2 R4 R5: create a report with photo, category, description, coordinates', async () => {
  const res = await request(app).post('/api/reports').set(auth(resident))
    .field('description', 'Huge pothole near AITU entrance')
    .field('category_id', '1').field('lat', '51.0905').field('lng', '71.4180')
    .attach('photo', PNG, { filename: 'p.png', contentType: 'image/png' });
  assert.equal(res.status, 201, res.text);
  assert.equal(res.body.status, 'under_review');
  assert.equal(res.body.category, 'Roads & Potholes');
  assert.match(res.body.photo_url, /\/uploads\/.+\.png$/);
  newId = res.body.id;
  const img = await request(app).get(new URL(res.body.photo_url).pathname);
  assert.equal(img.status, 200);
});

test('create: validation errors', async () => {
  const base = () => request(app).post('/api/reports').set(auth(resident));
  const noPhoto = await base().field('description', 'Valid text here').field('category_id', '1').field('lat', '51.1').field('lng', '71.4');
  assert.equal(noPhoto.status, 400);
  const fake = await base().field('description', 'Valid text here').field('category_id', '1').field('lat', '51.1').field('lng', '71.4')
    .attach('photo', Buffer.from('not an image'), { filename: 'x.png', contentType: 'image/png' });
  assert.equal(fake.status, 400);
  const big = await base().field('description', 'Valid text here').field('category_id', '1').field('lat', '51.1').field('lng', '71.4')
    .attach('photo', Buffer.concat([PNG, Buffer.alloc(2 * 1024 * 1024)]), { filename: 'big.png', contentType: 'image/png' });
  assert.equal(big.status, 400);
  assert.match(big.body.error, /2 MB/);
  const outside = await base().field('description', 'Valid text here').field('category_id', '1').field('lat', '43.2').field('lng', '76.9')
    .attach('photo', PNG, { filename: 'p.png', contentType: 'image/png' });
  assert.equal(outside.status, 400);
  const badCat = await base().field('description', 'Valid text here').field('category_id', '99').field('lat', '51.1').field('lng', '71.4')
    .attach('photo', PNG, { filename: 'p.png', contentType: 'image/png' });
  assert.equal(badCat.status, 400);
  const shortText = await base().field('description', 'abc').field('category_id', '1').field('lat', '51.1').field('lng', '71.4')
    .attach('photo', PNG, { filename: 'p.png', contentType: 'image/png' });
  assert.equal(shortText.status, 400);
});

test('R3: like adds exactly 1, twice is still 1, unlike removes, own report blocked', async () => {
  const before = (await request(app).get(`/api/reports/${newId}`).set(auth(other))).body.vote_count;
  const v1 = await request(app).post(`/api/reports/${newId}/vote`).set(auth(other));
  assert.equal(v1.body.vote_count, before + 1);
  assert.equal(v1.body.voted_by_me, true);
  const v2 = await request(app).post(`/api/reports/${newId}/vote`).set(auth(other));
  assert.equal(v2.body.vote_count, before + 1);
  const un = await request(app).delete(`/api/reports/${newId}/vote`).set(auth(other));
  assert.equal(un.body.vote_count, before);
  const own = await request(app).post(`/api/reports/${newId}/vote`).set(auth(resident));
  assert.equal(own.status, 400);
  assert.equal((await request(app).post('/api/reports/999999/vote').set(auth(other))).status, 404);
  assert.equal((await request(app).get('/api/reports/abc').set(auth(other))).status, 404);
  assert.equal((await request(app).get('/api/reports/99999999999').set(auth(other))).status, 404);
  assert.equal((await request(app).post('/api/reports/99999999999/vote').set(auth(other))).status, 404);
  assert.equal((await request(app).get('/api/reports?category_id=99999999999').set(auth(other))).status, 200);
});

test('R7: only admin changes status; R6 history; R8 author notified', async () => {
  const denied = await request(app).patch(`/api/admin/reports/${newId}/status`).set(auth(resident)).send({ status: 'resolved' });
  assert.equal(denied.status, 403);
  const bad = await request(app).patch(`/api/admin/reports/${newId}/status`).set(auth(admin)).send({ status: 'done' });
  assert.equal(bad.status, 400);

  const ok = await request(app).patch(`/api/admin/reports/${newId}/status`).set(auth(admin)).send({ status: 'in_progress' });
  assert.equal(ok.status, 200);
  assert.equal(ok.body.changed, true);
  const same = await request(app).patch(`/api/admin/reports/${newId}/status`).set(auth(admin)).send({ status: 'in_progress' });
  assert.equal(same.body.changed, false, 'same status must not create a duplicate log/notification');

  const detail = await request(app).get(`/api/reports/${newId}`).set(auth(resident));
  assert.equal(detail.body.status, 'in_progress');
  assert.equal(detail.body.history.length, 1);
  assert.equal(detail.body.history[0].new_status, 'in_progress');

  const notes = await request(app).get('/api/notifications').set(auth(resident));
  assert.ok(notes.body.unread >= 1);
  assert.equal(notes.body.items[0].report_id, newId);
  assert.match(notes.body.items[0].message, /In Progress/);
  assert.equal(notes.body.items[0].new_status, 'in_progress');
  await request(app).post('/api/notifications/read-all').set(auth(resident));
  assert.equal((await request(app).get('/api/notifications').set(auth(resident))).body.unread, 0);
  assert.equal((await request(app).get('/api/notifications').set(auth(other))).body.items.some((n) => n.report_id === newId), false);
});

test('admin stats', async () => {
  assert.equal((await request(app).get('/api/admin/stats').set(auth(resident))).status, 403);
  const s = await request(app).get('/api/admin/stats').set(auth(admin));
  assert.equal(s.body.reports, 121);
  assert.equal(s.body.by_category.length, 4);
});

test('bad JSON and unknown routes give clean errors', async () => {
  const res = await request(app).post('/api/auth/login').set('Content-Type', 'application/json').send('{bad');
  assert.equal(res.status, 400);
  assert.equal((await request(app).get('/api/nope')).status, 404);
});

test('store rules: account deletion in the app removes the user and their data', async () => {
  const reg = await request(app).post('/api/auth/register')
    .send({ email: 'leaver@example.kz', password: 'longpassword', display_name: 'Leaver' });
  const token = reg.body.token;
  const created = await request(app).post('/api/reports').set(auth(token))
    .field('description', 'Report that leaves with its author')
    .field('category_id', '1').field('lat', '51.15').field('lng', '71.45')
    .attach('photo', PNG, { filename: 'p.png', contentType: 'image/png' });
  assert.equal(created.status, 201, created.text);
  await request(app).post(`/api/reports/${created.body.id}/vote`).set(auth(other)).expect(200);

  // Wrong password: 400 (a 401 would log the user out of the app), nothing deleted
  const wrong = await request(app).post('/api/auth/delete-account').set(auth(token)).send({ password: 'nope' });
  assert.equal(wrong.status, 400);

  const ok = await request(app).post('/api/auth/delete-account').set(auth(token)).send({ password: 'longpassword' });
  assert.equal(ok.status, 200, ok.text);
  const left = await db.query(
    `SELECT (SELECT COUNT(*) FROM users WHERE email = 'leaver@example.kz') AS users,
            (SELECT COUNT(*) FROM reports WHERE id = $1) AS reports,
            (SELECT COUNT(*) FROM votes WHERE report_id = $1) AS votes`, [created.body.id]);
  assert.deepEqual(left.rows[0], { users: 0, reports: 0, votes: 0 });
  assert.equal((await request(app).get('/api/auth/me').set(auth(token))).status, 401);

  // City staff accounts are not deleted from the app
  const adminTry = await request(app).post('/api/auth/delete-account').set(auth(admin)).send({ password: 'Pass1234!' });
  assert.equal(adminTry.status, 403);
});

test('store rules: privacy policy and web account deletion pages', async () => {
  const privacy = await request(app).get('/privacy');
  assert.equal(privacy.status, 200);
  assert.match(privacy.text, /Privacy policy/);
  assert.match(privacy.text, /delete-account/);

  assert.equal((await request(app).get('/delete-account')).status, 200);
  await request(app).post('/api/auth/register')
    .send({ email: 'webleaver@example.kz', password: 'longpassword', display_name: 'Web Leaver' }).expect(201);
  const wrong = await request(app).post('/delete-account').type('form').send({ email: 'webleaver@example.kz', password: 'x' });
  assert.equal(wrong.status, 400);
  assert.match(wrong.text, /Wrong email or password/);
  const ok = await request(app).post('/delete-account').type('form').send({ email: 'WebLeaver@example.kz', password: 'longpassword' });
  assert.equal(ok.status, 200);
  assert.match(ok.text, /Account deleted/);
  const { rows } = await db.query("SELECT COUNT(*) AS n FROM users WHERE email = 'webleaver@example.kz'");
  assert.equal(rows[0].n, 0);
});

test('store rules: report content, block author, admin moderation, rude words filter', async () => {
  // A report by "other" that "resident" will complain about
  const make = (token, description) => request(app).post('/api/reports').set(auth(token))
    .field('description', description).field('category_id', '2').field('lat', '51.16').field('lng', '71.43')
    .attach('photo', PNG, { filename: 'p.png', contentType: 'image/png' });
  const rude = await make(other, 'fucking broken light');
  assert.equal(rude.status, 400);
  assert.equal(rude.body.error, 'Please remove rude words from the description');

  const bad = (await make(other, 'Report that people complain about')).body;
  const ids = async (token) => (await request(app).get('/api/reports?sort=new').set(auth(token))).body.map((r) => r.id);
  assert.ok((await ids(resident)).includes(bad.id));

  assert.equal((await request(app).post(`/api/reports/${bad.id}/flag`).set(auth(other)).send({})).status, 400); // own report
  const flag = await request(app).post(`/api/reports/${bad.id}/flag`).set(auth(resident)).send({ reason: 'Offensive photo' });
  assert.equal(flag.status, 200);
  // Hidden for the one who complained, still visible to the author and to the admin with the complaint count
  assert.ok(!(await ids(resident)).includes(bad.id));
  assert.equal((await request(app).get(`/api/reports/${bad.id}`).set(auth(resident))).status, 404);
  assert.ok((await ids(other)).includes(bad.id));
  const flaggedList = (await request(app).get('/api/reports?flagged=1').set(auth(admin))).body;
  assert.equal(flaggedList[0].id, bad.id);
  assert.equal(flaggedList[0].flag_count, 1);
  // flagged=1 is ignored for residents
  assert.ok((await request(app).get('/api/reports?flagged=1').set(auth(other))).body.length > 1);

  // Admin keeps it: complaints removed, visible again
  await request(app).delete(`/api/admin/reports/${bad.id}/flags`).set(auth(admin)).expect(200);
  assert.ok((await ids(resident)).includes(bad.id));

  // Block the author: none of their reports are shown, own reports still are; unblock all brings them back
  const otherId = (await request(app).get('/api/auth/me').set(auth(other))).body.user.id;
  assert.equal((await request(app).post(`/api/users/${otherId}/block`).set(auth(other))).status, 400);
  await request(app).post(`/api/users/${otherId}/block`).set(auth(resident)).expect(200);
  const seen = (await request(app).get('/api/reports').set(auth(resident))).body;
  assert.ok(seen.every((r) => r.user_id !== otherId));
  assert.ok((await request(app).get('/api/reports?mine=1').set(auth(resident))).body.length > 0);
  await request(app).delete('/api/users/blocks').set(auth(resident)).expect(200);
  assert.ok((await ids(resident)).includes(bad.id));

  // Admin deletes it; residents cannot
  assert.equal((await request(app).delete(`/api/admin/reports/${bad.id}`).set(auth(resident))).status, 403);
  await request(app).delete(`/api/admin/reports/${bad.id}`).set(auth(admin)).expect(200);
  assert.equal((await request(app).get(`/api/reports/${bad.id}`).set(auth(admin))).status, 404);
});

test('store rules: terms page', async () => {
  const terms = await request(app).get('/terms');
  assert.equal(terms.status, 200);
  assert.match(terms.text, /Zero tolerance/);
});
