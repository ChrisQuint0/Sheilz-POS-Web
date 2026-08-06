-- Add image_url to payment_methods table
ALTER TABLE public.payment_methods
ADD COLUMN IF NOT EXISTS image_url TEXT;
