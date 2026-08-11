-- ============================================================
-- Migration: Add unit_cost to inventory_items
--            + get_inventory_turnover RPC for Analytics
-- ============================================================

-- 1. Add unit_cost column (nullable — existing items need manual entry)
ALTER TABLE public.inventory_items
  ADD COLUMN IF NOT EXISTS unit_cost NUMERIC(10,2);

-- ============================================================
-- 2. get_inventory_turnover RPC
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_inventory_turnover(
  p_date_from TIMESTAMPTZ DEFAULT NULL,
  p_date_to   TIMESTAMPTZ DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_date_from    TIMESTAMPTZ := COALESCE(p_date_from, '1970-01-01'::TIMESTAMPTZ);
  v_date_to      TIMESTAMPTZ := COALESCE(p_date_to,   now() + INTERVAL '1 day');
  v_span_days    INT;
  v_prev_from    TIMESTAMPTZ;
  v_prev_to      TIMESTAMPTZ;

  v_estimated_cogs       NUMERIC := 0;
  v_beginning_inventory  NUMERIC := 0;
  v_ending_inventory     NUMERIC := 0;
  v_average_inventory    NUMERIC := 0;
  v_turnover_rate        NUMERIC := 0;
  v_days_in_inventory    NUMERIC := 0;

  v_prev_cogs            NUMERIC := 0;
  v_prev_beg_inv         NUMERIC := 0;
  v_prev_end_inv         NUMERIC := 0;
  v_prev_avg_inv         NUMERIC := 0;
  v_prev_turnover        NUMERIC := 0;
  v_change_percent       NUMERIC := NULL;

  v_missing_cost_count   INT := 0;
  v_trend                JSONB := '[]'::JSONB;
  v_result               JSONB;

  -- For trend calculation
  v_interval_start       TIMESTAMPTZ;
  v_interval_end         TIMESTAMPTZ;
  v_interval_label       TEXT;
  v_interval_cogs        NUMERIC;
  v_interval_beg_inv     NUMERIC;
  v_interval_end_inv     NUMERIC;
  v_interval_avg_inv     NUMERIC;
  v_interval_turnover    NUMERIC;
  v_week_counter         INT := 0;
  v_interval_step        INTERVAL;
BEGIN
  -- Calculate span
  v_span_days := GREATEST(EXTRACT(DAY FROM (v_date_to - v_date_from))::INT, 1);

  -- Previous period (same duration, immediately before)
  v_prev_from := v_date_from - (v_date_to - v_date_from);
  v_prev_to   := v_date_from;

  -- Count ingredients missing unit_cost
  SELECT COUNT(*)
  INTO   v_missing_cost_count
  FROM   public.inventory_items
  WHERE  unit_cost IS NULL OR unit_cost <= 0;

  -- ──────────────────────────────────────────────
  -- ESTIMATED COGS (current period)
  -- Sum of ABS(quantity_changed) × unit_cost
  -- for 'Automatic POS Deduction' transactions
  -- ──────────────────────────────────────────────
  SELECT COALESCE(SUM(ABS(it.quantity_changed) * ii.unit_cost), 0)
  INTO   v_estimated_cogs
  FROM   public.inventory_transactions it
  JOIN   public.inventory_items ii ON ii.id = it.inventory_item_id
  WHERE  it.type = 'Automatic POS Deduction'
    AND  it.created_at >= v_date_from
    AND  it.created_at <  v_date_to
    AND  ii.unit_cost IS NOT NULL
    AND  ii.unit_cost > 0;

  -- ──────────────────────────────────────────────
  -- BEGINNING INVENTORY
  -- For each ingredient: find the stock level at the start of the period
  -- Use the last transaction's new_stock before v_date_from,
  -- or current_stock if no transactions exist before that date.
  -- Then multiply by unit_cost.
  -- ──────────────────────────────────────────────
  SELECT COALESCE(SUM(
    COALESCE(
      (SELECT it.new_stock
       FROM   public.inventory_transactions it
       WHERE  it.inventory_item_id = ii.id
         AND  it.created_at < v_date_from
       ORDER BY it.created_at DESC
       LIMIT 1),
      ii.current_stock
    ) * ii.unit_cost
  ), 0)
  INTO   v_beginning_inventory
  FROM   public.inventory_items ii
  WHERE  ii.unit_cost IS NOT NULL
    AND  ii.unit_cost > 0;

  -- ──────────────────────────────────────────────
  -- ENDING INVENTORY
  -- For each ingredient: find the stock level at the end of the period
  -- Use the last transaction's new_stock before v_date_to,
  -- or current_stock if no transactions exist before that date.
  -- Then multiply by unit_cost.
  -- ──────────────────────────────────────────────
  SELECT COALESCE(SUM(
    COALESCE(
      (SELECT it.new_stock
       FROM   public.inventory_transactions it
       WHERE  it.inventory_item_id = ii.id
         AND  it.created_at < v_date_to
       ORDER BY it.created_at DESC
       LIMIT 1),
      ii.current_stock
    ) * ii.unit_cost
  ), 0)
  INTO   v_ending_inventory
  FROM   public.inventory_items ii
  WHERE  ii.unit_cost IS NOT NULL
    AND  ii.unit_cost > 0;

  -- ──────────────────────────────────────────────
  -- AVERAGE INVENTORY & TURNOVER
  -- ──────────────────────────────────────────────
  v_average_inventory := (v_beginning_inventory + v_ending_inventory) / 2.0;

  IF v_average_inventory > 0 THEN
    v_turnover_rate := ROUND(v_estimated_cogs / v_average_inventory, 1);
    v_days_in_inventory := ROUND(v_span_days::NUMERIC / (v_estimated_cogs / v_average_inventory), 1);
  ELSE
    v_turnover_rate := NULL;
    v_days_in_inventory := NULL;
  END IF;

  -- ──────────────────────────────────────────────
  -- PREVIOUS PERIOD TURNOVER (for comparison %)
  -- ──────────────────────────────────────────────
  -- Previous COGS
  SELECT COALESCE(SUM(ABS(it.quantity_changed) * ii.unit_cost), 0)
  INTO   v_prev_cogs
  FROM   public.inventory_transactions it
  JOIN   public.inventory_items ii ON ii.id = it.inventory_item_id
  WHERE  it.type = 'Automatic POS Deduction'
    AND  it.created_at >= v_prev_from
    AND  it.created_at <  v_prev_to
    AND  ii.unit_cost IS NOT NULL
    AND  ii.unit_cost > 0;

  -- Previous beginning inventory
  SELECT COALESCE(SUM(
    COALESCE(
      (SELECT it.new_stock
       FROM   public.inventory_transactions it
       WHERE  it.inventory_item_id = ii.id
         AND  it.created_at < v_prev_from
       ORDER BY it.created_at DESC
       LIMIT 1),
      ii.current_stock
    ) * ii.unit_cost
  ), 0)
  INTO   v_prev_beg_inv
  FROM   public.inventory_items ii
  WHERE  ii.unit_cost IS NOT NULL
    AND  ii.unit_cost > 0;

  -- Previous ending inventory
  SELECT COALESCE(SUM(
    COALESCE(
      (SELECT it.new_stock
       FROM   public.inventory_transactions it
       WHERE  it.inventory_item_id = ii.id
         AND  it.created_at < v_prev_to
       ORDER BY it.created_at DESC
       LIMIT 1),
      ii.current_stock
    ) * ii.unit_cost
  ), 0)
  INTO   v_prev_end_inv
  FROM   public.inventory_items ii
  WHERE  ii.unit_cost IS NOT NULL
    AND  ii.unit_cost > 0;

  v_prev_avg_inv := (v_prev_beg_inv + v_prev_end_inv) / 2.0;

  IF v_prev_avg_inv > 0 THEN
    v_prev_turnover := ROUND(v_prev_cogs / v_prev_avg_inv, 1);
  ELSE
    v_prev_turnover := NULL;
  END IF;

  -- Change percentage
  IF v_turnover_rate IS NOT NULL AND v_prev_turnover IS NOT NULL AND v_prev_turnover > 0 THEN
    v_change_percent := ROUND(((v_turnover_rate - v_prev_turnover) / v_prev_turnover) * 100, 1);
  ELSE
    v_change_percent := NULL;
  END IF;

  -- ──────────────────────────────────────────────
  -- TREND CHART
  -- Divide period into sub-intervals and calculate
  -- turnover independently for each.
  -- ≤14 days → daily, ≤90 days → weekly, >90 → monthly
  -- ──────────────────────────────────────────────
  v_trend := '[]'::JSONB;

  IF v_span_days <= 14 THEN
    -- Daily intervals
    v_interval_start := v_date_from;
    WHILE v_interval_start < v_date_to LOOP
      v_interval_end := v_interval_start + INTERVAL '1 day';
      IF v_interval_end > v_date_to THEN
        v_interval_end := v_date_to;
      END IF;

      v_interval_label := TO_CHAR(v_interval_start AT TIME ZONE 'Asia/Manila', 'Mon DD');

      -- Interval COGS
      SELECT COALESCE(SUM(ABS(it.quantity_changed) * ii.unit_cost), 0)
      INTO   v_interval_cogs
      FROM   public.inventory_transactions it
      JOIN   public.inventory_items ii ON ii.id = it.inventory_item_id
      WHERE  it.type = 'Automatic POS Deduction'
        AND  it.created_at >= v_interval_start
        AND  it.created_at <  v_interval_end
        AND  ii.unit_cost IS NOT NULL AND ii.unit_cost > 0;

      -- Interval beginning inventory
      SELECT COALESCE(SUM(
        COALESCE(
          (SELECT it2.new_stock FROM public.inventory_transactions it2
           WHERE it2.inventory_item_id = ii.id AND it2.created_at < v_interval_start
           ORDER BY it2.created_at DESC LIMIT 1),
          ii.current_stock
        ) * ii.unit_cost
      ), 0)
      INTO   v_interval_beg_inv
      FROM   public.inventory_items ii
      WHERE  ii.unit_cost IS NOT NULL AND ii.unit_cost > 0;

      -- Interval ending inventory
      SELECT COALESCE(SUM(
        COALESCE(
          (SELECT it2.new_stock FROM public.inventory_transactions it2
           WHERE it2.inventory_item_id = ii.id AND it2.created_at < v_interval_end
           ORDER BY it2.created_at DESC LIMIT 1),
          ii.current_stock
        ) * ii.unit_cost
      ), 0)
      INTO   v_interval_end_inv
      FROM   public.inventory_items ii
      WHERE  ii.unit_cost IS NOT NULL AND ii.unit_cost > 0;

      v_interval_avg_inv := (v_interval_beg_inv + v_interval_end_inv) / 2.0;

      IF v_interval_avg_inv > 0 THEN
        v_interval_turnover := ROUND(v_interval_cogs / v_interval_avg_inv, 1);
      ELSE
        v_interval_turnover := 0;
      END IF;

      v_trend := v_trend || jsonb_build_object('label', v_interval_label, 'value', v_interval_turnover);
      v_interval_start := v_interval_end;
    END LOOP;

  ELSIF v_span_days <= 90 THEN
    -- Weekly intervals
    v_interval_start := v_date_from;
    v_week_counter := 1;
    WHILE v_interval_start < v_date_to LOOP
      v_interval_end := v_interval_start + INTERVAL '7 days';
      IF v_interval_end > v_date_to THEN
        v_interval_end := v_date_to;
      END IF;

      v_interval_label := 'Week ' || v_week_counter;

      -- Interval COGS
      SELECT COALESCE(SUM(ABS(it.quantity_changed) * ii.unit_cost), 0)
      INTO   v_interval_cogs
      FROM   public.inventory_transactions it
      JOIN   public.inventory_items ii ON ii.id = it.inventory_item_id
      WHERE  it.type = 'Automatic POS Deduction'
        AND  it.created_at >= v_interval_start
        AND  it.created_at <  v_interval_end
        AND  ii.unit_cost IS NOT NULL AND ii.unit_cost > 0;

      -- Interval beginning inventory
      SELECT COALESCE(SUM(
        COALESCE(
          (SELECT it2.new_stock FROM public.inventory_transactions it2
           WHERE it2.inventory_item_id = ii.id AND it2.created_at < v_interval_start
           ORDER BY it2.created_at DESC LIMIT 1),
          ii.current_stock
        ) * ii.unit_cost
      ), 0)
      INTO   v_interval_beg_inv
      FROM   public.inventory_items ii
      WHERE  ii.unit_cost IS NOT NULL AND ii.unit_cost > 0;

      -- Interval ending inventory
      SELECT COALESCE(SUM(
        COALESCE(
          (SELECT it2.new_stock FROM public.inventory_transactions it2
           WHERE it2.inventory_item_id = ii.id AND it2.created_at < v_interval_end
           ORDER BY it2.created_at DESC LIMIT 1),
          ii.current_stock
        ) * ii.unit_cost
      ), 0)
      INTO   v_interval_end_inv
      FROM   public.inventory_items ii
      WHERE  ii.unit_cost IS NOT NULL AND ii.unit_cost > 0;

      v_interval_avg_inv := (v_interval_beg_inv + v_interval_end_inv) / 2.0;

      IF v_interval_avg_inv > 0 THEN
        v_interval_turnover := ROUND(v_interval_cogs / v_interval_avg_inv, 1);
      ELSE
        v_interval_turnover := 0;
      END IF;

      v_trend := v_trend || jsonb_build_object('label', v_interval_label, 'value', v_interval_turnover);
      v_interval_start := v_interval_end;
      v_week_counter := v_week_counter + 1;
    END LOOP;

  ELSE
    -- Monthly intervals
    v_interval_start := v_date_from;
    WHILE v_interval_start < v_date_to LOOP
      v_interval_end := v_interval_start + INTERVAL '1 month';
      IF v_interval_end > v_date_to THEN
        v_interval_end := v_date_to;
      END IF;

      v_interval_label := TO_CHAR(v_interval_start AT TIME ZONE 'Asia/Manila', 'Mon YYYY');

      -- Interval COGS
      SELECT COALESCE(SUM(ABS(it.quantity_changed) * ii.unit_cost), 0)
      INTO   v_interval_cogs
      FROM   public.inventory_transactions it
      JOIN   public.inventory_items ii ON ii.id = it.inventory_item_id
      WHERE  it.type = 'Automatic POS Deduction'
        AND  it.created_at >= v_interval_start
        AND  it.created_at <  v_interval_end
        AND  ii.unit_cost IS NOT NULL AND ii.unit_cost > 0;

      -- Interval beginning inventory
      SELECT COALESCE(SUM(
        COALESCE(
          (SELECT it2.new_stock FROM public.inventory_transactions it2
           WHERE it2.inventory_item_id = ii.id AND it2.created_at < v_interval_start
           ORDER BY it2.created_at DESC LIMIT 1),
          ii.current_stock
        ) * ii.unit_cost
      ), 0)
      INTO   v_interval_beg_inv
      FROM   public.inventory_items ii
      WHERE  ii.unit_cost IS NOT NULL AND ii.unit_cost > 0;

      -- Interval ending inventory
      SELECT COALESCE(SUM(
        COALESCE(
          (SELECT it2.new_stock FROM public.inventory_transactions it2
           WHERE it2.inventory_item_id = ii.id AND it2.created_at < v_interval_end
           ORDER BY it2.created_at DESC LIMIT 1),
          ii.current_stock
        ) * ii.unit_cost
      ), 0)
      INTO   v_interval_end_inv
      FROM   public.inventory_items ii
      WHERE  ii.unit_cost IS NOT NULL AND ii.unit_cost > 0;

      v_interval_avg_inv := (v_interval_beg_inv + v_interval_end_inv) / 2.0;

      IF v_interval_avg_inv > 0 THEN
        v_interval_turnover := ROUND(v_interval_cogs / v_interval_avg_inv, 1);
      ELSE
        v_interval_turnover := 0;
      END IF;

      v_trend := v_trend || jsonb_build_object('label', v_interval_label, 'value', v_interval_turnover);
      v_interval_start := v_interval_end;
    END LOOP;
  END IF;

  -- ──────────────────────────────────────────────
  -- BUILD RESULT
  -- ──────────────────────────────────────────────
  v_result := jsonb_build_object(
    'turnoverRate',           v_turnover_rate,
    'daysInInventory',        v_days_in_inventory,
    'estimatedCogs',          ROUND(v_estimated_cogs, 2),
    'averageInventory',       ROUND(v_average_inventory, 2),
    'beginningInventory',     ROUND(v_beginning_inventory, 2),
    'endingInventory',        ROUND(v_ending_inventory, 2),
    'previousPeriodTurnover', v_prev_turnover,
    'changePercent',          v_change_percent,
    'missingCostCount',       v_missing_cost_count,
    'trend',                  v_trend
  );

  RETURN v_result;
END;
$$;
