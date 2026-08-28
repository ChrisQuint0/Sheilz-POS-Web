-- ============================================================
-- Migration: Add optional p_ingredient_id filter to get_inventory_turnover
--            + fix division-by-zero on days_in_inventory when COGS = 0
--            + fix historical stock fallback (use 0 instead of current_stock)
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_inventory_turnover(
  p_date_from     TIMESTAMPTZ DEFAULT NULL,
  p_date_to       TIMESTAMPTZ DEFAULT NULL,
  p_ingredient_id UUID        DEFAULT NULL
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
  -- Calculate span (DATE subtraction gives correct total days across months)
  v_span_days := GREATEST((v_date_to::DATE - v_date_from::DATE), 1);

  -- Previous period (same duration, immediately before)
  v_prev_from := v_date_from - (v_date_to - v_date_from);
  v_prev_to   := v_date_from;

  -- ──────────────────────────────────────────────
  -- Count ingredients missing unit_cost
  -- (scoped to ingredient filter if provided)
  -- ──────────────────────────────────────────────
  SELECT COUNT(*)
  INTO   v_missing_cost_count
  FROM   public.inventory_items
  WHERE  (unit_cost IS NULL OR unit_cost <= 0)
    AND  (p_ingredient_id IS NULL OR id = p_ingredient_id);

  -- ──────────────────────────────────────────────
  -- ESTIMATED COGS (current period)
  -- ──────────────────────────────────────────────
  SELECT COALESCE(SUM(ABS(it.quantity_changed) * ii.unit_cost), 0)
  INTO   v_estimated_cogs
  FROM   public.inventory_transactions it
  JOIN   public.inventory_items ii ON ii.id = it.inventory_item_id
  WHERE  it.type = 'Automatic POS Deduction'
    AND  it.created_at >= v_date_from
    AND  it.created_at <  v_date_to
    AND  ii.unit_cost IS NOT NULL
    AND  ii.unit_cost >  0
    AND  (p_ingredient_id IS NULL OR ii.id = p_ingredient_id);

  -- ──────────────────────────────────────────────
  -- BEGINNING INVENTORY
  -- Last new_stock before period start × unit_cost.
  -- FIX: fallback to 0 (not current_stock) when no prior transactions exist,
  --      because current_stock reflects today, not the historical start date.
  -- ──────────────────────────────────────────────
  SELECT COALESCE(SUM(
    COALESCE(
      (SELECT it.new_stock
       FROM   public.inventory_transactions it
       WHERE  it.inventory_item_id = ii.id
         AND  it.created_at < v_date_from
       ORDER BY it.created_at DESC
       LIMIT 1),
      0
    ) * ii.unit_cost
  ), 0)
  INTO   v_beginning_inventory
  FROM   public.inventory_items ii
  WHERE  ii.unit_cost IS NOT NULL
    AND  ii.unit_cost >  0
    AND  (p_ingredient_id IS NULL OR ii.id = p_ingredient_id);

  -- ──────────────────────────────────────────────
  -- ENDING INVENTORY
  -- Last new_stock before period end × unit_cost.
  -- FIX: same fallback to 0 as above.
  -- ──────────────────────────────────────────────
  SELECT COALESCE(SUM(
    COALESCE(
      (SELECT it.new_stock
       FROM   public.inventory_transactions it
       WHERE  it.inventory_item_id = ii.id
         AND  it.created_at < v_date_to
       ORDER BY it.created_at DESC
       LIMIT 1),
      0
    ) * ii.unit_cost
  ), 0)
  INTO   v_ending_inventory
  FROM   public.inventory_items ii
  WHERE  ii.unit_cost IS NOT NULL
    AND  ii.unit_cost >  0
    AND  (p_ingredient_id IS NULL OR ii.id = p_ingredient_id);

  -- ──────────────────────────────────────────────
  -- AVERAGE INVENTORY & TURNOVER
  -- FIX: guard against division by zero on days_in_inventory
  --      when COGS = 0 (turnover = 0 → 1/0 crash)
  -- ──────────────────────────────────────────────
  v_average_inventory := (v_beginning_inventory + v_ending_inventory) / 2.0;

  IF v_average_inventory > 0 THEN
    v_turnover_rate := ROUND(v_estimated_cogs / v_average_inventory, 1);
    IF v_turnover_rate > 0 THEN
      v_days_in_inventory := ROUND(v_span_days::NUMERIC / v_turnover_rate, 1);
    ELSE
      v_days_in_inventory := NULL;
    END IF;
  ELSE
    v_turnover_rate     := NULL;
    v_days_in_inventory := NULL;
  END IF;

  -- ──────────────────────────────────────────────
  -- PREVIOUS PERIOD TURNOVER (for comparison %)
  -- ──────────────────────────────────────────────
  SELECT COALESCE(SUM(ABS(it.quantity_changed) * ii.unit_cost), 0)
  INTO   v_prev_cogs
  FROM   public.inventory_transactions it
  JOIN   public.inventory_items ii ON ii.id = it.inventory_item_id
  WHERE  it.type = 'Automatic POS Deduction'
    AND  it.created_at >= v_prev_from
    AND  it.created_at <  v_prev_to
    AND  ii.unit_cost IS NOT NULL
    AND  ii.unit_cost >  0
    AND  (p_ingredient_id IS NULL OR ii.id = p_ingredient_id);

  SELECT COALESCE(SUM(
    COALESCE(
      (SELECT it.new_stock
       FROM   public.inventory_transactions it
       WHERE  it.inventory_item_id = ii.id
         AND  it.created_at < v_prev_from
       ORDER BY it.created_at DESC
       LIMIT 1),
      0
    ) * ii.unit_cost
  ), 0)
  INTO   v_prev_beg_inv
  FROM   public.inventory_items ii
  WHERE  ii.unit_cost IS NOT NULL
    AND  ii.unit_cost >  0
    AND  (p_ingredient_id IS NULL OR ii.id = p_ingredient_id);

  SELECT COALESCE(SUM(
    COALESCE(
      (SELECT it.new_stock
       FROM   public.inventory_transactions it
       WHERE  it.inventory_item_id = ii.id
         AND  it.created_at < v_prev_to
       ORDER BY it.created_at DESC
       LIMIT 1),
      0
    ) * ii.unit_cost
  ), 0)
  INTO   v_prev_end_inv
  FROM   public.inventory_items ii
  WHERE  ii.unit_cost IS NOT NULL
    AND  ii.unit_cost >  0
    AND  (p_ingredient_id IS NULL OR ii.id = p_ingredient_id);

  v_prev_avg_inv := (v_prev_beg_inv + v_prev_end_inv) / 2.0;

  IF v_prev_avg_inv > 0 THEN
    v_prev_turnover := ROUND(v_prev_cogs / v_prev_avg_inv, 1);
  ELSE
    v_prev_turnover := NULL;
  END IF;

  IF v_turnover_rate IS NOT NULL AND v_prev_turnover IS NOT NULL AND v_prev_turnover > 0 THEN
    v_change_percent := ROUND(((v_turnover_rate - v_prev_turnover) / v_prev_turnover) * 100, 1);
  ELSE
    v_change_percent := NULL;
  END IF;

  -- ──────────────────────────────────────────────
  -- TREND CHART
  -- ≤14 days → daily  |  ≤90 days → weekly  |  >90 → monthly
  -- Each interval is independently calculated (COGS / avg inventory)
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

      SELECT COALESCE(SUM(ABS(it.quantity_changed) * ii.unit_cost), 0)
      INTO   v_interval_cogs
      FROM   public.inventory_transactions it
      JOIN   public.inventory_items ii ON ii.id = it.inventory_item_id
      WHERE  it.type = 'Automatic POS Deduction'
        AND  it.created_at >= v_interval_start
        AND  it.created_at <  v_interval_end
        AND  ii.unit_cost IS NOT NULL AND ii.unit_cost > 0
        AND  (p_ingredient_id IS NULL OR ii.id = p_ingredient_id);

      SELECT COALESCE(SUM(
        COALESCE(
          (SELECT it2.new_stock FROM public.inventory_transactions it2
           WHERE it2.inventory_item_id = ii.id AND it2.created_at < v_interval_start
           ORDER BY it2.created_at DESC LIMIT 1),
          0
        ) * ii.unit_cost
      ), 0)
      INTO   v_interval_beg_inv
      FROM   public.inventory_items ii
      WHERE  ii.unit_cost IS NOT NULL AND ii.unit_cost > 0
        AND  (p_ingredient_id IS NULL OR ii.id = p_ingredient_id);

      SELECT COALESCE(SUM(
        COALESCE(
          (SELECT it2.new_stock FROM public.inventory_transactions it2
           WHERE it2.inventory_item_id = ii.id AND it2.created_at < v_interval_end
           ORDER BY it2.created_at DESC LIMIT 1),
          0
        ) * ii.unit_cost
      ), 0)
      INTO   v_interval_end_inv
      FROM   public.inventory_items ii
      WHERE  ii.unit_cost IS NOT NULL AND ii.unit_cost > 0
        AND  (p_ingredient_id IS NULL OR ii.id = p_ingredient_id);

      v_interval_avg_inv := (v_interval_beg_inv + v_interval_end_inv) / 2.0;

      IF v_interval_avg_inv > 0 AND v_interval_cogs > 0 THEN
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
    v_week_counter   := 1;
    WHILE v_interval_start < v_date_to LOOP
      v_interval_end := v_interval_start + INTERVAL '7 days';
      IF v_interval_end > v_date_to THEN
        v_interval_end := v_date_to;
      END IF;

      v_interval_label := 'Week ' || v_week_counter;

      SELECT COALESCE(SUM(ABS(it.quantity_changed) * ii.unit_cost), 0)
      INTO   v_interval_cogs
      FROM   public.inventory_transactions it
      JOIN   public.inventory_items ii ON ii.id = it.inventory_item_id
      WHERE  it.type = 'Automatic POS Deduction'
        AND  it.created_at >= v_interval_start
        AND  it.created_at <  v_interval_end
        AND  ii.unit_cost IS NOT NULL AND ii.unit_cost > 0
        AND  (p_ingredient_id IS NULL OR ii.id = p_ingredient_id);

      SELECT COALESCE(SUM(
        COALESCE(
          (SELECT it2.new_stock FROM public.inventory_transactions it2
           WHERE it2.inventory_item_id = ii.id AND it2.created_at < v_interval_start
           ORDER BY it2.created_at DESC LIMIT 1),
          0
        ) * ii.unit_cost
      ), 0)
      INTO   v_interval_beg_inv
      FROM   public.inventory_items ii
      WHERE  ii.unit_cost IS NOT NULL AND ii.unit_cost > 0
        AND  (p_ingredient_id IS NULL OR ii.id = p_ingredient_id);

      SELECT COALESCE(SUM(
        COALESCE(
          (SELECT it2.new_stock FROM public.inventory_transactions it2
           WHERE it2.inventory_item_id = ii.id AND it2.created_at < v_interval_end
           ORDER BY it2.created_at DESC LIMIT 1),
          0
        ) * ii.unit_cost
      ), 0)
      INTO   v_interval_end_inv
      FROM   public.inventory_items ii
      WHERE  ii.unit_cost IS NOT NULL AND ii.unit_cost > 0
        AND  (p_ingredient_id IS NULL OR ii.id = p_ingredient_id);

      v_interval_avg_inv := (v_interval_beg_inv + v_interval_end_inv) / 2.0;

      IF v_interval_avg_inv > 0 AND v_interval_cogs > 0 THEN
        v_interval_turnover := ROUND(v_interval_cogs / v_interval_avg_inv, 1);
      ELSE
        v_interval_turnover := 0;
      END IF;

      v_trend := v_trend || jsonb_build_object('label', v_interval_label, 'value', v_interval_turnover);
      v_interval_start := v_interval_end;
      v_week_counter   := v_week_counter + 1;
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

      SELECT COALESCE(SUM(ABS(it.quantity_changed) * ii.unit_cost), 0)
      INTO   v_interval_cogs
      FROM   public.inventory_transactions it
      JOIN   public.inventory_items ii ON ii.id = it.inventory_item_id
      WHERE  it.type = 'Automatic POS Deduction'
        AND  it.created_at >= v_interval_start
        AND  it.created_at <  v_interval_end
        AND  ii.unit_cost IS NOT NULL AND ii.unit_cost > 0
        AND  (p_ingredient_id IS NULL OR ii.id = p_ingredient_id);

      SELECT COALESCE(SUM(
        COALESCE(
          (SELECT it2.new_stock FROM public.inventory_transactions it2
           WHERE it2.inventory_item_id = ii.id AND it2.created_at < v_interval_start
           ORDER BY it2.created_at DESC LIMIT 1),
          0
        ) * ii.unit_cost
      ), 0)
      INTO   v_interval_beg_inv
      FROM   public.inventory_items ii
      WHERE  ii.unit_cost IS NOT NULL AND ii.unit_cost > 0
        AND  (p_ingredient_id IS NULL OR ii.id = p_ingredient_id);

      SELECT COALESCE(SUM(
        COALESCE(
          (SELECT it2.new_stock FROM public.inventory_transactions it2
           WHERE it2.inventory_item_id = ii.id AND it2.created_at < v_interval_end
           ORDER BY it2.created_at DESC LIMIT 1),
          0
        ) * ii.unit_cost
      ), 0)
      INTO   v_interval_end_inv
      FROM   public.inventory_items ii
      WHERE  ii.unit_cost IS NOT NULL AND ii.unit_cost > 0
        AND  (p_ingredient_id IS NULL OR ii.id = p_ingredient_id);

      v_interval_avg_inv := (v_interval_beg_inv + v_interval_end_inv) / 2.0;

      IF v_interval_avg_inv > 0 AND v_interval_cogs > 0 THEN
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
