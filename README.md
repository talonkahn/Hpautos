# H-Autos Nigeria 🚗

Nigeria's premium admin-controlled car marketplace — Supabase backend, Google auth only.

## Business Model

| Role | How |
|---|---|
| **Admin** | Lists ALL cars, approves everything, full control |
| **Individual Seller** | Pays ₦3,000 / $5 USDT for 14-day seller access. Sends car to admin via WhatsApp. Admin lists it. |
| **Car Stand / Dealership** | Registers free with RC number. Gets a branded store page. Admin approves after verifying RC. |
| **Buyer** | Browses & sends enquiry → goes to admin WhatsApp (+234 814 673 0044) |

---

## Setup (30 mins)

### 1. Create Supabase Project
1. Go to [supabase.com](https://supabase.com) → New Project
2. Region: `eu-west-1` (closest to Nigeria)

### 2. Run Database Schema
- Supabase → **SQL Editor** → paste & run `SUPABASE_SCHEMA.sql`

### 3. Enable Google OAuth
1. Supabase → **Authentication** → **Providers** → **Google** → Enable
2. [console.cloud.google.com](https://console.cloud.google.com) → Create OAuth Client ID (Web)
3. Authorized redirect URI: `https://YOUR_PROJECT.supabase.co/auth/v1/callback`
4. Paste Client ID + Secret into Supabase

### 4. Create Storage Buckets
Supabase → **Storage** → Create two buckets:
- `cars` → **Public: ON**
- `stores` → **Public: ON**

Add INSERT policy on each bucket:
```sql
(auth.role() = 'authenticated')
```

### 5. Environment Variables
```bash
cp .env.example .env
# Edit with your values:
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 6. Make Yourself Admin
Sign in with Google first, then run in SQL Editor:
```sql
UPDATE public.profiles SET is_admin = true WHERE email = 'samuelivere92@gmail.com';
```

### 7. Run Locally
```bash
npm install
npm run dev
```

---

## Deploy to Vercel (Free)
1. Push to GitHub
2. Import to [vercel.com](https://vercel.com)
3. Add env vars: `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
4. Deploy ✅

---

## How Seller Requests Work
1. User visits `/BecomeSeller` → fills form + enters payment ref
2. Submission auto-opens WhatsApp to **+234 814 673 0044** with details
3. Admin verifies payment in Admin Dashboard → **Approve** button
4. User's account gets `seller_active = true` for 14 days
5. Seller sends car details to admin on WhatsApp → admin lists it

### Activate seller manually in SQL:
```sql
UPDATE public.profiles 
SET seller_active = true, 
    seller_expiry = NOW() + INTERVAL '14 days'
WHERE email = 'seller@email.com';
```

---

## How Store Registration Works
1. Business owner visits `/RegisterStore` → fills form with RC number
2. Submission auto-opens WhatsApp to admin with store details
3. Admin verifies RC on [search.cac.gov.ng](https://search.cac.gov.ng)
4. Admin clicks **Approve** in Admin Dashboard → store goes live
5. Store gets a dedicated page at `/StoreDetails?id=...`
6. Admin can assign car listings to that store

---

## All Enquiries → Admin WhatsApp
Every "Send Enquiry" button on car listings opens WhatsApp to **+234 814 673 0044** with:
- Car details (title, price)
- Buyer name, phone, WhatsApp
- Buyer's message

Admin handles all buyer-seller coordination.

---

## Email Notifications (Optional Setup)
To enable actual email sending, create a Supabase Edge Function using [Resend](https://resend.com):

```bash
supabase functions new send-email
```

```typescript
// supabase/functions/send-email/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
serve(async (req) => {
  const { to, subject, html, bcc } = await req.json()
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${Deno.env.get('RESEND_API_KEY')}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: 'H-Autos <noreply@yourdomain.com>', to, subject, html, bcc: bcc || 'samuelivere92@gmail.com' })
  })
  return new Response(JSON.stringify(await res.json()), { status: 200 })
})
```

---

## Features Checklist

| Feature | Status |
|---|---|
| Google-only sign in | ✅ |
| Admin lists ALL cars (no user self-listing) | ✅ |
| ₦3,000 / $5 USDT seller subscription (14 days) | ✅ |
| Payment ref submitted → WhatsApp admin for verification | ✅ |
| Admin approves sellers from dashboard | ✅ |
| Car stand / dealership store registration | ✅ |
| RC number field + admin verification | ✅ |
| Investor-pitch-ready store pages | ✅ |
| All enquiries → admin WhatsApp +234 814 673 0044 | ✅ |
| Spotlight banner ads every 2 mins | ✅ |
| Admin: approve/reject cars, stores, seller requests | ✅ |
| Admin: post unlimited listings | ✅ |
| Admin: assign cars to stores | ✅ |
| Admin: feature/unfeature cars | ✅ |
| Admin: upgrade users, activate sellers | ✅ |
| In-app real-time chat | ✅ |
| WhatsApp integration on every car/store | ✅ |
| Monthly newsletter subscriber capture | ✅ |
| Saved cars | ✅ |
| No base44 | ✅ |
