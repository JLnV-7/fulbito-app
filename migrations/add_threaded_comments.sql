-- Migration: Add threaded comments and likes
-- compatible with existing comentarios table

-- Add parent_id for threading
ALTER TABLE public.comentarios ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES public.comentarios(id) ON DELETE CASCADE;

-- Create comentario_likes table
CREATE TABLE IF NOT EXISTS public.comentario_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comentario_id UUID NOT NULL REFERENCES public.comentarios(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(comentario_id, user_id)
);

-- Enable RLS
ALTER TABLE public.comentario_likes ENABLE ROW LEVEL SECURITY;

-- Policies for likes
CREATE POLICY "Anyone can read likes" ON public.comentario_likes FOR SELECT USING (true);
CREATE POLICY "Auth users can toggle likes" ON public.comentario_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can remove their likes" ON public.comentario_likes FOR DELETE USING (auth.uid() = user_id);

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_comentarios_parent ON public.comentarios(parent_id);
CREATE INDEX IF NOT EXISTS idx_comentario_likes_id ON public.comentario_likes(comentario_id);
