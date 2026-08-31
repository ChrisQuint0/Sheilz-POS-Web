-- Add 'Audit Logs Exported' to audit_action enum
ALTER TYPE public.audit_action ADD VALUE IF NOT EXISTS 'Audit Logs Exported';
