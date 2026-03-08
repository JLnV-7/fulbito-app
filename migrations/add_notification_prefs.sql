-- Migration: add_notification_prefs
-- Description: Add notification_prefs column to profiles table

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS notification_prefs JSONB DEFAULT '{"partidoInicio": true, "golFavorito": true, "resultadoProde": true, "nuevosSeguidores": true, "insignias": true}'::jsonb;
