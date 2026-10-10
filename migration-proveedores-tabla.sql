-- ============================================================
--  PROVEEDORES — tabla para guardar los proveedores
--  Correr UNA vez en: Supabase Dashboard > SQL Editor
-- ============================================================

CREATE TABLE IF NOT EXISTS proveedores (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre      TEXT NOT NULL UNIQUE,
  telefono    TEXT,
  notas       TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE proveedores ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "proveedores_public" ON proveedores;
CREATE POLICY "proveedores_public" ON proveedores FOR ALL USING (true) WITH CHECK (true);

-- Pasa a la tabla los proveedores que ya se usaron en entradas
INSERT INTO proveedores (nombre)
SELECT DISTINCT TRIM(proveedor) FROM entradas
WHERE proveedor IS NOT NULL AND TRIM(proveedor) <> ''
ON CONFLICT (nombre) DO NOTHING;
