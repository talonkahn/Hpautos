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

-- ─── STORAGE BUCKET SETUP ─────────────────────────────────────────────────────
-- Do this in Supabase Dashboard (not SQL Editor):
--
-- 1. Go to Storage → New bucket
--    Name: cars
--    Public: ON (toggle on)
--    → Create bucket
--
-- 2. Go to Storage → Policies → cars bucket → New policy
--    For INSERT: allowed_roles = authenticated
--    Or use: (auth.role() = 'authenticated')
--
-- 3. Repeat for a "stores" bucket (for store logos)
--
-- Once buckets exist, image upload in Admin Dashboard will work.
-- Until then, use the "Paste image URL" option in the list car form.

-- ─── CRYPTO PAYMENT TRACKING ──────────────────────────────────────────────────
-- Add payment tracking columns to enquiries table
ALTER TABLE public.enquiries ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'whatsapp';
ALTER TABLE public.enquiries ADD COLUMN IF NOT EXISTS payment_coin   TEXT;
ALTER TABLE public.enquiries ADD COLUMN IF NOT EXISTS payment_tx     TEXT;
ALTER TABLE public.enquiries ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending';


-- ═════════════════════════════════════════════════════════════════════════════
-- WEB3 ESCROW  (run this block once)
-- ═════════════════════════════════════════════════════════════════════════════

-- Listings: dealer payout wallet + exact USD price used for escrow
ALTER TABLE public.cars   ADD COLUMN IF NOT EXISTS dealer_wallet TEXT;
ALTER TABLE public.cars   ADD COLUMN IF NOT EXISTS price_usd NUMERIC;
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS wallet_address TEXT;

-- Orders: an off-chain mirror of each on-chain escrow order.
-- The chain is the source of truth; the app re-verifies status on-chain.
CREATE TABLE IF NOT EXISTS public.orders (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chain_order_id   BIGINT,
  chain_id         INT,
  escrow_address   TEXT,
  car_id           UUID REFERENCES public.cars(id) ON DELETE SET NULL,
  car_title        TEXT,
  car_image        TEXT,
  buyer_id         UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  buyer_wallet     TEXT,
  dealer_wallet    TEXT,
  buyer_name       TEXT,
  delivery_country TEXT,
  delivery_city    TEXT,
  amount_usd       NUMERIC,
  released_usdc    NUMERIC DEFAULT 0,
  status           TEXT DEFAULT 'funded',
  tracking_ref     TEXT,
  carrier          TEXT,
  create_tx        TEXT,
  created_block    BIGINT,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.order_events (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id      UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  type          TEXT NOT NULL,   -- funded | shipped | milestone | delivered | released | refunded | disputed | resolved
  label         TEXT,
  note          TEXT,
  tx_hash       TEXT,
  actor_wallet  TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.orders       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_events ENABLE ROW LEVEL SECURITY;

-- Orders hold no phone numbers or street addresses (those go to admin via WhatsApp),
-- and the same facts are public on-chain, so listing is open for transparency.
DROP POLICY IF EXISTS "orders_select" ON public.orders;
DROP POLICY IF EXISTS "orders_insert" ON public.orders;
DROP POLICY IF EXISTS "orders_update" ON public.orders;
CREATE POLICY "orders_select" ON public.orders FOR SELECT USING (true);
CREATE POLICY "orders_insert" ON public.orders FOR INSERT WITH CHECK (auth.uid() = buyer_id);
-- Signed-in participants (buyer, dealer, admin) sync the mirror after their transactions.
-- Production hardening: move this to an indexer / edge function that verifies tx logs.
CREATE POLICY "orders_update" ON public.orders FOR UPDATE USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "oev_select" ON public.order_events;
DROP POLICY IF EXISTS "oev_insert" ON public.order_events;
CREATE POLICY "oev_select" ON public.order_events FOR SELECT USING (true);
CREATE POLICY "oev_insert" ON public.order_events FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE INDEX IF NOT EXISTS orders_buyer_idx  ON public.orders (buyer_id);
CREATE INDEX IF NOT EXISTS orders_dealer_idx ON public.orders (lower(dealer_wallet));
CREATE INDEX IF NOT EXISTS oev_order_idx     ON public.order_events (order_id);


-- ═════════════════════════════════════════════════════════════════════════════
-- ROQQU INTEGRATION  (run this block once)
-- All three tables are written ONLY by the server (service role). Users can read their own rows.
-- BVN / NIN numbers are never stored — only the yes/no verification result.
-- ═════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.dealer_profiles (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  wallet_address TEXT UNIQUE,
  business_name  TEXT,
  bank_code      TEXT, bank_name TEXT, account_number TEXT, account_name TEXT,
  bank_verified  BOOLEAN DEFAULT false,
  bvn_verified   BOOLEAN DEFAULT false,
  nin_verified   BOOLEAN DEFAULT false,
  status         TEXT DEFAULT 'unverified',   -- unverified | verified | rejected
  reject_reason  TEXT,
  verified_at    TIMESTAMPTZ,
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.crypto_payments (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  car_id          UUID REFERENCES public.cars(id) ON DELETE SET NULL,
  car_title       TEXT,
  asset           TEXT, network TEXT,
  amount_usd      NUMERIC, amount_crypto NUMERIC,
  deposit_address TEXT, roqqu_ref TEXT, tx_hash TEXT,
  status          TEXT DEFAULT 'awaiting_payment',  -- awaiting_payment | confirmed | expired | failed
  expires_at      TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.payouts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  wallet_address  TEXT,
  amount_usdc     NUMERIC, fee_usdc NUMERIC, rate_ngn NUMERIC, amount_ngn NUMERIC,
  bank_name       TEXT, account_last4 TEXT, account_name TEXT,
  deposit_address TEXT, network TEXT, roqqu_ref TEXT, tx_hash TEXT,
  status          TEXT DEFAULT 'awaiting_deposit',  -- awaiting_deposit | paid | failed
  quote_expires_at TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.dealer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crypto_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payouts         ENABLE ROW LEVEL SECURITY;

-- Read own rows (or all, for admins). No INSERT/UPDATE/DELETE policies on purpose:
-- only the server's service-role key can write, so nobody can mark their own payment "confirmed".
DROP POLICY IF EXISTS "dealer_profiles_read" ON public.dealer_profiles;
DROP POLICY IF EXISTS "crypto_payments_read" ON public.crypto_payments;
DROP POLICY IF EXISTS "payouts_read"         ON public.payouts;
CREATE POLICY "dealer_profiles_read" ON public.dealer_profiles FOR SELECT
  USING (user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true));
CREATE POLICY "crypto_payments_read" ON public.crypto_payments FOR SELECT
  USING (user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true));
CREATE POLICY "payouts_read" ON public.payouts FOR SELECT
  USING (user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true));

-- Public, limited view: lets listings show a "Verified dealer" badge without exposing bank details.
CREATE OR REPLACE VIEW public.verified_dealers AS
  SELECT lower(wallet_address) AS wallet_address, business_name
  FROM public.dealer_profiles WHERE status = 'verified';
GRANT SELECT ON public.verified_dealers TO anon, authenticated;
