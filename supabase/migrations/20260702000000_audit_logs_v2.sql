-- ============================================================================
-- AUDIT LOGS V2: Enums, Schema Changes, and Database Triggers
-- ============================================================================

-- ────────────────────────────────────────────────────────────────────────────
-- 1. Create ENUM types
-- ────────────────────────────────────────────────────────────────────────────

CREATE TYPE public.audit_category AS ENUM (
    'Authentication',
    'Sales',
    'Inventory',
    'Team Management',
    'Products',
    'Analytics',
    'System'
);

CREATE TYPE public.audit_action AS ENUM (
    -- Authentication
    'User Login', 'User Logout', 'Failed Login', 'Password Reset',
    -- Sales
    'Transaction Created', 'Transaction Edited', 'Transaction Deleted',
    'Transaction Voided (Not Made)', 'Transaction Voided (Consumed)',
    -- Inventory
    'Ingredient Created', 'Inventory Replenished', 'Inventory Adjusted',
    'Waste Recorded', 'Stock Correction',
    -- Team Management
    'User Created', 'User Updated', 'Role Changed',
    'User Deactivated', 'User Deleted',
    -- Products
    'Product Created', 'Product Updated', 'Product Archived', 'Product Deleted',
    -- System
    'Settings Updated', 'Backup Created',
    -- Analytics
    'Report Exported'
);

CREATE TYPE public.audit_severity AS ENUM (
    'Low', 'Medium', 'High', 'Critical'
);

CREATE TYPE public.audit_target_type AS ENUM (
    'User', 'Transaction', 'Ingredient', 'Inventory',
    'Product', 'Settings', 'Backup', 'Report'
);

-- ────────────────────────────────────────────────────────────────────────────
-- 2. Alter audit_logs table to use enums
-- ────────────────────────────────────────────────────────────────────────────

-- Clear existing test data so type casting does not fail on invalid strings
TRUNCATE TABLE public.audit_logs;

-- Drop existing CHECK constraints first
ALTER TABLE public.audit_logs
    DROP CONSTRAINT IF EXISTS audit_logs_category_check,
    DROP CONSTRAINT IF EXISTS audit_logs_severity_check;

