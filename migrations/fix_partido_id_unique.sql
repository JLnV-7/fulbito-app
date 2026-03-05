-- Ensure fixture_id is unique for upsert support
-- This enables the scraper to sync partidos into Supabase using fixture_id as conflict key
ALTER TABLE partidos ADD CONSTRAINT unique_fixture_id UNIQUE (fixture_id);
