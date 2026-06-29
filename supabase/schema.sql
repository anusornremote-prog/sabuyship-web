-- Database schema for Sabuy Ship Logistics Platform

-- 1. Create Enums
CREATE TYPE user_role AS ENUM ('CUSTOMER', 'ADMIN');
CREATE TYPE inquiry_status AS ENUM ('PENDING', 'QUOTED', 'REJECTED');
CREATE TYPE quotation_status AS ENUM ('DRAFT', 'SENT', 'ACCEPTED', 'REJECTED');
CREATE TYPE payment_status AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
CREATE TYPE order_status AS ENUM (
  'NEW',
  'QUOTED',
  'WAITING_PAYMENT',
  'PAID',
  'ORDERED',
  'CHINA_WAREHOUSE',
  'SHIPPING',
  'THAILAND_WAREHOUSE',
  'OUT_FOR_DELIVERY',
  'DELIVERED'
);
CREATE TYPE wallet_transaction_type AS ENUM ('TOPUP', 'DEDUCTION', 'REFUND');
CREATE TYPE wallet_transaction_status AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- 2. Create Sequences
CREATE SEQUENCE IF NOT EXISTS new_customer_code_seq START WITH 1;

-- 3. Profiles (extends auth.users)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  role user_role DEFAULT 'CUSTOMER',
  customer_code TEXT UNIQUE,
  full_name TEXT,
  phone TEXT,
  line_id TEXT,
  wallet_balance NUMERIC(10, 2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Inquiries
CREATE TABLE inquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inquiry_number TEXT UNIQUE NOT NULL,
  customer_id UUID REFERENCES profiles(id) ON DELETE SET NULL, -- nullable for guests
  customer_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  line_id TEXT,
  product_url TEXT NOT NULL,
  quantity INTEGER DEFAULT 1,
  remark TEXT,
  status inquiry_status DEFAULT 'PENDING',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Quotations
CREATE TABLE quotations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inquiry_id UUID REFERENCES inquiries(id) ON DELETE CASCADE,
  product_cost NUMERIC(10, 2) DEFAULT 0,
  service_fee NUMERIC(10, 2) DEFAULT 0,
  shipping_fee NUMERIC(10, 2) DEFAULT 0,
  other_fee NUMERIC(10, 2) DEFAULT 0,
  total_price NUMERIC(10, 2) DEFAULT 0,
  status quotation_status DEFAULT 'DRAFT',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Orders
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT UNIQUE NOT NULL,
  customer_id UUID REFERENCES profiles(id) ON DELETE RESTRICT,
  quotation_id UUID REFERENCES quotations(id) ON DELETE RESTRICT,
  status order_status DEFAULT 'NEW',
  admin_notes TEXT,
  tracking_number TEXT,
  shipping_company TEXT,
  shipping_address_id UUID REFERENCES addresses(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Payments
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  amount NUMERIC(10, 2) NOT NULL,
  payment_date TIMESTAMPTZ NOT NULL,
  slip_url TEXT NOT NULL,
  status payment_status DEFAULT 'PENDING',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Tracking Logs
CREATE TABLE tracking_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  status order_status NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Wallet Transactions
CREATE TABLE wallet_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  amount NUMERIC(10, 2) NOT NULL,
  type wallet_transaction_type NOT NULL,
  status wallet_transaction_status DEFAULT 'PENDING',
  reference_image TEXT,
  description TEXT,
  admin_note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE inquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE tracking_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_transactions ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile." ON profiles;
DROP POLICY IF EXISTS "Users can update own profile." ON profiles;
DROP POLICY IF EXISTS "Admins can do everything on profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can delete profiles" ON profiles;

CREATE POLICY "Public profiles are viewable by everyone." ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile." ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile." ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins can update profiles" ON profiles FOR UPDATE 
  USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'ADMIN');
CREATE POLICY "Admins can delete profiles" ON profiles FOR DELETE 
  USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'ADMIN');

-- Inquiries Policies
DROP POLICY IF EXISTS "Anyone can insert inquiries" ON inquiries;
DROP POLICY IF EXISTS "Customers can view own inquiries" ON inquiries;
DROP POLICY IF EXISTS "Users and admins can view inquiries" ON inquiries;
DROP POLICY IF EXISTS "Admins can update inquiries" ON inquiries;

CREATE POLICY "Anyone can insert inquiries" ON inquiries FOR INSERT WITH CHECK (true);
CREATE POLICY "Users and admins can view inquiries" ON inquiries FOR SELECT 
  USING (auth.uid() = customer_id OR (SELECT role FROM profiles WHERE id = auth.uid()) = 'ADMIN');
CREATE POLICY "Admins can update inquiries" ON inquiries FOR UPDATE 
  USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'ADMIN');

-- Quotations Policies
DROP POLICY IF EXISTS "Admins can do everything on quotations" ON quotations;
DROP POLICY IF EXISTS "Customers can view quotations" ON quotations;

CREATE POLICY "Admins can do everything on quotations" ON quotations FOR ALL 
  USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'ADMIN')
  WITH CHECK ((SELECT role FROM profiles WHERE id = auth.uid()) = 'ADMIN');
CREATE POLICY "Customers can view quotations" ON quotations FOR SELECT 
  USING (EXISTS (
    SELECT 1 FROM inquiries 
    WHERE inquiries.id = quotations.inquiry_id 
    AND inquiries.customer_id = auth.uid()
  ));

-- Orders Policies
DROP POLICY IF EXISTS "Admins can do everything on orders" ON orders;
DROP POLICY IF EXISTS "Customers can view own orders" ON orders;

