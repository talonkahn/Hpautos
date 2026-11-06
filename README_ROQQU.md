# Roqqu integration — setup & status

## What's built (all three features)
| # | Feature | Where users see it |
|---|---|---|
| 1 | **Auto-confirmed crypto checkout** — unique deposit address per order (BTC, ETH, SOL, USDT-TRC20/ERC20), QR, countdown, live status polling, no tx-hash pasting | Car page → "⚡ Pay with Crypto — auto-confirmed" |
| 2 | **Dealer cash-out USDC → naira** — quote (rate + fee), deposit instructions, status polling, history | Dealer Escrow page |
| 3 | **Dealer verification** — bank account name check + BVN/NIN, "Verified dealer" badge on listings | Dealer Escrow page; badge on car pages |
Admin: Admin Dashboard → **⚡ Roqqu** tab (payments, cash-outs, dealer verification).

## Architecture (why the private key is safe)
Browser → `/api/roqqu` (Vercel serverless) → Roqqu. The key lives only in server env vars. The server verifies the caller's Supabase login on every action, **prices cars itself** (the browser can't change the amount), and is the only thing allowed to write payment/payout/verification rows (no INSERT/UPDATE policies exist for users). BVN/NIN are never stored or logged.

## Modes
`ROQQU_MODE=mock` (default) simulates Roqqu: deposit addresses are deliberately invalid text (`TEST-MODE-DO-NOT-SEND-…`) so no real funds can be sent. A "Simulate payment" button appears so the whole flow can be demoed.
`ROQQU_MODE=live` calls the real API, **after `api/_lib/roqqu.js` is completed** from the Roqqu API Services (RAS) docs: base URL, request signing with the RASPRIV/RASPUB keys, endpoint paths. Until then live mode returns a clear "not implemented" error — it never fakes success. The webhook (`api/roqqu-webhook.js`) rejects everything in live mode until its signature check is implemented.

## Setup
1. Supabase SQL editor → run the **ROQQU INTEGRATION** block at the bottom of `MIGRATION_RUN_NOW.sql`.
2. Add to `.env` locally **and** to Vercel → Settings → Environment Variables (then redeploy):
   ```
   ROQQU_MODE=mock
   ROQQU_PRIVATE_KEY=<your RASPRIV… test key>
   ROQQU_PUBLIC_KEY=<your RASPUB… test key>
   SUPABASE_SERVICE_ROLE_KEY=<Supabase → Project Settings → API Keys → service_role>
   ```
   **No `VITE_` prefix on any of these.** Anything with `VITE_` is public in the browser. Never commit `.env`.
3. `npm install` then `npm run dev` (the dev server now also serves `/api`).

## Test it (≈2 minutes)
1. Admin → Roqqu tab: the amber "Test mode" banner should show, with no red warning.
2. Open a car → ⚡ Pay with Crypto → pick a coin → address + QR appear → "Simulate payment" → confirmed.
3. Dealer Escrow → verify: pick any bank, any 10-digit account, "Check account name", enter any 11-digit BVN **not ending in 0** (ending in 0 simulates a failure), connect wallet → Verified.
4. Cash out: amount → quote → Continue → "Simulate deposit & payout" → paid. Then a car listed with that dealer wallet shows the ✅ Verified dealer badge.

## Going live
Send the RAS docs (Authentication page + endpoints for: bank list, account name enquiry, BVN/NIN verify, generate deposit address/payment link, rate/quote, payout, webhooks). Fill in the six `live` functions + `buildAuthHeaders()` + `verifyWebhook()`, set `ROQQU_BASE_URL` and `ROQQU_MODE=live`.
Rotate the test keys you shared in chat before using anything real.
