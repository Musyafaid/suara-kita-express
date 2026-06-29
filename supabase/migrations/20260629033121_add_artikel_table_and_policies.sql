/*
# Add artikel (related articles) table for voting events

1. New Tables
- `artikel` — articles/explanations linked to voting events
  - `id` (uuid, primary key)
  - `event_id` (uuid, references event_voting)
  - `judul` (text, not null)
  - `konten` (text, not null)
  - `sumber` (text, optional source URL)
  - `penulis` (text, optional author)
  - `urutan` (integer, default 0 for ordering)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

2. Security
- Enable RLS on `artikel`.
- Public can read artikel for active events.
- Only admins can write.
*/

CREATE TABLE IF NOT EXISTS public.artikel (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.event_voting(id) ON DELETE CASCADE,
  judul TEXT NOT NULL,
  konten TEXT NOT NULL,
  sumber TEXT,
  penulis TEXT,
  urutan INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.artikel TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.artikel TO authenticated;
GRANT ALL ON public.artikel TO service_role;

ALTER TABLE public.artikel ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "artikel public read" ON public.artikel;
CREATE POLICY "artikel public read" ON public.artikel FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "artikel admin write" ON public.artikel;
CREATE POLICY "artikel admin write" ON public.artikel FOR ALL
  TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

DROP TRIGGER IF EXISTS trg_artikel_updated ON public.artikel;
CREATE TRIGGER trg_artikel_updated
  BEFORE UPDATE ON public.artikel
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX IF NOT EXISTS idx_artikel_event ON public.artikel(event_id);