CREATE POLICY "Admins can do everything on orders" ON orders FOR ALL 
  USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'ADMIN')
  WITH CHECK ((SELECT role FROM profiles WHERE id = auth.uid()) = 'ADMIN');
CREATE POLICY "Customers can view own orders" ON orders FOR SELECT 
  USING (customer_id = auth.uid());

-- Tracking Logs Policies
DROP POLICY IF EXISTS "Admins can do everything on tracking_logs" ON tracking_logs;
DROP POLICY IF EXISTS "Customers can view tracking_logs" ON tracking_logs;

CREATE POLICY "Admins can do everything on tracking_logs" ON tracking_logs FOR ALL 
  USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'ADMIN')
  WITH CHECK ((SELECT role FROM profiles WHERE id = auth.uid()) = 'ADMIN');
CREATE POLICY "Customers can view tracking_logs" ON tracking_logs FOR SELECT 
  USING (EXISTS (
    SELECT 1 FROM orders 
    WHERE orders.id = tracking_logs.order_id 
    AND orders.customer_id = auth.uid()
  ));

-- Wallet Transactions Policies
DROP POLICY IF EXISTS "Admins can do everything on wallet_transactions" ON wallet_transactions;
DROP POLICY IF EXISTS "Customers can view own wallet_transactions" ON wallet_transactions;
DROP POLICY IF EXISTS "Customers can insert own wallet_transactions" ON wallet_transactions;

CREATE POLICY "Admins can do everything on wallet_transactions" ON wallet_transactions FOR ALL 
  USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'ADMIN')
  WITH CHECK ((SELECT role FROM profiles WHERE id = auth.uid()) = 'ADMIN');
  
CREATE POLICY "Customers can view own wallet_transactions" ON wallet_transactions FOR SELECT 
  USING (customer_id = auth.uid());
  
CREATE POLICY "Customers can insert own wallet_transactions" ON wallet_transactions FOR INSERT 
  WITH CHECK (customer_id = auth.uid() AND type = 'TOPUP');

-- Simple trigger to create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  seq_val BIGINT;
  num_part INTEGER;
  char_part INTEGER;
  letter CHAR(1);
BEGIN
  -- Get the next value from the sequence (assume it starts from 1)
  seq_val := nextval('new_customer_code_seq');
  
  -- Calculate numerical part (1 to 999)
  num_part := ((seq_val - 1) % 999) + 1;
  
  -- Calculate character part (A=0, B=1, ..., Z=25)
  char_part := ((seq_val - 1) / 999) % 26;
  
  -- Convert char_part to actual letter (ASCII 65 is 'A')
  letter := chr(65 + char_part);

  INSERT INTO public.profiles (id, full_name, role, customer_code, phone, line_id)
  VALUES (
    new.id, 
    new.raw_user_meta_data->>'full_name', 
    'CUSTOMER',
    'M-S' || letter || LPAD(num_part::TEXT, 3, '0'),
    new.raw_user_meta_data->>'phone',
    new.raw_user_meta_data->>'line_id'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Payments Policies
DROP POLICY IF EXISTS "Admins can do everything on payments" ON payments;
DROP POLICY IF EXISTS "Customers can view own payments" ON payments;
DROP POLICY IF EXISTS "Customers can insert payments" ON payments;

CREATE POLICY "Admins can do everything on payments" ON payments FOR ALL 
  USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'ADMIN')
  WITH CHECK ((SELECT role FROM profiles WHERE id = auth.uid()) = 'ADMIN');
CREATE POLICY "Customers can view own payments" ON payments FOR SELECT 
  USING (EXISTS (
    SELECT 1 FROM orders 
    WHERE orders.id = payments.order_id 
    AND orders.customer_id = auth.uid()
  ));
CREATE POLICY "Customers can insert payments" ON payments FOR INSERT 
  WITH CHECK (EXISTS (
    SELECT 1 FROM orders 
    WHERE orders.id = payments.order_id 
    AND orders.customer_id = auth.uid()
  ));

-- Addresses
CREATE TABLE addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  address_line TEXT NOT NULL,
  subdistrict TEXT,
  district TEXT,
  province TEXT,
  postal_code TEXT,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE addresses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can do everything on addresses" ON addresses;
DROP POLICY IF EXISTS "Customers can manage own addresses" ON addresses;

CREATE POLICY "Admins can do everything on addresses" ON addresses FOR ALL 
  USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'ADMIN')
  WITH CHECK ((SELECT role FROM profiles WHERE id = auth.uid()) = 'ADMIN');
  
CREATE POLICY "Customers can manage own addresses" ON addresses FOR ALL
  USING (customer_id = auth.uid())
  WITH CHECK (customer_id = auth.uid());

-- 8. Shipments (for tracking packages imported from Excel)
CREATE TABLE shipments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  customer_code TEXT NOT NULL,
  transport_type TEXT,
  tracking_number TEXT,
  product_type TEXT,
  product_name TEXT,
  container_date TEXT,
  quantity INTEGER,
  weight NUMERIC,
  arrival_date TEXT,
  shipping_cost TEXT,
  width NUMERIC,
  length NUMERIC,
  height NUMERIC,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE shipments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can do everything on shipments" ON shipments;
DROP POLICY IF EXISTS "Customers can view own shipments" ON shipments;

CREATE POLICY "Admins can do everything on shipments" ON shipments FOR ALL 
  USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'ADMIN')
  WITH CHECK ((SELECT role FROM profiles WHERE id = auth.uid()) = 'ADMIN');

CREATE POLICY "Customers can view own shipments" ON shipments FOR SELECT 
  USING (customer_id = auth.uid());
