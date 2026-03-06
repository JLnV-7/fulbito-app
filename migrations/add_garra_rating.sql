-- Add garra_rating to match_logs
ALTER TABLE public.match_logs ADD COLUMN IF NOT EXISTS rating_garra DECIMAL(3,1) CHECK (rating_garra >= 0.5 AND rating_garra <= 5.0);
