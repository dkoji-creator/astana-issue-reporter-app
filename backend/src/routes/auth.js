const express = require('express');
const db = require('../db');
const { hashPassword, verifyPassword } = require('../passwords');
const { signToken, requireAuth } = require('../auth');

const router = express.Router();
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const publicUser = (u) => ({ id: u.id, email: u.email, display_name: u.display_name, role: u.role });

router.post('/register', async (req, res) => {
  const email = String(req.body.email || '').trim().toLowerCase();
  const password = String(req.body.password || '');
  const displayName = String(req.body.display_name || '').trim();

  if (!EMAIL_RE.test(email) || email.length > 120) return res.status(400).json({ error: 'Enter a valid email' });
  if (password.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters' });
  if (displayName.length < 2 || displayName.length > 60) return res.status(400).json({ error: 'Name must be 2–60 characters' });

  // New accounts are always residents; admins are created only in the database
  const { rows } = await db.query(
    `INSERT INTO users (email, password_hash, display_name) VALUES ($1, $2, $3)
     ON CONFLICT (email) DO NOTHING
     RETURNING id, email, display_name, role`,
    [email, hashPassword(password), displayName],
  );
  if (!rows[0]) return res.status(409).json({ error: 'This email is already registered' });
  res.status(201).json({ token: signToken(rows[0]), user: publicUser(rows[0]) });
});

router.post('/login', async (req, res) => {
  const email = String(req.body.email || '').trim().toLowerCase();
  const password = String(req.body.password || '');
  const { rows } = await db.query('SELECT * FROM users WHERE email = $1', [email]);
  const user = rows[0];
  if (!user || !verifyPassword(password, user.password_hash)) {
    return res.status(401).json({ error: 'Wrong email or password' });
  }
  res.json({ token: signToken(user), user: publicUser(user) });
});

router.get('/me', requireAuth, (req, res) => res.json({ user: publicUser(req.user) }));

router.put('/push-token', requireAuth, async (req, res) => {
  const token = req.body.token ? String(req.body.token).slice(0, 200) : null;
  await db.query('UPDATE users SET push_token = $1 WHERE id = $2', [token, req.user.id]);
  res.json({ ok: true });
});

module.exports = router;
