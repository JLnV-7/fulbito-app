-- Add tables for live chat polls
CREATE TABLE IF NOT EXISTS public.chat_polls (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    partido_id TEXT NOT NULL,
    created_by UUID REFERENCES auth.users(id),
    question TEXT NOT NULL,
    options JSONB NOT NULL, -- Array of strings
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.chat_poll_votes (
    poll_id UUID REFERENCES public.chat_polls(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    option_index INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    PRIMARY KEY (poll_id, user_id)
);

-- RLS Policies
ALTER TABLE public.chat_polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_poll_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can see polls" ON public.chat_polls FOR SELECT USING (true);
CREATE POLICY "Anyone can see votes" ON public.chat_poll_votes FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create polls" ON public.chat_polls FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Users can vote" ON public.chat_poll_votes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can change their vote" ON public.chat_poll_votes FOR UPDATE USING (auth.uid() = user_id);
