CREATE TABLE public.user_lineups (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  formation TEXT NOT NULL DEFAULT '4-3-3',
  players JSONB NOT NULL DEFAULT '[]',
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS
ALTER TABLE public.user_lineups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view any lineup" ON public.user_lineups FOR SELECT USING (true);
CREATE POLICY "Users can modify their own lineup" ON public.user_lineups FOR ALL USING (auth.uid() = user_id);
