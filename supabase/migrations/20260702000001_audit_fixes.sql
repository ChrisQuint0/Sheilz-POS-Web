-- ============================================================================
-- AUDIT LOGS FIXES: Enum additions and Trigger fixes
-- ============================================================================

-- 1. Add new Enum values
ALTER TYPE public.audit_action ADD VALUE IF NOT EXISTS 'User Reactivated';
ALTER TYPE public.audit_action ADD VALUE IF NOT EXISTS 'Ingredient Updated';
ALTER TYPE public.audit_action ADD VALUE IF NOT EXISTS 'Ingredient Deleted';
ALTER TYPE public.audit_action ADD VALUE IF NOT EXISTS 'Product Restored';

-- 2. Update `profiles` trigger
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

    IF TG_OP = 'INSERT' THEN
        v_action   := 'User Created';
        v_severity := 'Medium';
        v_target_name := NEW.display_name;
        v_details  := jsonb_build_object(
            'newValue', jsonb_build_object(
                'display_name', NEW.display_name,
                'email', NEW.email,
                'role', NEW.role,
                'status', NEW.status
            )
        );

        PERFORM public.insert_audit_log(
            v_actor, 'Team Management', v_action, v_severity,
            'User', NEW.id::TEXT, v_target_name, v_details
        );

    ELSIF TG_OP = 'UPDATE' THEN
        v_target_name := NEW.display_name;

        -- Prevent double-logging when user is first created and role is immediately updated
        -- If the user was created less than 5 seconds ago, skip logging the update
        IF EXTRACT(EPOCH FROM (now() - OLD.created_at)) < 5 THEN
            RETURN NEW;
        END IF;

        -- Determine the specific action & severity
        IF OLD.role IS DISTINCT FROM NEW.role THEN
            v_action   := 'Role Changed';
            v_severity := 'High';
            v_details  := jsonb_build_object(
                'previousValue', jsonb_build_object('role', OLD.role),
                'newValue',      jsonb_build_object('role', NEW.role)
            );
            PERFORM public.insert_audit_log(
                v_actor, 'Team Management', v_action, v_severity,
                'User', NEW.id::TEXT, v_target_name, v_details
            );
        END IF;

        IF OLD.status IS DISTINCT FROM NEW.status THEN
            IF NEW.status = 'Inactive' THEN
                v_action   := 'User Deactivated';
                v_severity := 'High';
            ELSIF NEW.status = 'Active' THEN
                v_action   := 'User Reactivated';
                v_severity := 'Medium';
            END IF;
            
            v_details  := jsonb_build_object(
                'previousValue', jsonb_build_object('status', OLD.status),
                'newValue',      jsonb_build_object('status', NEW.status)
            );
            PERFORM public.insert_audit_log(
                v_actor, 'Team Management', v_action, v_severity,
                'User', NEW.id::TEXT, v_target_name, v_details
            );
        END IF;

        -- General update (if anything other than role/status changed, or if role/status + other fields)
        IF OLD.display_name IS DISTINCT FROM NEW.display_name
           OR OLD.email IS DISTINCT FROM NEW.email
           OR OLD.avatar_url IS DISTINCT FROM NEW.avatar_url THEN
            v_action   := 'User Updated';
            v_severity := 'Medium';

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
                v_actor, 'Team Management', v_action, v_severity,
                'User', NEW.id::TEXT, v_target_name, v_details
            );
        END IF;

    ELSIF TG_OP = 'DELETE' THEN
        v_action   := 'User Deleted';
        v_severity := 'Critical';
        v_target_name := OLD.display_name;
        v_details  := jsonb_build_object(
            'previousValue', jsonb_build_object(
                'display_name', OLD.display_name,
                'email', OLD.email,
                'role', OLD.role
            )
        );

        PERFORM public.insert_audit_log(
            v_actor, 'Team Management', v_action, v_severity,
            'User', OLD.id::TEXT, v_target_name, v_details
        );
    END IF;

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 3. Update `products` trigger
CREATE OR REPLACE FUNCTION public.audit_products_trigger()
RETURNS TRIGGER AS $$
DECLARE
    v_action public.audit_action;
    v_severity public.audit_severity;
    v_details JSONB := '{}';
    v_actor UUID;
