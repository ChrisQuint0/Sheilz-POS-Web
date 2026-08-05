-- Update get_dashboard_kpis to support week offsets
-- If p_day_offset = 0, returns today's data vs yesterday's data.
-- If p_day_offset < 0, returns the selected week's data vs the previous week's data.

CREATE OR REPLACE FUNCTION public.get_dashboard_kpis(
  p_day_offset INT DEFAULT 0
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result JSON;
  
  -- Variables for offset = 0 (Daily view)
  v_today_start TIMESTAMPTZ := (date_trunc('day', now() AT TIME ZONE 'Asia/Manila') AT TIME ZONE 'Asia/Manila');
  v_today_end   TIMESTAMPTZ := v_today_start + INTERVAL '1 day';
  v_yest_start  TIMESTAMPTZ := v_today_start - INTERVAL '1 day';
  v_yest_end    TIMESTAMPTZ := v_today_start;

  -- Variables for offset < 0 (Weekly view)
  v_base_start DATE := (date_trunc('week', (now() AT TIME ZONE 'Asia/Manila') + interval '1 day') - interval '1 day')::DATE;
  v_week_start DATE := v_base_start + p_day_offset;
  v_week_end   DATE := v_week_start + 7;
  v_prev_week_start DATE := v_week_start - 7;
  v_prev_week_end   DATE := v_week_start;

  -- Active variables that will be used for the query
  v_curr_start TIMESTAMPTZ;
  v_curr_end   TIMESTAMPTZ;
  v_prev_start TIMESTAMPTZ;
  v_prev_end   TIMESTAMPTZ;
BEGIN
  IF p_day_offset = 0 THEN
    v_curr_start := v_today_start;
    v_curr_end   := v_today_end;
    v_prev_start := v_yest_start;
    v_prev_end   := v_yest_end;
  ELSE
    -- Cast dates to timestamptz in Manila timezone to match boundary semantics correctly
    v_curr_start := (v_week_start::TIMESTAMP AT TIME ZONE 'Asia/Manila');
    v_curr_end   := (v_week_end::TIMESTAMP AT TIME ZONE 'Asia/Manila');
    v_prev_start := (v_prev_week_start::TIMESTAMP AT TIME ZONE 'Asia/Manila');
    v_prev_end   := (v_prev_week_end::TIMESTAMP AT TIME ZONE 'Asia/Manila');
  END IF;

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
      AND  created_at >= v_curr_start
      AND  created_at <  v_curr_end
  ) t
  CROSS JOIN (
    SELECT SUM(amount) AS total_revenue,
           COUNT(*)    AS total_orders,
           AVG(amount) AS avg_order_value
    FROM   public.orders
    WHERE  status = 'Completed'
      AND  created_at >= v_prev_start
      AND  created_at <  v_prev_end
  ) y;

  RETURN v_result;
END;
$$;
