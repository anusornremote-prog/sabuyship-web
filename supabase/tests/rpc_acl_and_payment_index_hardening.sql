\set ON_ERROR_STOP on
BEGIN;

DO $$
DECLARE
  v_unsafe_functions INTEGER;
BEGIN
  SELECT count(*) INTO v_unsafe_functions
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname = 'public'
    AND p.proname IN (
      'admin_approve_import_inquiry',
      'admin_archive_inquiries',
      'admin_import_shipments',
      'admin_mark_shipment_paid',
      'admin_quote_shipping_round',
      'admin_record_manual_payment',
      'admin_record_out_of_stock',
      'admin_review_payment',
      'admin_set_exchange_rate',
      'admin_update_order_status',
      'admin_update_refund',
      'admin_upsert_round1_quotation',
      'customer_submit_payment',
      'handle_new_user',
      'is_admin'
    )
    AND has_function_privilege('anon', p.oid, 'EXECUTE');

  IF v_unsafe_functions <> 0 THEN
    RAISE EXCEPTION 'Anonymous RPC execute privileges remain: %', v_unsafe_functions;
  END IF;

  IF to_regclass('public.payments_one_open_per_numbered_round_idx') IS NULL THEN
    RAISE EXCEPTION 'Numbered payment-round unique index is missing';
  END IF;
END;
$$;

ROLLBACK;
SELECT 'rpc_acl_and_payment_index_hardening: PASS' AS result;
