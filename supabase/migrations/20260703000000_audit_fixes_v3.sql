-- ============================================================================
-- AUDIT LOGS FIXES V3: Strict Typing and Variant Logging suppression
-- ============================================================================

-- 1. Drop the old strictly-typed function so we can replace it with TEXT parameters
DROP FUNCTION IF EXISTS public.insert_audit_log(UUID, public.audit_category, public.audit_action, public.audit_severity, public.audit_target_type, TEXT, TEXT, JSONB);

-- 2. Create the new insert_audit_log that takes TEXT and casts internally
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


-- 3. Drop the variant trigger so it stops double-logging
DROP TRIGGER IF EXISTS audit_product_variants_trigger ON public.product_variants;


-- 4. Update Profiles Trigger with explicit casts
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
        v_action   := 'User Created'::public.audit_action;
        v_severity := 'Medium'::public.audit_severity;
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
            v_actor, 'Team Management', v_action::TEXT, v_severity::TEXT,
            'User', NEW.id::TEXT, v_target_name, v_details
        );

    ELSIF TG_OP = 'UPDATE' THEN
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


-- 5. Update Inventory Items Trigger
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
        v_action := 'Ingredient Created'::public.audit_action;
        v_severity := 'Low'::public.audit_severity;
        v_details := jsonb_build_object(
            'newValue', jsonb_build_object(
                'name', NEW.name,
                'unit', NEW.unit,
                'current_stock', NEW.current_stock,
                'max_capacity', NEW.max_capacity
            )
        );

        PERFORM public.insert_audit_log(
            v_actor, 'Inventory', v_action::TEXT, v_severity::TEXT,
            'Ingredient', NEW.id::TEXT, NEW.name, v_details
        );
    ELSIF TG_OP = 'UPDATE' THEN
        IF OLD.name IS DISTINCT FROM NEW.name
           OR OLD.unit IS DISTINCT FROM NEW.unit
           OR OLD.max_capacity IS DISTINCT FROM NEW.max_capacity THEN
            
            v_action := 'Ingredient Updated'::public.audit_action;
            v_severity := 'Low'::public.audit_severity;
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
                v_actor, 'Inventory', v_action::TEXT, v_severity::TEXT,
                'Ingredient', NEW.id::TEXT, NEW.name, v_details
            );
        END IF;
    ELSIF TG_OP = 'DELETE' THEN
        v_action := 'Ingredient Deleted'::public.audit_action;
        v_severity := 'Medium'::public.audit_severity;
        v_details := jsonb_build_object(
            'previousValue', jsonb_build_object(
                'name', OLD.name,
                'unit', OLD.unit,
                'current_stock', OLD.current_stock
            )
        );

        PERFORM public.insert_audit_log(
            v_actor, 'Inventory', v_action::TEXT, v_severity::TEXT,
            'Ingredient', OLD.id::TEXT, OLD.name, v_details
        );
    END IF;

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 6. Update Orders Trigger
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
        v_action   := 'Transaction Created'::public.audit_action;
        v_severity := 'Low'::public.audit_severity;
        v_details  := jsonb_build_object(
            'newValue', jsonb_build_object(
                'order_id', NEW.order_id,
                'amount', NEW.amount,
                'status', NEW.status,
                'customer_name', NEW.customer_name
            )
        );

        PERFORM public.insert_audit_log(
            v_actor, 'Sales', v_action::TEXT, v_severity::TEXT,
            'Transaction', NEW.id::TEXT, NEW.order_id, v_details
        );

    ELSIF TG_OP = 'UPDATE' THEN
        IF OLD.status IS DISTINCT FROM NEW.status THEN
            IF NEW.status = 'Void (Not Made)' THEN
                v_action   := 'Transaction Voided (Not Made)'::public.audit_action;
                v_severity := 'High'::public.audit_severity;
            ELSIF NEW.status = 'Void (Consumed)' THEN
                v_action   := 'Transaction Voided (Consumed)'::public.audit_action;
                v_severity := 'High'::public.audit_severity;
            ELSE
                v_action   := 'Transaction Edited'::public.audit_action;
                v_severity := 'Medium'::public.audit_severity;
            END IF;
        ELSE
            v_action   := 'Transaction Edited'::public.audit_action;
            v_severity := 'Medium'::public.audit_severity;
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
            v_actor, 'Sales', v_action::TEXT, v_severity::TEXT,
            'Transaction', NEW.id::TEXT, NEW.order_id, v_details
        );

    ELSIF TG_OP = 'DELETE' THEN
        v_action   := 'Transaction Deleted'::public.audit_action;
        v_severity := 'High'::public.audit_severity;
        v_details  := jsonb_build_object(
            'previousValue', jsonb_build_object(
                'order_id', OLD.order_id,
                'amount', OLD.amount,
                'status', OLD.status
            )
        );

        PERFORM public.insert_audit_log(
            v_actor, 'Sales', v_action::TEXT, v_severity::TEXT,
            'Transaction', OLD.id::TEXT, OLD.order_id, v_details
        );
    END IF;

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 7. Update Inventory Transactions Trigger
CREATE OR REPLACE FUNCTION public.audit_inventory_transactions_trigger()
RETURNS TRIGGER AS $$
DECLARE
    v_action public.audit_action;
    v_severity public.audit_severity;
    v_details JSONB := '{}';
    v_target_name TEXT;