BEGIN
    v_actor := auth.uid();

    IF TG_OP = 'INSERT' THEN
        v_action   := 'Product Created';
        v_severity := 'Medium';
        v_details  := jsonb_build_object(
            'newValue', jsonb_build_object(
                'name', NEW.name,
                'type', NEW.type,
                'base_price', NEW.base_price
            )
        );

        PERFORM public.insert_audit_log(
            v_actor, 'Products', v_action, v_severity,
            'Product', NEW.id::TEXT, NEW.name, v_details
        );

    ELSIF TG_OP = 'UPDATE' THEN
        IF OLD.is_visible IS DISTINCT FROM NEW.is_visible THEN
            IF NEW.is_visible = false THEN
                v_action   := 'Product Archived';
                v_severity := 'Medium';
            ELSE
                v_action   := 'Product Restored';
                v_severity := 'Medium';
            END IF;
            
            v_details  := jsonb_build_object(
                'previousValue', jsonb_build_object('is_visible', OLD.is_visible),
                'newValue',      jsonb_build_object('is_visible', NEW.is_visible)
            );
            PERFORM public.insert_audit_log(
                v_actor, 'Products', v_action, v_severity,
                'Product', NEW.id::TEXT, NEW.name, v_details
            );
        END IF;

        IF OLD.name IS DISTINCT FROM NEW.name
           OR OLD.type IS DISTINCT FROM NEW.type
           OR OLD.base_price IS DISTINCT FROM NEW.base_price
           OR OLD.image_url IS DISTINCT FROM NEW.image_url THEN
            
            v_action   := 'Product Updated';
            v_severity := 'Low';

            v_details  := jsonb_build_object(
                'previousValue', jsonb_build_object(
                    'name', OLD.name,
                    'type', OLD.type,
                    'base_price', OLD.base_price
                ),
                'newValue', jsonb_build_object(
                    'name', NEW.name,
                    'type', NEW.type,
                    'base_price', NEW.base_price
                )
            );
            PERFORM public.insert_audit_log(
                v_actor, 'Products', v_action, v_severity,
                'Product', NEW.id::TEXT, NEW.name, v_details
            );
        END IF;

    ELSIF TG_OP = 'DELETE' THEN
        v_action   := 'Product Deleted';
        v_severity := 'High';
        v_details  := jsonb_build_object(
            'previousValue', jsonb_build_object(
                'name', OLD.name,
                'type', OLD.type,
                'base_price', OLD.base_price
            )
        );

        PERFORM public.insert_audit_log(
            v_actor, 'Products', v_action, v_severity,
            'Product', OLD.id::TEXT, OLD.name, v_details
        );
    END IF;

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 4. Update `inventory_items` trigger
CREATE OR REPLACE FUNCTION public.audit_inventory_items_trigger()
RETURNS TRIGGER AS $$
DECLARE
    v_action public.audit_action;
    v_severity public.audit_severity;
    v_actor UUID;
    v_details JSONB;
BEGIN
    v_actor := auth.uid();

    IF TG_OP = 'INSERT' THEN
        v_action := 'Ingredient Created';
        v_severity := 'Low';
        v_details := jsonb_build_object(
            'newValue', jsonb_build_object(
                'name', NEW.name,
                'unit', NEW.unit,
                'current_stock', NEW.current_stock,
                'max_capacity', NEW.max_capacity
            )
        );

        PERFORM public.insert_audit_log(
            v_actor, 'Inventory', v_action, v_severity,
            'Ingredient', NEW.id::TEXT, NEW.name, v_details
        );
    ELSIF TG_OP = 'UPDATE' THEN
        IF OLD.name IS DISTINCT FROM NEW.name
           OR OLD.unit IS DISTINCT FROM NEW.unit
           OR OLD.max_capacity IS DISTINCT FROM NEW.max_capacity THEN
            
            v_action := 'Ingredient Updated';
            v_severity := 'Low';
            v_details := jsonb_build_object(
                'previousValue', jsonb_build_object(
                    'name', OLD.name,
                    'unit', OLD.unit,
                    'max_capacity', OLD.max_capacity
                ),
                'newValue', jsonb_build_object(
                    'name', NEW.name,
                    'unit', NEW.unit,
                    'max_capacity', NEW.max_capacity
                )
            );
            PERFORM public.insert_audit_log(
                v_actor, 'Inventory', v_action, v_severity,
                'Ingredient', NEW.id::TEXT, NEW.name, v_details
            );
        END IF;
    ELSIF TG_OP = 'DELETE' THEN
        v_action := 'Ingredient Deleted';
        v_severity := 'Medium';
        v_details := jsonb_build_object(
            'previousValue', jsonb_build_object(
                'name', OLD.name,
                'unit', OLD.unit,
                'current_stock', OLD.current_stock
            )
        );

        PERFORM public.insert_audit_log(
            v_actor, 'Inventory', v_action, v_severity,
            'Ingredient', OLD.id::TEXT, OLD.name, v_details
        );
    END IF;

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate trigger to handle UPDATE and DELETE
DROP TRIGGER IF EXISTS audit_inventory_items_changes ON public.inventory_items;
CREATE TRIGGER audit_inventory_items_changes
    AFTER INSERT OR UPDATE OR DELETE ON public.inventory_items
    FOR EACH ROW
    EXECUTE FUNCTION public.audit_inventory_items_trigger();
