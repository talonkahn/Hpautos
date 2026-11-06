-- ============================================================
-- H-AUTOS NIGERIA — COMPLETE SCHEMA v3
-- Run in: Supabase → SQL Editor → New Query → Run All
-- ============================================================

-- 1. PROFILES
CREATE TABLE IF NOT EXISTS public.profiles (
  id                  UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email               TEXT,
  full_name           TEXT,
  avatar_url          TEXT,
  phone               TEXT,
  whatsapp            TEXT,
  is_admin            BOOLEAN DEFAULT false,
  subscription_status TEXT DEFAULT 'free',
  seller_active       BOOLEAN DEFAULT false,
  seller_expiry       TIMESTAMPTZ,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_select" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "profiles_insert" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update" ON public.profiles FOR UPDATE USING (
  auth.uid() = id OR
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
);

-- 2. STORES
CREATE TABLE IF NOT EXISTS public.stores (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id          UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  owner_email       TEXT,
  name              TEXT NOT NULL,
  rc_number         TEXT,
  logo_url          TEXT,
  banner_url        TEXT,
  address           TEXT,
  city              TEXT,
  country           TEXT DEFAULT 'NG',
  state             TEXT,
  phone             TEXT,
  whatsapp          TEXT,
  email             TEXT,
  website           TEXT,
  description       TEXT,
  specialization    TEXT,
  years_in_business INTEGER,
  status            TEXT DEFAULT 'pending',
  is_verified       BOOLEAN DEFAULT false,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "stores_select"  ON public.stores FOR SELECT USING (status = 'approved' OR owner_id = auth.uid() OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true));
CREATE POLICY "stores_insert"  ON public.stores FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "stores_update"  ON public.stores FOR UPDATE USING (auth.uid() = owner_id OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true));
CREATE POLICY "stores_delete"  ON public.stores FOR DELETE USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true));

-- 3. CARS
CREATE TABLE IF NOT EXISTS public.cars (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id       UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  store_id        UUID REFERENCES public.stores(id) ON DELETE SET NULL,
  seller_email    TEXT,
  seller_name     TEXT,
  seller_phone    TEXT,
  seller_whatsapp TEXT,
  title           TEXT NOT NULL,
  make            TEXT,
  model           TEXT,
  year            INT,
  price           NUMERIC NOT NULL,
  mileage         NUMERIC,
  fuel_type       TEXT DEFAULT 'petrol',
  transmission    TEXT DEFAULT 'automatic',
  condition       TEXT DEFAULT 'nigerian_used',
  country         TEXT DEFAULT 'NG',
  state           TEXT,
  city            TEXT,
  description     TEXT,
  images          TEXT[] DEFAULT '{}',
  video_url       TEXT,
  features        TEXT[] DEFAULT '{}',
  status          TEXT DEFAULT 'pending',
  is_featured     BOOLEAN DEFAULT false,
  is_verified     BOOLEAN DEFAULT false,
  views           INT DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.cars ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cars_select" ON public.cars FOR SELECT USING (status = 'approved' OR seller_id = auth.uid() OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true));
CREATE POLICY "cars_insert" ON public.cars FOR INSERT WITH CHECK (auth.uid() = seller_id);
CREATE POLICY "cars_update" ON public.cars FOR UPDATE USING (auth.uid() = seller_id OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true));
CREATE POLICY "cars_delete" ON public.cars FOR DELETE USING (auth.uid() = seller_id OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true));

-- 4. SELLER REQUESTS
CREATE TABLE IF NOT EXISTS public.seller_requests (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  full_name       TEXT,
  phone           TEXT,
  whatsapp        TEXT,
  payment_method  TEXT,
  payment_ref     TEXT,
  amount_paid     NUMERIC,
  currency        TEXT,
  status          TEXT DEFAULT 'pending',
  approved_at     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.seller_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "selreq_select" ON public.seller_requests FOR SELECT USING (user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true));
CREATE POLICY "selreq_insert" ON public.seller_requests FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "selreq_update" ON public.seller_requests FOR UPDATE USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true));

-- 5. ENQUIRIES
CREATE TABLE IF NOT EXISTS public.enquiries (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  car_id          UUID REFERENCES public.cars(id) ON DELETE SET NULL,
  car_title       TEXT,
  car_price       NUMERIC,
  user_id         UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  buyer_name      TEXT NOT NULL,
  buyer_phone     TEXT NOT NULL,
  buyer_whatsapp  TEXT,
  message         TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.enquiries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "enq_insert" ON public.enquiries FOR INSERT WITH CHECK (true);
CREATE POLICY "enq_select" ON public.enquiries FOR SELECT USING (user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true));

