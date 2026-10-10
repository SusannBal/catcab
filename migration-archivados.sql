-- ============================================================
--  ARCHIVADOS — agrega la columna "archived" a productos
--  Correr UNA vez en: Supabase Dashboard > SQL Editor
-- ============================================================

-- 1. Nueva columna (por defecto, todos activos)
ALTER TABLE productos ADD COLUMN IF NOT EXISTS archived BOOLEAN NOT NULL DEFAULT false;

-- 2. Archivar los productos que hoy ya están agotados
--    stock = stock inicial + entradas - ventas
UPDATE productos p
SET archived = true
WHERE COALESCE(p.initial_stock, 0)
    + COALESCE((SELECT SUM(e.cantidad) FROM entradas e WHERE e.product_id = p.id), 0)
    - (SELECT COUNT(*) FROM ventas v WHERE v.product_id = p.id)
    <= 0;
