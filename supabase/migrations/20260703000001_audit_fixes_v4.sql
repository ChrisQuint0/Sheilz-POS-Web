-- ============================================================================
-- AUDIT LOGS FIXES V4: Resolving Function Overloads & Profile Logging
-- ============================================================================

-- 1. Drop all possible existing signatures of insert_audit_log to avoid PGRST203 overloads
DROP FUNCTION IF EXISTS public.insert_audit_log(UUID, public.audit_category, public.audit_action, public.audit_severity, public.audit_target_type, TEXT, TEXT, JSONB);
DROP FUNCTION IF EXISTS public.insert_audit_log(UUID, public.audit_category, public.audit_action, public.audit_severity, TEXT, TEXT, TEXT, JSONB);
DROP FUNCTION IF EXISTS public.insert_audit_log(UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, JSONB);

-- 2. Create the definitive flexible insert_audit_log function
CREATE OR REPLACE FUNCTION public.insert_audit_log(
    p_user_id UUID,
    p_category TEXT,
    p_action TEXT,
    p_severity TEXT,
    p_target_type TEXT,
    p_target_id TEXT,
    p_target_name TEXT,
    p_details JSONB DEFAULT NULL
) RETURNS VOID AS $$
DECLARE
    v_user_name TEXT;
    v_user_role TEXT;
    v_user_email TEXT;
BEGIN
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
        details
    ) VALUES (
        p_user_id, v_user_name, v_user_role, v_user_email,
        p_category::public.audit_category, 
        p_action::public.audit_action, 
        p_severity::public.audit_severity,
        p_target_type::public.audit_target_type, 
        p_target_id, p_target_name,
        p_details
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 3. Update Profiles Trigger to skip INSERT (we will log manually to preserve Actor ID)
CREATE OR REPLACE FUNCTION public.audit_profiles_trigger()
RETURNS TRIGGER AS $$
DECLARE
    v_action public.audit_action;
    v_severity public.audit_severity;
    v_details JSONB := '{}';
    v_actor UUID;
    v_target_name TEXT;
BEGIN
    v_actor := auth.uid();

    IF TG_OP = 'UPDATE' THEN
        v_target_name := NEW.display_name;

        -- Prevent double-logging when user is first created and role is immediately updated
        IF EXTRACT(EPOCH FROM (now() - OLD.created_at)) < 5 THEN
            RETURN NEW;
        END IF;

        IF OLD.role IS DISTINCT FROM NEW.role THEN
            v_action   := 'Role Changed'::public.audit_action;
            v_severity := 'High'::public.audit_severity;
            v_details  := jsonb_build_object(
                'previousValue', jsonb_build_object('role', OLD.role),
                'newValue',      jsonb_build_object('role', NEW.role)
            );
            PERFORM public.insert_audit_log(
                v_actor, 'Team Management', v_action::TEXT, v_severity::TEXT,
                'User', NEW.id::TEXT, v_target_name, v_details
            );
        END IF;

        IF OLD.status IS DISTINCT FROM NEW.status THEN
            IF NEW.status = 'Inactive' THEN
                v_action   := 'User Deactivated'::public.audit_action;
                v_severity := 'High'::public.audit_severity;
            ELSIF NEW.status = 'Active' THEN
                v_action   := 'User Reactivated'::public.audit_action;
                v_severity := 'Medium'::public.audit_severity;
            END IF;
            
            v_details  := jsonb_build_object(
                'previousValue', jsonb_build_object('status', OLD.status),
                'newValue',      jsonb_build_object('status', NEW.status)
            );
            PERFORM public.insert_audit_log(
                v_actor, 'Team Management', v_action::TEXT, v_severity::TEXT,
                'User', NEW.id::TEXT, v_target_name, v_details
            );
        END IF;

        IF OLD.display_name IS DISTINCT FROM NEW.display_name
           OR OLD.email IS DISTINCT FROM NEW.email
           OR OLD.avatar_url IS DISTINCT FROM NEW.avatar_url THEN
            v_action   := 'User Updated'::public.audit_action;
            v_severity := 'Medium'::public.audit_severity;

            v_details  := jsonb_build_object(
                'previousValue', jsonb_build_object(
                    'display_name', OLD.display_name,
                    'email', OLD.email
                ),
                'newValue', jsonb_build_object(
                    'display_name', NEW.display_name,
                    'email', NEW.email
                )
            );
            PERFORM public.insert_audit_log(
                v_actor, 'Team Management', v_action::TEXT, v_severity::TEXT,
                'User', NEW.id::TEXT, v_target_name, v_details
            );
        END IF;

    ELSIF TG_OP = 'DELETE' THEN
        v_action   := 'User Deleted'::public.audit_action;
        v_severity := 'Critical'::public.audit_severity;
        v_target_name := OLD.display_name;
        v_details  := jsonb_build_object(
            'previousValue', jsonb_build_object(
                'display_name', OLD.display_name,
                'email', OLD.email,
                'role', OLD.role
            )
        );

        PERFORM public.insert_audit_log(
            v_actor, 'Team Management', v_action::TEXT, v_severity::TEXT,
            'User', OLD.id::TEXT, v_target_name, v_details
        );
    END IF;

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
