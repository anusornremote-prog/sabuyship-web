-- Local-only until explicitly approved for staging/production.
-- Hardens administrative financial operations with audit trails and atomic RPCs.

CREATE TABLE IF NOT EXISTS public.admin_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  old_data JSONB,
  new_data JSONB,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS admin_audit_logs_entity_idx
  ON public.admin_audit_logs(entity_type, entity_id, created_at DESC);
CREATE INDEX IF NOT EXISTS admin_audit_logs_actor_idx
  ON public.admin_audit_logs(actor_id, created_at DESC);

ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can view audit logs" ON public.admin_audit_logs;
CREATE POLICY "Admins can view audit logs" ON public.admin_audit_logs
FOR SELECT TO authenticated USING (public.is_admin());

REVOKE ALL ON public.admin_audit_logs FROM anon, authenticated;
GRANT SELECT ON public.admin_audit_logs TO authenticated;

ALTER TABLE public.inquiries
  ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS archived_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS archive_reason TEXT;

CREATE INDEX IF NOT EXISTS inquiries_active_created_at_idx
  ON public.inquiries(created_at DESC) WHERE archived_at IS NULL;

ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS rejected_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS rejected_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS payment_reference TEXT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.payments WHERE status IN ('PENDING', 'APPROVED')
    GROUP BY order_id, payment_round HAVING count(*) > 1
  ) THEN
    CREATE UNIQUE INDEX IF NOT EXISTS payments_one_open_per_round_idx
      ON public.payments(order_id, payment_round)
      WHERE status IN ('PENDING', 'APPROVED');
  ELSE
    RAISE NOTICE 'Skipping payments_one_open_per_round_idx because legacy duplicate open payments require review';
  END IF;
END;
$$;

CREATE TABLE IF NOT EXISTS public.refunds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE RESTRICT,
  payment_id UUID REFERENCES public.payments(id) ON DELETE SET NULL,
  customer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDING'
    CHECK (status IN ('PENDING', 'APPROVED', 'PAID', 'FAILED', 'CANCELED')),
  refund_method TEXT,
  payment_reference TEXT,
  proof_path TEXT,
  requested_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  approved_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  paid_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  approved_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS refunds_status_created_at_idx
  ON public.refunds(status, created_at DESC);
CREATE INDEX IF NOT EXISTS refunds_order_id_idx ON public.refunds(order_id);

ALTER TABLE public.refunds ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Customers can view own refunds" ON public.refunds;
CREATE POLICY "Customers can view own refunds" ON public.refunds
FOR SELECT TO authenticated USING (customer_id = auth.uid());
DROP POLICY IF EXISTS "Admins can manage refunds" ON public.refunds;
CREATE POLICY "Admins can manage refunds" ON public.refunds
FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
GRANT SELECT ON public.refunds TO authenticated;

ALTER TABLE public.shipments
  ADD COLUMN IF NOT EXISTS shipping_cost_amount NUMERIC(12, 2)
    CHECK (shipping_cost_amount IS NULL OR shipping_cost_amount >= 0),
  ADD COLUMN IF NOT EXISTS payment_status TEXT NOT NULL DEFAULT 'PENDING'
    CHECK (payment_status IN ('PENDING', 'PAID', 'WAIVED', 'REFUNDED')),
  ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS paid_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS payment_reference TEXT;

UPDATE public.shipments
SET
  shipping_cost_amount = CASE
    WHEN trim(regexp_replace(COALESCE(shipping_cost, ''), '[^0-9.]', '', 'g')) ~ '^[0-9]+(\.[0-9]+)?$'
      THEN trim(regexp_replace(shipping_cost, '[^0-9.]', '', 'g'))::numeric
    ELSE NULL
  END,
  payment_status = CASE
    WHEN COALESCE(shipping_cost, '') LIKE '%(จ่ายแล้ว)%' THEN 'PAID'
    ELSE payment_status
  END
WHERE shipping_cost_amount IS NULL;

CREATE TABLE IF NOT EXISTS public.exchange_rate_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  old_rate NUMERIC(12, 4),
  new_rate NUMERIC(12, 4) NOT NULL CHECK (new_rate > 0),
  reason TEXT,
  changed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.exchange_rate_history ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can view exchange rate history" ON public.exchange_rate_history;
CREATE POLICY "Admins can view exchange rate history" ON public.exchange_rate_history
FOR SELECT TO authenticated USING (public.is_admin());
GRANT SELECT ON public.exchange_rate_history TO authenticated;

CREATE TABLE IF NOT EXISTS public.shipment_import_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_name TEXT NOT NULL,
  total_rows INTEGER NOT NULL DEFAULT 0,
  imported_rows INTEGER NOT NULL DEFAULT 0,
  failed_rows INTEGER NOT NULL DEFAULT 0,
  result JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.shipment_import_batches ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can view shipment imports" ON public.shipment_import_batches;
CREATE POLICY "Admins can view shipment imports" ON public.shipment_import_batches
FOR SELECT TO authenticated USING (public.is_admin());
GRANT SELECT ON public.shipment_import_batches TO authenticated;

CREATE TABLE IF NOT EXISTS public.notification_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_type TEXT NOT NULL CHECK (recipient_type IN ('ADMIN', 'CUSTOMER')),
  recipient_profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  channel TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('SENT', 'FAILED', 'SKIPPED')),
  error_code TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS notification_logs_created_at_idx ON public.notification_logs(created_at DESC);
