const express = require('express');
const multer = require('multer');
const db = require('../db');
const config = require('../config');
const { requireAuth } = require('../auth');
const { savePhoto, looksLikeImage, EXT } = require('../storage');
const { parseId } = require('../ids');

const router = express.Router();
router.use(requireAuth);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: config.maxPhotoBytes, files: 1 },
  fileFilter: (req, file, cb) => cb(null, Boolean(EXT[file.mimetype])),
});

const STATUSES = ['under_review', 'in_progress', 'resolved'];

// One SELECT used by the list and the detail endpoints
const REPORT_SELECT = `
  SELECT r.id, r.description, r.lat, r.lng, r.photo_url, r.status, r.created_at,
         r.user_id, u.display_name AS author_name,
         r.category_id, c.name AS category,
         (SELECT COUNT(*) FROM votes v WHERE v.report_id = r.id) AS vote_count,
         EXISTS (SELECT 1 FROM votes v WHERE v.report_id = r.id AND v.user_id = $1) AS voted_by_me
  FROM reports r
  JOIN users u ON u.id = r.user_id
  JOIN categories c ON c.id = r.category_id`;

router.get('/categories', async (req, res) => {
  const { rows } = await db.query('SELECT id, name FROM categories ORDER BY id');
  res.json(rows);
});

// GET /api/reports?sort=votes|new&status=..&category_id=..&mine=1
router.get('/', async (req, res) => {
  const where = [];
  const params = [req.user.id];
  if (STATUSES.includes(req.query.status)) {
    params.push(req.query.status);
    where.push(`r.status = $${params.length}`);
  }
  const categoryId = parseId(req.query.category_id);
  if (categoryId) {
    params.push(categoryId);
    where.push(`r.category_id = $${params.length}`);
  }
  if (req.query.mine === '1') where.push('r.user_id = $1');

  const order = req.query.sort === 'new'
    ? 'r.created_at DESC, r.id DESC'
    : 'vote_count DESC, r.created_at DESC, r.id DESC'; // success criterion 3: sorted by votes
  const sql = `${REPORT_SELECT} ${where.length ? 'WHERE ' + where.join(' AND ') : ''} ORDER BY ${order}`;
  const { rows } = await db.query(sql, params);
  res.json(rows);
});

router.get('/:id', async (req, res) => {
  const id = parseId(req.params.id);
  if (!id) return res.status(404).json({ error: 'Report not found' });
  const { rows } = await db.query(`${REPORT_SELECT} WHERE r.id = $2`, [req.user.id, id]);
  if (!rows[0]) return res.status(404).json({ error: 'Report not found' });
  const history = await db.query(
    `SELECT s.old_status, s.new_status, s.changed_at, u.display_name AS changed_by
     FROM status_log s JOIN users u ON u.id = s.changed_by
     WHERE s.report_id = $1 ORDER BY s.changed_at, s.id`,
    [id],
  );
  res.json({ ...rows[0], history: history.rows });
});

// Multer errors (file too big etc.) become a clear 400 instead of a 500
function photoUpload(req, res, next) {
  upload.single('photo')(req, res, (err) => {
    if (!err) return next();
    if (err.code === 'LIMIT_FILE_SIZE') return res.status(400).json({ error: 'Photo must be 2 MB or smaller' });
    return res.status(400).json({ error: 'Could not read the photo' });
  });
}

router.post('/', photoUpload, async (req, res) => {
  const description = String(req.body.description || '').trim();
  const categoryId = parseId(req.body.category_id);
  const lat = Number(req.body.lat);
  const lng = Number(req.body.lng);

  if (!req.file) return res.status(400).json({ error: 'Attach one photo (JPG or PNG)' });
  if (!looksLikeImage(req.file)) return res.status(400).json({ error: 'The file is not a real JPG or PNG image' });
  if (description.length < 5 || description.length > 500) return res.status(400).json({ error: 'Description must be 5–500 characters' });
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || lat < 51.0 || lat > 51.3 || lng < 71.2 || lng > 71.7) {
    return res.status(400).json({ error: 'The point must be inside Astana' });
  }
  const cat = await db.query('SELECT id FROM categories WHERE id = $1', [categoryId]);
  if (!cat.rows[0]) return res.status(400).json({ error: 'Choose a category' });

  const photoUrl = await savePhoto(req.file, req);
  const { rows } = await db.query(
    `INSERT INTO reports (user_id, category_id, description, lat, lng, photo_url)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
    [req.user.id, categoryId, description, lat, lng, photoUrl],
  );
  const created = await db.query(`${REPORT_SELECT} WHERE r.id = $2`, [req.user.id, rows[0].id]);
  res.status(201).json(created.rows[0]);
});

// R3: like / unlike. One like per user (primary key), not on your own report
async function voteState(userId, reportId) {
  const { rows } = await db.query(
    `SELECT (SELECT COUNT(*) FROM votes WHERE report_id = $2) AS vote_count,
            EXISTS (SELECT 1 FROM votes WHERE report_id = $2 AND user_id = $1) AS voted_by_me`,
    [userId, reportId],
  );
  return rows[0];
}

router.post('/:id/vote', async (req, res) => {
  const id = parseId(req.params.id);
  const { rows } = await db.query('SELECT user_id FROM reports WHERE id = $1', [id || 0]);
  if (!rows[0]) return res.status(404).json({ error: 'Report not found' });
  if (rows[0].user_id === req.user.id) return res.status(400).json({ error: 'You cannot like your own report' });
  await db.query('INSERT INTO votes (user_id, report_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [req.user.id, id]);
  res.json(await voteState(req.user.id, id));
});

router.delete('/:id/vote', async (req, res) => {
  const id = parseId(req.params.id);
  if (!id) return res.status(404).json({ error: 'Report not found' });
  await db.query('DELETE FROM votes WHERE user_id = $1 AND report_id = $2', [req.user.id, id]);
  res.json(await voteState(req.user.id, id));
});

module.exports = router;
