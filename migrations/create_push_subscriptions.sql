-- Migration: Create push_subscriptions table
-- Stores Web Push API subscriptions for users

CREATE TABLE IF NOT EXISTS push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, endpoint)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user ON push_subscriptions(user_id);

-- RLS
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Users can insert their own subscriptions
CREATE POLICY "Users can insert own subscription"
  ON push_subscriptions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can read their own subscriptions
CREATE POLICY "Users can read own subscription"
  ON push_subscriptions FOR SELECT
  USING (auth.uid() = user_id);

-- Users can delete their own subscriptions
CREATE POLICY "Users can delete own subscription"
  ON push_subscriptions FOR DELETE
  USING (auth.uid() = user_id);
