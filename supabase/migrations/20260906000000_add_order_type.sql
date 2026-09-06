ALTER TABLE public.order_items
ADD COLUMN IF NOT EXISTS uses_packaging BOOLEAN NOT NULL DEFAULT false;
