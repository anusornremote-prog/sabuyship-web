-- Sabuyship baseline schema for a fresh Supabase project.
-- This file is intended for staging/bootstrap. Do not run it on production.

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TYPE public.user_role AS ENUM ('CUSTOMER', 'ADMIN');
CREATE TYPE public.inquiry_status AS ENUM ('PENDING', 'QUOTED', 'ORDERED', 'REJECTED');
CREATE TYPE public.quotation_status AS ENUM ('DRAFT', 'SENT', 'ACCEPTED', 'REJECTED');
CREATE TYPE public.payment_status AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
CREATE TYPE public.payment_round_status AS ENUM ('PENDING', 'UPLOADED', 'PAID', 'REJECTED', 'NOT_APPLICABLE');
CREATE TYPE public.order_status AS ENUM (
  'NEW',
  'QUOTED',
  'WAITING_PAYMENT',
  'PAYMENT_REJECTED',
  'PAID',
  'ORDERED',
  'CHINA_WAREHOUSE',
  'SHIPPING',
  'THAILAND_WAREHOUSE',
  'OUT_FOR_DELIVERY',
  'DELIVERED',
  'CANCELED'
);
CREATE TYPE public.wallet_transaction_type AS ENUM ('TOPUP', 'DEDUCTION', 'REFUND');
CREATE TYPE public.wallet_transaction_status AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

CREATE SEQUENCE public.new_customer_code_seq START WITH 1;

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.user_role NOT NULL DEFAULT 'CUSTOMER',
  customer_code TEXT UNIQUE,
  full_name TEXT,
  phone TEXT,
  line_id TEXT,
  line_uid TEXT,
  wallet_balance NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (wallet_balance >= 0),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  address_line TEXT NOT NULL,
  subdistrict TEXT,
  district TEXT,
  province TEXT,
  postal_code TEXT,
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.inquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inquiry_number TEXT UNIQUE NOT NULL,
  customer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  customer_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  line_id TEXT,
  product_url TEXT NOT NULL DEFAULT '-',
  product_name TEXT,
  image_url TEXT,
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  items JSONB NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(items) = 'array'),
  shipping_type TEXT NOT NULL DEFAULT 'CAR' CHECK (shipping_type IN ('CAR', 'BOAT')),
  service_type TEXT NOT NULL DEFAULT 'BUY_AND_IMPORT' CHECK (service_type IN ('BUY_AND_IMPORT', 'IMPORT_ONLY')),
  shipping_address_id UUID REFERENCES public.addresses(id) ON DELETE SET NULL,
  remark TEXT,
  notes TEXT,
  status public.inquiry_status NOT NULL DEFAULT 'PENDING',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.quotations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inquiry_id UUID NOT NULL REFERENCES public.inquiries(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  product_cost NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (product_cost >= 0),
  service_fee NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (service_fee >= 0),
  shipping_cost_cn_cn NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (shipping_cost_cn_cn >= 0),
  shipping_cost_cn_th NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (shipping_cost_cn_th >= 0),
  shipping_cost_th_th NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (shipping_cost_th_th >= 0),
  wooden_crate_cost NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (wooden_crate_cost >= 0),
  other_fee NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (other_fee >= 0),
  total_price NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (total_price >= 0),
  admin_notes TEXT,
  valid_until TIMESTAMPTZ,
  status public.quotation_status NOT NULL DEFAULT 'DRAFT',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT UNIQUE NOT NULL,
  customer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  quotation_id UUID NOT NULL REFERENCES public.quotations(id) ON DELETE RESTRICT,
  status public.order_status NOT NULL DEFAULT 'NEW',
  payment_round_1_status public.payment_round_status NOT NULL DEFAULT 'PENDING',
  payment_round_2_status public.payment_round_status,
  payment_round_3_status public.payment_round_status,
  admin_notes TEXT,
  tracking_number TEXT,
  shipping_company TEXT,
  shipping_address_id UUID REFERENCES public.addresses(id) ON DELETE SET NULL,
  consolidated_into_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  delivered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  payment_round SMALLINT CHECK (payment_round BETWEEN 1 AND 3),
  amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
  payment_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  payment_method TEXT,
  transfer_date DATE,
  transfer_time TIME,
  slip_url TEXT NOT NULL,
  rejection_reason TEXT,
  status public.payment_status NOT NULL DEFAULT 'PENDING',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.tracking_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  status TEXT NOT NULL,
  notes TEXT,
  description TEXT,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.wallet_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
  type public.wallet_transaction_type NOT NULL,
  status public.wallet_transaction_status NOT NULL DEFAULT 'PENDING',
  reference_image TEXT,
  description TEXT,
  admin_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.shipments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  customer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  customer_code TEXT NOT NULL,
  transport_type TEXT,
  tracking_number TEXT,
  thailand_tracking_number TEXT,
  status TEXT,
  product_type TEXT,
  product_name TEXT,
  container_date TEXT,
  quantity INTEGER,
  weight NUMERIC(12, 3),
  arrival_date TEXT,
  shipping_cost TEXT,
  width NUMERIC(12, 3),
  length NUMERIC(12, 3),
  height NUMERIC(12, 3),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.site_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO public.site_settings (key, value)
VALUES ('exchange_rate', '5.20'::jsonb);

CREATE INDEX inquiries_customer_id_idx ON public.inquiries(customer_id);
CREATE INDEX inquiries_status_created_at_idx ON public.inquiries(status, created_at DESC);
CREATE INDEX quotations_inquiry_id_idx ON public.quotations(inquiry_id);
CREATE INDEX orders_customer_id_created_at_idx ON public.orders(customer_id, created_at DESC);
CREATE INDEX orders_status_idx ON public.orders(status);
CREATE INDEX orders_quotation_id_idx ON public.orders(quotation_id);
CREATE INDEX orders_consolidated_into_id_idx ON public.orders(consolidated_into_id);
CREATE INDEX payments_order_id_created_at_idx ON public.payments(order_id, created_at DESC);
CREATE INDEX tracking_logs_order_id_created_at_idx ON public.tracking_logs(order_id, created_at);
CREATE INDEX shipments_customer_id_created_at_idx ON public.shipments(customer_id, created_at DESC);
CREATE UNIQUE INDEX shipments_tracking_number_unique_idx
  ON public.shipments(tracking_number)
  WHERE tracking_number IS NOT NULL;
CREATE UNIQUE INDEX addresses_one_default_per_customer_idx
  ON public.addresses(customer_id)
  WHERE is_default;

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER profiles_set_updated_at BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER addresses_set_updated_at BEFORE UPDATE ON public.addresses
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER inquiries_set_updated_at BEFORE UPDATE ON public.inquiries
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER quotations_set_updated_at BEFORE UPDATE ON public.quotations
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER orders_set_updated_at BEFORE UPDATE ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER payments_set_updated_at BEFORE UPDATE ON public.payments
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER wallet_transactions_set_updated_at BEFORE UPDATE ON public.wallet_transactions
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER shipments_set_updated_at BEFORE UPDATE ON public.shipments
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER site_settings_set_updated_at BEFORE UPDATE ON public.site_settings
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid() AND role = 'ADMIN' AND is_active
  );
