-- ============================================================
-- V5 - Support tickets (feedback / help desk)
-- ============================================================

CREATE TABLE support_tickets (
    id               BIGSERIAL PRIMARY KEY,
    user_id          BIGINT       NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category         VARCHAR(50)  NOT NULL,   -- BUG_REPORT | FEATURE_REQUEST | ACCOUNT_ISSUE | OTHER
    priority         VARCHAR(50)  NOT NULL,   -- LOW | MEDIUM | HIGH
    message          TEXT         NOT NULL,
    contact_consent  BOOLEAN      NOT NULL DEFAULT FALSE,
    status           VARCHAR(50)  NOT NULL DEFAULT 'OPEN',  -- OPEN | IN_PROGRESS | RESOLVED
    resolved_by      BIGINT       REFERENCES users(id) ON DELETE SET NULL,
    resolved_at      TIMESTAMP,
    created_at       TIMESTAMP    NOT NULL DEFAULT NOW()
);
