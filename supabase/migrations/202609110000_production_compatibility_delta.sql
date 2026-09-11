-- Production-only compatibility delta for the legacy Sabuyship database.
--
-- IMPORTANT:
--   * Review and test this file before applying it to any remote database.
--   * Do not run the initial-schema migration against the legacy production database.
--   * Legacy payment attempts intentionally keep payment_round = NULL. The aggregate
--     audit proved that amount/order alone cannot classify every historical attempt.
--   * Legacy shipment columns are intentionally retained to avoid data loss.

BEGIN;

SET LOCAL lock_timeout = '10s';
SET LOCAL statement_timeout = '2min';

-- Abort before changing anything if legacy rows cannot satisfy the target contract.
DO $preflight$
DECLARE
  blocker_count BIGINT;
BEGIN
  SELECT count(*) INTO blocker_count
  FROM public.orders
  WHERE customer_id IS NULL OR quotation_id IS NULL
     OR status IS NULL OR payment_round_1_status IS NULL
     OR created_at IS NULL OR updated_at IS NULL;
  IF blocker_count > 0 THEN
    RAISE EXCEPTION 'Preflight failed: % orders have missing required relationships', blocker_count;
  END IF;

  SELECT count(*) INTO blocker_count
  FROM public.payments
  WHERE order_id IS NULL OR amount IS NULL OR amount <= 0
     OR payment_date IS NULL OR slip_url IS NULL;
  IF blocker_count > 0 THEN
    RAISE EXCEPTION 'Preflight failed: % payments violate required fields', blocker_count;
  END IF;

  SELECT count(*) INTO blocker_count
  FROM public.payments
  WHERE status::text NOT IN ('PENDING', 'APPROVED', 'REJECTED');
  IF blocker_count > 0 THEN
    RAISE EXCEPTION 'Preflight failed: % payments have unsupported statuses', blocker_count;
  END IF;

  SELECT count(*) INTO blocker_count
  FROM public.profiles
  WHERE role IS NULL OR wallet_balance IS NULL OR wallet_balance < 0
     OR created_at IS NULL OR updated_at IS NULL;
  IF blocker_count > 0 THEN
    RAISE EXCEPTION 'Preflight failed: % profiles violate required fields', blocker_count;
  END IF;

  SELECT count(*) INTO blocker_count
  FROM public.addresses
  WHERE customer_id IS NULL OR full_name IS NULL OR phone IS NULL
     OR address_line IS NULL OR is_default IS NULL
     OR created_at IS NULL OR updated_at IS NULL;
  IF blocker_count > 0 THEN
    RAISE EXCEPTION 'Preflight failed: % addresses violate required fields', blocker_count;
  END IF;

  SELECT count(*) INTO blocker_count
  FROM public.inquiries
  WHERE inquiry_number IS NULL OR customer_name IS NULL OR phone IS NULL
     OR product_url IS NULL OR quantity IS NULL OR quantity <= 0
     OR items IS NULL OR jsonb_typeof(items) <> 'array'
     OR shipping_type NOT IN ('CAR', 'BOAT')
     OR service_type NOT IN ('BUY_AND_IMPORT', 'IMPORT_ONLY')
     OR status IS NULL OR created_at IS NULL OR updated_at IS NULL;
  IF blocker_count > 0 THEN
    RAISE EXCEPTION 'Preflight failed: % inquiries violate required fields', blocker_count;
  END IF;

  SELECT count(*) INTO blocker_count
  FROM public.quotations
  WHERE inquiry_id IS NULL OR product_cost IS NULL OR product_cost < 0
     OR service_fee IS NULL OR service_fee < 0
     OR shipping_cost_cn_cn IS NULL OR shipping_cost_cn_cn < 0
     OR shipping_cost_cn_th IS NULL OR shipping_cost_cn_th < 0
     OR shipping_cost_th_th IS NULL OR shipping_cost_th_th < 0
     OR other_fee IS NULL OR other_fee < 0
     OR total_price IS NULL OR total_price < 0
     OR status IS NULL OR created_at IS NULL OR updated_at IS NULL;
  IF blocker_count > 0 THEN
    RAISE EXCEPTION 'Preflight failed: % quotations violate required fields', blocker_count;
  END IF;

  SELECT count(*) INTO blocker_count
  FROM public.tracking_logs
  WHERE order_id IS NULL OR status IS NULL OR created_at IS NULL;
  IF blocker_count > 0 THEN
    RAISE EXCEPTION 'Preflight failed: % tracking logs violate required fields', blocker_count;
  END IF;

  SELECT count(*) INTO blocker_count
  FROM public.wallet_transactions
  WHERE customer_id IS NULL OR amount IS NULL OR amount <= 0
     OR type IS NULL OR status IS NULL OR created_at IS NULL OR updated_at IS NULL;
  IF blocker_count > 0 THEN
    RAISE EXCEPTION 'Preflight failed: % wallet transactions violate required fields', blocker_count;
  END IF;

  SELECT count(*) INTO blocker_count
  FROM public.shipments
  WHERE customer_code IS NULL OR created_at IS NULL OR updated_at IS NULL;
  IF blocker_count > 0 THEN
    RAISE EXCEPTION 'Preflight failed: % shipments violate required fields', blocker_count;
  END IF;

  SELECT count(*) INTO blocker_count
  FROM public.orders
  WHERE payment_round_1_status::text NOT IN
    ('PENDING', 'UPLOADED', 'PAID', 'REJECTED', 'NOT_APPLICABLE')
     OR (payment_round_2_status IS NOT NULL AND payment_round_2_status::text NOT IN
       ('PENDING', 'UPLOADED', 'PAID', 'REJECTED', 'NOT_APPLICABLE'))
     OR (payment_round_3_status IS NOT NULL AND payment_round_3_status::text NOT IN
       ('PENDING', 'UPLOADED', 'PAID', 'REJECTED', 'NOT_APPLICABLE'));
  IF blocker_count > 0 THEN
    RAISE EXCEPTION 'Preflight failed: % orders have unsupported payment-round statuses', blocker_count;
  END IF;

  SELECT count(*) INTO blocker_count
  FROM (
    SELECT customer_id
    FROM public.addresses
    WHERE is_default
    GROUP BY customer_id
    HAVING count(*) > 1
  ) duplicates;
  IF blocker_count > 0 THEN
    RAISE EXCEPTION 'Preflight failed: % customers have multiple default addresses', blocker_count;
  END IF;

  SELECT count(*) INTO blocker_count
  FROM (
    SELECT tracking_number
    FROM public.shipments
    WHERE tracking_number IS NOT NULL AND btrim(tracking_number) <> ''
    GROUP BY tracking_number
    HAVING count(*) > 1
  ) duplicates;
  IF blocker_count > 0 THEN
    RAISE EXCEPTION 'Preflight failed: % duplicate shipment tracking numbers exist', blocker_count;
  END IF;
