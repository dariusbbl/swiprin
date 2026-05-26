ALTER TABLE cv_drafts ADD COLUMN IF NOT EXISTS extracted_text TEXT;
ALTER TABLE cv_drafts ADD COLUMN IF NOT EXISTS experience_years FLOAT;
