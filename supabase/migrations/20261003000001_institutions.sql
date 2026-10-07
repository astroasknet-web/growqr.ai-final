-- Directory of Indian colleges and universities (AICTE register + Hipolabs university list).
-- Loaded by qrscore/tools/import-institutions.php; read by the app for college pickers.
-- Idempotent: safe to run more than once.

CREATE TABLE IF NOT EXISTS institutions (
  id           bigserial PRIMARY KEY,
  source       varchar(20)  NOT NULL,            -- 'aicte' | 'hipolabs' (| 'aishe' later)
  source_id    varchar(120) NOT NULL,            -- AICTE id, or slug for sources without ids
  name         varchar(255) NOT NULL,
  name_norm    varchar(255) NOT NULL,            -- lower-case, punctuation stripped, for search and de-duplication
  kind         varchar(20)  NOT NULL DEFAULT 'college',   -- 'college' | 'university'
  inst_type    varchar(60),                      -- Government, Private-Self Financing, Deemed to be University(Pvt) ...
  state        varchar(80),
  district     varchar(120),
  address      varchar(500),
  website      varchar(300),
  domain       varchar(150),
  is_women     boolean NOT NULL DEFAULT false,
  is_minority  boolean NOT NULL DEFAULT false,
  created_at   timestamp NOT NULL DEFAULT LOCALTIMESTAMP(0),
  updated_at   timestamp NOT NULL DEFAULT LOCALTIMESTAMP(0),
  CONSTRAINT institutions_source_key UNIQUE (source, source_id)
);

CREATE INDEX IF NOT EXISTS institutions_name_norm_idx ON institutions (name_norm text_pattern_ops);
CREATE INDEX IF NOT EXISTS institutions_state_idx     ON institutions (state);
CREATE INDEX IF NOT EXISTS institutions_kind_idx      ON institutions (kind);

-- Same posture as every other table: the browser never talks to the database directly.
ALTER TABLE institutions ENABLE ROW LEVEL SECURITY;
