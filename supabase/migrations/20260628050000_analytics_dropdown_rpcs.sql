-- Analytics Dropdown RPCs
-- Ensures all historical payment methods and categories appear in the analytics filters.

------------------------------------------------------------
-- 1. get_analytics_payment_methods
------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_analytics_payment_methods()
RETURNS TABLE(method_name TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
    SELECT DISTINCT payment_method::TEXT AS method_name
    FROM public.orders
    WHERE payment_method IS NOT NULL
    ORDER BY method_name;
END;
$$;
