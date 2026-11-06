# H-Autos Nigeria 🚗 v3

Admin-controlled Nigerian car marketplace. Email-only auth, no Google.

## Auth Model
- Users sign up/in with **email + password only** (no Google)
- Sign-up is prompted only when a user tries to **contact a seller on WhatsApp**
- Admin is **samuelivere92@gmail.com** — auto-detected, full dashboard access

## Setup (30 min)

### 1. Supabase Project
1. [supabase.com](https://supabase.com) → New Project
2. Run `SUPABASE_SCHEMA.sql` in SQL Editor
3. Authentication → Providers → **Email: ON**, **Google: OFF**

### 2. Storage Buckets
Create two **public** buckets: `cars` and `stores`
Add INSERT policy on each: `(auth.role() = 'authenticated')`

### 3. .env
```bash
cp .env.example .env
# Fill VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
```

### 4. Make Yourself Admin
Sign up at the site with `samuelivere92@gmail.com`, then run in SQL Editor:
```sql
UPDATE public.profiles SET is_admin = true WHERE email = 'samuelivere92@gmail.com';
```

### 5. Run
```bash
npm install
npm run dev
```

### 6. Deploy (Vercel)
Push to GitHub → Import on Vercel → Add env vars → Deploy.

## Features
| | |
|---|---|
| Email-only auth | ✅ |
| Sign-up prompt only when contacting seller | ✅ |
| Admin auto-detected by email | ✅ |
| Admin dashboard: visitors, revenue, stores, cars | ✅ |
| Revenue chart (NGN + USDT) | ✅ |
| Site visitor tracking (today / week / month / total) | ✅ |
| Store approvals with RC verification | ✅ |
| Seller subscription ₦3,000 / $5 USDT | ✅ |
| All enquiries → admin WhatsApp | ✅ |
| Spotlight ads every 2 mins | ✅ |
| Real-time in-app chat | ✅ |
| No Google auth | ✅ |
| No base44 | ✅ |