ALTER TABLE public.notification_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can view notification logs" ON public.notification_logs;
CREATE POLICY "Admins can view notification logs" ON public.notification_logs
FOR SELECT TO authenticated USING (public.is_admin());
GRANT SELECT ON public.notification_logs TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_review_payment(
  p_payment_id UUID,
  p_decision TEXT,
  p_rejection_reason TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_actor UUID := auth.uid();
  v_payment public.payments%ROWTYPE;
  v_order public.orders%ROWTYPE;
  v_round_column TEXT;
  v_next_status public.order_status;
  v_log_status TEXT;
  v_expected NUMERIC(12, 2);
  v_quote public.quotations%ROWTYPE;
  v_child RECORD;
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Forbidden'; END IF;
  IF p_decision NOT IN ('APPROVE', 'REJECT') THEN RAISE EXCEPTION 'Invalid decision'; END IF;
  IF p_decision = 'REJECT' AND COALESCE(trim(p_rejection_reason), '') = '' THEN
    RAISE EXCEPTION 'Rejection reason is required';
  END IF;

  SELECT * INTO v_payment FROM public.payments WHERE id = p_payment_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Payment not found'; END IF;
  IF v_payment.status <> 'PENDING' THEN RAISE EXCEPTION 'Payment was already reviewed'; END IF;
  IF v_payment.payment_round NOT BETWEEN 1 AND 3 THEN RAISE EXCEPTION 'Invalid payment round'; END IF;

  SELECT * INTO v_order FROM public.orders WHERE id = v_payment.order_id FOR UPDATE;
  SELECT * INTO v_quote FROM public.quotations WHERE id = v_order.quotation_id;

  v_round_column := format('payment_round_%s_status', v_payment.payment_round);
  IF (to_jsonb(v_order) ->> v_round_column) <> 'UPLOADED' THEN
    RAISE EXCEPTION 'Order payment round is not awaiting review';
  END IF;

  v_expected := CASE v_payment.payment_round
    WHEN 1 THEN COALESCE(v_quote.product_cost, 0) + COALESCE(v_quote.shipping_cost_cn_cn, 0)
    WHEN 2 THEN COALESCE(v_quote.shipping_cost_cn_th, 0)
    WHEN 3 THEN COALESCE(v_quote.shipping_cost_th_th, 0)
  END;
  IF abs(v_payment.amount - v_expected) > 0.01 THEN
    RAISE EXCEPTION 'Payment amount does not match the current round total';
  END IF;

  IF p_decision = 'APPROVE' THEN
    UPDATE public.payments SET
      status = 'APPROVED', approved_by = v_actor, approved_at = now(),
      rejected_by = NULL, rejected_at = NULL, rejection_reason = NULL
    WHERE id = p_payment_id;

    v_next_status := CASE v_payment.payment_round
      WHEN 1 THEN 'ORDERED'::public.order_status
      WHEN 2 THEN 'SHIPPING'::public.order_status
      WHEN 3 THEN 'OUT_FOR_DELIVERY'::public.order_status
    END;
    v_log_status := format('PAID_ROUND_%s', v_payment.payment_round);
    EXECUTE format('UPDATE public.orders SET %I = $1, status = $2 WHERE id = $3', v_round_column)
      USING 'PAID'::public.payment_round_status, v_next_status, v_order.id;

    INSERT INTO public.tracking_logs(order_id, status, notes, created_by)
    VALUES (v_order.id, v_log_status,
      format('ชำระเงินรอบที่ %s เรียบร้อยแล้ว', v_payment.payment_round), v_actor);

    IF v_payment.payment_round = 3 THEN
      FOR v_child IN
        SELECT id FROM public.orders WHERE consolidated_into_id = v_order.id FOR UPDATE
      LOOP
        UPDATE public.orders SET status = 'OUT_FOR_DELIVERY', payment_round_3_status = 'PAID'
        WHERE id = v_child.id;
        INSERT INTO public.tracking_logs(order_id, status, notes, created_by)
        VALUES (v_child.id, 'PAID_ROUND_3',
          format('ชำระรอบที่ 3 ผ่านออเดอร์หลัก %s', v_order.order_number), v_actor);
      END LOOP;
    END IF;
  ELSE
    UPDATE public.payments SET
      status = 'REJECTED', rejection_reason = trim(p_rejection_reason),
      rejected_by = v_actor, rejected_at = now(), approved_by = NULL, approved_at = NULL
    WHERE id = p_payment_id;
    EXECUTE format('UPDATE public.orders SET %I = $1, status = $2 WHERE id = $3', v_round_column)
      USING 'REJECTED'::public.payment_round_status, 'PAYMENT_REJECTED'::public.order_status, v_order.id;
    INSERT INTO public.tracking_logs(order_id, status, notes, created_by)
    VALUES (v_order.id, 'PAYMENT_REJECTED',
      format('สลิปรอบที่ %s ถูกปฏิเสธ: %s', v_payment.payment_round, trim(p_rejection_reason)), v_actor);
  END IF;

  INSERT INTO public.admin_audit_logs(actor_id, action, entity_type, entity_id, old_data, new_data, reason)
  VALUES (v_actor, 'PAYMENT_' || p_decision, 'payment', v_payment.id,
    to_jsonb(v_payment), jsonb_build_object('decision', p_decision, 'order_id', v_order.id), p_rejection_reason);

  RETURN jsonb_build_object(
    'payment_id', v_payment.id,
    'order_id', v_order.id,
    'customer_id', v_order.customer_id,
    'order_number', v_order.order_number,
    'payment_round', v_payment.payment_round,
    'decision', p_decision
  );
END;
$$;

REVOKE ALL ON FUNCTION public.admin_review_payment(UUID, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_review_payment(UUID, TEXT, TEXT) TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_quote_shipping_round(
  p_order_id UUID,
  p_round SMALLINT,
  p_amount NUMERIC,
  p_updated_items JSONB DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_actor UUID := auth.uid();
  v_order public.orders%ROWTYPE;
  v_quote public.quotations%ROWTYPE;
  v_inquiry_id UUID;
  v_old_amount NUMERIC(12, 2);
  v_new_total NUMERIC(12, 2);
  v_round_status public.payment_round_status;
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Forbidden'; END IF;
  IF p_round NOT IN (2, 3) OR p_amount IS NULL OR p_amount < 0 OR p_amount > 10000000 THEN
    RAISE EXCEPTION 'Invalid shipping amount';
  END IF;

  SELECT * INTO v_order FROM public.orders WHERE id = p_order_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Order not found'; END IF;
  SELECT * INTO v_quote FROM public.quotations WHERE id = v_order.quotation_id FOR UPDATE;
  SELECT inquiry_id INTO v_inquiry_id FROM public.quotations WHERE id = v_order.quotation_id;

  v_round_status := CASE p_round
    WHEN 2 THEN v_order.payment_round_2_status
    ELSE v_order.payment_round_3_status
  END;
  IF v_round_status = 'PAID' THEN RAISE EXCEPTION 'Paid round cannot be edited'; END IF;
  IF v_round_status = 'UPLOADED' THEN RAISE EXCEPTION 'Round with a pending slip cannot be edited'; END IF;
  IF p_updated_items IS NOT NULL AND jsonb_typeof(p_updated_items) <> 'array' THEN
    RAISE EXCEPTION 'Updated items must be an array';
  END IF;

  IF p_round = 2 THEN
    v_old_amount := COALESCE(v_quote.shipping_cost_cn_th, 0);
    v_new_total := v_quote.total_price - v_old_amount + p_amount;
    UPDATE public.quotations SET shipping_cost_cn_th = p_amount, total_price = v_new_total
      WHERE id = v_quote.id;
    UPDATE public.orders SET
      payment_round_2_status = CASE WHEN p_amount = 0 THEN 'PAID'::public.payment_round_status ELSE 'PENDING'::public.payment_round_status END,
      status = CASE WHEN p_amount = 0 THEN 'SHIPPING'::public.order_status ELSE 'CHINA_WAREHOUSE'::public.order_status END
      WHERE id = v_order.id;
  ELSE
    v_old_amount := COALESCE(v_quote.shipping_cost_th_th, 0);
    v_new_total := v_quote.total_price - v_old_amount + p_amount;
    UPDATE public.quotations SET shipping_cost_th_th = p_amount, total_price = v_new_total
      WHERE id = v_quote.id;
    UPDATE public.orders SET
      payment_round_3_status = CASE WHEN p_amount = 0 THEN 'PAID'::public.payment_round_status ELSE 'PENDING'::public.payment_round_status END,
      status = CASE WHEN p_amount = 0 THEN 'OUT_FOR_DELIVERY'::public.order_status ELSE 'THAILAND_WAREHOUSE'::public.order_status END
      WHERE id = v_order.id;
  END IF;

  IF p_updated_items IS NOT NULL THEN
    UPDATE public.inquiries SET items = p_updated_items WHERE id = v_inquiry_id;
  END IF;

  INSERT INTO public.tracking_logs(order_id, status, notes, created_by)
  VALUES (v_order.id, format('QUOTED_ROUND_%s', p_round),
    format('อัปเดตค่าขนส่งรอบที่ %s เป็นจำนวน %s บาท', p_round, p_amount), v_actor);
  IF p_amount = 0 THEN
    INSERT INTO public.tracking_logs(order_id, status, notes, created_by)
    VALUES (v_order.id, format('PAID_ROUND_%s', p_round),
      format('รอบที่ %s ไม่มีค่าใช้จ่ายและปิดยอดอัตโนมัติ', p_round), v_actor);
  END IF;

  INSERT INTO public.admin_audit_logs(actor_id, action, entity_type, entity_id, old_data, new_data)
  VALUES (v_actor, format('QUOTE_ROUND_%s', p_round), 'order', v_order.id,
    jsonb_build_object('amount', v_old_amount, 'status', v_order.status),
    jsonb_build_object('amount', p_amount, 'total_price', v_new_total));

  RETURN jsonb_build_object('order_id', v_order.id, 'customer_id', v_order.customer_id,
    'order_number', v_order.order_number, 'round', p_round, 'amount', p_amount);
END;
$$;

REVOKE ALL ON FUNCTION public.admin_quote_shipping_round(UUID, SMALLINT, NUMERIC, JSONB) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_quote_shipping_round(UUID, SMALLINT, NUMERIC, JSONB) TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_archive_inquiries(p_ids UUID[], p_reason TEXT)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_actor UUID := auth.uid();
  v_count INTEGER;
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Forbidden'; END IF;
  IF COALESCE(array_length(p_ids, 1), 0) = 0 OR COALESCE(trim(p_reason), '') = '' THEN
    RAISE EXCEPTION 'IDs and archive reason are required';
  END IF;

  UPDATE public.inquiries
  SET archived_at = now(), archived_by = v_actor, archive_reason = trim(p_reason)
  WHERE id = ANY(p_ids) AND archived_at IS NULL;
  GET DIAGNOSTICS v_count = ROW_COUNT;

  INSERT INTO public.admin_audit_logs(actor_id, action, entity_type, new_data, reason)
  VALUES (v_actor, 'INQUIRIES_ARCHIVED', 'inquiry', jsonb_build_object('ids', p_ids, 'count', v_count), trim(p_reason));
  RETURN v_count;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_archive_inquiries(UUID[], TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_archive_inquiries(UUID[], TEXT) TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_set_exchange_rate(p_new_rate NUMERIC, p_reason TEXT DEFAULT NULL)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_actor UUID := auth.uid();
  v_old_rate NUMERIC(12, 4);
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Forbidden'; END IF;
  IF p_new_rate IS NULL OR p_new_rate < 0.1 OR p_new_rate > 100 THEN
    RAISE EXCEPTION 'Invalid exchange rate';
  END IF;

  SELECT (value #>> '{}')::numeric INTO v_old_rate FROM public.site_settings WHERE key = 'exchange_rate' FOR UPDATE;
  INSERT INTO public.site_settings(key, value, updated_at)
  VALUES ('exchange_rate', to_jsonb(p_new_rate), now())
  ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = EXCLUDED.updated_at;

  INSERT INTO public.exchange_rate_history(old_rate, new_rate, reason, changed_by)
  VALUES (v_old_rate, p_new_rate, NULLIF(trim(p_reason), ''), v_actor);
  INSERT INTO public.admin_audit_logs(actor_id, action, entity_type, old_data, new_data, reason)
  VALUES (v_actor, 'EXCHANGE_RATE_CHANGED', 'site_setting',
    jsonb_build_object('rate', v_old_rate), jsonb_build_object('rate', p_new_rate), p_reason);
  RETURN jsonb_build_object('old_rate', v_old_rate, 'new_rate', p_new_rate);
END;
$$;

REVOKE ALL ON FUNCTION public.admin_set_exchange_rate(NUMERIC, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_set_exchange_rate(NUMERIC, TEXT) TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_mark_shipment_paid(
  p_shipment_id UUID,
  p_payment_reference TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_actor UUID := auth.uid();
  v_shipment public.shipments%ROWTYPE;
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Forbidden'; END IF;
  SELECT * INTO v_shipment FROM public.shipments WHERE id = p_shipment_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Shipment not found'; END IF;
  IF v_shipment.payment_status = 'PAID' THEN RAISE EXCEPTION 'Shipment is already paid'; END IF;

  UPDATE public.shipments SET payment_status = 'PAID', paid_at = now(), paid_by = v_actor,
    payment_reference = NULLIF(trim(p_payment_reference), '') WHERE id = p_shipment_id;
  INSERT INTO public.admin_audit_logs(actor_id, action, entity_type, entity_id, old_data, new_data)
  VALUES (v_actor, 'SHIPMENT_PAYMENT_RECEIVED', 'shipment', p_shipment_id,
    to_jsonb(v_shipment), jsonb_build_object('payment_status', 'PAID', 'payment_reference', p_payment_reference));
  RETURN jsonb_build_object('shipment_id', p_shipment_id, 'payment_status', 'PAID');
END;
$$;

REVOKE ALL ON FUNCTION public.admin_mark_shipment_paid(UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_mark_shipment_paid(UUID, TEXT) TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_update_order_status(
  p_order_id UUID,
  p_status public.order_status,
  p_tracking_number TEXT,
  p_shipping_company TEXT,
  p_reason TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_actor UUID := auth.uid();
  v_order public.orders%ROWTYPE;
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Forbidden'; END IF;
  IF COALESCE(trim(p_reason), '') = '' THEN RAISE EXCEPTION 'Reason is required'; END IF;
  SELECT * INTO v_order FROM public.orders WHERE id = p_order_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Order not found'; END IF;
  IF v_order.status IN ('DELIVERED', 'CANCELED') AND p_status <> v_order.status THEN
    RAISE EXCEPTION 'Closed orders cannot be reopened with the manual status tool';
  END IF;

  UPDATE public.orders SET
    status = p_status,
    tracking_number = NULLIF(trim(p_tracking_number), ''),
    shipping_company = COALESCE(NULLIF(trim(p_shipping_company), ''), shipping_company),
    delivered_at = CASE WHEN p_status = 'DELIVERED' THEN COALESCE(delivered_at, now()) ELSE delivered_at END
  WHERE id = p_order_id;
  INSERT INTO public.tracking_logs(order_id, status, notes, created_by)
  VALUES (p_order_id, p_status::text, trim(p_reason), v_actor);
  INSERT INTO public.admin_audit_logs(actor_id, action, entity_type, entity_id, old_data, new_data, reason)
  VALUES (v_actor, 'ORDER_STATUS_MANUAL', 'order', p_order_id, to_jsonb(v_order),
    jsonb_build_object('status', p_status, 'tracking_number', p_tracking_number,
      'shipping_company', p_shipping_company), trim(p_reason));
  RETURN jsonb_build_object('order_id', p_order_id, 'customer_id', v_order.customer_id,
    'order_number', v_order.order_number, 'status', p_status);
END;
$$;

REVOKE ALL ON FUNCTION public.admin_update_order_status(UUID, public.order_status, TEXT, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_update_order_status(UUID, public.order_status, TEXT, TEXT, TEXT) TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_record_out_of_stock(
  p_order_id UUID,
  p_items JSONB,
  p_cancel_entire_order BOOLEAN,
  p_reason TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_actor UUID := auth.uid();
  v_order public.orders%ROWTYPE;
  v_inquiry_id UUID;
  v_refund NUMERIC(12, 2) := 0;
  v_item JSONB;
  v_total_qty NUMERIC;
  v_out_qty NUMERIC;
  v_unit_price NUMERIC;
  v_refund_id UUID;
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Forbidden'; END IF;
  IF jsonb_typeof(p_items) <> 'array' OR COALESCE(trim(p_reason), '') = '' THEN
    RAISE EXCEPTION 'Items and reason are required';
  END IF;
  SELECT * INTO v_order FROM public.orders WHERE id = p_order_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Order not found'; END IF;
  SELECT inquiry_id INTO v_inquiry_id FROM public.quotations WHERE id = v_order.quotation_id;
  IF v_inquiry_id IS NULL THEN RAISE EXCEPTION 'Linked inquiry not found'; END IF;

  FOR v_item IN SELECT value FROM jsonb_array_elements(p_items)
  LOOP
    IF COALESCE((v_item ->> 'is_out_of_stock')::boolean, false) THEN
      v_total_qty := GREATEST(COALESCE((v_item ->> 'quantity')::numeric, 1), 1);
      v_out_qty := COALESCE((v_item ->> 'out_of_stock_qty')::numeric, 0);
      IF v_out_qty <= 0 OR v_out_qty > v_total_qty THEN RAISE EXCEPTION 'Invalid out-of-stock quantity'; END IF;
      v_unit_price := CASE
        WHEN COALESCE((v_item ->> 'price_thb')::numeric, 0) > 0 THEN (v_item ->> 'price_thb')::numeric
        ELSE COALESCE((v_item ->> 'quoted_price')::numeric, 0) / v_total_qty
      END;
      v_refund := v_refund + round(v_out_qty * v_unit_price, 2);
    END IF;
  END LOOP;

  UPDATE public.inquiries SET items = p_items WHERE id = v_inquiry_id;
  IF p_cancel_entire_order THEN
    UPDATE public.orders SET status = 'CANCELED' WHERE id = p_order_id;
  END IF;
  IF v_refund > 0 THEN
    INSERT INTO public.refunds(order_id, customer_id, amount, reason, requested_by)
    VALUES (p_order_id, v_order.customer_id, v_refund, trim(p_reason), v_actor)
    RETURNING id INTO v_refund_id;
  END IF;
  INSERT INTO public.tracking_logs(order_id, status, notes, created_by)
  VALUES (p_order_id, CASE WHEN p_cancel_entire_order THEN 'ORDER_CANCELED' ELSE 'ITEM_OUT_OF_STOCK' END,
    format('%s (ยอดรอดำเนินการคืน %s บาท)', trim(p_reason), v_refund), v_actor);
  INSERT INTO public.admin_audit_logs(actor_id, action, entity_type, entity_id, old_data, new_data, reason)
  VALUES (v_actor, 'OUT_OF_STOCK_RECORDED', 'order', p_order_id, to_jsonb(v_order),
    jsonb_build_object('refund_id', v_refund_id, 'refund_amount', v_refund,
      'cancel_entire_order', p_cancel_entire_order), trim(p_reason));
  RETURN jsonb_build_object('order_id', p_order_id, 'customer_id', v_order.customer_id,
    'order_number', v_order.order_number, 'refund_id', v_refund_id,
    'refund_amount', v_refund, 'is_canceled', p_cancel_entire_order);
END;
$$;

REVOKE ALL ON FUNCTION public.admin_record_out_of_stock(UUID, JSONB, BOOLEAN, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_record_out_of_stock(UUID, JSONB, BOOLEAN, TEXT) TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_import_shipments(p_file_name TEXT, p_rows JSONB)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_actor UUID := auth.uid();
  v_row JSONB;
  v_profile_id UUID;
  v_count INTEGER := 0;
  v_batch_id UUID;
  v_tracking TEXT;
  v_customer_code TEXT;
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Forbidden'; END IF;
  IF jsonb_typeof(p_rows) <> 'array' OR jsonb_array_length(p_rows) = 0 OR jsonb_array_length(p_rows) > 1000 THEN
    RAISE EXCEPTION 'Import must contain 1-1000 rows';
  END IF;
  INSERT INTO public.shipment_import_batches(file_name, total_rows, created_by)
  VALUES (COALESCE(NULLIF(trim(p_file_name), ''), 'shipments.xlsx'), jsonb_array_length(p_rows), v_actor)
  RETURNING id INTO v_batch_id;

  FOR v_row IN SELECT value FROM jsonb_array_elements(p_rows)
  LOOP
    v_customer_code := trim(COALESCE(v_row ->> 'customer_code', ''));
    v_tracking := trim(COALESCE(v_row ->> 'tracking_number', ''));
    IF v_customer_code = '' OR v_tracking = '' THEN RAISE EXCEPTION 'Every row requires customer_code and tracking_number'; END IF;
    SELECT id INTO v_profile_id FROM public.profiles WHERE customer_code = v_customer_code AND role = 'CUSTOMER';

    INSERT INTO public.shipments(
      customer_code, customer_id, transport_type, tracking_number, product_type,
      product_name, container_date, quantity, weight, arrival_date,
      shipping_cost, shipping_cost_amount, width, length, height
    ) VALUES (
      v_customer_code, v_profile_id, NULLIF(v_row ->> 'transport_type', ''), v_tracking,
      NULLIF(v_row ->> 'product_type', ''), NULLIF(v_row ->> 'product_name', ''),
      NULLIF(v_row ->> 'container_date', ''), NULLIF(v_row ->> 'quantity', '')::integer,
      NULLIF(v_row ->> 'weight', '')::numeric, NULLIF(v_row ->> 'arrival_date', ''),
      NULLIF(v_row ->> 'shipping_cost', ''), NULLIF(v_row ->> 'shipping_cost_amount', '')::numeric,
      NULLIF(v_row ->> 'width', '')::numeric, NULLIF(v_row ->> 'length', '')::numeric,
      NULLIF(v_row ->> 'height', '')::numeric
    )
    ON CONFLICT (tracking_number) WHERE tracking_number IS NOT NULL
    DO UPDATE SET
      customer_code = EXCLUDED.customer_code, customer_id = EXCLUDED.customer_id,
      transport_type = EXCLUDED.transport_type, product_type = EXCLUDED.product_type,
      product_name = EXCLUDED.product_name, container_date = EXCLUDED.container_date,
      quantity = EXCLUDED.quantity, weight = EXCLUDED.weight, arrival_date = EXCLUDED.arrival_date,
      shipping_cost = EXCLUDED.shipping_cost, shipping_cost_amount = EXCLUDED.shipping_cost_amount,
      width = EXCLUDED.width, length = EXCLUDED.length, height = EXCLUDED.height;
    v_count := v_count + 1;
  END LOOP;

  UPDATE public.shipment_import_batches SET imported_rows = v_count,
    result = jsonb_build_object('status', 'COMPLETED') WHERE id = v_batch_id;
  INSERT INTO public.admin_audit_logs(actor_id, action, entity_type, entity_id, new_data)
  VALUES (v_actor, 'SHIPMENTS_IMPORTED', 'shipment_import_batch', v_batch_id,
    jsonb_build_object('file_name', p_file_name, 'rows', v_count));
  RETURN jsonb_build_object('batch_id', v_batch_id, 'imported_rows', v_count);
END;
$$;

REVOKE ALL ON FUNCTION public.admin_import_shipments(TEXT, JSONB) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_import_shipments(TEXT, JSONB) TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_record_manual_payment(
  p_order_id UUID,
  p_reason TEXT,
  p_payment_reference TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_actor UUID := auth.uid();
  v_order public.orders%ROWTYPE;
  v_quote public.quotations%ROWTYPE;
  v_round SMALLINT;
  v_amount NUMERIC(12, 2);
  v_payment_id UUID;
  v_next_status public.order_status;
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Forbidden'; END IF;
  IF COALESCE(trim(p_reason), '') = '' THEN RAISE EXCEPTION 'Reason is required'; END IF;
  SELECT * INTO v_order FROM public.orders WHERE id = p_order_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Order not found'; END IF;
  SELECT * INTO v_quote FROM public.quotations WHERE id = v_order.quotation_id;

  IF v_order.payment_round_1_status NOT IN ('PAID', 'NOT_APPLICABLE') THEN v_round := 1;
  ELSIF v_order.status IN ('ORDERED', 'CHINA_WAREHOUSE') AND v_order.payment_round_2_status <> 'PAID' THEN v_round := 2;
  ELSIF v_order.status IN ('SHIPPING', 'THAILAND_WAREHOUSE') AND v_order.payment_round_3_status <> 'PAID' THEN v_round := 3;
  ELSE RAISE EXCEPTION 'No payable round is currently open';
  END IF;

  v_amount := CASE v_round
    WHEN 1 THEN COALESCE(v_quote.product_cost, 0) + COALESCE(v_quote.shipping_cost_cn_cn, 0)
    WHEN 2 THEN COALESCE(v_quote.shipping_cost_cn_th, 0)
    WHEN 3 THEN COALESCE(v_quote.shipping_cost_th_th, 0)
  END;
  IF v_amount <= 0 THEN RAISE EXCEPTION 'The current round has no payable amount'; END IF;
  IF EXISTS (SELECT 1 FROM public.payments WHERE order_id = p_order_id AND payment_round = v_round
    AND status IN ('PENDING', 'APPROVED')) THEN
    RAISE EXCEPTION 'An open payment already exists for this round';
  END IF;

  INSERT INTO public.payments(order_id, payment_round, amount, payment_date, payment_method,
    payment_reference, slip_url, status, approved_by, approved_at)
  VALUES (p_order_id, v_round, v_amount, now(), 'MANUAL', NULLIF(trim(p_payment_reference), ''),
    'manual://admin-confirmed', 'APPROVED', v_actor, now())
  RETURNING id INTO v_payment_id;

  v_next_status := CASE v_round WHEN 1 THEN 'ORDERED' WHEN 2 THEN 'SHIPPING' ELSE 'OUT_FOR_DELIVERY' END;
  IF v_round = 1 THEN UPDATE public.orders SET payment_round_1_status = 'PAID', status = v_next_status WHERE id = p_order_id;
  ELSIF v_round = 2 THEN UPDATE public.orders SET payment_round_2_status = 'PAID', status = v_next_status WHERE id = p_order_id;
  ELSE UPDATE public.orders SET payment_round_3_status = 'PAID', status = v_next_status WHERE id = p_order_id;
  END IF;

  INSERT INTO public.tracking_logs(order_id, status, notes, created_by)
  VALUES (p_order_id, format('PAID_ROUND_%s', v_round),
    format('แอดมินยืนยันรับชำระรอบที่ %s: %s', v_round, trim(p_reason)), v_actor);
  INSERT INTO public.admin_audit_logs(actor_id, action, entity_type, entity_id, new_data, reason)
  VALUES (v_actor, 'MANUAL_PAYMENT_RECORDED', 'payment', v_payment_id,
    jsonb_build_object('order_id', p_order_id, 'payment_round', v_round, 'amount', v_amount,
      'payment_reference', p_payment_reference), trim(p_reason));
  RETURN jsonb_build_object('payment_id', v_payment_id, 'order_id', p_order_id,
    'customer_id', v_order.customer_id, 'order_number', v_order.order_number,
    'payment_round', v_round, 'amount', v_amount);
END;
$$;

REVOKE ALL ON FUNCTION public.admin_record_manual_payment(UUID, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_record_manual_payment(UUID, TEXT, TEXT) TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_update_refund(
  p_refund_id UUID,
  p_status TEXT,
  p_refund_method TEXT DEFAULT NULL,
  p_payment_reference TEXT DEFAULT NULL,
  p_reason TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_actor UUID := auth.uid();
  v_refund public.refunds%ROWTYPE;
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Forbidden'; END IF;
  IF p_status NOT IN ('APPROVED', 'PAID', 'FAILED', 'CANCELED') THEN RAISE EXCEPTION 'Invalid refund status'; END IF;
  SELECT * INTO v_refund FROM public.refunds WHERE id = p_refund_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Refund not found'; END IF;
  IF v_refund.status IN ('PAID', 'CANCELED') THEN RAISE EXCEPTION 'Closed refund cannot be changed'; END IF;
  IF p_status = 'PAID' AND (COALESCE(trim(p_refund_method), '') = '' OR COALESCE(trim(p_payment_reference), '') = '') THEN
    RAISE EXCEPTION 'Paid refund requires method and payment reference';
  END IF;

  UPDATE public.refunds SET
    status = p_status,
    refund_method = COALESCE(NULLIF(trim(p_refund_method), ''), refund_method),
    payment_reference = COALESCE(NULLIF(trim(p_payment_reference), ''), payment_reference),
    approved_by = CASE WHEN p_status = 'APPROVED' THEN v_actor ELSE approved_by END,
    approved_at = CASE WHEN p_status = 'APPROVED' THEN now() ELSE approved_at END,
    paid_by = CASE WHEN p_status = 'PAID' THEN v_actor ELSE paid_by END,
    paid_at = CASE WHEN p_status = 'PAID' THEN now() ELSE paid_at END,
    updated_at = now()
  WHERE id = p_refund_id;
  INSERT INTO public.tracking_logs(order_id, status, notes, created_by)
  VALUES (v_refund.order_id, 'REFUND_' || p_status,
    format('อัปเดตเงินคืน %s บาท เป็น %s%s', v_refund.amount, p_status,
      CASE WHEN COALESCE(trim(p_reason), '') <> '' THEN ': ' || trim(p_reason) ELSE '' END), v_actor);
  INSERT INTO public.admin_audit_logs(actor_id, action, entity_type, entity_id, old_data, new_data, reason)
  VALUES (v_actor, 'REFUND_' || p_status, 'refund', p_refund_id, to_jsonb(v_refund),
    jsonb_build_object('status', p_status, 'refund_method', p_refund_method,
      'payment_reference', p_payment_reference), p_reason);
  RETURN jsonb_build_object('refund_id', p_refund_id, 'order_id', v_refund.order_id,
    'customer_id', v_refund.customer_id, 'amount', v_refund.amount, 'status', p_status);
END;
$$;

REVOKE ALL ON FUNCTION public.admin_update_refund(UUID, TEXT, TEXT, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_update_refund(UUID, TEXT, TEXT, TEXT, TEXT) TO authenticated;

CREATE OR REPLACE FUNCTION public.customer_submit_payment(
  p_order_id UUID,
  p_payment_round SMALLINT,
  p_amount NUMERIC,
  p_payment_date TIMESTAMPTZ,
  p_slip_path TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_actor UUID := auth.uid();
  v_order public.orders%ROWTYPE;
  v_quote public.quotations%ROWTYPE;
  v_expected NUMERIC(12, 2);
  v_current_status public.payment_round_status;
  v_payment_id UUID;
  v_order_number TEXT;
  v_customer_name TEXT;
BEGIN
  IF v_actor IS NULL THEN RAISE EXCEPTION 'Unauthorized'; END IF;
  IF p_payment_round NOT IN (1, 2, 3) OR p_amount <= 0 THEN RAISE EXCEPTION 'Invalid payment details'; END IF;
  IF p_payment_date IS NULL OR p_payment_date > now() + interval '10 minutes' THEN RAISE EXCEPTION 'Invalid payment date'; END IF;
  IF COALESCE(p_slip_path, '') = ''
    OR p_slip_path NOT LIKE v_actor::TEXT || '/' || p_order_id::TEXT || '/%'
    OR p_slip_path LIKE '%..%' THEN
    RAISE EXCEPTION 'Invalid payment slip path';
  END IF;

  SELECT * INTO v_order FROM public.orders WHERE id = p_order_id FOR UPDATE;
  IF NOT FOUND OR v_order.customer_id <> v_actor THEN RAISE EXCEPTION 'Order not found'; END IF;
  SELECT * INTO v_quote FROM public.quotations WHERE id = v_order.quotation_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Quotation not found'; END IF;

  v_expected := CASE p_payment_round
    WHEN 1 THEN COALESCE(v_quote.product_cost, 0) + COALESCE(v_quote.shipping_cost_cn_cn, 0)
    WHEN 2 THEN COALESCE(v_quote.shipping_cost_cn_th, 0)
    WHEN 3 THEN COALESCE(v_quote.shipping_cost_th_th, 0)
  END;
  IF abs(round(p_amount, 2) - round(v_expected, 2)) > 0.01 THEN
    RAISE EXCEPTION 'Payment amount does not match this round';
  END IF;

  v_current_status := CASE p_payment_round
    WHEN 1 THEN v_order.payment_round_1_status
    WHEN 2 THEN v_order.payment_round_2_status
    WHEN 3 THEN v_order.payment_round_3_status
  END;
  IF v_current_status NOT IN ('PENDING', 'REJECTED') THEN
    RAISE EXCEPTION 'This payment round is not accepting a slip';
  END IF;
  IF EXISTS (SELECT 1 FROM public.payments WHERE order_id = p_order_id
    AND payment_round = p_payment_round AND status IN ('PENDING', 'APPROVED')) THEN
    RAISE EXCEPTION 'An open payment already exists for this round';
  END IF;

  INSERT INTO public.payments(order_id, payment_round, amount, payment_date, payment_method, slip_url, status)
  VALUES (p_order_id, p_payment_round, round(p_amount, 2), p_payment_date, 'BANK_TRANSFER', p_slip_path, 'PENDING')
  RETURNING id INTO v_payment_id;

  IF p_payment_round = 1 THEN UPDATE public.orders SET payment_round_1_status = 'UPLOADED' WHERE id = p_order_id;
  ELSIF p_payment_round = 2 THEN UPDATE public.orders SET payment_round_2_status = 'UPLOADED' WHERE id = p_order_id;
  ELSE UPDATE public.orders SET payment_round_3_status = 'UPLOADED' WHERE id = p_order_id;
  END IF;

  INSERT INTO public.tracking_logs(order_id, status, notes, created_by)
  VALUES (p_order_id, format('UPLOADED_ROUND_%s', p_payment_round),
    format('แนบหลักฐานชำระเงิน รอบที่ %s (ยอด %s บาท)', p_payment_round, round(p_amount, 2)), v_actor);

  SELECT o.order_number, COALESCE(p.full_name, p.customer_code, 'ไม่ระบุชื่อ')
  INTO v_order_number, v_customer_name
  FROM public.orders o LEFT JOIN public.profiles p ON p.id = o.customer_id WHERE o.id = p_order_id;
  RETURN jsonb_build_object('payment_id', v_payment_id, 'order_id', p_order_id,
    'order_number', v_order_number, 'customer_name', v_customer_name,
    'payment_round', p_payment_round, 'amount', round(p_amount, 2));
END;
$$;

REVOKE ALL ON FUNCTION public.customer_submit_payment(UUID, SMALLINT, NUMERIC, TIMESTAMPTZ, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.customer_submit_payment(UUID, SMALLINT, NUMERIC, TIMESTAMPTZ, TEXT) TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_upsert_round1_quotation(
  p_inquiry_id UUID,
  p_quotation_id UUID,
  p_product_cost NUMERIC,
  p_shipping_cost_cn_cn NUMERIC,
  p_other_fee NUMERIC,
  p_updated_items JSONB DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_actor UUID := auth.uid();
  v_inquiry public.inquiries%ROWTYPE;
  v_quote public.quotations%ROWTYPE;
  v_quote_id UUID;
  v_total NUMERIC(12, 2);
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Forbidden'; END IF;
  IF p_product_cost < 0 OR p_shipping_cost_cn_cn < 0 OR p_other_fee < 0 THEN RAISE EXCEPTION 'Amounts cannot be negative'; END IF;
  IF p_updated_items IS NOT NULL AND jsonb_typeof(p_updated_items) <> 'array' THEN RAISE EXCEPTION 'Items must be an array'; END IF;
  SELECT * INTO v_inquiry FROM public.inquiries WHERE id = p_inquiry_id FOR UPDATE;
  IF NOT FOUND OR v_inquiry.archived_at IS NOT NULL THEN RAISE EXCEPTION 'Inquiry not found'; END IF;
  IF v_inquiry.status = 'ORDERED' OR EXISTS (SELECT 1 FROM public.orders o JOIN public.quotations q ON q.id = o.quotation_id WHERE q.inquiry_id = p_inquiry_id) THEN
    RAISE EXCEPTION 'Cannot change a quotation after an order has been created';
  END IF;

  IF p_quotation_id IS NOT NULL THEN
    SELECT * INTO v_quote FROM public.quotations WHERE id = p_quotation_id AND inquiry_id = p_inquiry_id FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'Quotation not found'; END IF;
    IF v_quote.status = 'ACCEPTED' THEN RAISE EXCEPTION 'Accepted quotation cannot be changed'; END IF;
    v_total := round(p_product_cost, 2) + round(p_shipping_cost_cn_cn, 2) + round(p_other_fee, 2)
      + COALESCE(v_quote.shipping_cost_cn_th, 0) + COALESCE(v_quote.shipping_cost_th_th, 0);
    UPDATE public.quotations SET product_cost = round(p_product_cost, 2),
      shipping_cost_cn_cn = round(p_shipping_cost_cn_cn, 2), other_fee = round(p_other_fee, 2),
      total_price = v_total, updated_at = now() WHERE id = p_quotation_id RETURNING id INTO v_quote_id;
  ELSE
    v_total := round(p_product_cost, 2) + round(p_shipping_cost_cn_cn, 2) + round(p_other_fee, 2);
    INSERT INTO public.quotations(inquiry_id, customer_id, product_cost, shipping_cost_cn_cn, other_fee, total_price, status)
    VALUES (p_inquiry_id, v_inquiry.customer_id, round(p_product_cost, 2), round(p_shipping_cost_cn_cn, 2),
      round(p_other_fee, 2), v_total, 'SENT') RETURNING id INTO v_quote_id;
  END IF;

  UPDATE public.inquiries SET status = 'QUOTED', items = COALESCE(p_updated_items, items), updated_at = now() WHERE id = p_inquiry_id;
  INSERT INTO public.admin_audit_logs(actor_id, action, entity_type, entity_id, new_data)
  VALUES (v_actor, CASE WHEN p_quotation_id IS NULL THEN 'QUOTATION_CREATED' ELSE 'QUOTATION_UPDATED' END,
    'quotation', v_quote_id, jsonb_build_object('inquiry_id', p_inquiry_id, 'total_price', v_total));
  RETURN jsonb_build_object('quotation_id', v_quote_id, 'inquiry_id', p_inquiry_id,
    'customer_id', v_inquiry.customer_id, 'inquiry_number', v_inquiry.inquiry_number, 'total_price', v_total);
END;
$$;

REVOKE ALL ON FUNCTION public.admin_upsert_round1_quotation(UUID, UUID, NUMERIC, NUMERIC, NUMERIC, JSONB) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_upsert_round1_quotation(UUID, UUID, NUMERIC, NUMERIC, NUMERIC, JSONB) TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_approve_import_inquiry(p_inquiry_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_actor UUID := auth.uid();
  v_inquiry public.inquiries%ROWTYPE;
  v_quote_id UUID;
  v_order_id UUID;
  v_order_number TEXT;
  v_tracking_numbers TEXT;
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Forbidden'; END IF;
  SELECT * INTO v_inquiry FROM public.inquiries WHERE id = p_inquiry_id FOR UPDATE;
  IF NOT FOUND OR v_inquiry.archived_at IS NOT NULL THEN RAISE EXCEPTION 'Inquiry not found'; END IF;
  IF v_inquiry.service_type <> 'IMPORT_ONLY' OR v_inquiry.status <> 'PENDING' THEN
    RAISE EXCEPTION 'Inquiry is not an approvable import-only request';
  END IF;
  IF EXISTS (SELECT 1 FROM public.quotations WHERE inquiry_id = p_inquiry_id) THEN
    RAISE EXCEPTION 'Inquiry already has a quotation';
  END IF;

  INSERT INTO public.quotations(inquiry_id, customer_id, product_cost, shipping_cost_cn_cn, other_fee, total_price, status)
  VALUES (p_inquiry_id, v_inquiry.customer_id, 0, 0, 0, 0, 'ACCEPTED') RETURNING id INTO v_quote_id;
  v_order_number := 'ORD-' || to_char(clock_timestamp(), 'YYMMDDHH24MISSMS') || '-' || upper(substr(replace(gen_random_uuid()::TEXT, '-', ''), 1, 4));
  INSERT INTO public.orders(order_number, quotation_id, customer_id, status, payment_round_1_status)
  VALUES (v_order_number, v_quote_id, v_inquiry.customer_id, 'CHINA_WAREHOUSE', 'NOT_APPLICABLE') RETURNING id INTO v_order_id;
  UPDATE public.inquiries SET status = 'ORDERED', updated_at = now() WHERE id = p_inquiry_id;
  SELECT string_agg(item->>'china_tracking_number', ', ') INTO v_tracking_numbers
  FROM jsonb_array_elements(COALESCE(v_inquiry.items, '[]'::jsonb)) item
  WHERE COALESCE(item->>'china_tracking_number', '') <> '';
  INSERT INTO public.tracking_logs(order_id, status, notes, created_by)
  VALUES (v_order_id, 'CHINA_WAREHOUSE', 'สร้างออเดอร์นำเข้าอย่างเดียว; พัสดุจีน: ' || COALESCE(v_tracking_numbers, '-'), v_actor);
  INSERT INTO public.admin_audit_logs(actor_id, action, entity_type, entity_id, new_data)
  VALUES (v_actor, 'IMPORT_INQUIRY_APPROVED', 'order', v_order_id,
    jsonb_build_object('inquiry_id', p_inquiry_id, 'quotation_id', v_quote_id, 'order_number', v_order_number));
  RETURN jsonb_build_object('order_id', v_order_id, 'order_number', v_order_number, 'customer_id', v_inquiry.customer_id);
END;
$$;

REVOKE ALL ON FUNCTION public.admin_approve_import_inquiry(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_approve_import_inquiry(UUID) TO authenticated;

CREATE OR REPLACE FUNCTION public.integration_update_tracking(p_order_id UUID, p_status TEXT, p_notes TEXT DEFAULT NULL)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order public.orders%ROWTYPE;
  v_new_status public.order_status;
  v_old_rank INTEGER;
  v_new_rank INTEGER;
  v_log_id UUID;
BEGIN
  IF p_status NOT IN ('ORDERED', 'CHINA_WAREHOUSE', 'SHIPPING', 'THAILAND_WAREHOUSE', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELED') THEN
    RAISE EXCEPTION 'Invalid tracking status';
  END IF;
  v_new_status := p_status::public.order_status;
  SELECT * INTO v_order FROM public.orders WHERE id = p_order_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Order not found'; END IF;
  IF v_order.status IN ('DELIVERED', 'CANCELED') AND v_order.status <> v_new_status THEN
    RAISE EXCEPTION 'Closed order status cannot be changed';
  END IF;
  v_old_rank := CASE v_order.status WHEN 'NEW' THEN 0 WHEN 'WAITING_PAYMENT' THEN 1 WHEN 'ORDERED' THEN 2
    WHEN 'CHINA_WAREHOUSE' THEN 3 WHEN 'SHIPPING' THEN 4 WHEN 'THAILAND_WAREHOUSE' THEN 5
    WHEN 'OUT_FOR_DELIVERY' THEN 6 WHEN 'DELIVERED' THEN 7 ELSE 0 END;
  v_new_rank := CASE v_new_status WHEN 'ORDERED' THEN 2 WHEN 'CHINA_WAREHOUSE' THEN 3 WHEN 'SHIPPING' THEN 4
    WHEN 'THAILAND_WAREHOUSE' THEN 5 WHEN 'OUT_FOR_DELIVERY' THEN 6 WHEN 'DELIVERED' THEN 7
    WHEN 'CANCELED' THEN 99 ELSE 0 END;
  IF v_new_status <> 'CANCELED' AND v_new_rank < v_old_rank THEN RAISE EXCEPTION 'Tracking status cannot move backward'; END IF;

  UPDATE public.orders SET status = v_new_status,
    delivered_at = CASE WHEN v_new_status = 'DELIVERED' THEN now() ELSE delivered_at END,
    updated_at = now() WHERE id = p_order_id;
  INSERT INTO public.tracking_logs(order_id, status, notes)
  VALUES (p_order_id, p_status, NULLIF(trim(p_notes), '')) RETURNING id INTO v_log_id;
  INSERT INTO public.admin_audit_logs(action, entity_type, entity_id, old_data, new_data, reason)
  VALUES ('INTEGRATION_TRACKING_UPDATED', 'order', p_order_id, jsonb_build_object('status', v_order.status),
    jsonb_build_object('status', v_new_status, 'tracking_log_id', v_log_id), p_notes);
  RETURN jsonb_build_object('log_id', v_log_id, 'order_id', p_order_id, 'status', v_new_status);
END;
$$;

REVOKE ALL ON FUNCTION public.integration_update_tracking(UUID, TEXT, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.integration_update_tracking(UUID, TEXT, TEXT) TO service_role;

CREATE OR REPLACE FUNCTION public.accept_quotation_as_order(
  p_quotation_id UUID,
  p_customer_id UUID,
  p_shipping_address_id UUID DEFAULT NULL,
  p_admin_notes TEXT DEFAULT NULL,
  p_terms_version TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_quote public.quotations%ROWTYPE;
  v_inquiry public.inquiries%ROWTYPE;
  v_order public.orders%ROWTYPE;
BEGIN
  IF auth.role() <> 'service_role' AND auth.uid() <> p_customer_id THEN RAISE EXCEPTION 'Forbidden'; END IF;
  SELECT * INTO v_quote FROM public.quotations WHERE id = p_quotation_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Quotation not found'; END IF;
  SELECT * INTO v_inquiry FROM public.inquiries WHERE id = v_quote.inquiry_id FOR UPDATE;
  IF NOT FOUND OR v_inquiry.customer_id <> p_customer_id OR v_inquiry.archived_at IS NOT NULL THEN RAISE EXCEPTION 'Quotation not found'; END IF;
  IF p_shipping_address_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.addresses WHERE id = p_shipping_address_id AND customer_id = p_customer_id
  ) THEN RAISE EXCEPTION 'Invalid shipping address'; END IF;

  SELECT * INTO v_order FROM public.orders WHERE quotation_id = p_quotation_id OR order_number = v_inquiry.inquiry_number LIMIT 1;
  IF FOUND THEN
    IF v_order.customer_id <> p_customer_id THEN RAISE EXCEPTION 'Order number conflict'; END IF;
    RETURN jsonb_build_object('existing', true, 'order', to_jsonb(v_order));
  END IF;
  IF v_quote.status NOT IN ('SENT', 'DRAFT') OR v_inquiry.status <> 'QUOTED' THEN
    RAISE EXCEPTION 'Quotation is not available for acceptance';
  END IF;

  INSERT INTO public.orders(order_number, customer_id, quotation_id, status, payment_round_1_status,
    admin_notes, shipping_address_id, terms_version, terms_accepted_at)
  VALUES (v_inquiry.inquiry_number, p_customer_id, p_quotation_id, 'WAITING_PAYMENT', 'PENDING',
    NULLIF(trim(p_admin_notes), ''), p_shipping_address_id, p_terms_version,
    CASE WHEN p_terms_version IS NULL THEN NULL ELSE now() END)
  RETURNING * INTO v_order;
  UPDATE public.quotations SET status = 'ACCEPTED', updated_at = now() WHERE id = p_quotation_id;
  UPDATE public.inquiries SET status = 'ORDERED', updated_at = now() WHERE id = v_quote.inquiry_id;
  INSERT INTO public.tracking_logs(order_id, status, notes, created_by)
  VALUES (v_order.id, 'WAITING_PAYMENT', 'สร้างคำสั่งซื้อและรอชำระเงินรอบที่ 1', auth.uid());
  RETURN jsonb_build_object('existing', false, 'order', to_jsonb(v_order));
END;
$$;

REVOKE ALL ON FUNCTION public.accept_quotation_as_order(UUID, UUID, UUID, TEXT, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.accept_quotation_as_order(UUID, UUID, UUID, TEXT, TEXT) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.customer_confirm_order_receipt(p_order_identifier TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_actor UUID := auth.uid();
  v_order public.orders%ROWTYPE;
BEGIN
  IF v_actor IS NULL THEN RAISE EXCEPTION 'Unauthorized'; END IF;
  SELECT * INTO v_order FROM public.orders
  WHERE customer_id = v_actor AND (id::TEXT = p_order_identifier OR order_number = p_order_identifier)
  FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Order not found'; END IF;
  IF v_order.status <> 'OUT_FOR_DELIVERY' THEN RAISE EXCEPTION 'Invalid status for confirming receipt'; END IF;
  UPDATE public.orders SET status = 'DELIVERED', delivered_at = now(), updated_at = now() WHERE id = v_order.id;
  INSERT INTO public.tracking_logs(order_id, status, notes, created_by)
  VALUES (v_order.id, 'DELIVERED', 'ลูกค้ายืนยันได้รับสินค้าเรียบร้อยแล้ว', v_actor);
  RETURN jsonb_build_object('order_id', v_order.id, 'status', 'DELIVERED');
END;
$$;

REVOKE ALL ON FUNCTION public.customer_confirm_order_receipt(TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.customer_confirm_order_receipt(TEXT) TO authenticated;
