-- Update get_void_analysis to return statistics for Consumed, Not Made, and All

CREATE OR REPLACE FUNCTION public.get_void_analysis(
  p_date_from TIMESTAMPTZ DEFAULT NULL,
  p_date_to   TIMESTAMPTZ DEFAULT NULL,
  p_category  TEXT DEFAULT 'all',
  p_payment_method TEXT DEFAULT 'all',
  p_cashier   TEXT DEFAULT 'all'
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result     JSON;
  v_date_from  TIMESTAMPTZ := COALESCE(p_date_from, '1970-01-01'::TIMESTAMPTZ);
  v_date_to    TIMESTAMPTZ := COALESCE(p_date_to,   now() + INTERVAL '1 day');
BEGIN
  SELECT json_build_object(
    'consumed', json_build_object(
       'total_voids', COALESCE(SUM(CASE WHEN o.status = 'Void (Consumed)' THEN 1 ELSE 0 END), 0),
       'revenue_lost', COALESCE(SUM(CASE WHEN o.status = 'Void (Consumed)' THEN o.subtotal ELSE 0 END), 0),
       'void_rate', CASE WHEN t.total_orders > 0 THEN ROUND((COALESCE(SUM(CASE WHEN o.status = 'Void (Consumed)' THEN 1 ELSE 0 END), 0)::NUMERIC / t.total_orders) * 100, 1) ELSE 0 END
    ),
    'not_made', json_build_object(
       'total_voids', COALESCE(SUM(CASE WHEN o.status = 'Void (Not Made)' THEN 1 ELSE 0 END), 0),
       'revenue_lost', COALESCE(SUM(CASE WHEN o.status = 'Void (Not Made)' THEN o.subtotal ELSE 0 END), 0),
       'void_rate', CASE WHEN t.total_orders > 0 THEN ROUND((COALESCE(SUM(CASE WHEN o.status = 'Void (Not Made)' THEN 1 ELSE 0 END), 0)::NUMERIC / t.total_orders) * 100, 1) ELSE 0 END
    ),
    'all', json_build_object(
       'total_voids', COALESCE(SUM(CASE WHEN o.status IN ('Void (Not Made)', 'Void (Consumed)') THEN 1 ELSE 0 END), 0),
       'revenue_lost', COALESCE(SUM(CASE WHEN o.status IN ('Void (Not Made)', 'Void (Consumed)') THEN o.subtotal ELSE 0 END), 0),
       'void_rate', CASE WHEN t.total_orders > 0 THEN ROUND((COALESCE(SUM(CASE WHEN o.status IN ('Void (Not Made)', 'Void (Consumed)') THEN 1 ELSE 0 END), 0)::NUMERIC / t.total_orders) * 100, 1) ELSE 0 END
    ),
    'total_orders', t.total_orders
  ) INTO v_result
  FROM (
    SELECT o.id, o.status, SUM(oi.subtotal) as subtotal
    FROM   public.orders o
    JOIN   public.order_items oi ON o.id = oi.order_id
    LEFT JOIN public.products p ON p.id = oi.product_id
    LEFT JOIN public.product_categories pc ON pc.id = p.category_id
    WHERE  o.status IN ('Void (Not Made)', 'Void (Consumed)')
      AND  o.created_at >= v_date_from
      AND  o.created_at <  v_date_to
      AND (p_payment_method = 'all' OR o.payment_method = p_payment_method)
      AND (p_cashier = 'all' OR o.cashier_name = p_cashier)
      AND (p_category = 'all' OR pc.name = p_category)
    GROUP BY o.id, o.status
  ) o
  CROSS JOIN (
    SELECT COUNT(DISTINCT o.id) AS total_orders
    FROM   public.orders o
    JOIN   public.order_items oi ON o.id = oi.order_id
    LEFT JOIN public.products p ON p.id = oi.product_id
    LEFT JOIN public.product_categories pc ON pc.id = p.category_id
    WHERE  o.created_at >= v_date_from
      AND  o.created_at <  v_date_to
      AND (p_payment_method = 'all' OR o.payment_method = p_payment_method)
      AND (p_cashier = 'all' OR o.cashier_name = p_cashier)
      AND (p_category = 'all' OR pc.name = p_category)
  ) t;

  RETURN v_result;
END;
$$;
