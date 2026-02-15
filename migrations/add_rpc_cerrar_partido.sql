-- Function to close a match and update player stats
-- This function is called from the frontend when an admin closes a match

CREATE OR REPLACE FUNCTION cerrar_partido_mundial(
    p_partido_id UUID,
    p_resultado_azul INTEGER,
    p_resultado_rojo INTEGER
)
RETURNS VOID AS $$
BEGIN
    -- 1. Update match status and final score
    UPDATE partidos_amigos
    SET 
        estado = 'finalizado',
        resultado_azul = p_resultado_azul,
        resultado_rojo = p_resultado_rojo,
        updated_at = NOW()
    WHERE id = p_partido_id;

    -- 2. (Optional) Here we could trigger other logic
    -- The frontend already updates individual player stats (goles/asistencias) 
    -- via a separate direct update before calling this RPC.
    
    -- Future: Calculate streaks or rankings here if needed.

END;
$$ LANGUAGE plpgsql;
