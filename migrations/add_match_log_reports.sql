-- Migration: Add match log reports for moderation

-- Helper function for updated_at (if not exists)
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create reports table
CREATE TABLE IF NOT EXISTS public.match_log_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    match_log_id UUID NOT NULL REFERENCES public.match_logs(id) ON DELETE CASCADE,
    reporter_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    reason TEXT NOT NULL,
    details TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'dismissed', 'deleted_content')),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.match_log_reports ENABLE ROW LEVEL SECURITY;

-- Policies
-- First drop existing if they exist to avoid errors on re-run
DROP POLICY IF EXISTS "Users can report match logs" ON public.match_log_reports;
DROP POLICY IF EXISTS "Only admins can view reports" ON public.match_log_reports;

CREATE POLICY "Users can report match logs" ON public.match_log_reports
    FOR INSERT WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "Only admins can view reports" ON public.match_log_reports
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND (username = 'admin' OR username = 'julia')
        )
    );

-- Trigger for updated_at
DROP TRIGGER IF EXISTS update_match_log_reports_updated_at ON public.match_log_reports;
CREATE TRIGGER update_match_log_reports_updated_at
BEFORE UPDATE ON public.match_log_reports
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
