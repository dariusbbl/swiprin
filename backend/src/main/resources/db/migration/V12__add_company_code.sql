ALTER TABLE companies ADD COLUMN IF NOT EXISTS company_code VARCHAR(6) UNIQUE;

-- Assign a temporary sequential code to existing companies so the NOT NULL constraint can be added later
UPDATE companies SET company_code = LPAD((100000 + id)::TEXT, 6, '0') WHERE company_code IS NULL;

ALTER TABLE companies ALTER COLUMN company_code SET NOT NULL;
