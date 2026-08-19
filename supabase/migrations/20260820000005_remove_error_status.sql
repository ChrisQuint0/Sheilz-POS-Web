-- =====================================================================
-- 1. Drop status from app_error_logs table
-- =====================================================================
ALTER TABLE public.app_error_logs DROP COLUMN IF EXISTS status;
DROP INDEX IF EXISTS idx_app_error_logs_status;

-- =====================================================================
-- 2. Update warnings RPC to count errors in last 24h instead of "Open"
-- =====================================================================
CREATE OR REPLACE FUNCTION get_diagnostics_warnings()
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_w JSONB:='[]'::jsonb;
  v_items TEXT[]; v_cnt INT:=0;
  v_n BIGINT; v_db BIGINT; v_lim BIGINT:=524288000;
  v_oe INT; v_sq INT; v_rc INT;
BEGIN
  -- Inventory warning
  SELECT array_agg(name),count(*) INTO v_items,v_cnt
    FROM inventory_items WHERE current_stock<=low_stock_threshold AND low_stock_threshold>0;
  IF COALESCE(v_cnt,0)>0 THEN
    v_w:=v_w||to_jsonb(format('%s ingredient(s) are critically low (%s).',v_cnt,
      array_to_string(v_items[1:3],', ')||CASE WHEN v_cnt>3 THEN ', ...' ELSE '' END));
  END IF;

  -- Audit log capacity warning
  SELECT count(*) INTO v_n FROM audit_logs;
  IF v_n>8000 THEN
    v_w:=v_w||to_jsonb(format('Audit log storage nearing capacity (%s%%).',round(v_n::numeric/10000*100)));
  END IF;

  -- Database storage warning
  SELECT pg_database_size(current_database()) INTO v_db;
  IF v_db::numeric/v_lim>0.8 THEN
    v_w:=v_w||to_jsonb(format('Database storage at %s%% capacity (%sMB / %sMB).',
      round(v_db::numeric/v_lim*100),round(v_db::numeric/(1024*1024)),round(v_lim::numeric/(1024*1024))));
  END IF;

  -- Application errors warning (updated logic)
  SELECT count(*) INTO v_oe FROM app_error_logs WHERE created_at > now() - interval '24 hours';
  IF v_oe>0 THEN
    v_w:=v_w||to_jsonb(format('%s application error(s) logged in the last 24 hours.',v_oe));
  END IF;

  -- Slow query warning
  BEGIN
    SELECT count(*) INTO v_sq FROM pg_stat_statements
     WHERE dbid=(SELECT oid FROM pg_database WHERE datname=current_database())
       AND mean_exec_time>200 AND calls>5
       AND query !~* 'pg_stat|pg_settings|pg_database|diagnostics';
    IF COALESCE(v_sq,0)>0 THEN
      v_w:=v_w||to_jsonb(format('Slow database queries detected (%s queries averaging > 200ms).',v_sq));
    END IF;
  EXCEPTION WHEN undefined_table THEN NULL;
  END;

  -- Audit high-severity events warning
  SELECT count(*) INTO v_rc FROM audit_logs
   WHERE severity IN ('High','Critical') AND created_at>now()-interval '24 hours';
  IF v_rc>0 THEN
    v_w:=v_w||to_jsonb(format('%s high-severity event(s) detected in the last 24 hours.',v_rc));
  END IF;

  RETURN v_w;
END;
$$;

-- =====================================================================
-- 3. Update error logs RPC to remove status field from JSON
-- =====================================================================
CREATE OR REPLACE FUNCTION get_diagnostics_error_logs(p_limit INT DEFAULT 50)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN COALESCE((
    SELECT jsonb_agg(e) FROM (
      SELECT jsonb_build_object(
        'id',id::text,
        'timestamp',created_at,
        'module',module,
        'severity',severity,
        'message',message
      ) AS e
      FROM app_error_logs ORDER BY created_at DESC LIMIT p_limit
    ) sub
  ),'[]'::jsonb);
END;
$$;
