-- ============================================================
-- V4 - Replace boolean remote with work_mode enum column
-- ============================================================

ALTER TABLE jobs ADD COLUMN work_mode VARCHAR(50) NOT NULL DEFAULT 'ON_SITE';

-- Migrate existing data: remote=true → REMOTE, remote=false → ON_SITE
UPDATE jobs SET work_mode = CASE WHEN remote = TRUE THEN 'REMOTE' ELSE 'ON_SITE' END;

ALTER TABLE jobs DROP COLUMN remote;
