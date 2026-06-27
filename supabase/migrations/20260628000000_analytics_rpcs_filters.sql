-- Analytics RPC Functions with Filters
-- This migration updates the analytics functions to support category, payment_method, and cashier filters.

------------------------------------------------------------
-- 1. get_analytics_kpis
------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_analytics_kpis(
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
    SELECT SUM(oi.subtotal) AS total_revenue,
           COUNT(DISTINCT o.id) AS total_orders,
           SUM(oi.subtotal) / NULLIF(COUNT(DISTINCT o.id), 0) AS avg_order_value
    FROM   public.orders o
    JOIN   public.order_items oi ON o.id = oi.order_id
    LEFT JOIN public.products p ON p.id = oi.product_id
    LEFT JOIN public.product_categories pc ON pc.id = p.category_id
    WHERE  o.status = 'Completed'
      AND  o.created_at >= v_date_from
      AND  o.created_at <  v_date_to
      AND (p_payment_method = 'all' OR o.payment_method = p_payment_method)
      AND (p_cashier = 'all' OR o.cashier_name = p_cashier)
      AND (p_category = 'all' OR pc.name = p_category)
  ) cur
  CROSS JOIN (
    SELECT SUM(oi.subtotal) AS total_revenue,
           COUNT(DISTINCT o.id) AS total_orders,
           SUM(oi.subtotal) / NULLIF(COUNT(DISTINCT o.id), 0) AS avg_order_value
    FROM   public.orders o
    JOIN   public.order_items oi ON o.id = oi.order_id
    LEFT JOIN public.products p ON p.id = oi.product_id
    LEFT JOIN public.product_categories pc ON pc.id = p.category_id
    WHERE  o.status = 'Completed'
      AND  o.created_at >= v_prev_from
      AND  o.created_at <  v_prev_to
      AND (p_payment_method = 'all' OR o.payment_method = p_payment_method)
      AND (p_cashier = 'all' OR o.cashier_name = p_cashier)
      AND (p_category = 'all' OR pc.name = p_category)
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
  p_date_to   TIMESTAMPTZ DEFAULT NULL,
  p_category  TEXT DEFAULT 'all',
  p_payment_method TEXT DEFAULT 'all',
  p_cashier   TEXT DEFAULT 'all'
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
             COALESCE(SUM(oi.subtotal), 0) AS total_sales
      FROM   generate_series(v_date_from::DATE, (v_date_to - INTERVAL '1 day')::DATE, '1 day') AS d(day)
      LEFT JOIN public.orders o
        ON o.created_at::DATE = d.day
        AND o.status = 'Completed'
        AND (p_payment_method = 'all' OR o.payment_method = p_payment_method)
        AND (p_cashier = 'all' OR o.cashier_name = p_cashier)
      LEFT JOIN public.order_items oi ON o.id = oi.order_id
      LEFT JOIN public.products p ON p.id = oi.product_id
      LEFT JOIN public.product_categories pc ON pc.id = p.category_id AND (p_category = 'all' OR pc.name = p_category)
      WHERE (p_category = 'all' OR pc.name = p_category OR o.id IS NULL)
      GROUP BY d.day
      ORDER BY d.day;
  ELSIF v_span_days <= 120 THEN
    -- Weekly granularity
    RETURN QUERY
      SELECT 'Wk ' || TO_CHAR(DATE_TRUNC('week', o.created_at), 'Mon DD') AS period_label,
             COALESCE(SUM(oi.subtotal), 0) AS total_sales
      FROM   public.orders o
      JOIN   public.order_items oi ON o.id = oi.order_id
      LEFT JOIN public.products p ON p.id = oi.product_id
      LEFT JOIN public.product_categories pc ON pc.id = p.category_id
      WHERE  o.status = 'Completed'
        AND  o.created_at >= v_date_from
        AND  o.created_at <  v_date_to
        AND (p_payment_method = 'all' OR o.payment_method = p_payment_method)
        AND (p_cashier = 'all' OR o.cashier_name = p_cashier)
        AND (p_category = 'all' OR pc.name = p_category)
      GROUP BY DATE_TRUNC('week', o.created_at)
      ORDER BY DATE_TRUNC('week', o.created_at);
  ELSE
    -- Monthly granularity
    RETURN QUERY
      SELECT TO_CHAR(DATE_TRUNC('month', o.created_at), 'Mon YYYY') AS period_label,
             COALESCE(SUM(oi.subtotal), 0) AS total_sales
      FROM   public.orders o
      JOIN   public.order_items oi ON o.id = oi.order_id
      LEFT JOIN public.products p ON p.id = oi.product_id
      LEFT JOIN public.product_categories pc ON pc.id = p.category_id
      WHERE  o.status = 'Completed'
        AND  o.created_at >= v_date_from
        AND  o.created_at <  v_date_to
        AND (p_payment_method = 'all' OR o.payment_method = p_payment_method)
        AND (p_cashier = 'all' OR o.cashier_name = p_cashier)
        AND (p_category = 'all' OR pc.name = p_category)
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
  p_limit     INT DEFAULT 10,
  p_category  TEXT DEFAULT 'all',
  p_payment_method TEXT DEFAULT 'all',
  p_cashier   TEXT DEFAULT 'all'
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
    LEFT JOIN public.products p ON p.id = oi.product_id
    LEFT JOIN public.product_categories pc ON pc.id = p.category_id
    WHERE  o.status = 'Completed'
      AND  o.created_at >= v_date_from
      AND  o.created_at <  v_date_to
      AND (p_payment_method = 'all' OR o.payment_method = p_payment_method)
      AND (p_cashier = 'all' OR o.cashier_name = p_cashier)
      AND (p_category = 'all' OR pc.name = p_category)
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
  p_date_to   TIMESTAMPTZ DEFAULT NULL,
  p_category  TEXT DEFAULT 'all',
  p_payment_method TEXT DEFAULT 'all',
  p_cashier   TEXT DEFAULT 'all'
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
      AND (p_payment_method = 'all' OR o.payment_method = p_payment_method)
      AND (p_cashier = 'all' OR o.cashier_name = p_cashier)
      AND (p_category = 'all' OR pc.name = p_category)
    GROUP BY pc.name
    ORDER BY revenue DESC;
END;
$$;

------------------------------------------------------------
-- 5. get_peak_hours
------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_peak_hours(
  p_date_from TIMESTAMPTZ DEFAULT NULL,
  p_date_to   TIMESTAMPTZ DEFAULT NULL,
  p_category  TEXT DEFAULT 'all',
  p_payment_method TEXT DEFAULT 'all',
  p_cashier   TEXT DEFAULT 'all'
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
             COUNT(DISTINCT o.id) AS cnt
      FROM   public.orders o
      JOIN   public.order_items oi ON o.id = oi.order_id
      LEFT JOIN public.products p ON p.id = oi.product_id
      LEFT JOIN public.product_categories pc ON pc.id = p.category_id
      WHERE  o.status = 'Completed'
        AND  o.created_at >= v_date_from
        AND  o.created_at <  v_date_to
        AND (p_payment_method = 'all' OR o.payment_method = p_payment_method)
        AND (p_cashier = 'all' OR o.cashier_name = p_cashier)
        AND (p_category = 'all' OR pc.name = p_category)
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
  p_date_to   TIMESTAMPTZ DEFAULT NULL,
  p_category  TEXT DEFAULT 'all',
  p_payment_method TEXT DEFAULT 'all',
  p_cashier   TEXT DEFAULT 'all'
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
           COALESCE(SUM(oi.subtotal), 0) AS total_sales
    FROM (VALUES (0,'Sun'),(1,'Mon'),(2,'Tue'),(3,'Wed'),(4,'Thu'),(5,'Fri'),(6,'Sat')) AS d(dow, day_name)
    LEFT JOIN public.orders o
      ON EXTRACT(DOW FROM o.created_at)::INT = d.dow
      AND o.status = 'Completed'
      AND o.created_at >= v_date_from
      AND o.created_at <  v_date_to
      AND (p_payment_method = 'all' OR o.payment_method = p_payment_method)
      AND (p_cashier = 'all' OR o.cashier_name = p_cashier)
    LEFT JOIN public.order_items oi ON o.id = oi.order_id
    LEFT JOIN public.products p ON p.id = oi.product_id
    LEFT JOIN public.product_categories pc ON pc.id = p.category_id AND (p_category = 'all' OR pc.name = p_category)
    WHERE (p_category = 'all' OR pc.name = p_category OR o.id IS NULL)
    GROUP BY d.dow, d.day_name
    ORDER BY d.dow;
END;
$$;

------------------------------------------------------------
-- 7. get_payment_distribution
------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_payment_distribution(
  p_date_from TIMESTAMPTZ DEFAULT NULL,
  p_date_to   TIMESTAMPTZ DEFAULT NULL,
  p_category  TEXT DEFAULT 'all',
  p_payment_method TEXT DEFAULT 'all',
  p_cashier   TEXT DEFAULT 'all'
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
  SELECT COALESCE(SUM(oi.subtotal), 0) INTO v_total
  FROM   public.orders o
  JOIN   public.order_items oi ON o.id = oi.order_id
  LEFT JOIN public.products p ON p.id = oi.product_id
  LEFT JOIN public.product_categories pc ON pc.id = p.category_id
  WHERE  o.status = 'Completed'
    AND  o.created_at >= v_date_from
    AND  o.created_at <  v_date_to
    AND (p_payment_method = 'all' OR o.payment_method = p_payment_method)
    AND (p_cashier = 'all' OR o.cashier_name = p_cashier)
    AND (p_category = 'all' OR pc.name = p_category);

  RETURN QUERY
    SELECT o.payment_method AS method,
           SUM(oi.subtotal) AS revenue,
           CASE WHEN v_total > 0
                THEN ROUND(SUM(oi.subtotal) / v_total * 100, 1)
                ELSE 0 END AS percentage
    FROM   public.orders o
    JOIN   public.order_items oi ON o.id = oi.order_id
    LEFT JOIN public.products p ON p.id = oi.product_id
    LEFT JOIN public.product_categories pc ON pc.id = p.category_id
    WHERE  o.status = 'Completed'
      AND  o.created_at >= v_date_from
      AND  o.created_at <  v_date_to
      AND (p_payment_method = 'all' OR o.payment_method = p_payment_method)
      AND (p_cashier = 'all' OR o.cashier_name = p_cashier)
      AND (p_category = 'all' OR pc.name = p_category)
    GROUP BY o.payment_method
    ORDER BY revenue DESC;
END;
$$;

------------------------------------------------------------
-- 8. get_transaction_status
------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_transaction_status(
  p_date_from TIMESTAMPTZ DEFAULT NULL,
  p_date_to   TIMESTAMPTZ DEFAULT NULL,
  p_category  TEXT DEFAULT 'all',
  p_payment_method TEXT DEFAULT 'all',
  p_cashier   TEXT DEFAULT 'all'
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
  SELECT COUNT(DISTINCT o.id) INTO v_total
  FROM   public.orders o
  JOIN   public.order_items oi ON o.id = oi.order_id
  LEFT JOIN public.products p ON p.id = oi.product_id
  LEFT JOIN public.product_categories pc ON pc.id = p.category_id
  WHERE  o.created_at >= v_date_from
    AND  o.created_at <  v_date_to
    AND (p_payment_method = 'all' OR o.payment_method = p_payment_method)
    AND (p_cashier = 'all' OR o.cashier_name = p_cashier)
    AND (p_category = 'all' OR pc.name = p_category);

  RETURN QUERY
    SELECT o.status,
           COUNT(DISTINCT o.id) AS order_count,
           CASE WHEN v_total > 0
                THEN ROUND(COUNT(DISTINCT o.id)::NUMERIC / v_total * 100, 1)
                ELSE 0 END AS percentage
    FROM   public.orders o
    JOIN   public.order_items oi ON o.id = oi.order_id
    LEFT JOIN public.products p ON p.id = oi.product_id
    LEFT JOIN public.product_categories pc ON pc.id = p.category_id
    WHERE  o.created_at >= v_date_from
      AND  o.created_at <  v_date_to
      AND (p_payment_method = 'all' OR o.payment_method = p_payment_method)
      AND (p_cashier = 'all' OR o.cashier_name = p_cashier)
      AND (p_category = 'all' OR pc.name = p_category)
    GROUP BY o.status
    ORDER BY order_count DESC;
END;
$$;

------------------------------------------------------------
-- 9. get_void_analysis
------------------------------------------------------------
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
    'total_voids',    COALESCE(v.total_voids, 0),
    'revenue_lost',   COALESCE(v.revenue_lost, 0),
    'void_rate',      CASE WHEN COALESCE(t.total_orders, 0) > 0
                           THEN ROUND(COALESCE(v.total_voids, 0)::NUMERIC / t.total_orders * 100, 1)
                           ELSE 0 END,
    'total_orders',   COALESCE(t.total_orders, 0)
  ) INTO v_result
  FROM (
    SELECT COUNT(DISTINCT o.id) AS total_voids,
           SUM(oi.subtotal) AS revenue_lost
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

------------------------------------------------------------
-- 10. get_inventory_consumption (No category/cashier filters as it's inventory)
------------------------------------------------------------
-- Left unchanged since inventory transactions don't have cashier/payment details.

------------------------------------------------------------
-- 11. get_cashier_list
------------------------------------------------------------
-- Left unchanged.
