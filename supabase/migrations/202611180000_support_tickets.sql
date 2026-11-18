-- Product Issue Coordination / Support Ticket System (non-liability full-support workflow)
-- Safe to apply idempotently on staging and production Supabase projects.

CREATE TABLE IF NOT EXISTS public.support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_number TEXT UNIQUE NOT NULL,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  category TEXT NOT NULL CHECK (
    category IN ('MISSING_ITEM', 'DAMAGED_TRANSIT', 'NOT_AS_DESCRIBED', 'OTHER')
  ),
  subject TEXT NOT NULL CHECK (char_length(trim(subject)) BETWEEN 2 AND 160),
  description TEXT NOT NULL CHECK (char_length(trim(description)) BETWEEN 5 AND 4000),
  evidence_urls TEXT[] NOT NULL DEFAULT '{}'::text[],
  video_url TEXT,
  status TEXT NOT NULL DEFAULT 'NEW' CHECK (
    status IN ('NEW', 'IN_PROGRESS', 'WAITING_CUSTOMER', 'RESOLVED', 'CLOSED')
  ),
  coordinator_scope_acknowledged_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolution_note TEXT,
  assigned_admin_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  last_activity_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at TIMESTAMPTZ,
  closed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS support_tickets_customer_activity_idx
  ON public.support_tickets(customer_id, last_activity_at DESC);
CREATE INDEX IF NOT EXISTS support_tickets_order_created_idx
  ON public.support_tickets(order_id, created_at DESC);
CREATE INDEX IF NOT EXISTS support_tickets_status_activity_idx
  ON public.support_tickets(status, last_activity_at DESC);

CREATE TABLE IF NOT EXISTS public.ticket_updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  author_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  author_role TEXT NOT NULL CHECK (author_role IN ('CUSTOMER', 'ADMIN', 'SYSTEM')),
  message TEXT NOT NULL CHECK (char_length(trim(message)) BETWEEN 1 AND 4000),
  attachments TEXT[] NOT NULL DEFAULT '{}'::text[],
  is_internal BOOLEAN NOT NULL DEFAULT false,
  status_from TEXT,
  status_to TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ticket_updates_ticket_created_idx
  ON public.ticket_updates(ticket_id, created_at ASC);

ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_updates ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.support_tickets FROM anon, authenticated;
REVOKE ALL ON public.ticket_updates FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.support_tickets TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ticket_updates TO authenticated;

DROP POLICY IF EXISTS "Customers can view own support tickets" ON public.support_tickets;
CREATE POLICY "Customers can view own support tickets" ON public.support_tickets
FOR SELECT TO authenticated USING (customer_id = auth.uid());

DROP POLICY IF EXISTS "Customers can create own support tickets" ON public.support_tickets;
CREATE POLICY "Customers can create own support tickets" ON public.support_tickets
FOR INSERT TO authenticated WITH CHECK (
  customer_id = auth.uid()
  AND status = 'NEW'
  AND EXISTS (
    SELECT 1 FROM public.orders o
    WHERE o.id = support_tickets.order_id
      AND o.customer_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Admins can manage support tickets" ON public.support_tickets;
CREATE POLICY "Admins can manage support tickets" ON public.support_tickets
FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Customers can view public updates on own tickets" ON public.ticket_updates;
CREATE POLICY "Customers can view public updates on own tickets" ON public.ticket_updates
FOR SELECT TO authenticated USING (
  is_internal = false
  AND EXISTS (
    SELECT 1 FROM public.support_tickets t
    WHERE t.id = ticket_updates.ticket_id
      AND t.customer_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Customers can post public replies on own open tickets" ON public.ticket_updates;
CREATE POLICY "Customers can post public replies on own open tickets" ON public.ticket_updates
FOR INSERT TO authenticated WITH CHECK (
  author_role = 'CUSTOMER'
  AND author_id = auth.uid()
  AND is_internal = false
  AND EXISTS (
    SELECT 1 FROM public.support_tickets t
    WHERE t.id = ticket_updates.ticket_id
      AND t.customer_id = auth.uid()
      AND t.status <> 'CLOSED'
  )
);

DROP POLICY IF EXISTS "Admins can manage ticket updates" ON public.ticket_updates;
CREATE POLICY "Admins can manage ticket updates" ON public.ticket_updates
FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Private storage bucket for support ticket image evidence
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'ticket_attachments',
  'ticket_attachments',
  false,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "Customers can upload own ticket attachments" ON storage.objects;
CREATE POLICY "Customers can upload own ticket attachments" ON storage.objects
FOR INSERT TO authenticated WITH CHECK (
  bucket_id = 'ticket_attachments'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

DROP POLICY IF EXISTS "Customers can view own ticket attachments" ON storage.objects;
CREATE POLICY "Customers can view own ticket attachments" ON storage.objects
FOR SELECT TO authenticated USING (
  bucket_id = 'ticket_attachments'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

DROP POLICY IF EXISTS "Admins can manage ticket attachments" ON storage.objects;
CREATE POLICY "Admins can manage ticket attachments" ON storage.objects
FOR ALL TO authenticated USING (
  bucket_id = 'ticket_attachments' AND public.is_admin()
) WITH CHECK (
  bucket_id = 'ticket_attachments' AND public.is_admin()
);
