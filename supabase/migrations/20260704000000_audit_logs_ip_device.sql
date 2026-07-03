-- ============================================================================
-- AUDIT LOGS IP & DEVICE: Extract IP and Device from headers
-- ============================================================================

-- Drop the old signature (8 arguments)
DROP FUNCTION IF EXISTS public.insert_audit_log(UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, JSONB);

-- Create new signature (10 arguments)
CREATE OR REPLACE FUNCTION public.insert_audit_log(
    p_user_id UUID,
    p_category TEXT,
    p_action TEXT,
    p_severity TEXT,
    p_target_type TEXT,
    p_target_id TEXT,
    p_target_name TEXT,
    p_details JSONB DEFAULT NULL,
    p_ip_address TEXT DEFAULT NULL,
    p_device TEXT DEFAULT NULL
) RETURNS VOID AS $$
DECLARE
    v_user_name TEXT;
    v_user_role TEXT;
    v_user_email TEXT;
    v_req_headers JSONB;
BEGIN
    -- Attempt to get IP and Device from PostgREST headers if not provided
    BEGIN
        v_req_headers := current_setting('request.headers', true)::jsonb;
        
        IF p_ip_address IS NULL THEN
            p_ip_address := v_req_headers->>'x-forwarded-for';
            IF p_ip_address IS NULL THEN
                 p_ip_address := v_req_headers->>'x-real-ip';
            END IF;
            
            -- If multiple IPs in x-forwarded-for, take the first one
            IF p_ip_address LIKE '%,%' THEN
                p_ip_address := split_part(p_ip_address, ',', 1);
            END IF;
        END IF;
        
        IF p_device IS NULL THEN
            p_device := v_req_headers->>'user-agent';
        END IF;
    EXCEPTION WHEN OTHERS THEN
        -- Ignore errors if not called via PostgREST context
    END;

    -- Look up the acting user's profile snapshot
    IF p_user_id IS NOT NULL THEN
        SELECT display_name, role, email
        INTO v_user_name, v_user_role, v_user_email
        FROM public.profiles
        WHERE id = p_user_id;
    END IF;

    -- Fallback if user not found (e.g. system-triggered or user already deleted)
    v_user_name  := COALESCE(v_user_name,  'System');
    v_user_role  := COALESCE(v_user_role,  'System');
    v_user_email := COALESCE(v_user_email, 'system@internal');

    INSERT INTO public.audit_logs (
        user_id, user_name, user_role, user_email,
        category, action, severity,
        target_type, target_id, target_name,
        details, ip_address, device
    ) VALUES (
        p_user_id, v_user_name, v_user_role, v_user_email,
        p_category::public.audit_category, 
        p_action::public.audit_action, 
        p_severity::public.audit_severity,
        p_target_type::public.audit_target_type, 
        p_target_id, p_target_name,
        p_details, p_ip_address, p_device
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
