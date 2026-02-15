-- Fix: Cambiar partido_id de UUID a TEXT para soportar chat de grupo
-- El chat de grupo usa "grupo-{uuid}" como partido_id, que no es UUID válido

ALTER TABLE comentarios ALTER COLUMN partido_id TYPE TEXT;
