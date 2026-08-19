-- =====================================================================
-- Diagnostics Analytics: app_error_logs table + RPC functions
-- Consolidated single migration (replaces 4 previous files)
-- =====================================================================

-- Helper: relative time formatting
CREATE OR REPLACE FUNCTION diagnostics_relative_time(ts TIMESTAMPTZ)
RETURNS TEXT LANGUAGE sql STABLE AS $$
  SELECT CASE
    WHEN ts IS NULL THEN 'Unknown'
    WHEN now() - ts < interval '1 minute' THEN 'Just now'
    WHEN now() - ts < interval '1 hour'  THEN extract(minute from age(now(), ts))::int || ' minutes ago'
    WHEN now() - ts < interval '24 hours' THEN extract(hour from age(now(), ts))::int || ' hours ago'
    ELSE to_char(ts AT TIME ZONE 'Asia/Manila', 'Mon DD, HH:MI AM')
  END
$$;

-- ========================================
-- 1. App Error Logs Table
-- ========================================
CREATE TABLE IF NOT EXISTS public.app_error_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module      TEXT NOT NULL,
  severity    TEXT NOT NULL DEFAULT 'Warning'
              CHECK (severity IN ('Information','Warning','Critical')),
  message     TEXT NOT NULL,
  status      TEXT NOT NULL DEFAULT 'Open'
              CHECK (status IN ('Open','Resolved')),
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  metadata    JSONB,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_app_error_logs_created_at ON public.app_error_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_app_error_logs_status     ON public.app_error_logs(status);

ALTER TABLE public.app_error_logs ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='app_error_logs' AND policyname='Authenticated users can read error logs') THEN
    CREATE POLICY "Authenticated users can read error logs"
      ON public.app_error_logs FOR SELECT TO authenticated USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='app_error_logs' AND policyname='Authenticated users can insert error logs') THEN
    CREATE POLICY "Authenticated users can insert error logs"
      ON public.app_error_logs FOR INSERT TO authenticated WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='app_error_logs' AND policyname='Authenticated users can update error logs') THEN
    CREATE POLICY "Authenticated users can update error logs"
      ON public.app_error_logs FOR UPDATE TO authenticated USING (true);
  END IF;
END $$;

-- ========================================
-- 2. Insert Error Log (callable from app)
-- ========================================
CREATE OR REPLACE FUNCTION insert_error_log(
  p_module   TEXT,
  p_severity TEXT DEFAULT 'Warning',
  p_message  TEXT DEFAULT '',
  p_metadata JSONB DEFAULT NULL
) RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_id UUID;
BEGIN
  INSERT INTO app_error_logs (module, severity, message, metadata)
  VALUES (p_module, p_severity, p_message, p_metadata)
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$;

-- ========================================
-- 3. System Health
-- ========================================
CREATE OR REPLACE FUNCTION get_diagnostics_system_health()
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_last_sync TIMESTAMPTZ;
BEGIN
  SELECT MAX(synced_at) INTO v_last_sync FROM orders WHERE synced_at IS NOT NULL;
  RETURN jsonb_build_object(
    'serverTime',  now(),
    'dbSizeBytes', pg_database_size(current_database()),
    'lastSync',    v_last_sync
  );
END;
$$;

-- ========================================
-- 4. Database Health Metrics
-- ========================================
CREATE OR REPLACE FUNCTION get_diagnostics_db_health()
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_active_conn  INT;
  v_max_conn     INT;
  v_up_s         BIGINT;
  v_act INT; v_idl INT; v_wait INT; v_tot INT;
  v_slow         INT;
  v_chr          NUMERIC;
  v_db_bytes     BIGINT;
  v_total_bytes  BIGINT := 524288000;
  v_events       JSONB := '[]'::jsonb;
  v_status       TEXT;