END
$preflight$;

-- Add enum values used by the current application. These values are not consumed
-- until a later transaction, which is safe for PostgreSQL enum additions.
ALTER TYPE public.inquiry_status ADD VALUE IF NOT EXISTS 'ORDERED';
ALTER TYPE public.order_status ADD VALUE IF NOT EXISTS 'PAYMENT_REJECTED';
ALTER TYPE public.order_status ADD VALUE IF NOT EXISTS 'CANCELED';

DO $types$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'public' AND t.typname = 'payment_status'
  ) THEN
    CREATE TYPE public.payment_status AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'public' AND t.typname = 'payment_round_status'
  ) THEN
    CREATE TYPE public.payment_round_status AS ENUM
      ('PENDING', 'UPLOADED', 'PAID', 'REJECTED', 'NOT_APPLICABLE');
  END IF;
END
$types$;

-- Missing compatibility columns. Nullable historical fields stay nullable.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;

ALTER TABLE public.inquiries
  ADD COLUMN IF NOT EXISTS product_name TEXT,
  ADD COLUMN IF NOT EXISTS shipping_address_id UUID,
  ADD COLUMN IF NOT EXISTS notes TEXT;

ALTER TABLE public.quotations
  ADD COLUMN IF NOT EXISTS customer_id UUID,
  ADD COLUMN IF NOT EXISTS wooden_crate_cost NUMERIC(12, 2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS admin_notes TEXT,
  ADD COLUMN IF NOT EXISTS valid_until TIMESTAMPTZ;

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS payment_round_1_status TEXT NOT NULL DEFAULT 'PENDING',
  ADD COLUMN IF NOT EXISTS payment_round_2_status TEXT,
  ADD COLUMN IF NOT EXISTS payment_round_3_status TEXT,
  ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMPTZ;

ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS payment_round SMALLINT,
  ADD COLUMN IF NOT EXISTS payment_method TEXT,
  ADD COLUMN IF NOT EXISTS transfer_date DATE,
  ADD COLUMN IF NOT EXISTS transfer_time TIME,
  ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

ALTER TABLE public.tracking_logs
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS created_by UUID;

ALTER TABLE public.shipments
  ADD COLUMN IF NOT EXISTS order_id UUID,
  ADD COLUMN IF NOT EXISTS thailand_tracking_number TEXT,
  ADD COLUMN IF NOT EXISTS status TEXT;

-- Preserve all payment attempts. Only future submissions are classified by the app.
COMMENT ON COLUMN public.payments.payment_round IS
  'Payment round 1-3. NULL means an unclassified legacy payment attempt.';

-- Backfills with deterministic sources only.
UPDATE public.profiles
SET is_active = true
WHERE is_active IS NULL;

UPDATE public.quotations q
SET customer_id = i.customer_id
FROM public.inquiries i
WHERE q.inquiry_id = i.id
  AND q.customer_id IS NULL;

-- Policies can depend on columns whose types are changed below. Drop the public
-- table policies first; the transaction restores them automatically on failure.
DO $drop_public_policies$
DECLARE
  table_name TEXT;
  policy_name TEXT;
BEGIN
  FOREACH table_name IN ARRAY ARRAY[
    'profiles', 'addresses', 'inquiries', 'quotations', 'orders',
    'payments', 'tracking_logs', 'wallet_transactions', 'shipments', 'site_settings'
  ]
  LOOP
    FOR policy_name IN
      SELECT policyname
      FROM pg_policies
      WHERE schemaname = 'public' AND tablename = table_name
    LOOP
      EXECUTE format('DROP POLICY %I ON public.%I', policy_name, table_name);
    END LOOP;
  END LOOP;
END
$drop_public_policies$;

-- Align enum-backed status columns with the current contract.
ALTER TABLE public.orders
  ALTER COLUMN payment_round_1_status DROP DEFAULT,
  ALTER COLUMN payment_round_2_status DROP DEFAULT,
  ALTER COLUMN payment_round_3_status DROP DEFAULT;

ALTER TABLE public.orders
  ALTER COLUMN payment_round_1_status TYPE public.payment_round_status
    USING payment_round_1_status::text::public.payment_round_status,
  ALTER COLUMN payment_round_2_status TYPE public.payment_round_status
    USING payment_round_2_status::text::public.payment_round_status,
  ALTER COLUMN payment_round_3_status TYPE public.payment_round_status
    USING payment_round_3_status::text::public.payment_round_status;

ALTER TABLE public.orders
  ALTER COLUMN payment_round_1_status SET DEFAULT 'PENDING'::public.payment_round_status,
  ALTER COLUMN payment_round_1_status SET NOT NULL;

ALTER TABLE public.payments
  ALTER COLUMN status DROP DEFAULT;

ALTER TABLE public.payments
  ALTER COLUMN status TYPE public.payment_status
    USING status::text::public.payment_status;

ALTER TABLE public.payments
  ALTER COLUMN status SET DEFAULT 'PENDING'::public.payment_status,
  ALTER COLUMN status SET NOT NULL;

-- Tracking events include workflow events that are intentionally broader than order_status.
ALTER TABLE public.tracking_logs
  ALTER COLUMN status DROP DEFAULT,
  ALTER COLUMN status TYPE TEXT USING status::text,
  ALTER COLUMN status SET NOT NULL;

-- Widen monetary and dimensional fields without reducing precision.
ALTER TABLE public.profiles
  ALTER COLUMN role SET DEFAULT 'CUSTOMER'::public.user_role,
  ALTER COLUMN role SET NOT NULL,
  ALTER COLUMN wallet_balance TYPE NUMERIC(12, 2) USING wallet_balance::NUMERIC(12, 2),
  ALTER COLUMN wallet_balance SET DEFAULT 0,
  ALTER COLUMN wallet_balance SET NOT NULL,
  ALTER COLUMN is_active SET DEFAULT true,
  ALTER COLUMN is_active SET NOT NULL;

ALTER TABLE public.quotations
  ALTER COLUMN product_cost TYPE NUMERIC(12, 2) USING product_cost::NUMERIC(12, 2),
  ALTER COLUMN service_fee TYPE NUMERIC(12, 2) USING service_fee::NUMERIC(12, 2),
  ALTER COLUMN shipping_cost_cn_cn TYPE NUMERIC(12, 2) USING shipping_cost_cn_cn::NUMERIC(12, 2),
  ALTER COLUMN shipping_cost_cn_th TYPE NUMERIC(12, 2) USING shipping_cost_cn_th::NUMERIC(12, 2),
  ALTER COLUMN shipping_cost_th_th TYPE NUMERIC(12, 2) USING shipping_cost_th_th::NUMERIC(12, 2),
  ALTER COLUMN wooden_crate_cost TYPE NUMERIC(12, 2) USING wooden_crate_cost::NUMERIC(12, 2),
  ALTER COLUMN other_fee TYPE NUMERIC(12, 2) USING other_fee::NUMERIC(12, 2),
  ALTER COLUMN total_price TYPE NUMERIC(12, 2) USING total_price::NUMERIC(12, 2),
  ALTER COLUMN product_cost SET DEFAULT 0,
  ALTER COLUMN product_cost SET NOT NULL,
  ALTER COLUMN service_fee SET DEFAULT 0,
  ALTER COLUMN service_fee SET NOT NULL,
  ALTER COLUMN shipping_cost_cn_cn SET DEFAULT 0,
  ALTER COLUMN shipping_cost_cn_cn SET NOT NULL,
  ALTER COLUMN shipping_cost_cn_th SET DEFAULT 0,
  ALTER COLUMN shipping_cost_cn_th SET NOT NULL,
  ALTER COLUMN shipping_cost_th_th SET DEFAULT 0,
  ALTER COLUMN shipping_cost_th_th SET NOT NULL,
  ALTER COLUMN wooden_crate_cost SET DEFAULT 0,
  ALTER COLUMN wooden_crate_cost SET NOT NULL,
  ALTER COLUMN other_fee SET DEFAULT 0,
  ALTER COLUMN other_fee SET NOT NULL,
  ALTER COLUMN total_price SET DEFAULT 0,
  ALTER COLUMN total_price SET NOT NULL,
  ALTER COLUMN status SET DEFAULT 'DRAFT'::public.quotation_status,
  ALTER COLUMN status SET NOT NULL,
  ALTER COLUMN created_at SET DEFAULT now(),
  ALTER COLUMN created_at SET NOT NULL,
  ALTER COLUMN updated_at SET DEFAULT now(),
  ALTER COLUMN updated_at SET NOT NULL;

ALTER TABLE public.inquiries
  ALTER COLUMN product_url SET DEFAULT '-',
  ALTER COLUMN product_url SET NOT NULL,
  ALTER COLUMN quantity SET DEFAULT 1,
  ALTER COLUMN quantity SET NOT NULL,
  ALTER COLUMN items SET DEFAULT '[]'::jsonb,
  ALTER COLUMN items SET NOT NULL,
  ALTER COLUMN shipping_type SET DEFAULT 'CAR',
  ALTER COLUMN shipping_type SET NOT NULL,
  ALTER COLUMN service_type SET DEFAULT 'BUY_AND_IMPORT',
  ALTER COLUMN service_type SET NOT NULL,
  ALTER COLUMN status SET DEFAULT 'PENDING'::public.inquiry_status,
  ALTER COLUMN status SET NOT NULL,
  ALTER COLUMN created_at SET DEFAULT now(),
  ALTER COLUMN created_at SET NOT NULL,
  ALTER COLUMN updated_at SET DEFAULT now(),
  ALTER COLUMN updated_at SET NOT NULL;

ALTER TABLE public.payments
  ALTER COLUMN amount TYPE NUMERIC(12, 2) USING amount::NUMERIC(12, 2),
  ALTER COLUMN payment_date SET DEFAULT now(),
  ALTER COLUMN payment_date SET NOT NULL,
  ALTER COLUMN order_id SET NOT NULL,
  ALTER COLUMN amount SET NOT NULL,
  ALTER COLUMN slip_url SET NOT NULL,
  ALTER COLUMN created_at SET DEFAULT now(),
  ALTER COLUMN created_at SET NOT NULL,
  ALTER COLUMN updated_at SET DEFAULT now(),
  ALTER COLUMN updated_at SET NOT NULL;

ALTER TABLE public.orders
  ALTER COLUMN customer_id SET NOT NULL,
  ALTER COLUMN quotation_id SET NOT NULL,
  ALTER COLUMN status SET DEFAULT 'NEW'::public.order_status,
  ALTER COLUMN status SET NOT NULL,
  ALTER COLUMN created_at SET DEFAULT now(),
  ALTER COLUMN created_at SET NOT NULL,
  ALTER COLUMN updated_at SET DEFAULT now(),
  ALTER COLUMN updated_at SET NOT NULL;

ALTER TABLE public.tracking_logs
  ALTER COLUMN order_id SET NOT NULL,
  ALTER COLUMN created_at SET DEFAULT now(),
  ALTER COLUMN created_at SET NOT NULL;

ALTER TABLE public.addresses
  ALTER COLUMN customer_id SET NOT NULL,
  ALTER COLUMN is_default SET DEFAULT false,
  ALTER COLUMN is_default SET NOT NULL,
  ALTER COLUMN created_at SET DEFAULT now(),
  ALTER COLUMN created_at SET NOT NULL,
  ALTER COLUMN updated_at SET DEFAULT now(),
  ALTER COLUMN updated_at SET NOT NULL;

ALTER TABLE public.quotations
  ALTER COLUMN inquiry_id SET NOT NULL;

ALTER TABLE public.wallet_transactions
  ALTER COLUMN amount TYPE NUMERIC(12, 2) USING amount::NUMERIC(12, 2),
  ALTER COLUMN customer_id SET NOT NULL,
  ALTER COLUMN amount SET NOT NULL,
  ALTER COLUMN type SET NOT NULL,
  ALTER COLUMN status SET DEFAULT 'PENDING'::public.wallet_transaction_status,
  ALTER COLUMN status SET NOT NULL,
  ALTER COLUMN created_at SET DEFAULT now(),
  ALTER COLUMN created_at SET NOT NULL,
  ALTER COLUMN updated_at SET DEFAULT now(),
  ALTER COLUMN updated_at SET NOT NULL;

ALTER TABLE public.shipments
  ALTER COLUMN customer_code SET NOT NULL,
  ALTER COLUMN created_at SET DEFAULT now(),
  ALTER COLUMN created_at SET NOT NULL,
  ALTER COLUMN updated_at SET DEFAULT now(),
  ALTER COLUMN updated_at SET NOT NULL;

ALTER TABLE public.site_settings
  ALTER COLUMN value SET NOT NULL,
  ALTER COLUMN updated_at SET DEFAULT now(),
  ALTER COLUMN updated_at SET NOT NULL;

-- Add checks with stable names so the delta can be reviewed or re-run safely.
DO $constraints$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'profiles_wallet_balance_check'
      AND conrelid = 'public.profiles'::regclass
  ) THEN
    ALTER TABLE public.profiles ADD CONSTRAINT profiles_wallet_balance_check
      CHECK (wallet_balance >= 0) NOT VALID;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'quotations_product_cost_check' AND conrelid = 'public.quotations'::regclass) THEN
    ALTER TABLE public.quotations ADD CONSTRAINT quotations_product_cost_check CHECK (product_cost >= 0) NOT VALID;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'quotations_service_fee_check' AND conrelid = 'public.quotations'::regclass) THEN
    ALTER TABLE public.quotations ADD CONSTRAINT quotations_service_fee_check CHECK (service_fee >= 0) NOT VALID;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'quotations_shipping_cost_cn_cn_check' AND conrelid = 'public.quotations'::regclass) THEN
    ALTER TABLE public.quotations ADD CONSTRAINT quotations_shipping_cost_cn_cn_check CHECK (shipping_cost_cn_cn >= 0) NOT VALID;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'quotations_shipping_cost_cn_th_check' AND conrelid = 'public.quotations'::regclass) THEN
    ALTER TABLE public.quotations ADD CONSTRAINT quotations_shipping_cost_cn_th_check CHECK (shipping_cost_cn_th >= 0) NOT VALID;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'quotations_shipping_cost_th_th_check' AND conrelid = 'public.quotations'::regclass) THEN
    ALTER TABLE public.quotations ADD CONSTRAINT quotations_shipping_cost_th_th_check CHECK (shipping_cost_th_th >= 0) NOT VALID;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'quotations_wooden_crate_cost_check' AND conrelid = 'public.quotations'::regclass) THEN
    ALTER TABLE public.quotations ADD CONSTRAINT quotations_wooden_crate_cost_check CHECK (wooden_crate_cost >= 0) NOT VALID;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'quotations_other_fee_check' AND conrelid = 'public.quotations'::regclass) THEN
    ALTER TABLE public.quotations ADD CONSTRAINT quotations_other_fee_check CHECK (other_fee >= 0) NOT VALID;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'quotations_total_price_check' AND conrelid = 'public.quotations'::regclass) THEN
    ALTER TABLE public.quotations ADD CONSTRAINT quotations_total_price_check CHECK (total_price >= 0) NOT VALID;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'payments_amount_check'
      AND conrelid = 'public.payments'::regclass
  ) THEN
    ALTER TABLE public.payments ADD CONSTRAINT payments_amount_check
      CHECK (amount > 0) NOT VALID;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'payments_payment_round_check'
      AND conrelid = 'public.payments'::regclass
  ) THEN
    ALTER TABLE public.payments ADD CONSTRAINT payments_payment_round_check
      CHECK (payment_round BETWEEN 1 AND 3) NOT VALID;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'inquiries_quantity_check'
      AND conrelid = 'public.inquiries'::regclass
  ) THEN
    ALTER TABLE public.inquiries ADD CONSTRAINT inquiries_quantity_check
      CHECK (quantity > 0) NOT VALID;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'inquiries_items_check'
      AND conrelid = 'public.inquiries'::regclass
  ) THEN
    ALTER TABLE public.inquiries ADD CONSTRAINT inquiries_items_check
      CHECK (jsonb_typeof(items) = 'array') NOT VALID;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'inquiries_shipping_type_check'
      AND conrelid = 'public.inquiries'::regclass
  ) THEN
    ALTER TABLE public.inquiries ADD CONSTRAINT inquiries_shipping_type_check
      CHECK (shipping_type IN ('CAR', 'BOAT')) NOT VALID;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'inquiries_service_type_check'
      AND conrelid = 'public.inquiries'::regclass
  ) THEN
    ALTER TABLE public.inquiries ADD CONSTRAINT inquiries_service_type_check
      CHECK (service_type IN ('BUY_AND_IMPORT', 'IMPORT_ONLY')) NOT VALID;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'inquiries_shipping_address_id_fkey'
      AND conrelid = 'public.inquiries'::regclass
  ) THEN
    ALTER TABLE public.inquiries ADD CONSTRAINT inquiries_shipping_address_id_fkey
      FOREIGN KEY (shipping_address_id) REFERENCES public.addresses(id) ON DELETE SET NULL NOT VALID;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'quotations_customer_id_fkey'
      AND conrelid = 'public.quotations'::regclass
  ) THEN
    ALTER TABLE public.quotations ADD CONSTRAINT quotations_customer_id_fkey
      FOREIGN KEY (customer_id) REFERENCES public.profiles(id) ON DELETE SET NULL NOT VALID;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'tracking_logs_created_by_fkey'
      AND conrelid = 'public.tracking_logs'::regclass
  ) THEN
    ALTER TABLE public.tracking_logs ADD CONSTRAINT tracking_logs_created_by_fkey
      FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE SET NULL NOT VALID;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'shipments_order_id_fkey'
      AND conrelid = 'public.shipments'::regclass
  ) THEN
    ALTER TABLE public.shipments ADD CONSTRAINT shipments_order_id_fkey
      FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE SET NULL NOT VALID;
  END IF;
