-- Profiles Table
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name TEXT NOT NULL,
    email TEXT NOT NULL,
    avatar_url TEXT,
    role TEXT NOT NULL DEFAULT 'Cashier' CHECK (role IN ('Administrator', 'Manager', 'Cashier')),
    status TEXT NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive')),
    last_login TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Auto-update updated_at function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, display_name, email)
    VALUES (
        NEW.id, 
        COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)), 
        NEW.email
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Product Categories
CREATE TABLE public.product_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Sizes
CREATE TABLE public.sizes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Temperatures
CREATE TABLE public.temperatures (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Payment Methods
CREATE TABLE public.payment_methods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    is_enabled BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Products
CREATE TABLE public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    category_id UUID NOT NULL REFERENCES public.product_categories(id) ON DELETE RESTRICT,
    type TEXT NOT NULL DEFAULT 'Beverage' CHECK (type IN ('Beverage', 'Pastry', 'Other')),
    description TEXT,
    image_url TEXT,
    has_recipe BOOLEAN NOT NULL DEFAULT false,
    is_visible BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER set_products_updated_at
    BEFORE UPDATE ON public.products
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Product Sizes
CREATE TABLE public.product_sizes (
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    size_id UUID NOT NULL REFERENCES public.sizes(id) ON DELETE CASCADE,
    price NUMERIC(10,2) NOT NULL DEFAULT 0,
    PRIMARY KEY (product_id, size_id)
);

-- Product Temperatures
CREATE TABLE public.product_temperatures (
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    temperature_id UUID NOT NULL REFERENCES public.temperatures(id) ON DELETE CASCADE,
    PRIMARY KEY (product_id, temperature_id)
);

-- Inventory Categories
CREATE TABLE public.inventory_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Inventory Items
CREATE TABLE public.inventory_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    category_id UUID NOT NULL REFERENCES public.inventory_categories(id) ON DELETE RESTRICT,
    unit TEXT NOT NULL CHECK (unit IN ('g', 'ml', 'oz', 'pump', 'piece')),
    current_stock NUMERIC(12,2) NOT NULL DEFAULT 0,
    max_capacity NUMERIC(12,2) NOT NULL DEFAULT 0,
    low_stock_threshold NUMERIC(12,2) NOT NULL DEFAULT 0,
    image_url TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER set_inventory_items_updated_at
    BEFORE UPDATE ON public.inventory_items
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Product Recipes
CREATE TABLE public.product_recipes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    inventory_item_id UUID NOT NULL REFERENCES public.inventory_items(id) ON DELETE RESTRICT,
    quantity NUMERIC(10,2) NOT NULL,
    unit TEXT NOT NULL,
    UNIQUE (product_id, inventory_item_id)
);

-- Inventory Transactions
CREATE TABLE public.inventory_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    inventory_item_id UUID NOT NULL REFERENCES public.inventory_items(id) ON DELETE RESTRICT,
    type TEXT NOT NULL CHECK (type IN (
        'Replenishment', 
        'Automatic POS Deduction', 
        'Manual Adjustment', 
        'Waste / Spoilage', 
        'Stock Correction'
    )),
    previous_stock NUMERIC(12,2) NOT NULL,
    quantity_changed NUMERIC(12,2) NOT NULL,
    new_stock NUMERIC(12,2) NOT NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    notes TEXT,
    
    delivery_cost NUMERIC(10,2),
    expense_payment_method TEXT,
    supplier TEXT,
    received_by TEXT,
    delivery_date DATE,
    delivery_time TEXT,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Orders
CREATE TABLE public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id TEXT NOT NULL UNIQUE,
    customer_name TEXT NOT NULL DEFAULT 'Walk-In',
    status TEXT NOT NULL DEFAULT 'Completed' CHECK (status IN (
        'Completed', 'Void (Not Made)', 'Void (Consumed)'
    )),
    amount NUMERIC(10,2) NOT NULL DEFAULT 0,
    payment_method TEXT NOT NULL,
    cashier_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    cashier_name TEXT NOT NULL,
    
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    last_modified_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    last_modified_at TIMESTAMPTZ,
    
    synced_from_device TEXT,
    synced_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Order Items
CREATE TABLE public.order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    size TEXT,
    temperature TEXT,
    quantity INT NOT NULL DEFAULT 1,
    unit_price NUMERIC(10,2) NOT NULL DEFAULT 0,
    subtotal NUMERIC(10,2) NOT NULL DEFAULT 0
);

-- Audit Logs
CREATE TABLE public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    user_name TEXT NOT NULL,
    user_role TEXT NOT NULL,
    user_email TEXT NOT NULL,
    
    category TEXT NOT NULL CHECK (category IN (
        'Authentication', 'Sales', 'Inventory', 
        'Team Management', 'Products', 'Analytics', 'System'
    )),
    action TEXT NOT NULL,
    severity TEXT NOT NULL DEFAULT 'Low' CHECK (severity IN ('Low', 'Medium', 'High', 'Critical')),
    
    target_type TEXT,
    target_id TEXT,
    target_name TEXT,
    
    ip_address TEXT,
    device TEXT,
    details JSONB,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_audit_logs_created_at ON public.audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX idx_audit_logs_category ON public.audit_logs(category);
CREATE INDEX idx_audit_logs_severity ON public.audit_logs(severity);
