// Saves an uploaded photo and returns its public URL.
// With SUPABASE_URL set, photos go to Supabase Storage (cloud); otherwise to the local ./uploads folder.
const crypto = require('crypto');
const fs = require('fs/promises');
const path = require('path');
const config = require('./config');

const UPLOAD_DIR = path.join(__dirname, '..', 'uploads');
const EXT = { 'image/jpeg': 'jpg', 'image/png': 'png' };

async function savePhoto(file, req) {
  const name = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}.${EXT[file.mimetype]}`;

  if (config.supabaseUrl && config.supabaseKey) {
    const url = `${config.supabaseUrl}/storage/v1/object/${config.supabaseBucket}/${name}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.supabaseKey}`,
        'Content-Type': file.mimetype,
      },
      body: file.buffer,
    });
    if (!res.ok) throw new Error(`Photo upload failed: ${res.status} ${await res.text()}`);
    return `${config.supabaseUrl}/storage/v1/object/public/${config.supabaseBucket}/${name}`;
  }

  await fs.mkdir(UPLOAD_DIR, { recursive: true });
  await fs.writeFile(path.join(UPLOAD_DIR, name), file.buffer);
  const base = config.publicUrl || `${req.protocol}://${req.get('host')}`;
  return `${base}/uploads/${name}`;
}

// Checks the real file signature, not only the declared type
function looksLikeImage(file) {
  const b = file.buffer;
  if (file.mimetype === 'image/jpeg') return b.length > 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff;
  if (file.mimetype === 'image/png') return b.length > 8 && b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  return false;
}

module.exports = { savePhoto, looksLikeImage, EXT };