END
$constraints$;

ALTER TABLE public.profiles VALIDATE CONSTRAINT profiles_wallet_balance_check;
ALTER TABLE public.quotations VALIDATE CONSTRAINT quotations_product_cost_check;
ALTER TABLE public.quotations VALIDATE CONSTRAINT quotations_service_fee_check;
ALTER TABLE public.quotations VALIDATE CONSTRAINT quotations_shipping_cost_cn_cn_check;
ALTER TABLE public.quotations VALIDATE CONSTRAINT quotations_shipping_cost_cn_th_check;
ALTER TABLE public.quotations VALIDATE CONSTRAINT quotations_shipping_cost_th_th_check;
ALTER TABLE public.quotations VALIDATE CONSTRAINT quotations_wooden_crate_cost_check;
ALTER TABLE public.quotations VALIDATE CONSTRAINT quotations_other_fee_check;
ALTER TABLE public.quotations VALIDATE CONSTRAINT quotations_total_price_check;
ALTER TABLE public.payments VALIDATE CONSTRAINT payments_amount_check;
ALTER TABLE public.payments VALIDATE CONSTRAINT payments_payment_round_check;
ALTER TABLE public.inquiries VALIDATE CONSTRAINT inquiries_quantity_check;
ALTER TABLE public.inquiries VALIDATE CONSTRAINT inquiries_items_check;
ALTER TABLE public.inquiries VALIDATE CONSTRAINT inquiries_shipping_type_check;
ALTER TABLE public.inquiries VALIDATE CONSTRAINT inquiries_service_type_check;
ALTER TABLE public.inquiries VALIDATE CONSTRAINT inquiries_shipping_address_id_fkey;
ALTER TABLE public.quotations VALIDATE CONSTRAINT quotations_customer_id_fkey;
ALTER TABLE public.tracking_logs VALIDATE CONSTRAINT tracking_logs_created_by_fkey;
ALTER TABLE public.shipments VALIDATE CONSTRAINT shipments_order_id_fkey;

