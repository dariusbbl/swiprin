-- ============================================================
-- V1 - Initial schema
-- ============================================================

CREATE TABLE companies (
    id          BIGSERIAL PRIMARY KEY,
    name        VARCHAR(255) NOT NULL,
    website     VARCHAR(512),
    description TEXT,
    logo_url    VARCHAR(512),
    is_verified BOOLEAN   NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE users (
    id           BIGSERIAL PRIMARY KEY,
    full_name    VARCHAR(255) NOT NULL,
    email        VARCHAR(255) NOT NULL UNIQUE,
    password     VARCHAR(255) NOT NULL,
    role         VARCHAR(50)  NOT NULL,  -- CANDIDATE | RECRUITER | ADMIN
    phone_number VARCHAR(50),
    job_title    VARCHAR(255),
    business_email VARCHAR(255),
    company_id   BIGINT REFERENCES companies(id) ON DELETE SET NULL,
    created_at   TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE skills (
    id   BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE user_skills (
    user_id  BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    skill_id BIGINT NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, skill_id)
);

CREATE TABLE jobs (
    id                  BIGSERIAL PRIMARY KEY,
    title               VARCHAR(255) NOT NULL,
    description         TEXT         NOT NULL,
    location            VARCHAR(255),
    remote              BOOLEAN      NOT NULL DEFAULT FALSE,
    shortlist_threshold INT          NOT NULL DEFAULT 70,
    company_id          BIGINT       NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    recruiter_id        BIGINT       NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    active              BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at          TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE TABLE job_skills (
    job_id   BIGINT NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    skill_id BIGINT NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
    is_hard  BOOLEAN NOT NULL DEFAULT TRUE,
    PRIMARY KEY (job_id, skill_id)
);

CREATE TABLE cv_drafts (
    id         BIGSERIAL PRIMARY KEY,
    user_id    BIGINT       NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name       VARCHAR(255) NOT NULL,
    file_url   VARCHAR(512),
    is_default BOOLEAN      NOT NULL DEFAULT FALSE,
    deleted    BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP    NOT NULL DEFAULT NOW()
);

-- Ensures at most one default CV per user at the DB level
CREATE UNIQUE INDEX cv_drafts_one_default_per_user
    ON cv_drafts(user_id) WHERE is_default = TRUE;

CREATE TABLE applications (
    id           BIGSERIAL PRIMARY KEY,
    job_id       BIGINT    NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    user_id      BIGINT    NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    cv_draft_id  BIGINT    REFERENCES cv_drafts(id) ON DELETE SET NULL,
    status       VARCHAR(50) NOT NULL DEFAULT 'APPLIED',  -- APPLIED | SCREENING | INTERVIEW | OFFER | REJECTED
    match_percent INT,
    shortlisted  BOOLEAN   NOT NULL DEFAULT FALSE,
    applied_at   TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE (job_id, user_id)
);

CREATE TABLE interview_schedules (
    id             BIGSERIAL PRIMARY KEY,
    application_id BIGINT       NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
    title          VARCHAR(255) NOT NULL,
    scheduled_at   TIMESTAMP    NOT NULL,
    mode           VARCHAR(50)  NOT NULL DEFAULT 'ONLINE',  -- ONLINE | ONSITE
    location       VARCHAR(255),
    description    TEXT,
    created_at     TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE TABLE notifications (
    id         BIGSERIAL PRIMARY KEY,
    user_id    BIGINT       NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type         VARCHAR(50)  NOT NULL DEFAULT 'GENERAL',  -- SHORTLIST | STATUS_UPDATE | INTERVIEW_SCHEDULED | INTERVIEW_UPDATED | OFFER | GENERAL
    message      TEXT         NOT NULL,
    reference_id BIGINT,
    is_read    BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP    NOT NULL DEFAULT NOW()
);
