-- ============================================================================
-- Add 'Inactive Login Attempt' to audit_action enum
-- ============================================================================

ALTER TYPE public.audit_action ADD VALUE IF NOT EXISTS 'Inactive Login Attempt';
