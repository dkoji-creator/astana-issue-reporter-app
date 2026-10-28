require('dotenv').config({ quiet: true });

const config = {
  port: Number(process.env.PORT) || 4000,
  databaseUrl: process.env.DATABASE_URL || 'postgresql://app:app@localhost:5432/astana',
  // Cloud databases (Supabase, Neon, Render) need SSL; a local PostgreSQL does not
  databaseSsl: process.env.DATABASE_SSL === 'true',
  jwtSecret: process.env.JWT_SECRET || 'dev-only-secret-change-me',
  // Optional: Supabase Storage for photos. Without it photos are saved to ./uploads
  supabaseUrl: process.env.SUPABASE_URL || '',
  supabaseKey: process.env.SUPABASE_SERVICE_KEY || '',
  supabaseBucket: process.env.SUPABASE_BUCKET || 'report-photos',
  publicUrl: process.env.PUBLIC_URL || '',
  maxPhotoBytes: 2 * 1024 * 1024, // 2 MB, from the midterm risk table
};

if (process.env.NODE_ENV === 'production' && config.jwtSecret === 'dev-only-secret-change-me') {
  throw new Error('Set JWT_SECRET in production');
}

module.exports = config;
