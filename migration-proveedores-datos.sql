-- ============================================================
--  PROVEEDORES — datos extra (lugar de compra, contacto, pagos...)
--  Correr UNA vez en: Supabase Dashboard > SQL Editor
--  (solo agrega columnas, no borra nada)
-- ============================================================

ALTER TABLE proveedores ADD COLUMN IF NOT EXISTS tipo           TEXT;     -- Tienda, Mayorista, Importador, Online...
ALTER TABLE proveedores ADD COLUMN IF NOT EXISTS contacto       TEXT;     -- Persona con la que tratas
ALTER TABLE proveedores ADD COLUMN IF NOT EXISTS direccion      TEXT;     -- Lugar de compra
ALTER TABLE proveedores ADD COLUMN IF NOT EXISTS ciudad         TEXT;
ALTER TABLE proveedores ADD COLUMN IF NOT EXISTS maps_url       TEXT;     -- Enlace de Google Maps
ALTER TABLE proveedores ADD COLUMN IF NOT EXISTS horario        TEXT;     -- Horario de atención
ALTER TABLE proveedores ADD COLUMN IF NOT EXISTS web            TEXT;     -- Página, Facebook, TikTok...
ALTER TABLE proveedores ADD COLUMN IF NOT EXISTS metodos_pago   TEXT;     -- Separados por coma
ALTER TABLE proveedores ADD COLUMN IF NOT EXISTS tiempo_entrega TEXT;     -- Ej: "Inmediato", "3-5 días"
ALTER TABLE proveedores ADD COLUMN IF NOT EXISTS compra_minima  TEXT;     -- Ej: "Docena", "Bs. 500"
ALTER TABLE proveedores ADD COLUMN IF NOT EXISTS hace_envios    BOOLEAN DEFAULT false;
ALTER TABLE proveedores ADD COLUMN IF NOT EXISTS calificacion   SMALLINT; -- 1 a 5
