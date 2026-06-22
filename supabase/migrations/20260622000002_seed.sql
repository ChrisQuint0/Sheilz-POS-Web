-- Seed Product Categories
INSERT INTO public.product_categories (name) VALUES
    ('Coffee'), ('Non-Coffee'), ('Sparkling Drinks'), ('Tea'), ('Pastries'), ('Limited Time')
ON CONFLICT (name) DO NOTHING;

-- Seed Sizes
INSERT INTO public.sizes (name, sort_order) VALUES
    ('12oz', 1), ('16oz', 2), ('22oz', 3)
ON CONFLICT (name) DO NOTHING;

-- Seed Temperatures
INSERT INTO public.temperatures (name, sort_order) VALUES
    ('Hot', 1), ('Cold', 2), ('Blended', 3)
ON CONFLICT (name) DO NOTHING;

-- Seed Payment Methods
INSERT INTO public.payment_methods (name, is_enabled) VALUES
    ('Cash', true), ('GCash', true), ('Maya', true), ('Credit Card', true)
ON CONFLICT (name) DO NOTHING;

-- Seed Inventory Categories
INSERT INTO public.inventory_categories (name) VALUES
    ('Coffee'), ('Dairy'), ('Syrups'), ('Powders'), ('Fruits'), ('Miscellaneous')
ON CONFLICT (name) DO NOTHING;