BEGIN
  SELECT count(*) INTO v_active_conn
    FROM pg_stat_activity WHERE state='active' AND backend_type='client backend';
  SELECT setting::int INTO v_max_conn
    FROM pg_settings WHERE name='max_connections';
  SELECT extract(epoch from now()-pg_postmaster_start_time())::bigint INTO v_up_s;

  SELECT count(*) FILTER (WHERE state='active'),
         count(*) FILTER (WHERE state='idle'),
         count(*) FILTER (WHERE wait_event_type IS NOT NULL AND state='active'),
         count(*)
    INTO v_act, v_idl, v_wait, v_tot
    FROM pg_stat_activity WHERE backend_type='client backend';

  SELECT count(*) INTO v_slow
    FROM pg_stat_activity
   WHERE state='active' AND now()-query_start>interval '5 seconds'
     AND backend_type='client backend';

  SELECT CASE WHEN COALESCE(sum(heap_blks_hit),0)+COALESCE(sum(heap_blks_read),0)=0 THEN 100.0
         ELSE round(COALESCE(sum(heap_blks_hit),0)::numeric/
              (COALESCE(sum(heap_blks_hit),0)+COALESCE(sum(heap_blks_read),0))*100,2) END
    INTO v_chr FROM pg_statio_user_tables;

  SELECT pg_database_size(current_database()) INTO v_db_bytes;

  -- Build events array chronologically using a CTE
  -- Cast audit_action enum to TEXT for UNION ALL compatibility
  v_events := COALESCE((
    WITH raw_events AS (
      SELECT 'evt_vacuum'::text AS id, 'Automatic Vacuum Completed'::text AS name, max(last_autovacuum) AS ts
        FROM pg_stat_user_tables WHERE last_autovacuum IS NOT NULL
      UNION ALL
      SELECT 'evt_analyze'::text AS id, 'Auto-Analyze Completed'::text AS name, max(last_autoanalyze) AS ts
        FROM pg_stat_user_tables WHERE last_autoanalyze IS NOT NULL
      UNION ALL
      SELECT sub.id::text AS id, sub.action::text AS name, sub.created_at AS ts
        FROM (SELECT id, action, created_at FROM audit_logs ORDER BY created_at DESC LIMIT 4) sub
    )
    SELECT jsonb_agg(jsonb_build_object(
             'id', id,
             'name', name,
             'timestamp', diagnostics_relative_time(ts)
           ))
      FROM (
        SELECT * FROM raw_events
        WHERE ts IS NOT NULL
        ORDER BY ts DESC
        LIMIT 4
      ) sorted_events
  ), '[]'::jsonb);

  IF v_chr<80 OR v_active_conn::numeric/GREATEST(v_max_conn,1)>0.8 THEN v_status:='Critical';
  ELSIF v_slow>0 OR v_chr<95 THEN v_status:='Warning';
  ELSE v_status:='Healthy'; END IF;

  RETURN jsonb_build_object(
    'connectionPool', jsonb_build_object('active',v_active_conn,'max',v_max_conn),
    'uptime',         jsonb_build_object('days',(v_up_s/86400)::int,'hours',((v_up_s%86400)/3600)::int),
    'sessions',       jsonb_build_object('active',v_act,'idle',v_idl,'waiting',v_wait,'total',v_tot),
    'slowQueriesCount', v_slow,
    'cacheHitRatio',    v_chr,
    'storage',        jsonb_build_object(
      'usedGB', round(v_db_bytes::numeric/(1024*1024*1024),2),
      'totalGB',round(v_total_bytes::numeric/(1024*1024*1024),2)),
    'recentEvents',   v_events,
    'overallStatus',  v_status
  );
END;
$$;

-- ========================================
-- 5. Database Performance Metrics
-- ========================================
CREATE OR REPLACE FUNCTION get_diagnostics_db_performance()
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_avg NUMERIC:=0; v_slow NUMERIC:=0; v_fast NUMERIC:=0;
  v_sname TEXT:='N/A';
  v_r NUMERIC:=0; v_i NUMERIC:=0; v_u NUMERIC:=0;
  v_commit BIGINT:=0; v_roll BIGINT:=0;
  v_ups NUMERIC; v_tpm NUMERIC:=0; v_sr NUMERIC:=100;
  v_recs JSONB:='[]'::jsonb;
  v_chr NUMERIC:=100;
  v_has_pgss BOOLEAN;
