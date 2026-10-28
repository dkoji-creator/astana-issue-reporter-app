// Same format as the Assignment 3 Python prototype: pbkdf2_sha256$iterations$salt$hash
const crypto = require('crypto');

const ITERATIONS = 100000;

function hashPassword(password) {
  const salt = crypto.randomBytes(16);
  const digest = crypto.pbkdf2Sync(password, salt, ITERATIONS, 32, 'sha256');
  return `pbkdf2_sha256$${ITERATIONS}$${salt.toString('hex')}$${digest.toString('hex')}`;
}

function verifyPassword(password, stored) {
  const [algorithm, iterations, saltHex, hashHex] = String(stored).split('$');
  if (algorithm !== 'pbkdf2_sha256' || !hashHex) return false;
  const expected = Buffer.from(hashHex, 'hex');
  const digest = crypto.pbkdf2Sync(password, Buffer.from(saltHex, 'hex'), Number(iterations), expected.length, 'sha256');
  return crypto.timingSafeEqual(digest, expected);
}

module.exports = { hashPassword, verifyPassword };
