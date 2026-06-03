ALTER TABLE applications ADD COLUMN IF NOT EXISTS offer_text             TEXT;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS offer_salary           INTEGER;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS offer_salary_type      VARCHAR(5);
ALTER TABLE applications ADD COLUMN IF NOT EXISTS offer_employment_type  VARCHAR(20);
ALTER TABLE applications ADD COLUMN IF NOT EXISTS offer_deadline         DATE;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS offer_start_date       DATE;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS offer_accepted_at      TIMESTAMP;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS offer_declined_at      TIMESTAMP;
