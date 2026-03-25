-- Add specialized Phase 3 badges
INSERT INTO badges (name, description, icon, condition, xp_reward) 
VALUES 
('Ojo de Halcón', 'Acertaste tu primer Pleno (resultado exacto) en el Prode.', '🎯', 'first_pleno', 500),
('Termo Certificado', 'Reseñaste 5 partidos de tu equipo del corazón.', '🧉', 'five_team_reviews', 300),
('Vidente de Viterbo', 'Desbloqueaste tu primer insight avanzado de IA.', '🧠', 'first_insight', 200),
('Charleta de Tribuna', 'Participaste en 10 hilos de conversación en el Match Chat.', '💬', 'ten_replies', 150)
ON CONFLICT (name) DO NOTHING;
