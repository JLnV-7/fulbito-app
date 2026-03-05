-- ============================================
-- USER LISTS - Creacion de listas tipo Letterboxd
-- ============================================

CREATE TABLE IF NOT EXISTS user_lists (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  is_public BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS user_list_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  list_id UUID REFERENCES user_lists(id) ON DELETE CASCADE NOT NULL,
  partido_id TEXT NOT NULL,
  equipo_local TEXT NOT NULL,
  equipo_visitante TEXT NOT NULL,
  logo_local TEXT,
  logo_visitante TEXT,
  order_index INTEGER DEFAULT 0,
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_user_lists_user ON user_lists(user_id);
CREATE INDEX IF NOT EXISTS idx_user_lists_public ON user_lists(is_public);
CREATE INDEX IF NOT EXISTS idx_user_list_items_list ON user_list_items(list_id);

-- ============================================
-- RLS POLICIES
-- ============================================

ALTER TABLE user_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_list_items ENABLE ROW LEVEL SECURITY;

-- user_lists: ver públicos o propios
CREATE POLICY "user_lists_select" ON user_lists
  FOR SELECT USING (is_public = true OR user_id = auth.uid());

CREATE POLICY "user_lists_insert" ON user_lists
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "user_lists_update" ON user_lists
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "user_lists_delete" ON user_lists
  FOR DELETE USING (user_id = auth.uid());

-- user_list_items: acceso via list ownership
CREATE POLICY "list_items_select" ON user_list_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_lists
      WHERE user_lists.id = user_list_items.list_id
      AND (user_lists.is_public = true OR user_lists.user_id = auth.uid())
    )
  );

CREATE POLICY "list_items_insert" ON user_list_items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_lists
      WHERE user_lists.id = user_list_items.list_id
      AND user_lists.user_id = auth.uid()
    )
  );

CREATE POLICY "list_items_update" ON user_list_items
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM user_lists
      WHERE user_lists.id = user_list_items.list_id
      AND user_lists.user_id = auth.uid()
    )
  );

CREATE POLICY "list_items_delete" ON user_list_items
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM user_lists
      WHERE user_lists.id = user_list_items.list_id
      AND user_lists.user_id = auth.uid()
    )
  );
