-- Fix get_void_analysis to always return a row even when there are 0 voids

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
       'total_voids', COALESCE(v.consumed_voids, 0),
       'revenue_lost', COALESCE(v.consumed_loss, 0),
       'void_rate', CASE WHEN COALESCE(t.total_orders, 0) > 0 THEN ROUND(COALESCE(v.consumed_voids, 0)::NUMERIC / t.total_orders * 100, 1) ELSE 0 END
    ),
    'not_made', json_build_object(
       'total_voids', COALESCE(v.not_made_voids, 0),
       'revenue_lost', COALESCE(v.not_made_loss, 0),
       'void_rate', CASE WHEN COALESCE(t.total_orders, 0) > 0 THEN ROUND(COALESCE(v.not_made_voids, 0)::NUMERIC / t.total_orders * 100, 1) ELSE 0 END
    ),
    'all', json_build_object(
       'total_voids', COALESCE(v.all_voids, 0),
       'revenue_lost', COALESCE(v.all_loss, 0),
       'void_rate', CASE WHEN COALESCE(t.total_orders, 0) > 0 THEN ROUND(COALESCE(v.all_voids, 0)::NUMERIC / t.total_orders * 100, 1) ELSE 0 END
    ),
    'total_orders', COALESCE(t.total_orders, 0)
  ) INTO v_result
  FROM (
    SELECT 
      COUNT(DISTINCT CASE WHEN o.status = 'Void (Consumed)' THEN o.id END) AS consumed_voids,
      SUM(CASE WHEN o.status = 'Void (Consumed)' THEN oi.subtotal ELSE 0 END) AS consumed_loss,
      
      COUNT(DISTINCT CASE WHEN o.status = 'Void (Not Made)' THEN o.id END) AS not_made_voids,
      SUM(CASE WHEN o.status = 'Void (Not Made)' THEN oi.subtotal ELSE 0 END) AS not_made_loss,
      
      COUNT(DISTINCT CASE WHEN o.status IN ('Void (Not Made)', 'Void (Consumed)') THEN o.id END) AS all_voids,
      SUM(CASE WHEN o.status IN ('Void (Not Made)', 'Void (Consumed)') THEN oi.subtotal ELSE 0 END) AS all_loss
      
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
  ) v
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
