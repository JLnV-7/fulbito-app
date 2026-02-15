-- Add fixture_id column to partidos table
ALTER TABLE partidos 
ADD COLUMN IF NOT EXISTS fixture_id INTEGER;

-- Create index for fast lookups
CREATE INDEX IF NOT EXISTS idx_partidos_fixture_id ON partidos(fixture_id);

-- Optional: Add unique constraint if we want to ensure 1-1 mapping
-- ALTER TABLE partidos ADD CONSTRAINT unique_fixture_id UNIQUE (fixture_id);
