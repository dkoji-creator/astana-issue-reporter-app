-- Astana Issue Reporter: PostgreSQL schema
-- Run with: npm run db:reset  (drops and recreates everything, then seeds test data)
-- Moderation tables are in moderation.sql

DROP TABLE IF EXISTS report_flags, user_blocks, notifications, status_log, votes, reports, categories, users CASCADE;

CREATE TABLE users (
  id            SERIAL PRIMARY KEY,
  email         VARCHAR(120) NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,                       -- PBKDF2-SHA256, never plain text (R11)
  display_name  VARCHAR(60) NOT NULL,
  role          VARCHAR(10) NOT NULL DEFAULT 'resident' CHECK (role IN ('resident', 'admin')),
  push_token    TEXT,                                 -- Expo push token for R8, optional
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE categories (
  id   SERIAL PRIMARY KEY,
  name VARCHAR(40) NOT NULL UNIQUE
);

CREATE TABLE reports (
  id          SERIAL PRIMARY KEY,
  user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category_id INTEGER NOT NULL REFERENCES categories(id),
  description TEXT NOT NULL CHECK (char_length(description) BETWEEN 5 AND 500),
  lat         DOUBLE PRECISION NOT NULL CHECK (lat BETWEEN 51.0 AND 51.3),   -- Astana bounds
  lng         DOUBLE PRECISION NOT NULL CHECK (lng BETWEEN 71.2 AND 71.7),
  photo_url   TEXT,
  status      VARCHAR(15) NOT NULL DEFAULT 'under_review'
                CHECK (status IN ('under_review', 'in_progress', 'resolved')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE votes (
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  report_id  INTEGER NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, report_id)                    -- one like per user per report (R3)
);

CREATE TABLE status_log (
  id         SERIAL PRIMARY KEY,
  report_id  INTEGER NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
  changed_by INTEGER NOT NULL REFERENCES users(id),
  old_status VARCHAR(15),
  new_status VARCHAR(15) NOT NULL,
  changed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE notifications (
  id         SERIAL PRIMARY KEY,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  report_id  INTEGER REFERENCES reports(id) ON DELETE CASCADE,
  message    TEXT NOT NULL,
  new_status VARCHAR(15),                             -- lets the app show the text in the user's language
  is_read    BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_reports_status   ON reports(status);
CREATE INDEX idx_reports_category ON reports(category_id);
CREATE INDEX idx_reports_user     ON reports(user_id);
CREATE INDEX idx_votes_report     ON votes(report_id);
CREATE INDEX idx_status_log_report ON status_log(report_id);
CREATE INDEX idx_notifications_user ON notifications(user_id, is_read);
