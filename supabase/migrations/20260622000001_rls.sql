-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sizes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.temperatures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_sizes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_temperatures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Helper function to get current user's role
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT AS $$
    SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Profiles: read for authenticated
CREATE POLICY "Profiles: read for authenticated" ON public.profiles
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Profiles: admins can insert" ON public.profiles
    FOR INSERT TO authenticated WITH CHECK (public.get_user_role() = 'Administrator');

CREATE POLICY "Profiles: admins can update" ON public.profiles
    FOR UPDATE TO authenticated USING (public.get_user_role() = 'Administrator');

CREATE POLICY "Profiles: admins can delete" ON public.profiles
    FOR DELETE TO authenticated USING (public.get_user_role() = 'Administrator');

-- Read-all policies for configuration/lookup tables
CREATE POLICY "Read all for authenticated" ON public.product_categories FOR SELECT TO authenticated USING (true);
CREATE POLICY "Read all for authenticated" ON public.sizes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Read all for authenticated" ON public.temperatures FOR SELECT TO authenticated USING (true);
CREATE POLICY "Read all for authenticated" ON public.payment_methods FOR SELECT TO authenticated USING (true);
CREATE POLICY "Read all for authenticated" ON public.products FOR SELECT TO authenticated USING (true);
CREATE POLICY "Read all for authenticated" ON public.product_sizes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Read all for authenticated" ON public.product_temperatures FOR SELECT TO authenticated USING (true);
CREATE POLICY "Read all for authenticated" ON public.inventory_categories FOR SELECT TO authenticated USING (true);
CREATE POLICY "Read all for authenticated" ON public.inventory_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "Read all for authenticated" ON public.product_recipes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Read all for authenticated" ON public.inventory_transactions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Read all for authenticated" ON public.orders FOR SELECT TO authenticated USING (true);
CREATE POLICY "Read all for authenticated" ON public.order_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "Read all for authenticated" ON public.audit_logs FOR SELECT TO authenticated USING (true);

-- Admin/Manager write policies
CREATE POLICY "Admin/Manager can manage" ON public.product_categories FOR ALL TO authenticated USING (public.get_user_role() IN ('Administrator', 'Manager'));
CREATE POLICY "Admin/Manager can manage" ON public.sizes FOR ALL TO authenticated USING (public.get_user_role() IN ('Administrator', 'Manager'));
CREATE POLICY "Admin/Manager can manage" ON public.temperatures FOR ALL TO authenticated USING (public.get_user_role() IN ('Administrator', 'Manager'));
CREATE POLICY "Admin/Manager can manage" ON public.payment_methods FOR ALL TO authenticated USING (public.get_user_role() IN ('Administrator', 'Manager'));
CREATE POLICY "Admin/Manager can manage" ON public.products FOR ALL TO authenticated USING (public.get_user_role() IN ('Administrator', 'Manager'));
CREATE POLICY "Admin/Manager can manage" ON public.product_sizes FOR ALL TO authenticated USING (public.get_user_role() IN ('Administrator', 'Manager'));
CREATE POLICY "Admin/Manager can manage" ON public.product_temperatures FOR ALL TO authenticated USING (public.get_user_role() IN ('Administrator', 'Manager'));
CREATE POLICY "Admin/Manager can manage" ON public.inventory_categories FOR ALL TO authenticated USING (public.get_user_role() IN ('Administrator', 'Manager'));
CREATE POLICY "Admin/Manager can manage" ON public.inventory_items FOR ALL TO authenticated USING (public.get_user_role() IN ('Administrator', 'Manager'));
CREATE POLICY "Admin/Manager can manage" ON public.product_recipes FOR ALL TO authenticated USING (public.get_user_role() IN ('Administrator', 'Manager'));

-- Inventory transactions (insert only)
CREATE POLICY "Admin/Manager can insert" ON public.inventory_transactions
    FOR INSERT TO authenticated WITH CHECK (public.get_user_role() IN ('Administrator', 'Manager'));

-- Orders & Order Items
CREATE POLICY "Authenticated can insert orders" ON public.orders FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Admin/Manager can update orders" ON public.orders FOR UPDATE TO authenticated USING (public.get_user_role() IN ('Administrator', 'Manager'));
CREATE POLICY "Admin can delete orders" ON public.orders FOR DELETE TO authenticated USING (public.get_user_role() = 'Administrator');

CREATE POLICY "Authenticated can insert items" ON public.order_items FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Admin/Manager can update items" ON public.order_items FOR UPDATE TO authenticated USING (public.get_user_role() IN ('Administrator', 'Manager'));
CREATE POLICY "Admin can delete items" ON public.order_items FOR DELETE TO authenticated USING (public.get_user_role() = 'Administrator');

-- Audit logs
CREATE POLICY "Authenticated can insert" ON public.audit_logs
    FOR INSERT TO authenticated WITH CHECK (true);
