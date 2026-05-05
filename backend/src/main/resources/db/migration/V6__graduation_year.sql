-- Replace graduation_date (DATE) with graduation_year (SMALLINT)
ALTER TABLE user_profiles
    ADD COLUMN graduation_year SMALLINT;

UPDATE user_profiles
    SET graduation_year = EXTRACT(YEAR FROM graduation_date)::SMALLINT
    WHERE graduation_date IS NOT NULL;

ALTER TABLE user_profiles
    DROP COLUMN graduation_date;
