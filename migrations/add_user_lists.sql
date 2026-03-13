-- migrations/add_public_lists.sql

-- 1. Create user_lists table
CREATE TABLE IF NOT EXISTS user_lists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL CHECK (char_length(title) <= 100),
    description TEXT CHECK (char_length(description) <= 500),
    icon TEXT DEFAULT '📋',
    is_public BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Create user_list_items table (linking lists to matches)
CREATE TABLE IF NOT EXISTS user_list_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    list_id UUID REFERENCES user_lists(id) ON DELETE CASCADE NOT NULL,
    match_id INTEGER NOT NULL, -- External ID
    match_data JSONB, -- Cache match details (teams, scores, etc)
    note TEXT CHECK (char_length(note) <= 200),
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(list_id, match_id)
);

-- 3. RLS Policies
ALTER TABLE user_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_list_items ENABLE ROW LEVEL SECURITY;

-- Lists Polices
CREATE POLICY "Anyone can view public lists" ON user_lists
    FOR SELECT USING (is_public = true OR auth.uid() = user_id);

CREATE POLICY "Users can manage their lists" ON user_lists
    FOR ALL USING (auth.uid() = user_id);

-- Items Policies
CREATE POLICY "Anyone can view items of public lists" ON user_list_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_lists 
            WHERE user_lists.id = list_id 
            AND (user_lists.is_public = true OR user_lists.user_id = auth.uid())
        )
    );

CREATE POLICY "Users can manage items of their lists" ON user_list_items
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_lists 
            WHERE user_lists.id = list_id 
            AND user_lists.user_id = auth.uid()
        )
    );

-- 4. Sample lists (optional)
-- These will be created via UI by users.
