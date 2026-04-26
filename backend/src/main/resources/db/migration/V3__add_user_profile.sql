-- ============================================================
-- V3 - User profile (1:1 with users)
-- ============================================================

CREATE TABLE user_profiles (
    id               BIGSERIAL PRIMARY KEY,
    user_id          BIGINT       NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    bio              TEXT,
    current_location VARCHAR(255),
    education_level  VARCHAR(50),
    faculty          VARCHAR(255),
    graduation_date  DATE,
    linkedin_url     VARCHAR(512),
    github_url       VARCHAR(512),
    updated_at       TIMESTAMP    NOT NULL DEFAULT NOW()
);