BEGIN
  SELECT EXISTS(SELECT 1 FROM pg_extension WHERE extname='pg_stat_statements') INTO v_has_pgss;

  IF v_has_pgss THEN
    SELECT COALESCE(round(avg(mean_exec_time)::numeric,2),0),
           COALESCE(round(max(mean_exec_time)::numeric,2),0),
           COALESCE(round(min(CASE WHEN calls>10 THEN mean_exec_time END)::numeric,2),0)
      INTO v_avg, v_slow, v_fast
      FROM pg_stat_statements
     WHERE dbid=(SELECT oid FROM pg_database WHERE datname=current_database())
       AND calls>0 AND query !~* 'pg_stat|pg_settings|pg_database|diagnostics|pg_postmaster';

    SELECT LEFT(regexp_replace(query,'\s+',' ','g'),80) INTO v_sname
      FROM pg_stat_statements
     WHERE dbid=(SELECT oid FROM pg_database WHERE datname=current_database())
       AND calls>0 AND query !~* 'pg_stat|pg_settings|pg_database|diagnostics|pg_postmaster'
     ORDER BY mean_exec_time DESC LIMIT 1;

    SELECT COALESCE(round(avg(CASE WHEN query ~* '^\s*(SELECT|WITH)' THEN mean_exec_time END)::numeric,2),0),
           COALESCE(round(avg(CASE WHEN query ~* '^\s*INSERT' THEN mean_exec_time END)::numeric,2),0),
           COALESCE(round(avg(CASE WHEN query ~* '^\s*UPDATE' THEN mean_exec_time END)::numeric,2),0)
      INTO v_r, v_i, v_u
      FROM pg_stat_statements
     WHERE dbid=(SELECT oid FROM pg_database WHERE datname=current_database()) AND calls>0;
  END IF;

  SELECT COALESCE(xact_commit,0),COALESCE(xact_rollback,0)
    INTO v_commit,v_roll FROM pg_stat_database WHERE datname=current_database();

  SELECT extract(epoch from now()-pg_postmaster_start_time()) INTO v_ups;
  IF v_ups>0 THEN v_tpm:=round(v_commit::numeric/(v_ups/60)); END IF;
  IF (v_commit+v_roll)>0 THEN v_sr:=round(v_commit::numeric/(v_commit+v_roll)*100,2); END IF;

  SELECT CASE WHEN COALESCE(sum(heap_blks_hit),0)+COALESCE(sum(heap_blks_read),0)=0 THEN 100.0
         ELSE round(COALESCE(sum(heap_blks_hit),0)::numeric/
              (COALESCE(sum(heap_blks_hit),0)+COALESCE(sum(heap_blks_read),0))*100,2) END
    INTO v_chr FROM pg_statio_user_tables;

  -- Recommendations
  IF v_avg<=50 THEN
    v_recs:=v_recs||jsonb_build_array(jsonb_build_object('id','rec_1','type','Success',
      'message','Query performance is within acceptable limits.'));
  ELSE
    v_recs:=v_recs||jsonb_build_array(jsonb_build_object('id','rec_1','type','Warning',
      'message',format('Average query time is %sms. Consider optimizing frequent queries.', round(v_avg, 1))));
  END IF;

  IF v_chr>=95 THEN
    v_recs:=v_recs||jsonb_build_array(jsonb_build_object('id','rec_2','type','Success',
      'message',format('Cache hit ratio is excellent at %s%%.', round(v_chr, 1))));
  ELSIF v_chr>=80 THEN
    v_recs:=v_recs||jsonb_build_array(jsonb_build_object('id','rec_2','type','Warning',
      'message',format('Cache hit ratio is %s%%. Consider increasing shared_buffers.', round(v_chr, 1))));
  ELSE
    v_recs:=v_recs||jsonb_build_array(jsonb_build_object('id','rec_2','type','Critical',
      'message',format('Cache hit ratio is poor at %s%%.', round(v_chr, 1))));
  END IF;

  IF v_slow>500 THEN
    v_recs:=v_recs||jsonb_build_array(jsonb_build_object('id','rec_3','type','Warning',
      'message',format('Slowest query averages %sms. Consider adding indexes.', round(v_slow))));
  END IF;
  IF v_roll>10 THEN
    v_recs:=v_recs||jsonb_build_array(jsonb_build_object('id','rec_4','type','Warning',
      'message',format('%s transaction rollbacks detected. Review error handling.',v_roll)));
  END IF;

  RETURN jsonb_build_object(
    'averageQueryTimeMs',  v_avg,  'slowestQueryMs',    v_slow,
    'slowestQueryName',    COALESCE(v_sname,'N/A'),
    'fastestQueryMs',      v_fast,
    'averageInsertTimeMs', v_i,    'averageUpdateTimeMs',v_u,
    'averageReadTimeMs',   v_r,
    'transactionsPerMinute',v_tpm, 'tpmHistory','[]'::jsonb,
    'querySuccessRate',    v_sr,   'failedQueriesCount', v_roll,
    'responseTrend','[]'::jsonb,   'recommendations',    v_recs
  );
