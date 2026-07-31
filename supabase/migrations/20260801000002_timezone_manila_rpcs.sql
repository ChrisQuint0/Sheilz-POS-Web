-- Fix analytics and dashboard RPC functions to use Manila timezone.
-- PostgreSQL defaults to UTC for functions like DATE_TRUNC and EXTRACT on TIMESTAMPTZ columns.
-- This explicitly casts created_at and now() to Asia/Manila before grouping/extracting.

------------------------------------------------------------
-- 1. get_revenue_by_period
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
      FROM   generate_series((v_date_from AT TIME ZONE 'Asia/Manila')::DATE, ((v_date_to AT TIME ZONE 'Asia/Manila') - INTERVAL '1 day')::DATE, '1 day') AS d(day)
      LEFT JOIN public.orders o
        ON (o.created_at AT TIME ZONE 'Asia/Manila')::DATE = d.day::DATE
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
      SELECT 'Wk ' || TO_CHAR(DATE_TRUNC('week', o.created_at AT TIME ZONE 'Asia/Manila'), 'Mon DD') AS period_label,
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
      GROUP BY DATE_TRUNC('week', o.created_at AT TIME ZONE 'Asia/Manila')
      ORDER BY DATE_TRUNC('week', o.created_at AT TIME ZONE 'Asia/Manila');
  ELSE
    -- Monthly granularity
    RETURN QUERY
      SELECT TO_CHAR(DATE_TRUNC('month', o.created_at AT TIME ZONE 'Asia/Manila'), 'Mon YYYY') AS period_label,
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
      GROUP BY DATE_TRUNC('month', o.created_at AT TIME ZONE 'Asia/Manila')
      ORDER BY DATE_TRUNC('month', o.created_at AT TIME ZONE 'Asia/Manila');
  END IF;
END;
$$;

------------------------------------------------------------
-- 2. get_peak_hours
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
      SELECT EXTRACT(HOUR FROM (o.created_at AT TIME ZONE 'Asia/Manila'))::INT AS hr,
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
      GROUP BY EXTRACT(HOUR FROM (o.created_at AT TIME ZONE 'Asia/Manila'))::INT
    ) oc ON oc.hr = h.hr
    ORDER BY h.hr;
END;
$$;

------------------------------------------------------------
-- 3. get_peak_days
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
      ON EXTRACT(DOW FROM (o.created_at AT TIME ZONE 'Asia/Manila'))::INT = d.dow
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
-- 4. get_dashboard_kpis
------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_dashboard_kpis()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result JSON;
  v_today_start TIMESTAMPTZ := (date_trunc('day', now() AT TIME ZONE 'Asia/Manila') AT TIME ZONE 'Asia/Manila');
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
-- 5. get_dashboard_revenue_trend
------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_dashboard_revenue_trend(
  p_day_offset INT DEFAULT 0
)
RETURNS TABLE(day_label TEXT, day_date DATE, total_revenue NUMERIC)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  -- Base start remains the Sunday of the current week (using Manila timezone)
  v_base_start DATE := (date_trunc('week', (now() AT TIME ZONE 'Asia/Manila') + interval '1 day') - interval '1 day')::DATE;
  v_start DATE := v_base_start + p_day_offset;
  v_end   DATE := v_start + 7;
BEGIN
  RETURN QUERY
    SELECT TO_CHAR(d.day, 'Dy')     AS day_label,
           d.day::DATE               AS day_date,
           COALESCE(SUM(o.amount), 0) AS total_revenue
    FROM   generate_series(v_start, v_end - 1, '1 day'::INTERVAL) AS d(day)
    LEFT JOIN public.orders o
      ON  (o.created_at AT TIME ZONE 'Asia/Manila')::DATE = d.day::DATE
      AND o.status = 'Completed'
    GROUP BY d.day::DATE, d.day
    ORDER BY d.day::DATE;
END;
$$;
