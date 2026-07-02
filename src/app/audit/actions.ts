'use server';

import { createClient } from '@/app/lib/supabase/server';
import type { AuditLog } from './data';

// ── Helpers ──────────────────────────────────────────────────────────────────

type ActionResult<T = undefined> = T extends undefined
  ? { success: boolean; error?: string }
  : { success: boolean; error?: string; data?: T };

// ── Fetch Audit Logs (with server-side filtering & pagination) ───────────────

export interface AuditFilters {
  search?: string
  category?: string
  action?: string
  severity?: string
  userId?: string
  datePreset?: string
  customStartDate?: string
  customEndDate?: string
  page?: number
  pageSize?: number
}

export async function fetchAuditLogs(
  filters: AuditFilters = {}
): Promise<ActionResult<{ logs: AuditLog[]; totalCount: number }>> {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: 'Not authenticated.' };
  }

  const page = filters.page ?? 1;
  const pageSize = filters.pageSize ?? 50;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  // Build the query
  let query = supabase
    .from('audit_logs')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false });

  // ── Apply filters ──

  // Category filter
  if (filters.category && filters.category !== 'All') {
    query = query.eq('category', filters.category);
  }

  // Action filter
  if (filters.action && filters.action !== 'All') {
    query = query.eq('action', filters.action);
  }

  // Severity filter
  if (filters.severity && filters.severity !== 'All') {
    query = query.eq('severity', filters.severity);
  }

  // User filter (by user_id)
  if (filters.userId && filters.userId !== 'All') {
    query = query.eq('user_id', filters.userId);
  }

  // Date range filters
  if (filters.datePreset && filters.datePreset !== 'All') {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    switch (filters.datePreset) {
      case 'Today':
        query = query.gte('created_at', todayStart.toISOString());
        break;
      case 'Yesterday': {
        const yesterdayStart = new Date(todayStart);
        yesterdayStart.setDate(yesterdayStart.getDate() - 1);
        query = query
          .gte('created_at', yesterdayStart.toISOString())
          .lt('created_at', todayStart.toISOString());
        break;
      }
      case 'Last 7 Days': {
        const last7 = new Date(todayStart);
        last7.setDate(last7.getDate() - 7);
        query = query.gte('created_at', last7.toISOString());
        break;
      }
      case 'Last 30 Days': {
        const last30 = new Date(todayStart);
        last30.setDate(last30.getDate() - 30);
        query = query.gte('created_at', last30.toISOString());
        break;
      }
      case 'This Month': {
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        query = query.gte('created_at', monthStart.toISOString());
        break;
      }
      case 'Custom': {
        if (filters.customStartDate) {
          query = query.gte('created_at', new Date(filters.customStartDate).toISOString());
        }
        if (filters.customEndDate) {
          const endDate = new Date(filters.customEndDate);
          endDate.setHours(23, 59, 59, 999);
          query = query.lte('created_at', endDate.toISOString());
        }
        break;
      }
    }
  }

  // Search filter — matches across user_name, action (cast to text), target_name, target_id
  if (filters.search && filters.search.trim()) {
    const q = `%${filters.search.trim()}%`;
    query = query.or(
      `user_name.ilike.${q},target_name.ilike.${q},target_id.ilike.${q},user_email.ilike.${q}`
    );
  }

  // Apply pagination
  query = query.range(from, to);

  const { data, count, error } = await query;

  if (error) {
    return { success: false, error: error.message };
  }

  return {
    success: true,
    data: {
      logs: (data ?? []) as AuditLog[],
      totalCount: count ?? 0,
    },
  };
}

// ── Fetch unique users who have audit logs (for the User filter dropdown) ────

export async function fetchAuditUsers(): Promise<
  ActionResult<{ id: string; name: string }[]>
> {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: 'Not authenticated.' };
  }

  // Get distinct users from audit_logs using profiles table
  const { data, error } = await supabase
    .from('profiles')
    .select('id, display_name')
    .order('display_name', { ascending: true });

  if (error) {
    return { success: false, error: error.message };
  }

  return {
    success: true,
    data: (data ?? []).map((p) => ({ id: p.id, name: p.display_name })),
  };
}

// ── Application-Level Event Logging ──────────────────────────────────────────

/**
 * Logs application-level events (like Login, Logout, Report Export) that don't
 * correspond to database table mutations.
 */
export async function logAppEvent(
  action: import('./data').AuditAction,
  severity: import('./data').AuditSeverity,
  targetType: import('./data').AuditTargetType | null = null,
  targetName: string | null = null,
  details: any = null
): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Call the Postgres function we created in the migration
  const { error } = await supabase.rpc('insert_audit_log', {
    p_user_id: user?.id || null,
    p_category: getCategoryForAction(action),
    p_action: action,
    p_severity: severity,
    p_target_type: targetType,
    p_target_id: null,
    p_target_name: targetName,
    p_details: details ? details : null,
  });

  if (error) {
    console.error('Failed to log app event:', error.message);
  }
}

function getCategoryForAction(action: string): import('./data').AuditCategory {
  switch (action) {
    case 'User Login':
    case 'User Logout':
    case 'Failed Login':
    case 'Password Reset':
      return 'Authentication';
    case 'Report Exported':
      return 'Analytics';
    default:
      return 'System';
  }
}
