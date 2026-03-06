-- Migration: add_user_notifications
-- Description: Create table for OneSignal / FCM device tokens

CREATE TABLE IF NOT EXISTS public.user_notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    device_token TEXT NOT NULL,
    enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, device_token)
);

-- Enable RLS
ALTER TABLE public.user_notifications ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view own notification settings" 
ON public.user_notifications 
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own notification settings" 
ON public.user_notifications 
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own notification settings" 
ON public.user_notifications 
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own notification settings" 
ON public.user_notifications 
FOR DELETE USING (auth.uid() = user_id);
