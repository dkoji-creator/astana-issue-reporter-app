const express = require('express');
const db = require('../db');
const { requireAuth, requireAdmin } = require('../auth');
const { notifyStatusChange, sendPush } = require('../notify');
const { parseId } = require('../ids');

const router = express.Router();
router.use(requireAuth, requireAdmin);

const STATUSES = ['under_review', 'in_progress', 'resolved'];

// R7: admin changes the status; the change is logged and the author is notified (R8)
router.patch('/reports/:id/status', async (req, res) => {
  const id = parseId(req.params.id);
  const status = req.body.status;
  if (!STATUSES.includes(status)) return res.status(400).json({ error: 'Unknown status' });
  if (!id) return res.status(404).json({ error: 'Report not found' });

  const client = await db.pool.connect();
  let report;
  let message = null;
  try {
    await client.query('BEGIN');
    const found = await client.query('SELECT id, user_id, status FROM reports WHERE id = $1 FOR UPDATE', [id]);
    report = found.rows[0];
    if (!report) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Report not found' });
    }
    if (report.status !== status) {
      await client.query('UPDATE reports SET status = $1 WHERE id = $2', [status, id]);
      await client.query(
        'INSERT INTO status_log (report_id, changed_by, old_status, new_status) VALUES ($1, $2, $3, $4)',
        [id, req.user.id, report.status, status],
      );
      message = await notifyStatusChange(client, report, status);
    }
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
  if (message) sendPush(report.user_id, id, message); // fire and forget
  res.json({ id, status, changed: Boolean(message) });
});

router.get('/stats', async (req, res) => {
  const byStatus = await db.query('SELECT status, COUNT(*) AS count FROM reports GROUP BY status');
  const byCategory = await db.query(
    `SELECT c.name, COUNT(r.id) AS count FROM categories c
     LEFT JOIN reports r ON r.category_id = c.id GROUP BY c.id ORDER BY c.id`,
  );
  const totals = await db.query(
    'SELECT (SELECT COUNT(*) FROM reports) AS reports, (SELECT COUNT(*) FROM users) AS users, (SELECT COUNT(*) FROM votes) AS votes',
  );
  res.json({ ...totals.rows[0], by_status: byStatus.rows, by_category: byCategory.rows });
});

module.exports = router;
