-- ============================================================
-- H-AUTOS MIGRATION — Run this in Supabase SQL Editor
-- Adds missing tables + country columns safely
-- ============================================================

-- Add country column to cars (safe if already exists)
ALTER TABLE public.cars ADD COLUMN IF NOT EXISTS country TEXT DEFAULT 'NG';

-- Add country column to stores (safe if already exists)
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS country TEXT DEFAULT 'NG';

-- Revenue log table
CREATE TABLE IF NOT EXISTS public.revenue_log (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  description TEXT NOT NULL,
  amount      NUMERIC NOT NULL,
  currency    TEXT DEFAULT 'NGN',
  type        TEXT DEFAULT 'seller_subscription',
  user_id     UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.revenue_log ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "rev_insert" ON public.revenue_log;
DROP POLICY IF EXISTS "rev_select" ON public.revenue_log;
CREATE POLICY "rev_insert" ON public.revenue_log FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
);
CREATE POLICY "rev_select" ON public.revenue_log FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
);

-- Site visits table
CREATE TABLE IF NOT EXISTS public.site_visits (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page       TEXT,
  ref        TEXT,
  visited_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.site_visits ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "visits_insert" ON public.site_visits;
DROP POLICY IF EXISTS "visits_select" ON public.site_visits;
CREATE POLICY "visits_insert" ON public.site_visits FOR INSERT WITH CHECK (true);
CREATE POLICY "visits_select" ON public.site_visits FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
);

-- Ensure newsletter_subscribers exists
CREATE TABLE IF NOT EXISTS public.newsletter_subscribers (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email      TEXT UNIQUE NOT NULL,
  user_id    UUID REFERENCES public.profiles(id),
  subscribed BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "nl_insert" ON public.newsletter_subscribers;
DROP POLICY IF EXISTS "nl_select" ON public.newsletter_subscribers;
CREATE POLICY "nl_insert" ON public.newsletter_subscribers FOR INSERT WITH CHECK (true);
CREATE POLICY "nl_select" ON public.newsletter_subscribers FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
);

-- Make sure you are admin
UPDATE public.profiles SET is_admin = true WHERE email = 'samuelivere92@gmail.com';

-- Done!
SELECT 'Migration complete ✅' as status;
