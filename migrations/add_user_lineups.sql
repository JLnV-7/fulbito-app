-- Create table for user-built lineups (Dream Teams)
CREATE TABLE IF NOT EXISTS public.user_lineups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL DEFAULT 'Mi XI Ideal',
    tactic TEXT NOT NULL DEFAULT '4-3-3',
    players JSONB NOT NULL, -- Format: { "1": "Dibu Martínez", "2": "Molina", ... }
    is_public BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS Policies
ALTER TABLE public.user_lineups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can see public lineups" ON public.user_lineups FOR SELECT USING (is_public = true);
CREATE POLICY "Users can see their own private lineups" ON public.user_lineups FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own lineups" ON public.user_lineups FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can edit their own lineups" ON public.user_lineups FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own lineups" ON public.user_lineups FOR DELETE USING (auth.uid() = user_id);
