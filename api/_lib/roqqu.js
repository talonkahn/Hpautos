// ─────────────────────────────────────────────────────────────────────────────
// Roqqu adapter — SERVER ONLY. Never import this from src/ (it reads secret keys).
//
// Two modes (env ROQQU_MODE):
//   mock (default) → simulated Roqqu responses. Deposit addresses are deliberately INVALID
//                    strings so nobody can send real funds to them by mistake.
//   live           → real calls to Roqqu API Services (RAS). The HTTP layer at the bottom of
//                    this file (`liveRequest` + the `live` object) must be completed from the
//                    RAS docs: base URL, request signing with RASPRIV/RASPUB, endpoint paths.
//
// Everything else in the app talks to the `roqqu` object below and doesn't care which mode runs.
// ─────────────────────────────────────────────────────────────────────────────
import { createHash } from 'node:crypto';

export const MODE = (process.env.ROQQU_MODE || 'mock').toLowerCase() === 'live' ? 'live' : 'mock';
export const isMock = () => MODE === 'mock';

const PRIVATE_KEY = () => process.env.ROQQU_PRIVATE_KEY || '';
const PUBLIC_KEY = () => process.env.ROQQU_PUBLIC_KEY || '';
const BASE_URL = () => process.env.ROQQU_BASE_URL || '';

export const ASSETS = {
  BTC:        { label: 'Bitcoin',          network: 'Bitcoin',          usd: 65000, decimals: 6 },
  ETH:        { label: 'Ethereum',         network: 'Ethereum (ERC-20)', usd: 3200,  decimals: 5 },
  SOL:        { label: 'Solana',           network: 'Solana',           usd: 150,   decimals: 3 },
  USDT_TRC20: { label: 'USDT (Tron)',      network: 'TRC-20',           usd: 1,     decimals: 2 },
  USDT_ERC20: { label: 'USDT (Ethereum)',  network: 'ERC-20',           usd: 1,     decimals: 2 },
};

const MOCK_NGN_PER_USD = () => Number(process.env.ROQQU_MOCK_NGN_RATE || 1600);

export const BANKS = [
  { code: '044', name: 'Access Bank' }, { code: '058', name: 'Guaranty Trust Bank' }, { code: '011', name: 'First Bank of Nigeria' },
  { code: '033', name: 'United Bank for Africa' }, { code: '057', name: 'Zenith Bank' }, { code: '070', name: 'Fidelity Bank' },
  { code: '232', name: 'Sterling Bank' }, { code: '032', name: 'Union Bank' }, { code: '035', name: 'Wema Bank' },
  { code: '214', name: 'FCMB' }, { code: '221', name: 'Stanbic IBTC Bank' }, { code: '076', name: 'Polaris Bank' },
  { code: '050', name: 'Ecobank Nigeria' }, { code: '082', name: 'Keystone Bank' },
  { code: '50211', name: 'Kuda Microfinance Bank' }, { code: '50515', name: 'Moniepoint MFB' },
  { code: '100004', name: 'OPay' }, { code: '100033', name: 'PalmPay' },
];

export class RoqquError extends Error {
  constructor(message, status = 502) { super(message); this.status = status; }
}

