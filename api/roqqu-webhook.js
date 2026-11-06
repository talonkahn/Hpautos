// POST /api/roqqu-webhook — Roqqu notifies us when a deposit lands / a payout completes.
// SECURE BY DEFAULT: in live mode it rejects every call until verifyWebhook() is implemented
// from the RAS docs (signature / encryption scheme). In mock mode the endpoint is disabled.
import { isMock } from './_lib/roqqu.js';
import { adminDb } from './_lib/auth.js';

// TODO (live): verify the signature/encryption exactly as the RAS webhook docs describe,
// using ROQQU_PRIVATE_KEY, and return the parsed event. Return null if it does not verify.
function verifyWebhook(/* req */) { return null; }

// TODO (live): map Roqqu's event names/fields to ours.
function mapEvent(evt) {
  return { ref: evt.reference, status: evt.status === 'success' ? 'confirmed' : 'failed', txHash: evt.txHash || null };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  if (isMock()) return res.status(404).json({ ok: false, error: 'Webhook disabled in test mode.' });

  const evt = verifyWebhook(req);
  if (!evt) return res.status(401).json({ ok: false, error: 'Webhook not verified.' });

  const { ref, status, txHash } = mapEvent(evt);
  const db = adminDb();
  const now = new Date().toISOString();
  // Deposits for car payments
  await db.from('crypto_payments').update({ status, tx_hash: txHash, updated_at: now }).eq('roqqu_ref', ref).eq('status', 'awaiting_payment');
  // Cash-outs: a confirmed deposit means Roqqu is paying the dealer's bank
  await db.from('payouts').update({ status: status === 'confirmed' ? 'paid' : 'failed', tx_hash: txHash, updated_at: now }).eq('roqqu_ref', ref).eq('status', 'awaiting_deposit');
  return res.status(200).json({ ok: true });
}
