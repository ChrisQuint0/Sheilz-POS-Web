-- Alter unit_cost precision to handle very small fractional costs (e.g. mg)
ALTER TABLE public.inventory_items
  ALTER COLUMN unit_cost TYPE NUMERIC(10,4);

-- Re-apply the correct fractional cost for Citric Acid Powder
UPDATE public.inventory_items 
SET unit_cost = 0.0005 
WHERE name = 'Citric Acid Powder';
