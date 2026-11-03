// "Block author": the user stops seeing reports of someone who posts abusive content
const express = require('express');
const db = require('../db');
const { requireAuth } = require('../auth');
const { parseId } = require('../ids');

const router = express.Router();
router.use(requireAuth);

router.post('/:id/block', async (req, res) => {
  const id = parseId(req.params.id);
  if (id === req.user.id) return res.status(400).json({ error: 'You cannot block yourself' });
  const { rows } = await db.query('SELECT id FROM users WHERE id = $1', [id || 0]);
  if (!rows[0]) return res.status(404).json({ error: 'User not found' });
  await db.query('INSERT INTO user_blocks (blocker_id, blocked_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [req.user.id, id]);
  res.json({ ok: true });
});

// Unblock everyone at once (Profile → "Unblock all")
router.delete('/blocks', async (req, res) => {
  const { rowCount } = await db.query('DELETE FROM user_blocks WHERE blocker_id = $1', [req.user.id]);
  res.json({ ok: true, unblocked: rowCount });
});

module.exports = router;