$$;

REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin() TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  seq_val BIGINT;
  num_part INTEGER;
  char_part INTEGER;
  letter CHAR(1);
BEGIN
  seq_val := nextval('public.new_customer_code_seq');
  num_part := ((seq_val - 1) % 999) + 1;
  char_part := ((seq_val - 1) / 999) % 26;
  letter := chr(65 + char_part);

  INSERT INTO public.profiles (id, full_name, phone, line_id, line_uid, customer_code)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'phone',
    NEW.raw_user_meta_data->>'line_id',
    NEW.raw_user_meta_data->>'line_uid',
    'M-S' || letter || lpad(num_part::TEXT, 3, '0')
  );
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tracking_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON public.profiles
FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Admins can view all profiles" ON public.profiles
FOR SELECT TO authenticated USING (public.is_admin());
CREATE POLICY "Users can insert own profile" ON public.profiles
FOR INSERT TO authenticated WITH CHECK (
  auth.uid() = id
  AND role = 'CUSTOMER'
  AND wallet_balance = 0
  AND is_active
);
CREATE POLICY "Users can update own profile" ON public.profiles
FOR UPDATE TO authenticated
USING (auth.uid() = id AND role = 'CUSTOMER')
WITH CHECK (auth.uid() = id AND role = 'CUSTOMER');
CREATE POLICY "Admins can manage profiles" ON public.profiles
FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "Customers can manage own addresses" ON public.addresses
FOR ALL TO authenticated
USING (customer_id = auth.uid())
WITH CHECK (customer_id = auth.uid());
CREATE POLICY "Admins can manage addresses" ON public.addresses
FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "Guests can create inquiries" ON public.inquiries
FOR INSERT TO anon WITH CHECK (customer_id IS NULL);
CREATE POLICY "Customers can create own inquiries" ON public.inquiries
FOR INSERT TO authenticated WITH CHECK (customer_id = auth.uid() OR customer_id IS NULL);
CREATE POLICY "Customers can view own inquiries" ON public.inquiries
FOR SELECT TO authenticated USING (customer_id = auth.uid());
CREATE POLICY "Admins can manage inquiries" ON public.inquiries
FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "Customers can view own quotations" ON public.quotations
FOR SELECT TO authenticated USING (
  EXISTS (
    SELECT 1 FROM public.inquiries
    WHERE inquiries.id = quotations.inquiry_id
      AND inquiries.customer_id = auth.uid()
  )
);
CREATE POLICY "Admins can manage quotations" ON public.quotations
FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "Customers can view own orders" ON public.orders
FOR SELECT TO authenticated USING (customer_id = auth.uid());
CREATE POLICY "Admins can manage orders" ON public.orders
FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "Customers can view own payments" ON public.payments
FOR SELECT TO authenticated USING (
  EXISTS (
    SELECT 1 FROM public.orders
    WHERE orders.id = payments.order_id
      AND orders.customer_id = auth.uid()
  )
);
CREATE POLICY "Admins can manage payments" ON public.payments
FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "Customers can view own tracking logs" ON public.tracking_logs
FOR SELECT TO authenticated USING (
  EXISTS (
    SELECT 1 FROM public.orders
    WHERE orders.id = tracking_logs.order_id
      AND orders.customer_id = auth.uid()
  )
);
CREATE POLICY "Admins can manage tracking logs" ON public.tracking_logs
FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "Customers can view own wallet transactions" ON public.wallet_transactions
FOR SELECT TO authenticated USING (customer_id = auth.uid());
CREATE POLICY "Customers can request own topups" ON public.wallet_transactions
FOR INSERT TO authenticated WITH CHECK (
  customer_id = auth.uid() AND type = 'TOPUP' AND status = 'PENDING'
);
CREATE POLICY "Admins can manage wallet transactions" ON public.wallet_transactions
FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "Customers can view own shipments" ON public.shipments
FOR SELECT TO authenticated USING (customer_id = auth.uid());
CREATE POLICY "Admins can manage shipments" ON public.shipments
FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "Anyone can read site settings" ON public.site_settings
FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins can update site settings" ON public.site_settings
FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON public.site_settings TO anon, authenticated;
GRANT INSERT ON public.inquiries TO anon;
GRANT SELECT, INSERT ON public.inquiries TO authenticated;
GRANT SELECT ON public.profiles, public.quotations, public.orders, public.payments,
  public.tracking_logs, public.wallet_transactions, public.shipments TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.addresses TO authenticated;
GRANT INSERT ON public.wallet_transactions TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.profiles, public.inquiries, public.quotations,
  public.orders, public.payments, public.tracking_logs, public.wallet_transactions,
  public.shipments TO authenticated;
GRANT UPDATE ON public.site_settings TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.new_customer_code_seq TO authenticated;

-- A customer may edit only non-privileged profile attributes. Admin access continues
-- through table grants plus the admin RLS policy above.
REVOKE UPDATE ON public.profiles FROM anon, authenticated;
GRANT UPDATE (full_name, phone, line_id, line_uid, updated_at) ON public.profiles TO authenticated;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('inquiries', 'inquiries', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp']),
  ('payment_slips', 'payment_slips', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

CREATE POLICY "Anyone can upload inquiry images" ON storage.objects
FOR INSERT TO anon, authenticated WITH CHECK (bucket_id = 'inquiries');
CREATE POLICY "Authenticated users can upload payment slips" ON storage.objects
FOR INSERT TO authenticated WITH CHECK (bucket_id = 'payment_slips');
CREATE POLICY "Admins can delete Sabuyship uploads" ON storage.objects
FOR DELETE TO authenticated USING (
  bucket_id IN ('inquiries', 'payment_slips') AND public.is_admin()
);

COMMIT;