-- Drop the text default on severity before type conversion (can't auto-cast)
ALTER TABLE public.audit_logs
    ALTER COLUMN severity DROP DEFAULT;

-- Convert columns to enum types
ALTER TABLE public.audit_logs
    ALTER COLUMN category TYPE public.audit_category USING category::public.audit_category,
    ALTER COLUMN action TYPE public.audit_action USING action::public.audit_action,
    ALTER COLUMN severity TYPE public.audit_severity USING severity::public.audit_severity,
    ALTER COLUMN target_type TYPE public.audit_target_type USING target_type::public.audit_target_type;

-- Re-add the default as the proper enum value
ALTER TABLE public.audit_logs
    ALTER COLUMN severity SET DEFAULT 'Low'::public.audit_severity;

-- ────────────────────────────────────────────────────────────────────────────
-- 3. Helper: Insert an audit log row (used by all trigger functions)
-- ────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.insert_audit_log(
    p_user_id UUID,
    p_category public.audit_category,
    p_action public.audit_action,
    p_severity public.audit_severity,
    p_target_type public.audit_target_type,
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
        p_category, p_action, p_severity,
        p_target_type, p_target_id, p_target_name,
        p_details
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ────────────────────────────────────────────────────────────────────────────
-- 4. Trigger: profiles (Team Management)
-- ────────────────────────────────────────────────────────────────────────────

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

        IF OLD.status IS DISTINCT FROM NEW.status AND NEW.status = 'Inactive' THEN
            v_action   := 'User Deactivated';
            v_severity := 'High';
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

CREATE TRIGGER audit_profiles_changes
    AFTER INSERT OR UPDATE OR DELETE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.audit_profiles_trigger();

-- ────────────────────────────────────────────────────────────────────────────
-- 5. Trigger: products (Products)
-- ────────────────────────────────────────────────────────────────────────────

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
                'is_visible', NEW.is_visible
            )
        );

        PERFORM public.insert_audit_log(
            v_actor, 'Products', v_action, v_severity,
            'Product', NEW.id::TEXT, NEW.name, v_details
        );

    ELSIF TG_OP = 'UPDATE' THEN
        -- Check if product was archived (is_visible changed to false)
        IF OLD.is_visible = true AND NEW.is_visible = false THEN
            v_action   := 'Product Archived';
            v_severity := 'Medium';
        ELSE
            v_action   := 'Product Updated';
            v_severity := 'Low';
        END IF;

        v_details := jsonb_build_object(
            'previousValue', jsonb_build_object(
                'name', OLD.name,
                'type', OLD.type,
                'is_visible', OLD.is_visible
            ),
            'newValue', jsonb_build_object(
                'name', NEW.name,
                'type', NEW.type,
                'is_visible', NEW.is_visible
            )
        );

        PERFORM public.insert_audit_log(
            v_actor, 'Products', v_action, v_severity,
            'Product', NEW.id::TEXT, NEW.name, v_details
        );

    ELSIF TG_OP = 'DELETE' THEN
        v_action   := 'Product Deleted';
        v_severity := 'High';
        v_details  := jsonb_build_object(
            'previousValue', jsonb_build_object(
                'name', OLD.name,
                'type', OLD.type
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

CREATE TRIGGER audit_products_changes
    AFTER INSERT OR UPDATE OR DELETE ON public.products
    FOR EACH ROW
    EXECUTE FUNCTION public.audit_products_trigger();

-- ────────────────────────────────────────────────────────────────────────────
-- 6. Trigger: orders (Sales)
-- ────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.audit_orders_trigger()
RETURNS TRIGGER AS $$
DECLARE
    v_action public.audit_action;
    v_severity public.audit_severity;
    v_details JSONB := '{}';
    v_actor UUID;
BEGIN
    v_actor := auth.uid();

    IF TG_OP = 'INSERT' THEN
        v_action   := 'Transaction Created';
        v_severity := 'Low';
        v_details  := jsonb_build_object(
            'newValue', jsonb_build_object(
                'order_id', NEW.order_id,
                'customer_name', NEW.customer_name,
                'amount', NEW.amount,
                'payment_method', NEW.payment_method,
                'cashier_name', NEW.cashier_name
            )
        );

        PERFORM public.insert_audit_log(
            v_actor, 'Sales', v_action, v_severity,
            'Transaction', NEW.id::TEXT, NEW.order_id, v_details
        );

    ELSIF TG_OP = 'UPDATE' THEN
        -- Check status changes for voiding
        IF OLD.status IS DISTINCT FROM NEW.status THEN
            IF NEW.status = 'Void (Not Made)' THEN
                v_action   := 'Transaction Voided (Not Made)';
                v_severity := 'Medium';
            ELSIF NEW.status = 'Void (Consumed)' THEN
                v_action   := 'Transaction Voided (Consumed)';
                v_severity := 'High';
            ELSE
                v_action   := 'Transaction Edited';
                v_severity := 'Medium';
            END IF;
        ELSE
            v_action   := 'Transaction Edited';
            v_severity := 'Medium';
        END IF;

        v_details := jsonb_build_object(
            'previousValue', jsonb_build_object(
                'status', OLD.status,
                'amount', OLD.amount,
                'customer_name', OLD.customer_name
            ),
            'newValue', jsonb_build_object(
                'status', NEW.status,
                'amount', NEW.amount,
                'customer_name', NEW.customer_name
            )
        );

        PERFORM public.insert_audit_log(
            v_actor, 'Sales', v_action, v_severity,
            'Transaction', NEW.id::TEXT, NEW.order_id, v_details
        );

    ELSIF TG_OP = 'DELETE' THEN
        v_action   := 'Transaction Deleted';
        v_severity := 'High';
        v_details  := jsonb_build_object(
            'previousValue', jsonb_build_object(
                'order_id', OLD.order_id,
                'amount', OLD.amount,
                'status', OLD.status
            )
        );

        PERFORM public.insert_audit_log(
            v_actor, 'Sales', v_action, v_severity,
            'Transaction', OLD.id::TEXT, OLD.order_id, v_details
        );
    END IF;

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER audit_orders_changes
    AFTER INSERT OR UPDATE OR DELETE ON public.orders
    FOR EACH ROW
    EXECUTE FUNCTION public.audit_orders_trigger();

-- ────────────────────────────────────────────────────────────────────────────
-- 7. Trigger: inventory_items (Inventory - new ingredient)
-- ────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.audit_inventory_items_trigger()
RETURNS TRIGGER AS $$
DECLARE
    v_actor UUID;
    v_details JSONB;
BEGIN
    v_actor := auth.uid();

    IF TG_OP = 'INSERT' THEN
        v_details := jsonb_build_object(
            'newValue', jsonb_build_object(
                'name', NEW.name,
                'unit', NEW.unit,
                'current_stock', NEW.current_stock,
                'max_capacity', NEW.max_capacity
            )
        );

        PERFORM public.insert_audit_log(
            v_actor, 'Inventory', 'Ingredient Created', 'Low',
            'Ingredient', NEW.id::TEXT, NEW.name, v_details
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER audit_inventory_items_changes
    AFTER INSERT ON public.inventory_items
    FOR EACH ROW
    EXECUTE FUNCTION public.audit_inventory_items_trigger();

-- ────────────────────────────────────────────────────────────────────────────
-- 8. Trigger: inventory_transactions (Inventory movements)
-- ────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.audit_inventory_transactions_trigger()
RETURNS TRIGGER AS $$
DECLARE
    v_action public.audit_action;
    v_severity public.audit_severity;
    v_actor UUID;
    v_item_name TEXT;
    v_details JSONB;
BEGIN
    v_actor := COALESCE(NEW.user_id, auth.uid());

    -- Look up the inventory item name
    SELECT name INTO v_item_name
    FROM public.inventory_items
    WHERE id = NEW.inventory_item_id;

    -- Map inventory transaction type to audit action
    CASE NEW.type
        WHEN 'Replenishment' THEN
            v_action   := 'Inventory Replenished';
            v_severity := 'Low';
        WHEN 'Manual Adjustment' THEN
            v_action   := 'Inventory Adjusted';
            v_severity := 'Medium';
        WHEN 'Waste / Spoilage' THEN
            v_action   := 'Waste Recorded';
            v_severity := 'Medium';
        WHEN 'Stock Correction' THEN
            v_action   := 'Stock Correction';
            v_severity := 'Medium';
        ELSE
            -- 'Automatic POS Deduction' — skip audit for automatic deductions
            RETURN NEW;
    END CASE;

    v_details := jsonb_build_object(
        'previousValue', jsonb_build_object('stock', NEW.previous_stock),
        'newValue', jsonb_build_object(
            'stock', NEW.new_stock,
            'quantity_changed', NEW.quantity_changed
        ),
        'metadata', jsonb_build_object(
            'transaction_type', NEW.type,
            'notes', COALESCE(NEW.notes, '')
        )
    );

    PERFORM public.insert_audit_log(
        v_actor, 'Inventory', v_action, v_severity,
        'Inventory', NEW.inventory_item_id::TEXT, COALESCE(v_item_name, 'Unknown Item'), v_details
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER audit_inventory_transactions_changes
    AFTER INSERT ON public.inventory_transactions
    FOR EACH ROW
    EXECUTE FUNCTION public.audit_inventory_transactions_trigger();

-- ────────────────────────────────────────────────────────────────────────────
-- 9. Additional index for text search on audit logs
-- ────────────────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_name ON public.audit_logs(user_name);
CREATE INDEX IF NOT EXISTS idx_audit_logs_target_name ON public.audit_logs(target_name);
