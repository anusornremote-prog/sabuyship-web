\set ON_ERROR_STOP on
BEGIN;

INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
VALUES
  ('00000000-0000-0000-0000-000000000000', '10000000-0000-0000-0000-000000000001', 'authenticated', 'authenticated', 'admin-test@example.invalid', '', now(), '{}'::jsonb, '{}'::jsonb, now(), now()),
  ('00000000-0000-0000-0000-000000000000', '20000000-0000-0000-0000-000000000002', 'authenticated', 'authenticated', 'customer-test@example.invalid', '', now(), '{}'::jsonb, '{}'::jsonb, now(), now());

UPDATE public.profiles SET role = 'ADMIN', full_name = 'Admin Test', phone = '0800000001'
WHERE id = '10000000-0000-0000-0000-000000000001';
UPDATE public.profiles SET role = 'CUSTOMER', customer_code = 'T001A', full_name = 'Customer Test', phone = '0800000002'
WHERE id = '20000000-0000-0000-0000-000000000002';

INSERT INTO public.inquiries(id, inquiry_number, customer_id, customer_name, phone, product_url, items, status)
VALUES ('30000000-0000-0000-0000-000000000003', 'INQ-ADMIN-TEST-001',
  '20000000-0000-0000-0000-000000000002', 'Customer Test', '0800000002', 'https://example.invalid/item',
  '[{"quantity":2,"price_thb":500}]'::jsonb, 'PENDING');

DO $$
DECLARE
  v_quote JSONB;
  v_accept JSONB;
  v_payment JSONB;
  v_payment_id UUID;
  v_order_id UUID;
  v_result JSONB;
  v_refund_id UUID;
  v_shipment_id UUID;
  v_count INTEGER;
BEGIN
  PERFORM set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000001', true);
  PERFORM set_config('request.jwt.claim.role', 'authenticated', true);
  v_quote := public.admin_upsert_round1_quotation(
    '30000000-0000-0000-0000-000000000003', NULL, 1000, 100, 50, NULL);
  IF (v_quote->>'total_price')::numeric <> 1150 THEN RAISE EXCEPTION 'Quotation total assertion failed'; END IF;

  PERFORM set_config('request.jwt.claim.sub', '20000000-0000-0000-0000-000000000002', true);
  v_accept := public.accept_quotation_as_order(
    (v_quote->>'quotation_id')::uuid, '20000000-0000-0000-0000-000000000002', NULL, NULL, 'test-terms');
  v_order_id := (v_accept->'order'->>'id')::uuid;
  IF v_order_id IS NULL THEN RAISE EXCEPTION 'Order creation assertion failed'; END IF;

  v_payment := public.customer_submit_payment(v_order_id, 1::smallint, 1100::numeric, now(),
    '20000000-0000-0000-0000-000000000002/' || v_order_id::text || '/slip-test.jpg');
  v_payment_id := (v_payment->>'payment_id')::uuid;

  PERFORM set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000001', true);
  PERFORM public.admin_review_payment(v_payment_id, 'APPROVE', NULL);
  SELECT count(*) INTO v_count FROM public.orders
  WHERE id = v_order_id AND status = 'ORDERED' AND payment_round_1_status = 'PAID';
  IF v_count <> 1 THEN RAISE EXCEPTION 'Payment approval assertion failed'; END IF;
  SELECT count(*) INTO v_count FROM public.admin_audit_logs
  WHERE action IN ('QUOTATION_CREATED', 'PAYMENT_APPROVE');
  IF v_count <> 2 THEN RAISE EXCEPTION 'Audit trail assertion failed'; END IF;

  v_result := public.admin_record_out_of_stock(v_order_id,
    '[{"quantity":2,"price_thb":500,"is_out_of_stock":true,"out_of_stock_qty":1}]'::jsonb,
    false, 'Functional test');
  v_refund_id := (v_result->>'refund_id')::uuid;
  IF (v_result->>'refund_amount')::numeric <> 500 THEN RAISE EXCEPTION 'Refund calculation assertion failed'; END IF;
  PERFORM public.admin_update_refund(v_refund_id, 'APPROVED', NULL, NULL, 'Approved in test');
  PERFORM public.admin_update_refund(v_refund_id, 'PAID', 'BANK_TRANSFER', 'TEST-REF-001', 'Paid in test');

  INSERT INTO public.shipments(customer_id, customer_code, tracking_number, shipping_cost_amount)
  VALUES ('20000000-0000-0000-0000-000000000002', 'T001A', 'TRACK-TEST-001', 250)
  RETURNING id INTO v_shipment_id;
  PERFORM public.admin_mark_shipment_paid(v_shipment_id, 'TEST-PAY-001');
  PERFORM public.admin_import_shipments('functional-test.xlsx',
    '[{"customer_code":"T001A","tracking_number":"TRACK-TEST-002","quantity":"1","weight":"2.5","shipping_cost_amount":"100"}]'::jsonb);
  PERFORM public.admin_set_exchange_rate(5.25, 'Functional test');

  PERFORM public.admin_quote_shipping_round(v_order_id, 2::smallint, 0::numeric, NULL);
  SELECT count(*) INTO v_count FROM public.orders
  WHERE id = v_order_id AND status = 'SHIPPING' AND payment_round_2_status = 'PAID';
  IF v_count <> 1 THEN RAISE EXCEPTION 'Round 2 zero-cost assertion failed'; END IF;
  PERFORM public.admin_quote_shipping_round(v_order_id, 3::smallint, 0::numeric, NULL);
  PERFORM set_config('request.jwt.claim.sub', '20000000-0000-0000-0000-000000000002', true);
  PERFORM public.customer_confirm_order_receipt(v_order_id::text);
  SELECT count(*) INTO v_count FROM public.orders WHERE id = v_order_id AND status = 'DELIVERED';
  IF v_count <> 1 THEN RAISE EXCEPTION 'Receipt confirmation assertion failed'; END IF;
END;
$$;

ROLLBACK;
SELECT 'admin_operations_hardening: PASS' AS result;
