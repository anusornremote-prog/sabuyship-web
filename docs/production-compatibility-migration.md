# Production compatibility migration

Status: **local draft only — not approved for Production execution**

The legacy Production database already contains Sabuyship tables, so
`202609090000_initial_schema.sql` must not be executed against it. The dedicated
delta is `supabase/migrations/202609110000_production_compatibility_delta.sql`.

## Safety properties

- Runs in one transaction and rolls back if any preflight assertion fails.
- Uses short lock and statement timeouts instead of waiting indefinitely.
- Preserves all existing rows and all legacy shipment columns.
- Keeps legacy shipment measurement columns at their existing unconstrained numeric
  precision, avoiding a potentially lossy conversion that the application does not require.
- Does not infer `payments.payment_round` for historical attempts. A `NULL` round
  explicitly means “unclassified legacy payment”. New application submissions
  always provide round 1, 2, or 3.
- Backfills only deterministic values: active profiles default to `true`, and a
  quotation customer is copied from its inquiry when missing.
- Replaces broad legacy RLS policies and grants with the reviewed policy set.
- Storage policy cleanup is limited to policies referencing the `inquiries` or
  `payment_slips` buckets; policies for unrelated buckets are left alone.
- Adds missing foreign keys as `NOT VALID`, then validates them before commit.

## Required gates before any Production execution

1. Apply the delta to a disposable database restored from the Production schema.
2. Run `scripts/verify-production-compatibility.sql` there and confirm all error
   counters are zero. A nonzero `unclassified_legacy_payment_attempts` count is
   expected and preserves history.
3. Run the application build and the three-round workflow smoke test against that
   disposable database.
4. Review Supabase migration history. Production currently does not record the two
   baseline migration versions, so a normal `supabase db push` must not be used
   until migration-history reconciliation has been reviewed separately.
5. Take a verified Production backup and schedule a short maintenance window.
6. Obtain explicit approval for the exact Production command. This document does
   not grant permission to apply or deploy anything.

## Post-migration verification

The verification SQL is read-only and aggregate-only. It reports schema/security
error counts, status totals, and the number of unclassified legacy payment
attempts; it does not return identifiers, amounts, dates, or personal data.
