-- ============================================
--  CATÁLOGO — Supabase Setup (v3 - Con Entradas y Precio Histórico)
--  Correr en: Supabase Dashboard > SQL Editor
-- ============================================

-- 1. TABLA DE PRODUCTOS
CREATE TABLE IF NOT EXISTS productos (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name          TEXT NOT NULL,
  model         TEXT,
  category      TEXT NOT NULL DEFAULT 'Otro',
  specs         TEXT,
  price         NUMERIC(10,2) NOT NULL,
  buy_price     NUMERIC(10,2),
  initial_stock INTEGER DEFAULT 0,
  installments  TEXT,
  code          TEXT,
  image_url     TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- 2. TABLA DE VENTAS
CREATE TABLE IF NOT EXISTS ventas (
  id                UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id        UUID REFERENCES productos(id) ON DELETE CASCADE,
  seller            TEXT DEFAULT 'N',
  price_at_sale     NUMERIC(10,2),
  buy_price_at_sale NUMERIC(10,2), -- Precio de costo al momento de la venta (para ganancias históricas)
  sold_at           TIMESTAMPTZ DEFAULT NOW()
);

-- 3. TABLA DE ENTRADAS DE MERCADERÍA
CREATE TABLE IF NOT EXISTS entradas (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id    UUID REFERENCES productos(id) ON DELETE CASCADE,
  cantidad      INTEGER NOT NULL,
  buy_price     NUMERIC(10,2) NOT NULL, -- El costo de compra para este lote
  entered_at    TIMESTAMPTZ DEFAULT NOW()
);

-- 4. RLS — acceso público total (uso personal)
ALTER TABLE productos ENABLE ROW LEVEL SECURITY;
ALTER TABLE ventas    ENABLE ROW LEVEL SECURITY;
ALTER TABLE entradas  ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "productos_public" ON productos;
CREATE POLICY "productos_public" ON productos FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "ventas_public" ON ventas;
CREATE POLICY "ventas_public" ON ventas FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "entradas_public" ON entradas;
CREATE POLICY "entradas_public" ON entradas FOR ALL USING (true) WITH CHECK (true);

-- 5. STORAGE BUCKETS (productos y img_productos)
INSERT INTO storage.buckets (id, name, public)
VALUES ('productos', 'productos', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('img_productos', 'img_productos', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "storage_insert" ON storage.objects;
CREATE POLICY "storage_insert" ON storage.objects FOR INSERT WITH CHECK (bucket_id IN ('productos', 'img_productos'));

DROP POLICY IF EXISTS "storage_select" ON storage.objects;
CREATE POLICY "storage_select" ON storage.objects FOR SELECT USING (bucket_id IN ('productos', 'img_productos'));

DROP POLICY IF EXISTS "storage_delete" ON storage.objects;
CREATE POLICY "storage_delete" ON storage.objects FOR DELETE USING (bucket_id IN ('productos', 'img_productos'));

-- ============================================
-- LISTO
-- ============================================
