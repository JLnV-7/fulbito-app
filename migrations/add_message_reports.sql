-- Migration to create the 'message_reports' table
-- Execute this using the Supabase SQL editor or CLI

CREATE TABLE message_reports (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    reporter_id UUID REFERENCES public.profiles(id) NOT NULL,
    message_id UUID REFERENCES public.messages(id) NOT NULL,
    reason TEXT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    -- Ensure a user can't report the same message multiple times to spam
    UNIQUE(reporter_id, message_id)
);

-- Enable RLS
ALTER TABLE message_reports ENABLE ROW LEVEL SECURITY;

-- Policy: Only authenticated users can insert reports
CREATE POLICY "Authenticated users can create reports" 
ON message_reports FOR INSERT 
WITH CHECK (auth.role() = 'authenticated');

-- Policy: Users can only see the reports they created (Admin can bypass this via server roles if needed)
CREATE POLICY "Users can view their own reports" 
ON message_reports FOR SELECT 
USING (auth.uid() = reporter_id);
