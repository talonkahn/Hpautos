import React, { useEffect, useState, useCallback } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, ShieldCheck, RefreshCw, ExternalLink, Wallet, Gem, Clock, MapPin } from 'lucide-react';
import { toast } from 'sonner';
import { useWallet } from '@/lib/WalletContext';
import * as web3 from '@/lib/web3';
import { syncOrder, allowedActions, getOrderEvents, addOrderEvent, updateOrderRow } from '@/lib/orders';
import { S } from '@/lib/escrowAbi';
import OrderTimeline from './OrderTimeline';

const STATUS_STYLE = {
  Funded: 'bg-blue-100 text-blue-700', Shipped: 'bg-amber-100 text-amber-700', Delivered: 'bg-purple-100 text-purple-700',
  Released: 'bg-emerald-100 text-emerald-700', Refunded: 'bg-slate-200 text-slate-700', Disputed: 'bg-red-100 text-red-700',
  Resolved: 'bg-purple-100 text-purple-700',
};
const fmtDate = (sec) => new Date(sec * 1000).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });

export default function OrderCard({ order: initial, onChanged }) {
  const wallet = useWallet();
  const [order, setOrder] = useState(initial);
  const [chain, setChain] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState('');
  const [panel, setPanel] = useState('');          // which small form is open
  const [f, setF] = useState({ tracking: '', carrier: '', label: '', note: '', reason: '', toDealer: '', sold: true });
  const set = (k, v) => setF((p) => ({ ...p, [k]: v }));

  const refresh = useCallback(async () => {
    try {
      const [{ order: o, chain: c }, ev] = await Promise.all([syncOrder(initial), getOrderEvents(initial.id)]);
      setOrder(o); setChain(c); setEvents(ev);
      onChanged?.(o);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [initial.id]);

  useEffect(() => { setLoading(true); refresh(); }, [refresh]);

  const acts = allowedActions(chain, wallet.address);
  const chainId = order.chain_order_id;

  /** Run one on-chain action, then record it and re-verify against the chain. */
  const run = async (key, fn, ev, patch) => {
    if (!wallet.ctx) { wallet.openModal(); return; }
    if (wallet.wrongChain && !(await wallet.ensureChain())) return;
    setBusy(key);
    try {
      const { hash } = await fn(wallet.ctx);
      await addOrderEvent({ order_id: order.id, actor_wallet: wallet.address, tx_hash: hash, ...ev });
      if (patch) await updateOrderRow(order.id, patch).catch(() => {});
      toast.success(ev.label);
      setPanel('');
      await refresh();
    } catch (e) { toast.error(web3.friendlyError(e)); }
    finally { setBusy(''); }
  };

  const status = chain?.statusLabel;
  const pct = chain && chain.amount ? Math.min(100, (chain.paidOut / chain.amount) * 100) : 0;
  const Btn = ({ k, children, className = '', ...rest }) => (
    <Button disabled={!!busy} {...rest} className={`h-9 text-xs sm:text-sm gap-1.5 ${className}`}>
      {busy === k ? <Loader2 className="w-4 h-4 animate-spin" /> : children}
    </Button>
  );

  return (
    <Card className="overflow-hidden shadow-sm border-slate-200">
      <CardContent className="p-0">
        {/* Header */}
        <div className="flex gap-3 p-4 border-b border-slate-100">
          <img src={order.car_image || 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=200'} alt=""
            className="w-20 h-16 sm:w-24 sm:h-18 object-cover rounded-lg shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 flex-wrap">
              <h3 className="font-bold text-slate-900 text-sm sm:text-base leading-tight">{order.car_title}</h3>
              {loading ? <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
                : <Badge className={`${STATUS_STYLE[status] || 'bg-slate-100 text-slate-600'} border-0`}>{status || order.status}</Badge>}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">Order #{chainId} · {new Date(order.created_at).toLocaleDateString()}</p>
            {(order.delivery_city || order.delivery_country) && (
              <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5"><MapPin className="w-3 h-3" />Deliver to {[order.delivery_city, order.delivery_country].filter(Boolean).join(', ')}</p>
            )}
          </div>
        </div>

        {/* Money bar */}
        <div className="px-4 pt-4">
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="bg-slate-50 rounded-lg p-2"><p className="text-[10px] text-slate-500">Order total</p><p className="font-bold text-sm text-slate-900">{web3.fmtUsd(chain?.amount ?? order.amount_usd)}</p></div>
            <div className="bg-emerald-50 rounded-lg p-2"><p className="text-[10px] text-emerald-700">Released</p><p className="font-bold text-sm text-emerald-700">{web3.fmtUsd(chain?.paidOut ?? order.released_usdc)}</p></div>
            <div className="bg-blue-50 rounded-lg p-2"><p className="text-[10px] text-blue-700">Held in escrow</p><p className="font-bold text-sm text-blue-700">{web3.fmtUsd(chain?.remaining ?? 0)}</p></div>
          </div>
          <div className="h-1.5 bg-slate-100 rounded-full mt-3 overflow-hidden"><div className="h-full bg-emerald-500 transition-all" style={{ width: `${pct}%` }} /></div>

          {chain && status === 'Funded' && (
            <p className="text-[11px] text-slate-500 mt-2 flex items-center gap-1"><Clock className="w-3 h-3" />Dealer must ship by {fmtDate(chain.shipDeadline)}, otherwise the buyer can claim a full refund.</p>
          )}
          {chain && status === 'Delivered' && (
            <p className="text-[11px] text-slate-500 mt-2 flex items-center gap-1"><Clock className="w-3 h-3" />Funds auto-release on {fmtDate(chain.deliveredAt + chain.autoReleaseWindow)} unless the buyer confirms or disputes.</p>
          )}
        </div>

        {/* Verified-on-chain strip */}
        <div className="px-4 mt-3 flex items-center justify-between gap-2 flex-wrap">
          <span className="text-[11px] text-emerald-700 flex items-center gap-1"><ShieldCheck className="w-3.5 h-3.5" />{chain ? 'Status verified on-chain' : 'Verifying on-chain…'}</span>
          <div className="flex items-center gap-3">
            {order.create_tx && <a href={web3.explorerTx(order.create_tx)} target="_blank" rel="noopener noreferrer" className="text-[11px] text-blue-600 hover:underline inline-flex items-center gap-1">Escrow tx <ExternalLink className="w-3 h-3" /></a>}
            {chainId && ['Released', 'Resolved'].includes(status) && <a href={web3.explorerNft(chainId)} target="_blank" rel="noopener noreferrer" className="text-[11px] text-purple-600 hover:underline inline-flex items-center gap-1"><Gem className="w-3 h-3" />Vehicle Passport NFT</a>}
            <button onClick={() => { setLoading(true); refresh(); }} className="text-slate-400 hover:text-slate-700" title="Re-verify on-chain"><RefreshCw className="w-3.5 h-3.5" /></button>
          </div>
        </div>

        {/* Timeline */}
        <div className="p-4"><OrderTimeline order={order} chain={chain} events={events} /></div>

        {/* Actions */}
        {chain && (
          <div className="px-4 pb-4 space-y-3">
            {!wallet.isConnected && (
              <Button onClick={wallet.openModal} variant="outline" className="w-full gap-2 border-amber-300 text-amber-700"><Wallet className="w-4 h-4" />Connect wallet to take actions</Button>
            )}

            <div className="flex flex-wrap gap-2">
              {acts.confirmDelivery && <Btn k="confirm" className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => run('confirm', (c) => web3.confirmDelivery(c, chainId), { type: 'released', label: 'Delivery confirmed — funds released', note: 'Buyer confirmed receipt' })}>✓ Confirm delivery & release funds</Btn>}
              {acts.markShipped && <Btn k="ship-open" variant="outline" onClick={() => setPanel(panel === 'ship' ? '' : 'ship')}>🚢 Post shipping proof</Btn>}
              {acts.postMilestone && <Btn k="ms-open" variant="outline" onClick={() => setPanel(panel === 'ms' ? '' : 'ms')}>📍 Add milestone</Btn>}
              {acts.markDelivered && <Btn k="deliv" variant="outline" onClick={() => run('deliv', (c) => web3.markDelivered(c, chainId), { type: 'delivered', label: 'Delivery declared', note: 'Buyer confirmation window started' })}>📦 Mark delivered</Btn>}
              {acts.autoRelease && <Btn k="auto" className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => run('auto', (c) => web3.autoRelease(c, chainId), { type: 'released', label: 'Auto-released to dealer', note: 'Confirmation window passed' })}>Release funds (window passed)</Btn>}
              {acts.refund && <Btn k="refund" className="bg-blue-600 hover:bg-blue-700 text-white" onClick={() => run('refund', (c) => web3.refundIfNotShipped(c, chainId), { type: 'refunded', label: 'Refunded to buyer', note: 'Shipping deadline missed' })}>↩ Claim full refund</Btn>}
              {acts.raiseDispute && <Btn k="disp-open" variant="outline" className="border-red-200 text-red-600 hover:bg-red-50" onClick={() => setPanel(panel === 'disp' ? '' : 'disp')}>⚠ Raise dispute</Btn>}
              {acts.resolveDispute && <Btn k="res-open" className="bg-purple-600 hover:bg-purple-700 text-white" onClick={() => setPanel(panel === 'res' ? '' : 'res')}>⚖ Resolve dispute</Btn>}
            </div>

            {panel === 'ship' && (
              <div className="bg-slate-50 rounded-xl p-3 space-y-2">
                <Label className="text-xs">Tracking number / Bill of Lading *</Label>
                <Input value={f.tracking} onChange={(e) => set('tracking', e.target.value)} placeholder="e.g. MAEU123456789" />
                <Label className="text-xs">Carrier / vessel</Label>
                <Input value={f.carrier} onChange={(e) => set('carrier', e.target.value)} placeholder="e.g. Maersk RoRo — MV Atlantic" />
                <p className="text-[11px] text-slate-500">Posting proof releases the first {((chain.shipBps) / 100).toFixed(0)}% of the order to you (minus platform fee) to cover freight.</p>
                <Btn k="ship" className="w-full bg-amber-500 hover:bg-amber-600 text-white" onClick={() => {
                  if (!f.tracking.trim()) return toast.error('Enter the tracking number or B/L');
                  run('ship', (c) => web3.markShipped(c, chainId, f.tracking.trim()),
                    { type: 'shipped', label: 'Vehicle shipped', note: `${f.tracking.trim()}${f.carrier ? ` · ${f.carrier}` : ''}` },
                    { tracking_ref: f.tracking.trim(), carrier: f.carrier.trim() || null });
                }}>Confirm shipment on-chain</Btn>
              </div>
            )}

            {panel === 'ms' && (
              <div className="bg-slate-50 rounded-xl p-3 space-y-2">
                <Label className="text-xs">Milestone *</Label>
                <Input value={f.label} onChange={(e) => set('label', e.target.value)} placeholder="e.g. Departed Houston port" />
                <Label className="text-xs">Details</Label>
                <Input value={f.note} onChange={(e) => set('note', e.target.value)} placeholder="Vessel, ETA, customs reference…" />
                <Btn k="ms" className="w-full bg-amber-500 hover:bg-amber-600 text-white" onClick={() => {
                  if (!f.label.trim()) return toast.error('Enter a milestone');
                  run('ms', (c) => web3.postMilestone(c, chainId, f.label.trim(), f.note.trim()), { type: 'milestone', label: f.label.trim(), note: f.note.trim() });
                }}>Post milestone</Btn>
              </div>
            )}

            {panel === 'disp' && (
              <div className="bg-red-50 rounded-xl p-3 space-y-2">
                <Label className="text-xs">What went wrong? *</Label>
                <Textarea rows={2} value={f.reason} onChange={(e) => set('reason', e.target.value)} placeholder="Describe the issue — the arbiter will review it." />
                <p className="text-[11px] text-red-700">This freezes the remaining ${chain.remaining.toLocaleString()} until the arbiter resolves it.</p>
                <Btn k="disp" className="w-full bg-red-600 hover:bg-red-700 text-white" onClick={() => {
                  if (!f.reason.trim()) return toast.error('Describe the issue');
                  run('disp', (c) => web3.raiseDispute(c, chainId, f.reason.trim()), { type: 'disputed', label: 'Dispute raised', note: f.reason.trim() });
                }}>Freeze funds & raise dispute</Btn>
              </div>
            )}

            {panel === 'res' && (
              <div className="bg-purple-50 rounded-xl p-3 space-y-2">
                <Label className="text-xs">Amount to dealer (USD) — max {chain.remaining.toLocaleString()}</Label>
                <Input type="number" min="0" max={chain.remaining} value={f.toDealer} onChange={(e) => set('toDealer', e.target.value)} placeholder="0" />
                <p className="text-[11px] text-purple-700">Buyer receives the rest: {web3.fmtUsd(Math.max(0, chain.remaining - Number(f.toDealer || 0)))}</p>
                <label className="flex items-center gap-2 text-xs text-slate-700">
                  <input type="checkbox" checked={f.sold} onChange={(e) => set('sold', e.target.checked)} />
                  Sale completed (Vehicle Passport NFT goes to buyer). Untick if the sale failed (NFT burned).
                </label>
                <Btn k="res" className="w-full bg-purple-600 hover:bg-purple-700 text-white" onClick={() => {
                  const v = Number(f.toDealer || 0);
                  if (v < 0 || v > chain.remaining) return toast.error('Amount must be between 0 and the held balance');
                  run('res', (c) => web3.resolveDispute(c, chainId, v, f.sold),
                    { type: 'resolved', label: 'Dispute resolved', note: `Dealer ${web3.fmtUsd(v)} · Buyer ${web3.fmtUsd(chain.remaining - v)} · ${f.sold ? 'sale completed' : 'sale cancelled'}` });
                }}>Resolve on-chain</Btn>
              </div>
            )}

            {wallet.isConnected && !acts.isBuyer && !acts.isDealer && !acts.isArbiter && (
              <p className="text-[11px] text-slate-400">The connected wallet ({wallet.shortAddress}) is not a party to this order, so no actions are available.</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
