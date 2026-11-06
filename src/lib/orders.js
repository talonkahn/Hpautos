import { supabase } from './supabase';
import { readOrder, WEB3, sameAddr } from './web3';
import { STATUS } from './escrowAbi';

// ─── Supabase reads/writes for the `orders` mirror ────────────────────────────
// The chain is the source of truth. These tables only make lists/timelines fast
// and hold off-chain details (tracking refs, destination). Headline status is
// always re-read from the chain (see syncOrder).

export const createOrderRecord = async (row) => {
  const { data, error } = await supabase.from('orders').insert(row).select().single();
  if (error) throw error;
  return data;
};

export const addOrderEvent = async (event) => {
  const { error } = await supabase.from('order_events').insert(event);
  if (error) console.error('order event not saved', error);
};

export const getOrderEvents = async (orderId) => {
  const { data } = await supabase.from('order_events').select('*').eq('order_id', orderId).order('created_at', { ascending: true });
  return data || [];
};

export const getMyOrders = async (userId) => {
  const { data, error } = await supabase.from('orders').select('*').eq('buyer_id', userId).order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
};

export const getOrdersForDealer = async (wallet) => {
  const { data, error } = await supabase.from('orders').select('*').ilike('dealer_wallet', wallet).order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
};

export const getAllOrders = async () => {
  const { data, error } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
};

export const updateOrderRow = async (id, patch) => {
  const { data, error } = await supabase.from('orders').update({ ...patch, updated_at: new Date().toISOString() }).eq('id', id).select().single();
  if (error) throw error;
  return data;
};

// ─── Chain → DB reconciliation ────────────────────────────────────────────────
/** Reads the real on-chain state, mirrors it into the DB row, and returns both. */
export async function syncOrder(order) {
  if (!order?.chain_order_id) return { order, chain: null };
  const chain = await readOrder(order.chain_order_id);
  const status = chain.statusLabel.toLowerCase();
  const patch = {};
  if (order.status !== status) patch.status = status;
  if (Number(order.released_usdc || 0) !== chain.paidOut) patch.released_usdc = chain.paidOut;
  let updated = order;
  if (Object.keys(patch).length) {
    try { updated = await updateOrderRow(order.id, patch); } catch { updated = { ...order, ...patch }; }
  }
  return { order: updated, chain };
}

// ─── Which actions the connected wallet may take right now ────────────────────
// Mirrors the contract's access rules so the UI never offers a doomed transaction.
export function allowedActions(chain, wallet) {
  if (!chain || !wallet) return {};
  const nowSec = Math.floor(Date.now() / 1000);
  const isBuyer = sameAddr(wallet, chain.buyer);
  const isDealer = sameAddr(wallet, chain.dealer);
  const isArbiter = sameAddr(wallet, WEB3.arbiter);
  const s = STATUS[chain.status];
  return {
    markShipped:       isDealer && s === 'Funded',
    postMilestone:     (isDealer || isArbiter) && s === 'Shipped',
    markDelivered:     (isDealer || isArbiter) && s === 'Shipped',
    confirmDelivery:   isBuyer && (s === 'Shipped' || s === 'Delivered'),
    autoRelease:       s === 'Delivered' && nowSec >= chain.deliveredAt + chain.autoReleaseWindow,
    refund:            s === 'Funded' && nowSec > chain.shipDeadline,
    raiseDispute:      (isBuyer || isDealer) && ['Funded', 'Shipped', 'Delivered'].includes(s),
    resolveDispute:    isArbiter && s === 'Disputed',
    isBuyer, isDealer, isArbiter,
  };
}
