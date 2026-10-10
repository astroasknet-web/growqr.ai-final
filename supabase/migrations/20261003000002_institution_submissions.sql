-- Students can add a college that is missing from the directory. It stays 'pending' (visible only to admins and to
-- the student who typed it) until 3 different people submit it or an admin approves it. Idempotent.

ALTER TABLE institutions ADD COLUMN IF NOT EXISTS status       varchar(10) NOT NULL DEFAULT 'approved';  -- approved | pending | rejected
ALTER TABLE institutions ADD COLUMN IF NOT EXISTS submit_count integer     NOT NULL DEFAULT 0;
ALTER TABLE institutions ADD COLUMN IF NOT EXISTS reviewed_by  integer     NULL;
ALTER TABLE institutions ADD COLUMN IF NOT EXISTS reviewed_at  timestamp    NULL;

CREATE INDEX IF NOT EXISTS institutions_status_idx ON institutions (status);

-- One row per (college, submitter). submitter = 'u<user id>' for a signed-in user, 'i<hash of IP>' for someone still signing up.
CREATE TABLE IF NOT EXISTS institution_submissions (
  id             bigserial PRIMARY KEY,
  institution_id bigint       NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
  submitter      varchar(80)  NOT NULL,
  typed_name     varchar(255) NOT NULL,
  created_at     timestamp    NOT NULL DEFAULT LOCALTIMESTAMP(0),
  CONSTRAINT institution_submissions_uq UNIQUE (institution_id, submitter)
);
CREATE INDEX IF NOT EXISTS institution_submissions_who_idx ON institution_submissions (submitter, created_at);

ALTER TABLE institution_submissions ENABLE ROW LEVEL SECURITY;
