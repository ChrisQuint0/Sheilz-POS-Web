-- Change the revenue trend function to accept a day offset instead of a week offset.
-- This allows sliding the chart a single day at a time while still showing a 7-day window.

DROP FUNCTION IF EXISTS public.get_dashboard_revenue_trend(INT);

CREATE OR REPLACE FUNCTION public.get_dashboard_revenue_trend(
  p_day_offset INT DEFAULT 0
)
RETURNS TABLE(day_label TEXT, day_date DATE, total_revenue NUMERIC)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  -- Base start remains the Sunday of the current week
  v_base_start DATE := (date_trunc('week', now() + interval '1 day') - interval '1 day')::DATE;
  v_start DATE := v_base_start + p_day_offset;
  v_end   DATE := v_start + 7;
BEGIN
  RETURN QUERY
    SELECT TO_CHAR(d.day, 'Dy')     AS day_label,
           d.day::DATE               AS day_date,
           COALESCE(SUM(o.amount), 0) AS total_revenue
    FROM   generate_series(v_start, v_end - 1, '1 day'::INTERVAL) AS d(day)
    LEFT JOIN public.orders o
      ON  o.created_at::DATE = d.day::DATE
      AND o.status = 'Completed'
    GROUP BY d.day::DATE, d.day
    ORDER BY d.day::DATE;
END;
$$;