-- 6. CONVERSATIONS
CREATE TABLE IF NOT EXISTS public.conversations (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id    UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  seller_id   UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  car_id      UUID REFERENCES public.cars(id) ON DELETE SET NULL,
  last_message TEXT,
  updated_at  TIMESTAMPTZ DEFAULT NOW(),
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(buyer_id, seller_id, car_id)
);
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "conv_select" ON public.conversations FOR SELECT USING (auth.uid() = buyer_id OR auth.uid() = seller_id);
CREATE POLICY "conv_insert" ON public.conversations FOR INSERT WITH CHECK (auth.uid() = buyer_id);
CREATE POLICY "conv_update" ON public.conversations FOR UPDATE USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

-- 7. MESSAGES
CREATE TABLE IF NOT EXISTS public.messages (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id   UUID REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id         UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  content           TEXT NOT NULL,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "msg_select" ON public.messages FOR SELECT USING (EXISTS (SELECT 1 FROM public.conversations c WHERE c.id = conversation_id AND (c.buyer_id = auth.uid() OR c.seller_id = auth.uid())));
CREATE POLICY "msg_insert" ON public.messages FOR INSERT WITH CHECK (auth.uid() = sender_id AND EXISTS (SELECT 1 FROM public.conversations c WHERE c.id = conversation_id AND (c.buyer_id = auth.uid() OR c.seller_id = auth.uid())));
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;

-- 8. SPOTLIGHT ADS
CREATE TABLE IF NOT EXISTS public.spotlight_ads (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title       TEXT NOT NULL,
  description TEXT,
  image_url   TEXT,
  link_url    TEXT,
  is_active   BOOLEAN DEFAULT true,
  expires_at  TIMESTAMPTZ,
  created_by  UUID REFERENCES public.profiles(id),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.spotlight_ads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ads_select" ON public.spotlight_ads FOR SELECT USING (is_active = true OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true));
CREATE POLICY "ads_all"    ON public.spotlight_ads FOR ALL   USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true));

-- 9. NEWSLETTER
CREATE TABLE IF NOT EXISTS public.newsletter_subscribers (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email      TEXT UNIQUE NOT NULL,
  user_id    UUID REFERENCES public.profiles(id),
  subscribed BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "nl_insert" ON public.newsletter_subscribers FOR INSERT WITH CHECK (true);
CREATE POLICY "nl_select" ON public.newsletter_subscribers FOR SELECT USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true));

-- 10. REVENUE LOG
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
CREATE POLICY "rev_insert" ON public.revenue_log FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true));
CREATE POLICY "rev_select" ON public.revenue_log FOR SELECT USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true));

-- 11. SITE VISITS
CREATE TABLE IF NOT EXISTS public.site_visits (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page       TEXT,
  ref        TEXT,
  visited_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.site_visits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "visits_insert" ON public.site_visits FOR INSERT WITH CHECK (true);
CREATE POLICY "visits_select" ON public.site_visits FOR SELECT USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true));

-- ─── TRIGGER: Auto-create profile on email sign-up ────────────────────────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, is_admin)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    CASE WHEN NEW.email = 'samuelivere92@gmail.com' THEN true ELSE false END
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ─── TRIGGER: updated_at ──────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS trigger AS $$ BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$ LANGUAGE plpgsql;

CREATE TRIGGER cars_upd     BEFORE UPDATE ON public.cars     FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER profiles_upd BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER stores_upd   BEFORE UPDATE ON public.stores   FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ─── STORAGE ─────────────────────────────────────────────────────────────────
-- Supabase → Storage → Create bucket: "cars"   → Public ON
-- Supabase → Storage → Create bucket: "stores" → Public ON
-- Add INSERT policy on each: (auth.role() = 'authenticated')

-- ─── DISABLE GOOGLE OAUTH ─────────────────────────────────────────────────────
-- Supabase → Authentication → Providers → Google → DISABLE
-- Supabase → Authentication → Providers → Email → ENABLE
-- Optionally enable "Confirm email" (recommended for production)

-- ─── MAKE YOURSELF ADMIN ─────────────────────────────────────────────────────
-- After signing up with samuelivere92@gmail.com, run:
-- UPDATE public.profiles SET is_admin = true WHERE email = 'samuelivere92@gmail.com';
