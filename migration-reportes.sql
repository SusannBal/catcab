-- ============================================================
--  CONTÁCTANOS — tabla para quejas, errores y sugerencias
--  Correr UNA vez en: Supabase Dashboard > SQL Editor
--  (solo crea una tabla nueva, no toca tus datos)
-- ============================================================

CREATE TABLE IF NOT EXISTS reportes (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tipo        TEXT NOT NULL,                 -- Queja, Error, Sugerencia, Pregunta, Otro
  seccion     TEXT,                          -- Pestaña donde ocurrió
  asunto      TEXT NOT NULL,
  mensaje     TEXT NOT NULL,
  nombre      TEXT,
  contacto    TEXT,
  estado      TEXT NOT NULL DEFAULT 'pendiente', -- pendiente | resuelto
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE reportes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "reportes_public" ON reportes FOR ALL USING (true) WITH CHECK (true);
