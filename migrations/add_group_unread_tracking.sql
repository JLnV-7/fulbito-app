-- ============================================
-- UNREAD MESSAGES - Tracking para Grupos
-- ============================================

-- Agregar last_read_at a miembros_grupo para trackear el chat
ALTER TABLE miembros_grupo ADD COLUMN IF NOT EXISTS last_read_at TIMESTAMPTZ DEFAULT now();

-- Función para actualizar last_read_at vía RPC o trigger
CREATE OR REPLACE FUNCTION mark_group_chat_as_read(p_grupo_id UUID, p_user_id UUID)
RETURNS void AS $$
BEGIN
    UPDATE miembros_grupo 
    SET last_read_at = now() 
    WHERE grupo_id = p_grupo_id AND user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
