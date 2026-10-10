-- Portal accounts in the Next.js app: server-side sessions.
-- The browser holds only a random token (cookie); this table stores its SHA-256, so a database leak cannot be replayed as a login.
-- Idempotent. Row level security on with NO policies: reachable only through the server's database connection.

CREATE TABLE IF NOT EXISTS portal_sessions (
  id           char(64)    PRIMARY KEY,                       -- sha256(token), hex
  user_id      integer     NULL REFERENCES users(id) ON DELETE CASCADE,   -- null until the person is fully logged in
  csrf         char(32)    NOT NULL,
  data         jsonb       NOT NULL DEFAULT '{}'::jsonb,      -- pending two-step login, setup secret, one-time notices
  ip_hash      char(16)    NOT NULL DEFAULT '',
  created_at   timestamp   NOT NULL DEFAULT LOCALTIMESTAMP(0),
  last_seen_at timestamp   NOT NULL DEFAULT LOCALTIMESTAMP(0),
  expires_at   timestamp   NOT NULL
);
CREATE INDEX IF NOT EXISTS portal_sessions_user_idx ON portal_sessions (user_id);
CREATE INDEX IF NOT EXISTS portal_sessions_expires_idx ON portal_sessions (expires_at);

ALTER TABLE portal_sessions ENABLE ROW LEVEL SECURITY;
