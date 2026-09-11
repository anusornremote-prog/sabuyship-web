BEGIN;

-- Prevent customers from escalating their own role or changing wallet balances.
DROP POLICY IF EXISTS "Users can update own profile." ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

CREATE POLICY "Users can update own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id AND role = 'CUSTOMER')
WITH CHECK (auth.uid() = id AND role = 'CUSTOMER');

-- RLS controls rows; column grants control which profile attributes customers may mutate.
REVOKE UPDATE ON public.profiles FROM anon, authenticated;
GRANT UPDATE (full_name, phone, line_id, updated_at)
ON public.profiles
TO authenticated;

-- OAuth callback support for deployments that already have profiles.line_uid.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'profiles'
      AND column_name = 'line_uid'
  ) THEN
    EXECUTE 'GRANT UPDATE (line_uid) ON public.profiles TO authenticated';
  END IF;
END
$$;

COMMIT;
