-- Fix column type: SMALLINT → INTEGER to match Java Integer mapping
ALTER TABLE user_profiles
    ALTER COLUMN graduation_year TYPE INTEGER;
