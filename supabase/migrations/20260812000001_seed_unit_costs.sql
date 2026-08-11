-- Quick seed script to update existing ingredients with sample unit costs

UPDATE public.inventory_items SET unit_cost = 0.11 WHERE name = 'Condensed Milk';
UPDATE public.inventory_items SET unit_cost = 0.09 WHERE name = 'Whole Milk';
UPDATE public.inventory_items SET unit_cost = 2.50 WHERE name = '12oz Cold Cups';
UPDATE public.inventory_items SET unit_cost = 0.85 WHERE name = 'Coffee Beans';
UPDATE public.inventory_items SET unit_cost = 0.45 WHERE name = 'Vanilla Syrup';
UPDATE public.inventory_items SET unit_cost = 0.0005 WHERE name = 'Citric Acid Powder';
UPDATE public.inventory_items SET unit_cost = 0.45 WHERE name = 'Salted Caramel Syrup';
UPDATE public.inventory_items SET unit_cost = 1.10 WHERE name = 'Arabica';
UPDATE public.inventory_items SET unit_cost = 3.00 WHERE name = '16oz  Cold Cups'; 
UPDATE public.inventory_items SET unit_cost = 12.00 WHERE name = 'Tea';
UPDATE public.inventory_items SET unit_cost = 0.55 WHERE name = 'Robusta';
UPDATE public.inventory_items SET unit_cost = 0.40 WHERE name = 'Green Apple Syrup';
UPDATE public.inventory_items SET unit_cost = 0.60 WHERE name = 'Yuzu Syrup';
UPDATE public.inventory_items SET unit_cost = 2.50 WHERE name = 'Matcha Powder';
UPDATE public.inventory_items SET unit_cost = 0.80 WHERE name = 'Chocolate Powder';
UPDATE public.inventory_items SET unit_cost = 0.35 WHERE name = 'Strawberry Jam';
UPDATE public.inventory_items SET unit_cost = 0.40 WHERE name = 'Strawberry Syrup';
UPDATE public.inventory_items SET unit_cost = 4.50 WHERE name = 'Hot 16oz Cups';
