-- Create products table
CREATE TABLE public.products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  api_key UUID NOT NULL DEFAULT gen_random_uuid() UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all operations on products" ON public.products FOR ALL USING (true) WITH CHECK (true);

-- Migrate existing company api_keys into a default product per company
INSERT INTO public.products (company_id, name, api_key)
SELECT id, 'Produto Principal', api_key
FROM public.companies
WHERE api_key IS NOT NULL;

-- For companies without api_key, still create a default product
INSERT INTO public.products (company_id, name)
SELECT id, 'Produto Principal'
FROM public.companies
WHERE api_key IS NULL
  AND id NOT IN (SELECT company_id FROM public.products);

-- Add product_id to sprints
ALTER TABLE public.sprints
  ADD COLUMN product_id UUID REFERENCES public.products(id) ON DELETE SET NULL;

-- Add product_id to test_suites
ALTER TABLE public.test_suites
  ADD COLUMN product_id UUID REFERENCES public.products(id) ON DELETE SET NULL;

-- Add product_id to scenarios
ALTER TABLE public.scenarios
  ADD COLUMN product_id UUID REFERENCES public.products(id) ON DELETE SET NULL;

-- Update existing sprints to point to their company's default product
UPDATE public.sprints s
SET product_id = p.id
FROM public.products p
WHERE p.company_id = s.company_id;

-- Update existing test_suites to point to their company's default product
UPDATE public.test_suites ts
SET product_id = p.id
FROM public.products p
WHERE p.company_id = ts.company_id;

-- Update existing scenarios to point to their company's default product
UPDATE public.scenarios sc
SET product_id = p.id
FROM public.products p
WHERE p.company_id = sc.company_id;

-- Remove api_key from companies (now lives in products)
ALTER TABLE public.companies DROP COLUMN api_key;

-- Indexes
CREATE INDEX idx_products_company ON public.products(company_id);
CREATE INDEX idx_sprints_product ON public.sprints(product_id);
CREATE INDEX idx_test_suites_product ON public.test_suites(product_id);
CREATE INDEX idx_scenarios_product ON public.scenarios(product_id);
