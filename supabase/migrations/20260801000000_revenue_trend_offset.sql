-- Add a week-offset parameter to the revenue trend function so the dashboard
-- chart can slide backward (and forward) through previous weeks.
--
-- p_week_offset = 0 → current week (default, keeps existing behaviour)
-- p_week_offset = -1 → previous week
-- p_week_offset = -2 → two weeks ago, etc.

CREATE OR REPLACE FUNCTION public.get_dashboard_revenue_trend(
  p_week_offset INT DEFAULT 0
)
RETURNS TABLE(day_label TEXT, day_date DATE, total_revenue NUMERIC)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  -- Current week start (Sunday-based): shift +1 day, truncate to ISO week start, shift -1 day.
  v_base_start DATE := (date_trunc('week', now() + interval '1 day') - interval '1 day')::DATE;
  v_week_start DATE := v_base_start + (p_week_offset * 7);
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
