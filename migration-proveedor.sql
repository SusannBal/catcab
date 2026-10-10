-- ============================================================
--  PROVEEDOR — agrega la columna "proveedor" a entradas
--  Correr UNA vez en: Supabase Dashboard > SQL Editor
-- ============================================================

ALTER TABLE entradas ADD COLUMN IF NOT EXISTS proveedor TEXT;