BEGIN
    SELECT name INTO v_target_name
    FROM public.inventory_items
    WHERE id = NEW.inventory_item_id;

    IF NEW.type = 'Replenishment' THEN
        v_action := 'Inventory Replenished'::public.audit_action;
        v_severity := 'Medium'::public.audit_severity;
    ELSIF NEW.type = 'Waste / Spoilage' THEN
        v_action := 'Waste Recorded'::public.audit_action;
        v_severity := 'Medium'::public.audit_severity;
    ELSIF NEW.type = 'Stock Correction' THEN
        v_action := 'Stock Correction'::public.audit_action;
        v_severity := 'High'::public.audit_severity;
    ELSE
        v_action := 'Inventory Adjusted'::public.audit_action;
        v_severity := 'Low'::public.audit_severity;
    END IF;

    v_details := jsonb_build_object(
        'newValue', jsonb_build_object(
            'type', NEW.type,
            'quantity_changed', NEW.quantity_changed,
            'previous_stock', NEW.previous_stock,
            'new_stock', NEW.new_stock,
            'notes', NEW.notes
        )
    );

    PERFORM public.insert_audit_log(
        NEW.user_id, 'Inventory', v_action::TEXT, v_severity::TEXT,
        'Inventory', NEW.id::TEXT, v_target_name, v_details
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 8. Update Products Trigger (Fix archived_at)
CREATE OR REPLACE FUNCTION public.audit_products_trigger_function()
RETURNS TRIGGER AS $$
DECLARE
    v_action public.audit_action;
    v_severity public.audit_severity;
    v_details JSONB := '{}';
    v_actor UUID;
BEGIN
    v_actor := auth.uid();

    IF TG_OP = 'INSERT' THEN
        v_action   := 'Product Created'::public.audit_action;
        v_severity := 'Medium'::public.audit_severity;
        v_details  := jsonb_build_object(
            'newValue', jsonb_build_object(
                'name', NEW.name,
                'type', NEW.type,
                'category_id', NEW.category_id,
                'description', NEW.description,
                'has_recipe', NEW.has_recipe,
                'is_visible', NEW.is_visible
            )
        );

        PERFORM public.insert_audit_log(
            v_actor, 
            'Products', 
            v_action::TEXT, 
            v_severity::TEXT,
            'Product', 
            NEW.id::TEXT, 
            NEW.name, 
            v_details
        );

    ELSIF TG_OP = 'UPDATE' THEN
        IF OLD.archived_at IS DISTINCT FROM NEW.archived_at THEN
            IF NEW.archived_at IS NOT NULL THEN
                v_action   := 'Product Archived'::public.audit_action;
                v_severity := 'Medium'::public.audit_severity;
            ELSE
                v_action   := 'Product Restored'::public.audit_action;
                v_severity := 'Medium'::public.audit_severity;
            END IF;
            
            v_details  := jsonb_build_object(
                'previousValue', jsonb_build_object('archived_at', OLD.archived_at),
                'newValue',      jsonb_build_object('archived_at', NEW.archived_at)
            );
            PERFORM public.insert_audit_log(
                v_actor, 
                'Products', 
                v_action::TEXT, 
                v_severity::TEXT,
                'Product', 
                NEW.id::TEXT, 
                NEW.name, 
                v_details
            );
        END IF;

        IF OLD.name IS DISTINCT FROM NEW.name
           OR OLD.type IS DISTINCT FROM NEW.type
           OR OLD.category_id IS DISTINCT FROM NEW.category_id
           OR OLD.description IS DISTINCT FROM NEW.description
           OR OLD.image_url IS DISTINCT FROM NEW.image_url
           OR OLD.has_recipe IS DISTINCT FROM NEW.has_recipe THEN
            
            v_action   := 'Product Updated'::public.audit_action;
            v_severity := 'Low'::public.audit_severity;

            v_details  := jsonb_build_object(
                'previousValue', jsonb_build_object(
                    'name', OLD.name,
                    'type', OLD.type,
                    'category_id', OLD.category_id,
                    'description', OLD.description,
                    'image_url', OLD.image_url,
                    'has_recipe', OLD.has_recipe,
                    'is_visible', OLD.is_visible
                ),
                'newValue', jsonb_build_object(
                    'name', NEW.name,
                    'type', NEW.type,
                    'category_id', NEW.category_id,
                    'description', NEW.description,
                    'image_url', NEW.image_url,
                    'has_recipe', NEW.has_recipe,
                    'is_visible', NEW.is_visible
                )
            );
            PERFORM public.insert_audit_log(
                v_actor, 
                'Products', 
                v_action::TEXT, 
                v_severity::TEXT,
                'Product', 
                NEW.id::TEXT, 
                NEW.name, 
                v_details
            );
        END IF;

    ELSIF TG_OP = 'DELETE' THEN
        v_action   := 'Product Deleted'::public.audit_action;
        v_severity := 'High'::public.audit_severity;
        v_details  := jsonb_build_object(
            'previousValue', jsonb_build_object(
                'name', OLD.name,
                'type', OLD.type,
                'category_id', OLD.category_id,
                'description', OLD.description,
                'has_recipe', OLD.has_recipe,
                'is_visible', OLD.is_visible
            )
        );

        PERFORM public.insert_audit_log(
            v_actor, 
            'Products', 
            v_action::TEXT, 
            v_severity::TEXT,
            'Product', 
            OLD.id::TEXT, 
            OLD.name, 
            v_details
        );
    END IF;

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
