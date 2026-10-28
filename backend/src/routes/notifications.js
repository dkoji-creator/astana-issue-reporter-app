const express = require('express');
const db = require('../db');
const { requireAuth } = require('../auth');

const router = express.Router();
router.use(requireAuth);

router.get('/', async (req, res) => {
  const { rows } = await db.query(
    `SELECT id, report_id, message, new_status, is_read, created_at FROM notifications
     WHERE user_id = $1 ORDER BY created_at DESC, id DESC LIMIT 50`,
    [req.user.id],
  );
  const unread = rows.filter((n) => !n.is_read).length;
  res.json({ unread, items: rows });
});

router.post('/read-all', async (req, res) => {
  await db.query('UPDATE notifications SET is_read = true WHERE user_id = $1 AND NOT is_read', [req.user.id]);
  res.json({ ok: true });
});

module.exports = router;
