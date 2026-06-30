-- Dashboard-specific RPC functions
-- These power the main Dashboard page with today-focused metrics.

------------------------------------------------------------
-- 1. get_dashboard_kpis
-- Returns today's revenue, orders, avg order value
-- alongside yesterday's for comparison percentages.
------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_dashboard_kpis()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result JSON;
  v_today_start TIMESTAMPTZ := date_trunc('day', now());
  v_today_end   TIMESTAMPTZ := v_today_start + INTERVAL '1 day';
  v_yest_start  TIMESTAMPTZ := v_today_start - INTERVAL '1 day';
  v_yest_end    TIMESTAMPTZ := v_today_start;
BEGIN
  SELECT json_build_object(
    'today_revenue',     COALESCE(t.total_revenue, 0),
    'today_orders',      COALESCE(t.total_orders, 0),
    'today_avg_order',   ROUND(COALESCE(t.avg_order_value, 0), 2),
    'yesterday_revenue', COALESCE(y.total_revenue, 0),
    'yesterday_orders',  COALESCE(y.total_orders, 0),
    'yesterday_avg_order', ROUND(COALESCE(y.avg_order_value, 0), 2),
    'revenue_change',    CASE WHEN COALESCE(y.total_revenue, 0) > 0
                              THEN ROUND(((COALESCE(t.total_revenue, 0) - y.total_revenue) / y.total_revenue * 100)::NUMERIC, 1)
                              ELSE 0 END,
    'orders_change',     CASE WHEN COALESCE(y.total_orders, 0) > 0
                              THEN ROUND(((COALESCE(t.total_orders, 0) - y.total_orders)::NUMERIC / y.total_orders * 100)::NUMERIC, 1)
                              ELSE 0 END,
    'aov_change',        CASE WHEN COALESCE(y.avg_order_value, 0) > 0
                              THEN ROUND(((COALESCE(t.avg_order_value, 0) - y.avg_order_value) / y.avg_order_value * 100)::NUMERIC, 1)
                              ELSE 0 END
  ) INTO v_result
  FROM (
    SELECT SUM(amount) AS total_revenue,
           COUNT(*)    AS total_orders,
           AVG(amount) AS avg_order_value
    FROM   public.orders
    WHERE  status = 'Completed'
      AND  created_at >= v_today_start
      AND  created_at <  v_today_end
  ) t
  CROSS JOIN (
    SELECT SUM(amount) AS total_revenue,
           COUNT(*)    AS total_orders,
           AVG(amount) AS avg_order_value
    FROM   public.orders
    WHERE  status = 'Completed'
      AND  created_at >= v_yest_start
      AND  created_at <  v_yest_end
  ) y;

  RETURN v_result;
END;
$$;

------------------------------------------------------------
-- 2. get_dashboard_revenue_trend
-- Returns daily revenue for the current ISO week (Mon–Sun).
-- Days with no orders return 0.
------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_dashboard_revenue_trend()
RETURNS TABLE(day_label TEXT, day_date DATE, total_revenue NUMERIC)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_week_start DATE := date_trunc('week', now())::DATE;  -- Monday
  v_week_end   DATE := v_week_start + 7;                 -- Next Monday
BEGIN
  RETURN QUERY
    SELECT TO_CHAR(d.day, 'Dy')     AS day_label,
           d.day                     AS day_date,
           COALESCE(SUM(o.amount), 0) AS total_revenue
    FROM   generate_series(v_week_start, v_week_end - 1, '1 day'::INTERVAL) AS d(day)
    LEFT JOIN public.orders o
      ON  o.created_at::DATE = d.day
      AND o.status = 'Completed'
    GROUP BY d.day
    ORDER BY d.day;
END;
$$;

------------------------------------------------------------
-- 3. get_low_stock_items
-- Returns inventory items where current_stock <= low_stock_threshold,
-- ordered by severity (lowest ratio first).
------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_low_stock_items(
  p_limit INT DEFAULT 3
)
RETURNS TABLE(
  item_id UUID,
  item_name TEXT,
  category_name TEXT,
  current_stock NUMERIC,
  low_stock_threshold NUMERIC,
  unit TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
    SELECT ii.id              AS item_id,
           ii.name            AS item_name,
           ic.name            AS category_name,
           ii.current_stock,
           ii.low_stock_threshold,
           ii.unit
    FROM   public.inventory_items ii
    LEFT JOIN public.inventory_categories ic ON ic.id = ii.category_id
    WHERE  ii.current_stock <= ii.low_stock_threshold
      AND  ii.low_stock_threshold > 0
    ORDER BY (ii.current_stock / NULLIF(ii.low_stock_threshold, 0)) ASC
    LIMIT  p_limit;
END;
$$;

------------------------------------------------------------
-- 4. get_stock_alert_count
-- Returns the total number of inventory items below threshold.
------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_stock_alert_count()
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_count INT;
BEGIN
  SELECT COUNT(*)::INT INTO v_count
  FROM   public.inventory_items
  WHERE  current_stock <= low_stock_threshold
    AND  low_stock_threshold > 0;
  RETURN v_count;
END;
$$;
