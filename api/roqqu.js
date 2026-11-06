// POST /api/roqqu   body: { action, ...params }   header: Authorization: Bearer <supabase access token>
// One function = one Vercel serverless slot. All money-affecting logic lives here, never in the browser.
import { roqqu, roqquStatus, isMock, RoqquError, ASSETS } from './_lib/roqqu.js';
import { requireUser, adminDb, HttpError } from './_lib/auth.js';
import { carPriceUSD } from '../src/lib/pricing.js';

const isEvmAddress = (a) => /^0x[a-fA-F0-9]{40}$/.test(a || '');
const normName = (s) => (s || '').toUpperCase().replace(/[^A-Z\s]/g, ' ').split(/\s+/).filter(Boolean);
export const namesMatch = (a, b) => {
  const A = normName(a), B = normName(b);
  if (!A.length || !B.length) return false;
  const shared = A.filter((t) => B.includes(t)).length;
  return shared >= Math.min(2, A.length, B.length);
};
const num = (v) => Number(v);
const bad = (msg) => { throw new HttpError(400, msg); };

const actions = {
  // ── public ────────────────────────────────────────────────────────────────
  async health() {
    return { ...roqquStatus(), serviceRole: !!process.env.SUPABASE_SERVICE_ROLE_KEY, assets: ASSETS };
  },

  // ── shared ────────────────────────────────────────────────────────────────
  async list_banks() { return await roqqu.listBanks(); },

  async resolve_bank(ctx, { bankCode, accountNumber }) {
    return await roqqu.resolveBank({ bankCode, accountNumber });
  },

  // ── Feature 3: dealer verification (bank + BVN/NIN). BVN/NIN are NEVER stored or logged. ──
  async verify_dealer({ user }, { walletAddress, businessName, bankCode, accountNumber, bvn, nin }) {
    if (!isEvmAddress(walletAddress)) bad('Enter a valid payout wallet address (0x…).');
    if (!businessName?.trim()) bad('Enter your business / trading name.');
    if (!bvn && !nin) bad('Provide your BVN or NIN (or both).');

    const bank = await roqqu.resolveBank({ bankCode, accountNumber });
    const bankName = (await roqqu.listBanks()).find((b) => b.code === bankCode)?.name || bankCode;

    let bvnOk = false, ninOk = false, reason = null;
    if (bvn) {
      const r = await roqqu.verifyIdentity({ type: 'bvn', number: String(bvn) });
      bvnOk = r.verified && namesMatch(bank.accountName, r.fullName);
      if (!bvnOk) reason = r.verified ? 'BVN name does not match the bank account name.' : (r.reason || 'BVN could not be verified.');
    }
    if (nin) {
      const r = await roqqu.verifyIdentity({ type: 'nin', number: String(nin) });
      ninOk = r.verified && namesMatch(bank.accountName, r.fullName);
      if (!ninOk) reason = reason || (r.verified ? 'NIN name does not match the bank account name.' : (r.reason || 'NIN could not be verified.'));
    }

    const verified = bvnOk || ninOk;
    const row = {
      user_id: user.id, wallet_address: walletAddress.toLowerCase(), business_name: businessName.trim(),
      bank_code: bankCode, bank_name: bankName, account_number: accountNumber, account_name: bank.accountName,
      bank_verified: true, bvn_verified: bvnOk, nin_verified: ninOk,
      status: verified ? 'verified' : 'rejected', reject_reason: verified ? null : reason,
      verified_at: verified ? new Date().toISOString() : null, updated_at: new Date().toISOString(),
    };
    const { data, error } = await adminDb().from('dealer_profiles').upsert(row, { onConflict: 'user_id' }).select().single();
    if (error) throw new HttpError(500, error.message.includes('unique') ? 'That wallet is already registered to another dealer.' : error.message);
    return data;
  },

  // ── Feature 1: auto-confirmed crypto checkout ─────────────────────────────
  async create_payment({ user }, { carId, asset }) {
    if (!ASSETS[asset]) bad('Choose a supported coin.');
    const db = adminDb();
    const { data: car } = await db.from('cars').select('id,title,price,price_usd,country,status').eq('id', carId).maybeSingle();
    if (!car || car.status !== 'approved') bad('This car is not available for purchase.');

    const amountUsd = carPriceUSD(car);                       // priced on the server — the browser cannot change it
    if (!(amountUsd > 0)) bad('This listing has no valid price.');
    const dep = await roqqu.createDeposit({ asset, amountUsd, reference: `car-${car.id}` });

    const { data, error } = await db.from('crypto_payments').insert({
      user_id: user.id, car_id: car.id, car_title: car.title, asset, network: dep.network,
      amount_usd: amountUsd, amount_crypto: dep.amountCrypto, deposit_address: dep.address,
      roqqu_ref: dep.ref, status: 'awaiting_payment', expires_at: dep.expiresAt,
    }).select().single();
    if (error) throw new HttpError(500, error.message);
    return data;
  },

  async payment_status({ user, isAdmin }, { id }) {
    const { data } = await adminDb().from('crypto_payments').select('*').eq('id', id).maybeSingle();
    if (!data || (data.user_id !== user.id && !isAdmin)) throw new HttpError(404, 'Payment not found.');
    if (data.status === 'awaiting_payment' && new Date(data.expires_at) < new Date()) {
      await adminDb().from('crypto_payments').update({ status: 'expired', updated_at: new Date().toISOString() }).eq('id', id);
      return { ...data, status: 'expired' };
    }
    return data;
  },

  // ── Feature 2: dealer cash-out USDC → NGN bank ────────────────────────────
  async quote_cashout(ctx, { amountUsdc }) {
    const amt = num(amountUsdc);
    if (!(amt >= 10 && amt <= 50000)) bad('Amount must be between $10 and $50,000.');
    return await roqqu.quoteCashout({ amountUsdc: amt });
  },

  async create_cashout({ user }, { amountUsdc, walletAddress }) {
    const amt = num(amountUsdc);
    if (!(amt >= 10 && amt <= 50000)) bad('Amount must be between $10 and $50,000.');
    const db = adminDb();
    const { data: dealer } = await db.from('dealer_profiles').select('*').eq('user_id', user.id).maybeSingle();
    if (!dealer || dealer.status !== 'verified') bad('Verify your business and bank account first.');
    if (!isEvmAddress(walletAddress) || walletAddress.toLowerCase() !== dealer.wallet_address) bad('Connect the wallet you registered as your dealer payout wallet.');

    const quote = await roqqu.quoteCashout({ amountUsdc: amt });
    const out = await roqqu.createCashout({ amountUsdc: amt, quote, bank: { code: dealer.bank_code, accountNumber: dealer.account_number, accountName: dealer.account_name } });

    const { data, error } = await db.from('payouts').insert({
      user_id: user.id, wallet_address: dealer.wallet_address, amount_usdc: amt, fee_usdc: quote.feeUsdc,
      rate_ngn: quote.rate, amount_ngn: quote.amountNgn, bank_name: dealer.bank_name,
      account_last4: dealer.account_number.slice(-4), account_name: dealer.account_name,
      deposit_address: out.address, network: out.network, roqqu_ref: out.ref,
      status: 'awaiting_deposit', quote_expires_at: quote.expiresAt,
    }).select().single();
    if (error) throw new HttpError(500, error.message);
    return data;
  },

  async cashout_status({ user, isAdmin }, { id }) {
    const { data } = await adminDb().from('payouts').select('*').eq('id', id).maybeSingle();
    if (!data || (data.user_id !== user.id && !isAdmin)) throw new HttpError(404, 'Cash-out not found.');
    return data;
  },

  // ── Test mode only: simulate Roqqu confirming a deposit / paying out ──────
  async mock_confirm({ user, isAdmin }, { kind, id }) {
    if (!isMock()) throw new HttpError(403, 'Only available in test mode.');
    const db = adminDb();
    const table = kind === 'cashout' ? 'payouts' : 'crypto_payments';
    const { data: row } = await db.from(table).select('*').eq('id', id).maybeSingle();
    if (!row || (row.user_id !== user.id && !isAdmin)) throw new HttpError(404, 'Not found.');
    const next = kind === 'cashout' ? 'paid' : 'confirmed';
    const { data, error } = await db.from(table).update({ status: next, tx_hash: `mock-${Date.now().toString(36)}`, updated_at: new Date().toISOString() }).eq('id', id).select().single();
    if (error) throw new HttpError(500, error.message);
    return data;
  },
};

const PUBLIC = new Set(['health']);

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const action = body.action || req.query?.action;
    const fn = actions[action];
    if (!fn) throw new HttpError(400, 'Unknown action.');
    const ctx = PUBLIC.has(action) ? {} : await requireUser(req);
    const data = await fn(ctx, body);
    return res.status(200).json({ ok: true, data });
  } catch (e) {
    const status = e instanceof HttpError || e instanceof RoqquError ? e.status : 500;
    if (status >= 500) console.error('[roqqu]', e);          // never log request bodies (BVN/NIN)
    return res.status(status).json({ ok: false, error: status >= 500 && !(e instanceof HttpError || e instanceof RoqquError) ? 'Something went wrong. Please try again.' : e.message });
  }
}
