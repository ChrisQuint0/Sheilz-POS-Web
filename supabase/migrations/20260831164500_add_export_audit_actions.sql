-- Add new actions for exporting
ALTER TYPE public.audit_action ADD VALUE IF NOT EXISTS 'Diagnostic Exported';
ALTER TYPE public.audit_action ADD VALUE IF NOT EXISTS 'Dashboard Exported';
ALTER TYPE public.audit_action ADD VALUE IF NOT EXISTS 'Sales History Exported';