END;
$$;

-- ========================================
-- 6. Warning Conditions
-- ========================================
CREATE OR REPLACE FUNCTION get_diagnostics_warnings()
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_w JSONB:='[]'::jsonb;
  v_items TEXT[]; v_cnt INT:=0;
  v_n BIGINT; v_db BIGINT; v_lim BIGINT:=524288000;
  v_oe INT; v_sq INT; v_rc INT;
BEGIN
  SELECT array_agg(name),count(*) INTO v_items,v_cnt
    FROM inventory_items WHERE current_stock<=low_stock_threshold AND low_stock_threshold>0;
  IF COALESCE(v_cnt,0)>0 THEN
    v_w:=v_w||to_jsonb(format('%s ingredient(s) are critically low (%s).',v_cnt,
      array_to_string(v_items[1:3],', ')||CASE WHEN v_cnt>3 THEN ', ...' ELSE '' END));
  END IF;

  SELECT count(*) INTO v_n FROM audit_logs;
  IF v_n>8000 THEN
    v_w:=v_w||to_jsonb(format('Audit log storage nearing capacity (%s%%).',round(v_n::numeric/10000*100)));
  END IF;

  SELECT pg_database_size(current_database()) INTO v_db;
  IF v_db::numeric/v_lim>0.8 THEN
    v_w:=v_w||to_jsonb(format('Database storage at %s%% capacity (%sMB / %sMB).',
      round(v_db::numeric/v_lim*100),round(v_db::numeric/(1024*1024)),round(v_lim::numeric/(1024*1024))));
  END IF;

  SELECT count(*) INTO v_oe FROM app_error_logs WHERE status='Open';
  IF v_oe>0 THEN
    v_w:=v_w||to_jsonb(format('%s unresolved application error(s) require attention.',v_oe));
  END IF;

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

  SELECT count(*) INTO v_rc FROM audit_logs
   WHERE severity IN ('High','Critical') AND created_at>now()-interval '24 hours';
  IF v_rc>0 THEN
    v_w:=v_w||to_jsonb(format('%s high-severity event(s) detected in the last 24 hours.',v_rc));
  END IF;

  RETURN v_w;
END;
$$;

-- ========================================
-- 7. Error Logs
-- ========================================
CREATE OR REPLACE FUNCTION get_diagnostics_error_logs(p_limit INT DEFAULT 50)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN COALESCE((
    SELECT jsonb_agg(e) FROM (
      SELECT jsonb_build_object(
        'id',id::text,'timestamp',created_at,
        'module',module,'severity',severity,
        'message',message,'status',status) AS e
      FROM app_error_logs ORDER BY created_at DESC LIMIT p_limit
    ) sub
  ),'[]'::jsonb);
END;
$$;

-- ========================================
-- 8. Seed sample error logs (only if table is empty)
-- ========================================
INSERT INTO app_error_logs (module,severity,message,status,created_at)
SELECT * FROM (VALUES
  ('Inventory','Warning','Supplier API timeout during stock sync.','Resolved',now()-interval '10 minutes'),
  ('Customer Management','Critical','Failed to generate QR code for Card #11054.','Open',now()-interval '25 minutes'),
  ('Authentication','Warning','Rate limit exceeded for endpoint /api/auth.','Resolved',now()-interval '3 hours'),
  ('POS','Information','Offline receipt sync queue reached 50 items.','Open',now()-interval '12 hours'),
  ('Sales','Warning','Payment gateway response time exceeded 5s threshold.','Resolved',now()-interval '1 day'),
  ('Inventory','Critical','Failed to deduct stock for order #ORD-2026-0847.','Open',now()-interval '2 hours')
) AS v(module,severity,message,status,created_at)
WHERE NOT EXISTS (SELECT 1 FROM app_error_logs LIMIT 1);
