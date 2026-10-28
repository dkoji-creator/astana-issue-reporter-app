// Route ids must be positive integers that fit PostgreSQL INTEGER; anything else is "not found"
function parseId(value) {
  if (!/^\d{1,10}$/.test(String(value))) return null;
  const n = Number(value);
  return n >= 1 && n <= 2147483647 ? n : null;
}

module.exports = { parseId };