CREATE INDEX IF NOT EXISTS inquiries_customer_id_idx
  ON public.inquiries(customer_id);
CREATE INDEX IF NOT EXISTS inquiries_status_created_at_idx
  ON public.inquiries(status, created_at DESC);
CREATE INDEX IF NOT EXISTS quotations_inquiry_id_idx
  ON public.quotations(inquiry_id);
CREATE INDEX IF NOT EXISTS orders_customer_id_created_at_idx
  ON public.orders(customer_id, created_at DESC);
CREATE INDEX IF NOT EXISTS orders_status_idx
  ON public.orders(status);
CREATE INDEX IF NOT EXISTS orders_quotation_id_idx
  ON public.orders(quotation_id);
CREATE INDEX IF NOT EXISTS orders_consolidated_into_id_idx
  ON public.orders(consolidated_into_id);
CREATE INDEX IF NOT EXISTS payments_order_id_created_at_idx
  ON public.payments(order_id, created_at DESC);
CREATE INDEX IF NOT EXISTS tracking_logs_order_id_created_at_idx
  ON public.tracking_logs(order_id, created_at);
CREATE INDEX IF NOT EXISTS shipments_customer_id_created_at_idx
  ON public.shipments(customer_id, created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS shipments_tracking_number_unique_idx
  ON public.shipments(tracking_number)
  WHERE tracking_number IS NOT NULL AND btrim(tracking_number) <> '';
CREATE UNIQUE INDEX IF NOT EXISTS addresses_one_default_per_customer_idx
  ON public.addresses(customer_id)
  WHERE is_default;

-- Consistent updated_at handling.
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

DO $triggers$
DECLARE
  table_name TEXT;
BEGIN
  FOREACH table_name IN ARRAY ARRAY[
    'profiles', 'addresses', 'inquiries', 'quotations', 'orders',
    'payments', 'wallet_transactions', 'shipments', 'site_settings'
  ]
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS %I ON public.%I', table_name || '_set_updated_at', table_name);
    EXECUTE format(
      'CREATE TRIGGER %I BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.set_updated_at()',
      table_name || '_set_updated_at', table_name
    );
  END LOOP;
END
$triggers$;

-- Admin checks include account activation and avoid recursive profile policies.
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

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Replace all policies on Sabuyship public tables with the reviewed policy set.
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
  auth.uid() = id AND role = 'CUSTOMER' AND wallet_balance = 0 AND is_active
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
FOR INSERT TO anon WITH CHECK (customer_id IS NULL AND status = 'PENDING');
CREATE POLICY "Customers can create own inquiries" ON public.inquiries
FOR INSERT TO authenticated WITH CHECK (
  (customer_id = auth.uid() OR customer_id IS NULL) AND status = 'PENDING'
);
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

-- Table grants complement RLS. Remove legacy broad/public grants first.
REVOKE ALL PRIVILEGES ON TABLE
  public.profiles, public.addresses, public.inquiries, public.quotations,
  public.orders, public.payments, public.tracking_logs,
  public.wallet_transactions, public.shipments, public.site_settings
FROM anon, authenticated;

GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON public.site_settings TO anon, authenticated;
GRANT INSERT (
  inquiry_number, customer_id, customer_name, phone, line_id, product_url,
  quantity, items, shipping_type, service_type, status
) ON public.inquiries TO anon;
GRANT SELECT, INSERT ON public.inquiries TO authenticated;
GRANT SELECT ON public.profiles, public.quotations, public.orders, public.payments,
  public.tracking_logs, public.wallet_transactions, public.shipments TO authenticated;
GRANT INSERT, DELETE ON public.profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.addresses TO authenticated;
GRANT INSERT ON public.wallet_transactions TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.inquiries, public.quotations, public.orders,
  public.payments, public.tracking_logs, public.wallet_transactions, public.shipments
TO authenticated;
GRANT UPDATE ON public.site_settings TO authenticated;

REVOKE UPDATE ON public.profiles FROM anon, authenticated;
GRANT UPDATE (full_name, phone, line_id, line_uid, updated_at)
ON public.profiles TO authenticated;

REVOKE ALL ON SEQUENCE public.new_customer_code_seq FROM anon;
GRANT USAGE, SELECT ON SEQUENCE public.new_customer_code_seq TO authenticated;

-- Keep the existing public buckets, but replace only policies that reference the
-- two Sabuyship buckets. Policies for unrelated buckets are not touched.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('inquiries', 'inquiries', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp']),
  ('payment_slips', 'payment_slips', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DO $drop_storage_policies$
DECLARE
  policy_name TEXT;
BEGIN
  FOR policy_name IN
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND (
        coalesce(qual, '') LIKE '%inquiries%'
        OR coalesce(with_check, '') LIKE '%inquiries%'
        OR coalesce(qual, '') LIKE '%payment_slips%'
        OR coalesce(with_check, '') LIKE '%payment_slips%'
      )
  LOOP
    EXECUTE format('DROP POLICY %I ON storage.objects', policy_name);
  END LOOP;
END
$drop_storage_policies$;

CREATE POLICY "Anyone can upload inquiry images" ON storage.objects
FOR INSERT TO anon, authenticated WITH CHECK (bucket_id = 'inquiries');
CREATE POLICY "Authenticated users can upload payment slips" ON storage.objects
FOR INSERT TO authenticated WITH CHECK (bucket_id = 'payment_slips');
CREATE POLICY "Admins can delete Sabuyship uploads" ON storage.objects
FOR DELETE TO authenticated USING (
  bucket_id IN ('inquiries', 'payment_slips') AND public.is_admin()
);

COMMIT;
