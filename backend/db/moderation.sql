-- Moderation tables required by the app stores for user content (Apple 1.2, Google Play UGC policy).
-- Safe to run many times: the server runs it on every start, so an existing cloud database gets them too.

-- "Report content": a user flags someone else's report. 3 flags hide it until an admin decides
CREATE TABLE IF NOT EXISTS report_flags (
  report_id  INTEGER NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reason     VARCHAR(200),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (report_id, user_id)
);

-- "Block author": the blocker no longer sees reports of the blocked user
CREATE TABLE IF NOT EXISTS user_blocks (
  blocker_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  blocked_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (blocker_id, blocked_id)
);
