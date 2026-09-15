-- Close RPC execution to anonymous callers and preserve numbered-round uniqueness
-- without rewriting ambiguous legacy payments whose payment_round is NULL.

DO $$
DECLARE
  v_function REGPROCEDURE;
BEGIN
  FOR v_function IN
    SELECT p.oid::regprocedure
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
  LOOP
    EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM anon', v_function);
  END LOOP;
END;
$$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM public.payments
    WHERE status IN ('PENDING', 'APPROVED')
      AND payment_round BETWEEN 1 AND 3
    GROUP BY order_id, payment_round
    HAVING count(*) > 1
  ) THEN
    RAISE EXCEPTION 'Duplicate open payments exist for a numbered payment round';
  END IF;

  CREATE UNIQUE INDEX IF NOT EXISTS payments_one_open_per_numbered_round_idx
    ON public.payments(order_id, payment_round)
    WHERE status IN ('PENDING', 'APPROVED')
      AND payment_round BETWEEN 1 AND 3;
END;
$$;
