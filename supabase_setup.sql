-- 1. TABEL MATERIALS (8 MATERIAL UTAMA)
CREATE TABLE IF NOT EXISTS public.materials (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  unit TEXT NOT NULL,
  current_stock NUMERIC DEFAULT 0,
  min_stock NUMERIC DEFAULT 0,
  max_stock NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. TABEL MONTHLY_PLANS (PERENCANAAN BULANAN)
CREATE TABLE IF NOT EXISTS public.monthly_plans (
  period TEXT PRIMARY KEY,
  month_name TEXT NOT NULL,
  status TEXT DEFAULT 'Aktif',
  plan_type TEXT DEFAULT 'by_product',
  materials_plan JSONB DEFAULT '[]'::jsonb,
  products_plan JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. TABEL TRANSACTIONS (MUTASI STOK GUDANG)
CREATE TABLE IF NOT EXISTS public.transactions (
  id TEXT PRIMARY KEY,
  date TEXT NOT NULL,
  material_id TEXT NOT NULL,
  material_name TEXT NOT NULL,
  type TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  unit TEXT NOT NULL,
  previous_stock NUMERIC DEFAULT 0,
  current_stock NUMERIC DEFAULT 0,
  notes TEXT DEFAULT '-',
  operator TEXT DEFAULT 'Operator',
  for_product TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. INSERT DATA AWAL 8 MATERIAL UTAMA (JIKA BELUM ADA)
INSERT INTO public.materials (id, code, name, unit, current_stock, min_stock, max_stock)
VALUES
  ('mat-1', 'KP-150', 'Kapur mesh 150', 'Ton', 0, 20, 100),
  ('mat-2', 'KP-200', 'Kapur mesh 200', 'Ton', 0, 20, 100),
  ('mat-3', 'AD-NXC', 'Additive nexco', 'Kg', 0, 50, 250),
  ('mat-4', 'AD-WLM', 'Additive wellmocell', 'Kg', 0, 40, 200),
  ('mat-5', 'PS-SLK', 'Pasir silika', 'Kg', 0, 5000, 50000),
  ('mat-6', 'SM-PCC', 'Semen pcc', 'Ton', 0, 25, 120),
  ('mat-7', 'KB-WVN', 'Woven', 'Pcs', 0, 1500, 10000),
  ('mat-8', 'KB-PPR', 'Paper', 'Pcs', 0, 1200, 8000)
ON CONFLICT (id) DO NOTHING;

-- 5. AKTIFKAN POLICY AKSES PENUH (ENABLE RLS DENGAN IZIN BACA/TULIS)
ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monthly_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all on materials" ON public.materials FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on monthly_plans" ON public.monthly_plans FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on transactions" ON public.transactions FOR ALL USING (true) WITH CHECK (true);
