-- Analytics RPC Functions
-- These functions power the analytics dashboard with real data from the database.
-- All accept date range parameters and return aggregated results.

------------------------------------------------------------
-- 1. get_analytics_kpis
------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_analytics_kpis(
  p_date_from TIMESTAMPTZ DEFAULT NULL,
  p_date_to   TIMESTAMPTZ DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result JSON;
  v_date_from TIMESTAMPTZ := COALESCE(p_date_from, '1970-01-01'::TIMESTAMPTZ);
  v_date_to   TIMESTAMPTZ := COALESCE(p_date_to,   now() + INTERVAL '1 day');
  v_span      INTERVAL    := v_date_to - v_date_from;
  v_prev_from TIMESTAMPTZ := v_date_from - v_span;
  v_prev_to   TIMESTAMPTZ := v_date_from;
BEGIN
  SELECT json_build_object(
    'total_revenue',    COALESCE(cur.total_revenue, 0),
    'total_orders',     COALESCE(cur.total_orders, 0),
    'avg_order_value',  ROUND(COALESCE(cur.avg_order_value, 0), 2),
    'inventory_expenses', COALESCE(inv.expenses, 0),
    'net_revenue',      COALESCE(cur.total_revenue, 0) - COALESCE(inv.expenses, 0),
    'prev_revenue',     COALESCE(prev.total_revenue, 0),
    'prev_orders',      COALESCE(prev.total_orders, 0),
    'prev_avg_order',   ROUND(COALESCE(prev.avg_order_value, 0), 2),
    'revenue_change',   CASE WHEN COALESCE(prev.total_revenue, 0) > 0
                              THEN ROUND(((COALESCE(cur.total_revenue, 0) - prev.total_revenue) / prev.total_revenue * 100)::NUMERIC, 1)
                              ELSE 0 END,
    'orders_change',    CASE WHEN COALESCE(prev.total_orders, 0) > 0
                              THEN ROUND(((COALESCE(cur.total_orders, 0) - prev.total_orders)::NUMERIC / prev.total_orders * 100)::NUMERIC, 1)
                              ELSE 0 END,
    'aov_change',       CASE WHEN COALESCE(prev.avg_order_value, 0) > 0
                              THEN ROUND(((COALESCE(cur.avg_order_value, 0) - prev.avg_order_value) / prev.avg_order_value * 100)::NUMERIC, 1)
                              ELSE 0 END
  ) INTO v_result
  FROM (
    SELECT SUM(amount) AS total_revenue,
           COUNT(*)    AS total_orders,
           AVG(amount) AS avg_order_value
    FROM   public.orders
    WHERE  status = 'Completed'
      AND  created_at >= v_date_from
      AND  created_at <  v_date_to
  ) cur
  CROSS JOIN (
    SELECT SUM(amount) AS total_revenue,
           COUNT(*)    AS total_orders,
           AVG(amount) AS avg_order_value
    FROM   public.orders
    WHERE  status = 'Completed'
      AND  created_at >= v_prev_from
      AND  created_at <  v_prev_to
  ) prev
  CROSS JOIN (
    SELECT COALESCE(SUM(delivery_cost), 0) AS expenses
    FROM   public.inventory_transactions
    WHERE  type = 'Replenishment'
      AND  created_at >= v_date_from
      AND  created_at <  v_date_to
  ) inv;

  RETURN v_result;
END;
$$;

------------------------------------------------------------
-- 2. get_revenue_by_period
------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_revenue_by_period(
  p_date_from TIMESTAMPTZ DEFAULT NULL,
  p_date_to   TIMESTAMPTZ DEFAULT NULL
)
RETURNS TABLE(period_label TEXT, total_sales NUMERIC)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_date_from TIMESTAMPTZ := COALESCE(p_date_from, '1970-01-01'::TIMESTAMPTZ);
  v_date_to   TIMESTAMPTZ := COALESCE(p_date_to,   now() + INTERVAL '1 day');
  v_span_days INT;
BEGIN
  v_span_days := EXTRACT(DAY FROM (v_date_to - v_date_from))::INT;

  IF v_span_days <= 31 THEN
    -- Daily granularity
    RETURN QUERY
      SELECT TO_CHAR(d.day, 'Mon DD') AS period_label,
             COALESCE(SUM(o.amount), 0) AS total_sales
      FROM   generate_series(v_date_from::DATE, (v_date_to - INTERVAL '1 day')::DATE, '1 day') AS d(day)
      LEFT JOIN public.orders o
        ON o.created_at::DATE = d.day
        AND o.status = 'Completed'
      GROUP BY d.day
      ORDER BY d.day;
  ELSIF v_span_days <= 120 THEN
    -- Weekly granularity
    RETURN QUERY
      SELECT 'Wk ' || TO_CHAR(DATE_TRUNC('week', o.created_at), 'Mon DD') AS period_label,
             COALESCE(SUM(o.amount), 0) AS total_sales
      FROM   public.orders o
      WHERE  o.status = 'Completed'
        AND  o.created_at >= v_date_from
        AND  o.created_at <  v_date_to
      GROUP BY DATE_TRUNC('week', o.created_at)
      ORDER BY DATE_TRUNC('week', o.created_at);
  ELSE
    -- Monthly granularity
    RETURN QUERY
      SELECT TO_CHAR(DATE_TRUNC('month', o.created_at), 'Mon YYYY') AS period_label,
             COALESCE(SUM(o.amount), 0) AS total_sales
      FROM   public.orders o
      WHERE  o.status = 'Completed'
        AND  o.created_at >= v_date_from
        AND  o.created_at <  v_date_to
      GROUP BY DATE_TRUNC('month', o.created_at)
      ORDER BY DATE_TRUNC('month', o.created_at);
  END IF;
END;
$$;

------------------------------------------------------------
-- 3. get_top_products
------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_top_products(
  p_date_from TIMESTAMPTZ DEFAULT NULL,
  p_date_to   TIMESTAMPTZ DEFAULT NULL,
  p_limit     INT DEFAULT 10
)
RETURNS TABLE(product_name TEXT, qty_sold BIGINT, revenue NUMERIC)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_date_from TIMESTAMPTZ := COALESCE(p_date_from, '1970-01-01'::TIMESTAMPTZ);
  v_date_to   TIMESTAMPTZ := COALESCE(p_date_to,   now() + INTERVAL '1 day');
BEGIN
  RETURN QUERY
    SELECT oi.name           AS product_name,
           SUM(oi.quantity)  AS qty_sold,
           SUM(oi.subtotal)  AS revenue
    FROM   public.order_items oi
    JOIN   public.orders o ON o.id = oi.order_id
    WHERE  o.status = 'Completed'
      AND  o.created_at >= v_date_from
      AND  o.created_at <  v_date_to
    GROUP BY oi.name
    ORDER BY qty_sold DESC
    LIMIT p_limit;
END;
$$;

------------------------------------------------------------
-- 4. get_revenue_by_category
------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_revenue_by_category(
  p_date_from TIMESTAMPTZ DEFAULT NULL,
  p_date_to   TIMESTAMPTZ DEFAULT NULL
)
RETURNS TABLE(category_name TEXT, revenue NUMERIC)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_date_from TIMESTAMPTZ := COALESCE(p_date_from, '1970-01-01'::TIMESTAMPTZ);
  v_date_to   TIMESTAMPTZ := COALESCE(p_date_to,   now() + INTERVAL '1 day');
BEGIN
  RETURN QUERY
    SELECT pc.name          AS category_name,
           SUM(oi.subtotal) AS revenue
    FROM   public.order_items oi
    JOIN   public.orders o    ON o.id = oi.order_id
    LEFT JOIN public.products p  ON p.id = oi.product_id
    LEFT JOIN public.product_categories pc ON pc.id = p.category_id
    WHERE  o.status = 'Completed'
      AND  o.created_at >= v_date_from
      AND  o.created_at <  v_date_to
    GROUP BY pc.name
    ORDER BY revenue DESC;
END;
$$;

------------------------------------------------------------
-- 5. get_peak_hours
------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_peak_hours(
  p_date_from TIMESTAMPTZ DEFAULT NULL,
  p_date_to   TIMESTAMPTZ DEFAULT NULL
)
RETURNS TABLE(hour_label TEXT, order_count BIGINT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_date_from TIMESTAMPTZ := COALESCE(p_date_from, '1970-01-01'::TIMESTAMPTZ);
  v_date_to   TIMESTAMPTZ := COALESCE(p_date_to,   now() + INTERVAL '1 day');
BEGIN
  RETURN QUERY
    SELECT
      CASE
        WHEN h.hr = 0  THEN '12 AM'
        WHEN h.hr < 12 THEN h.hr || ' AM'
        WHEN h.hr = 12 THEN '12 PM'
        ELSE (h.hr - 12) || ' PM'
      END AS hour_label,
      COALESCE(oc.cnt, 0) AS order_count
    FROM generate_series(0, 23) AS h(hr)
    LEFT JOIN (
      SELECT EXTRACT(HOUR FROM o.created_at)::INT AS hr,
             COUNT(*) AS cnt
      FROM   public.orders o
      WHERE  o.status = 'Completed'
        AND  o.created_at >= v_date_from
        AND  o.created_at <  v_date_to
      GROUP BY EXTRACT(HOUR FROM o.created_at)::INT
    ) oc ON oc.hr = h.hr
    ORDER BY h.hr;
END;
$$;

------------------------------------------------------------
-- 6. get_peak_days
------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_peak_days(
  p_date_from TIMESTAMPTZ DEFAULT NULL,
  p_date_to   TIMESTAMPTZ DEFAULT NULL
)
RETURNS TABLE(day_label TEXT, total_sales NUMERIC)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_date_from TIMESTAMPTZ := COALESCE(p_date_from, '1970-01-01'::TIMESTAMPTZ);
  v_date_to   TIMESTAMPTZ := COALESCE(p_date_to,   now() + INTERVAL '1 day');
BEGIN
  RETURN QUERY
    SELECT d.day_name AS day_label,
           COALESCE(SUM(o.amount), 0) AS total_sales
    FROM (VALUES (0,'Sun'),(1,'Mon'),(2,'Tue'),(3,'Wed'),(4,'Thu'),(5,'Fri'),(6,'Sat')) AS d(dow, day_name)
    LEFT JOIN public.orders o
      ON EXTRACT(DOW FROM o.created_at)::INT = d.dow
      AND o.status = 'Completed'
      AND o.created_at >= v_date_from
      AND o.created_at <  v_date_to
    GROUP BY d.dow, d.day_name
    ORDER BY d.dow;
END;
$$;

------------------------------------------------------------
-- 7. get_payment_distribution
------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_payment_distribution(
  p_date_from TIMESTAMPTZ DEFAULT NULL,
  p_date_to   TIMESTAMPTZ DEFAULT NULL
)
RETURNS TABLE(method TEXT, revenue NUMERIC, percentage NUMERIC)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_date_from TIMESTAMPTZ := COALESCE(p_date_from, '1970-01-01'::TIMESTAMPTZ);
  v_date_to   TIMESTAMPTZ := COALESCE(p_date_to,   now() + INTERVAL '1 day');
  v_total     NUMERIC;
BEGIN
  SELECT COALESCE(SUM(amount), 0) INTO v_total
  FROM   public.orders
  WHERE  status = 'Completed'
    AND  created_at >= v_date_from
    AND  created_at <  v_date_to;

  RETURN QUERY
    SELECT o.payment_method AS method,
           SUM(o.amount) AS revenue,
           CASE WHEN v_total > 0
                THEN ROUND(SUM(o.amount) / v_total * 100, 1)
                ELSE 0 END AS percentage
    FROM   public.orders o
    WHERE  o.status = 'Completed'
      AND  o.created_at >= v_date_from
      AND  o.created_at <  v_date_to
    GROUP BY o.payment_method
    ORDER BY revenue DESC;
END;
$$;

------------------------------------------------------------
-- 8. get_transaction_status
------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_transaction_status(
  p_date_from TIMESTAMPTZ DEFAULT NULL,
  p_date_to   TIMESTAMPTZ DEFAULT NULL
)
RETURNS TABLE(status TEXT, order_count BIGINT, percentage NUMERIC)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_date_from TIMESTAMPTZ := COALESCE(p_date_from, '1970-01-01'::TIMESTAMPTZ);
  v_date_to   TIMESTAMPTZ := COALESCE(p_date_to,   now() + INTERVAL '1 day');
  v_total     BIGINT;
BEGIN
  SELECT COUNT(*) INTO v_total
  FROM   public.orders
  WHERE  created_at >= v_date_from
    AND  created_at <  v_date_to;

  RETURN QUERY
    SELECT o.status,
           COUNT(*) AS order_count,
           CASE WHEN v_total > 0
                THEN ROUND(COUNT(*)::NUMERIC / v_total * 100, 1)
                ELSE 0 END AS percentage
    FROM   public.orders o
    WHERE  o.created_at >= v_date_from
      AND  o.created_at <  v_date_to
    GROUP BY o.status
    ORDER BY order_count DESC;
END;
$$;

------------------------------------------------------------
-- 9. get_void_analysis
------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_void_analysis(
  p_date_from TIMESTAMPTZ DEFAULT NULL,
  p_date_to   TIMESTAMPTZ DEFAULT NULL
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
    'total_voids',    COALESCE(v.total_voids, 0),
    'revenue_lost',   COALESCE(v.revenue_lost, 0),
    'void_rate',      CASE WHEN COALESCE(t.total_orders, 0) > 0
                           THEN ROUND(COALESCE(v.total_voids, 0)::NUMERIC / t.total_orders * 100, 1)
                           ELSE 0 END,
    'total_orders',   COALESCE(t.total_orders, 0)
  ) INTO v_result
  FROM (
    SELECT COUNT(*) AS total_voids,
           SUM(amount) AS revenue_lost
    FROM   public.orders
    WHERE  status IN ('Void (Not Made)', 'Void (Consumed)')
      AND  created_at >= v_date_from
      AND  created_at <  v_date_to
  ) v
  CROSS JOIN (
    SELECT COUNT(*) AS total_orders
    FROM   public.orders
    WHERE  created_at >= v_date_from
      AND  created_at <  v_date_to
  ) t;

  RETURN v_result;
END;
$$;

------------------------------------------------------------
-- 10. get_inventory_consumption
------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_inventory_consumption(
  p_date_from  TIMESTAMPTZ DEFAULT NULL,
  p_date_to    TIMESTAMPTZ DEFAULT NULL,
  p_direction  TEXT DEFAULT 'most',  -- 'most' or 'least'
  p_limit      INT DEFAULT 4
)
RETURNS TABLE(item_name TEXT, unit TEXT, total_consumed NUMERIC)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_date_from TIMESTAMPTZ := COALESCE(p_date_from, '1970-01-01'::TIMESTAMPTZ);
  v_date_to   TIMESTAMPTZ := COALESCE(p_date_to,   now() + INTERVAL '1 day');
BEGIN
  IF p_direction = 'most' THEN
    RETURN QUERY
      SELECT ii.name AS item_name,
             ii.unit,
             ABS(SUM(it.quantity_changed)) AS total_consumed
      FROM   public.inventory_transactions it
      JOIN   public.inventory_items ii ON ii.id = it.inventory_item_id
      WHERE  it.quantity_changed < 0
        AND  it.created_at >= v_date_from
        AND  it.created_at <  v_date_to
      GROUP BY ii.name, ii.unit
      ORDER BY total_consumed DESC
      LIMIT p_limit;
  ELSE
    RETURN QUERY
      SELECT ii.name AS item_name,
             ii.unit,
             ABS(SUM(it.quantity_changed)) AS total_consumed
      FROM   public.inventory_transactions it
      JOIN   public.inventory_items ii ON ii.id = it.inventory_item_id
      WHERE  it.quantity_changed < 0
        AND  it.created_at >= v_date_from
        AND  it.created_at <  v_date_to
      GROUP BY ii.name, ii.unit
      ORDER BY total_consumed ASC
      LIMIT p_limit;
  END IF;
END;
$$;

------------------------------------------------------------
-- 11. get_cashier_list
------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_cashier_list()
RETURNS TABLE(cashier_name TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
    SELECT DISTINCT o.cashier_name
    FROM   public.orders o
    WHERE  o.cashier_name IS NOT NULL
      AND  o.cashier_name != ''
    ORDER BY o.cashier_name;
END;
$$;
