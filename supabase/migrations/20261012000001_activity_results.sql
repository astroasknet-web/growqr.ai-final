-- Interactive learning results: one row per student, course and activity (practice activities and module quizzes).
-- A row records what the student has actually DEMONSTRATED: attempts, best score and whether every check passed. The latest work
-- (document HTML, spreadsheet cells, slide deck, answers) is kept in state_json so the student can come back to it; it is only ever
-- written for a logged-in student and is deleted with the account. Idempotent, like every portal migration.
CREATE TABLE IF NOT EXISTS activity_results (
    user_id integer NOT NULL,
    course_slug varchar(120) NOT NULL,
    activity_id varchar(80) NOT NULL,          -- an activity id, or 'quiz:<module-slug>' for a module quiz
    attempts integer NOT NULL DEFAULT 0,
    best_score smallint NOT NULL DEFAULT 0,    -- percent of checks passed, best attempt
    passed boolean NOT NULL DEFAULT false,
    passed_at timestamp NULL,
    xp integer NOT NULL DEFAULT 0,
    state_json text NULL,
    updated_at timestamp NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, course_slug, activity_id),
    CONSTRAINT fk_actres_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS ix_actres_course ON activity_results (course_slug, activity_id);
ALTER TABLE activity_results ENABLE ROW LEVEL SECURITY;