const refFor = (prefix) => `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
const fakeAddress = (asset, ref) =>
  `TEST-MODE-DO-NOT-SEND-${asset}-${createHash('sha256').update(ref).digest('hex').slice(0, 10).toUpperCase()}`;

// ─── Mock implementation ─────────────────────────────────────────────────────
const mock = {
  async listBanks() { return BANKS; },

  async resolveBank({ bankCode, accountNumber }) {
    if (!BANKS.some((b) => b.code === bankCode)) throw new RoqquError('Unknown bank code', 400);
    if (!/^\d{10}$/.test(accountNumber)) throw new RoqquError('Account number must be 10 digits', 400);
    return { accountName: 'TEST DEALER ACCOUNT', accountNumber, bankCode };
  },

  async verifyIdentity({ type, number }) {
    const want = type === 'bvn' ? /^\d{11}$/ : /^\d{11}$/;
    if (!want.test(number || '')) throw new RoqquError(`${type.toUpperCase()} must be 11 digits`, 400);
    // Mock rule: numbers ending in 0 simulate a failed match so the failure path can be demoed.
    const ok = !number.endsWith('0');
    return { verified: ok, fullName: ok ? 'TEST DEALER ACCOUNT' : null, reason: ok ? null : 'Simulated mismatch (number ends in 0)' };
  },

  async createDeposit({ asset, amountUsd }) {
    const a = ASSETS[asset]; if (!a) throw new RoqquError('Unsupported asset', 400);
    const ref = refFor('mockdep');
    const amountCrypto = Number((amountUsd / a.usd).toFixed(a.decimals));
    return { ref, address: fakeAddress(asset, ref), amountCrypto, network: a.network, expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString() };
  },

  async quoteCashout({ amountUsdc }) {
    const rate = MOCK_NGN_PER_USD();
    const fee = Math.max(0.5, amountUsdc * 0.01);                 // 1% (min $0.50)
    return { rate, feeUsdc: Number(fee.toFixed(2)), amountNgn: Math.round((amountUsdc - fee) * rate), expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString() };
  },

  async createCashout({ amountUsdc, asset = 'USDT_ERC20' }) {
    const ref = refFor('mockout');
    return { ref, address: fakeAddress(asset, ref), network: ASSETS[asset]?.network || 'ERC-20' };
  },
};

// ─── Live implementation (TO COMPLETE from the RAS docs) ─────────────────────
// 1) Set ROQQU_BASE_URL, ROQQU_PRIVATE_KEY, ROQQU_PUBLIC_KEY in Vercel + local env.
// 2) Implement buildAuthHeaders() exactly as the RAS "Authentication" page describes.
// 3) Fill in each function below with the documented endpoint + payload, and map the response
//    to the same shapes the mock returns (see above) — nothing else in the app has to change.
function buildAuthHeaders(/* method, path, bodyString */) {
  throw new RoqquError('Live mode: buildAuthHeaders() not implemented — complete it from the RAS docs (api/_lib/roqqu.js).', 501);
}

// eslint-disable-next-line no-unused-vars
async function liveRequest(method, path, body) {
  if (!BASE_URL() || !PRIVATE_KEY() || !PUBLIC_KEY()) {
    throw new RoqquError('Live mode needs ROQQU_BASE_URL, ROQQU_PRIVATE_KEY and ROQQU_PUBLIC_KEY.', 500);
  }
  const bodyString = body ? JSON.stringify(body) : undefined;
  const res = await fetch(`${BASE_URL()}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', ...buildAuthHeaders(method, path, bodyString) },
    body: bodyString,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new RoqquError(data?.message || `Roqqu request failed (${res.status})`, res.status >= 500 ? 502 : res.status);
  return data;
}

const notYet = (what) => { throw new RoqquError(`Live mode: ${what} not implemented yet — complete it from the RAS docs (api/_lib/roqqu.js).`, 501); };
const live = {
  async listBanks()        { return notYet('listBanks'); },        // e.g. liveRequest('GET', '<banks path>')
  async resolveBank()      { return notYet('resolveBank'); },      // bank account name enquiry
  async verifyIdentity()   { return notYet('verifyIdentity'); },   // BVN / NIN verification
  async createDeposit()    { return notYet('createDeposit'); },    // generate wallet address / payment link per payment
  async quoteCashout()     { return notYet('quoteCashout'); },     // rate for USDC → NGN
  async createCashout()    { return notYet('createCashout'); },    // deposit address + payout instruction to the bank account
};

export const roqqu = isMock() ? mock : live;
export const roqquStatus = () => ({
  mode: MODE,
  keysPresent: !!(PRIVATE_KEY() && PUBLIC_KEY()),
  baseUrlSet: !!BASE_URL(),
});
