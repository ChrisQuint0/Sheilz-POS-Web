-- Drop the old 2-parameter overload of get_inventory_turnover.
-- The new 3-parameter version (with p_ingredient_id UUID DEFAULT NULL)
-- handles all cases since p_ingredient_id defaults to NULL.
DROP FUNCTION IF EXISTS public.get_inventory_turnover(TIMESTAMPTZ, TIMESTAMPTZ);
