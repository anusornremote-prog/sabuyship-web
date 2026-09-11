-- Aggregate-only, read-only verification for the production compatibility delta.
-- This query returns schema/security checks and aggregate counts only.

BEGIN TRANSACTION READ ONLY;
SET LOCAL statement_timeout = '30s';

WITH required_columns(table_name, column_name) AS (
  VALUES
    ('profiles', 'is_active'),
    ('inquiries', 'product_name'),
    ('inquiries', 'shipping_address_id'),
    ('inquiries', 'notes'),
    ('quotations', 'customer_id'),
    ('quotations', 'wooden_crate_cost'),
    ('quotations', 'admin_notes'),
    ('quotations', 'valid_until'),
    ('orders', 'delivered_at'),
    ('payments', 'payment_round'),
    ('payments', 'payment_method'),
    ('payments', 'transfer_date'),
    ('payments', 'transfer_time'),
    ('payments', 'updated_at'),
    ('tracking_logs', 'description'),
    ('tracking_logs', 'created_by'),
    ('shipments', 'order_id'),
    ('shipments', 'thailand_tracking_number'),
    ('shipments', 'status')
),
missing_columns AS (
  SELECT count(*) AS value
  FROM required_columns r
  WHERE NOT EXISTS (
    SELECT 1
    FROM information_schema.columns c
    WHERE c.table_schema = 'public'
      AND c.table_name = r.table_name
      AND c.column_name = r.column_name
  )
),
legacy_payment_summary AS (
  SELECT
    count(*) FILTER (WHERE payment_round IS NULL) AS unclassified_legacy_attempts,
    count(*) FILTER (WHERE payment_round NOT BETWEEN 1 AND 3) AS invalid_rounds
  FROM public.payments
),
relationship_summary AS (
  SELECT
    (SELECT count(*) FROM public.orders WHERE customer_id IS NULL OR quotation_id IS NULL)
      AS invalid_orders,
    (SELECT count(*) FROM public.payments WHERE order_id IS NULL)
      AS invalid_payments,
    (SELECT count(*) FROM public.tracking_logs WHERE order_id IS NULL)
      AS invalid_tracking_logs
),
unsafe_access AS (
  SELECT count(*) AS value
  FROM information_schema.role_table_grants
  WHERE table_schema = 'public'
    AND table_name IN ('profiles', 'orders', 'payments', 'tracking_logs', 'wallet_transactions')
    AND grantee IN ('anon', 'PUBLIC')
),
security_summary AS (
  SELECT
    (
      SELECT count(*)
      FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'public'
        AND c.relname IN (
          'profiles', 'addresses', 'inquiries', 'quotations', 'orders',
          'payments', 'tracking_logs', 'wallet_transactions', 'shipments', 'site_settings'
        )
        AND NOT c.relrowsecurity
    ) AS tables_without_rls,
    (
      SELECT count(*)
      FROM pg_policies
      WHERE schemaname = 'public'
        AND tablename IN (
          'profiles', 'addresses', 'quotations', 'orders', 'payments',
          'tracking_logs', 'wallet_transactions', 'shipments'
        )
        AND (
          roles && ARRAY['public', 'anon']::name[]
          OR (cmd IN ('ALL', 'INSERT', 'UPDATE', 'DELETE')
              AND (coalesce(qual, '') = 'true' OR coalesce(with_check, '') = 'true'))
        )
    ) AS unsafe_sensitive_policies,
    (
      SELECT count(*)
      FROM pg_policies
      WHERE schemaname = 'storage'
        AND tablename = 'objects'
        AND cmd IN ('SELECT', 'UPDATE')
        AND (
          coalesce(qual, '') LIKE '%inquiries%'
          OR coalesce(with_check, '') LIKE '%inquiries%'
          OR coalesce(qual, '') LIKE '%payment_slips%'
          OR coalesce(with_check, '') LIKE '%payment_slips%'
        )
    ) AS unsafe_sabuyship_storage_policies
),
expected_types AS (
  SELECT count(*) AS value
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND (
      (table_name = 'payments' AND column_name = 'status' AND udt_name <> 'payment_status')
      OR (table_name = 'tracking_logs' AND column_name = 'status' AND data_type <> 'text')
      OR (table_name = 'orders' AND column_name LIKE 'payment_round_%_status'
          AND udt_name <> 'payment_round_status')
    )
)
SELECT jsonb_build_object(
  'missing_required_columns', (SELECT value FROM missing_columns),
  'unexpected_status_column_types', (SELECT value FROM expected_types),
  'anonymous_sensitive_table_grants', (SELECT value FROM unsafe_access),
  'public_tables_without_rls', s.tables_without_rls,
  'unsafe_sensitive_policies', s.unsafe_sensitive_policies,
  'unsafe_sabuyship_storage_policies', s.unsafe_sabuyship_storage_policies,
  'unclassified_legacy_payment_attempts', l.unclassified_legacy_attempts,
  'invalid_payment_rounds', l.invalid_rounds,
  'orders_missing_required_relationships', r.invalid_orders,
  'payments_missing_order', r.invalid_payments,
  'tracking_logs_missing_order', r.invalid_tracking_logs,
  'payment_statuses', (
    SELECT jsonb_object_agg(status::text, row_count)
    FROM (
      SELECT status, count(*) AS row_count
      FROM public.payments
      GROUP BY status
      ORDER BY status::text
    ) grouped
  ),
  'order_statuses', (
    SELECT jsonb_object_agg(status::text, row_count)
    FROM (
      SELECT status, count(*) AS row_count
      FROM public.orders
      GROUP BY status
      ORDER BY status::text
    ) grouped
  )
) AS production_compatibility_verification
FROM legacy_payment_summary l
CROSS JOIN relationship_summary r
CROSS JOIN security_summary s;

ROLLBACK;
