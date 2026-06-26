-- 1. Create the new product_variants table
CREATE TABLE IF NOT EXISTS public.product_variants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    size_id UUID REFERENCES public.sizes(id) ON DELETE CASCADE,
    temperature_id UUID REFERENCES public.temperatures(id) ON DELETE CASCADE,
    price NUMERIC(10,2) NOT NULL DEFAULT 0,
    UNIQUE (product_id, size_id, temperature_id)
);

-- 2. Enable RLS and setup policies on the new table
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Read all for authenticated" ON public.product_variants 
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admin/Manager can manage" ON public.product_variants 
    FOR ALL TO authenticated USING (public.get_user_role() IN ('Administrator', 'Manager'));

-- 3. Delete the obsolete junction tables
DROP TABLE IF EXISTS public.product_temperatures CASCADE;
DROP TABLE IF EXISTS public.product_sizes CASCADE;
