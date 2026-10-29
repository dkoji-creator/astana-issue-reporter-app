require('dotenv').config({ quiet: true });

// Keep only https://xxxx.supabase.co: the dashboard also shows the URL with /rest/v1/ at the end,
// and that path would send photo uploads to the database API instead of Storage
function supabaseOrigin(value) {
  if (!value || !value.trim()) return '';
  try {
    return new URL(value.trim()).origin;
  } catch {
    throw new Error('SUPABASE_URL must look like https://xxxx.supabase.co');
  }
}

const config = {
  port: Number(process.env.PORT) || 4000,
  databaseUrl: process.env.DATABASE_URL || 'postgresql://app:app@localhost:5432/astana',
  // Cloud databases (Supabase, Neon, Render) need SSL; a local PostgreSQL does not
  databaseSsl: process.env.DATABASE_SSL === 'true',
  jwtSecret: process.env.JWT_SECRET || 'dev-only-secret-change-me',
  // Optional: Supabase Storage for photos. Without it photos are saved to ./uploads
  supabaseUrl: supabaseOrigin(process.env.SUPABASE_URL),
  supabaseKey: (process.env.SUPABASE_SERVICE_KEY || '').trim(),
  supabaseBucket: (process.env.SUPABASE_BUCKET || 'report-photos').trim(),
  publicUrl: process.env.PUBLIC_URL || '',
  maxPhotoBytes: 2 * 1024 * 1024, // 2 MB, from the midterm risk table
};

if (process.env.NODE_ENV === 'production' && config.jwtSecret === 'dev-only-secret-change-me') {
  throw new Error('Set JWT_SECRET in production');
}

module.exports = config;
