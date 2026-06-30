-- Fix the get_dashboard_revenue_trend function to return the correct types
-- and to start the week on Sunday instead of Monday.

CREATE OR REPLACE FUNCTION public.get_dashboard_revenue_trend()
RETURNS TABLE(day_label TEXT, day_date DATE, total_revenue NUMERIC)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  -- To start on Sunday: shift forward 1 day, truncate to Monday, then shift back 1 day.
  v_week_start DATE := (date_trunc('week', now() + interval '1 day') - interval '1 day')::DATE;
  v_week_end   DATE := v_week_start + 7;
BEGIN
  RETURN QUERY
    SELECT TO_CHAR(d.day, 'Dy')     AS day_label,
           d.day::DATE               AS day_date,
           COALESCE(SUM(o.amount), 0) AS total_revenue
    FROM   generate_series(v_week_start, v_week_end - 1, '1 day'::INTERVAL) AS d(day)
    LEFT JOIN public.orders o
      ON  o.created_at::DATE = d.day::DATE
      AND o.status = 'Completed'
    GROUP BY d.day::DATE, d.day
    ORDER BY d.day::DATE;
END;
$$;
