const jwt = require('jsonwebtoken');
const config = require('./config');
const db = require('./db');

function signToken(user) {
  return jwt.sign({ sub: user.id }, config.jwtSecret, { expiresIn: '30d' });
}

// Loads the user from the Bearer token; the role is read from the database, not trusted from the token
async function requireAuth(req, res, next) {
  const header = req.get('Authorization') || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Please log in' });
  let payload;
  try {
    payload = jwt.verify(token, config.jwtSecret);
  } catch {
    return res.status(401).json({ error: 'Session expired, please log in again' });
  }
  const { rows } = await db.query(
    'SELECT id, email, display_name, role FROM users WHERE id = $1',
    [payload.sub],
  );
  if (!rows[0]) return res.status(401).json({ error: 'Account not found' });
  req.user = rows[0];
  next();
}

function requireAdmin(req, res, next) {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admins only' });
  next();
}

module.exports = { signToken, requireAuth, requireAdmin };
