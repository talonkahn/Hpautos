import React from 'react';
import { Check, Lock, Truck, Ship, PackageCheck, Banknote, Undo2, Scale, ExternalLink } from 'lucide-react';
import { explorerTx } from '@/lib/web3';
import { S } from '@/lib/escrowAbi';

const fmtTime = (iso) => iso ? new Date(iso).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '';

const TxLink = ({ hash }) => hash ? (
  <a href={explorerTx(hash)} target="_blank" rel="noopener noreferrer"
    className="inline-flex items-center gap-1 text-[11px] text-blue-600 hover:underline font-mono">
    {hash.slice(0, 8)}…{hash.slice(-4)} <ExternalLink className="w-3 h-3" />
  </a>
) : null;

/**
 * Props:
 *  - order:  DB row (amount_usd, tracking_ref, carrier ...)
 *  - chain:  result of readOrder() — the source of truth for progress (may be null while loading)
 *  - events: rows from order_events (carry tx hashes and notes)
 */
export default function OrderTimeline({ order, chain, events = [] }) {
  const by = (type) => events.filter((e) => e.type === type);
  const first = (type) => by(type)[0];
  const milestones = by('milestone');

  // Progress level: trust the chain, fall back to recorded events.
  const eventLevel = first('released') ? 4 : first('delivered') ? 3 : first('shipped') ? 2 : 1;
  const chainLevel = chain
    ? ({ [S.FUNDED]: 1, [S.SHIPPED]: 2, [S.DELIVERED]: 3, [S.RELEASED]: 4 }[chain.status] ?? eventLevel)
    : eventLevel;

  const refunded = chain?.status === S.REFUNDED || !!first('refunded');
  const disputed = chain?.status === S.DISPUTED;
  const resolved = chain?.status === S.RESOLVED || !!first('resolved');
  const level = refunded ? 1 : chainLevel;

  const steps = [
    {
      key: 'funded', icon: Lock, need: 1,
      title: 'Funds locked in escrow',
      body: `$${Number(order.amount_usd || 0).toLocaleString()} USDC held by the smart contract`,
      ev: first('funded'),
    },
    {
      key: 'shipped', icon: Ship, need: 2,
      title: 'Dealer shipped the vehicle',
      body: order.tracking_ref ? `Tracking / B/L: ${order.tracking_ref}${order.carrier ? ` · ${order.carrier}` : ''}` : 'Waiting for the dealer to post shipping proof',
      ev: first('shipped'),
    },
    {
      key: 'transit', icon: Truck, need: 3, currentAt: 2,
      title: 'In transit',
      body: milestones.length ? null : 'Milestones appear here as the dealer posts updates',
      ev: null, milestones,
    },
    {
      key: 'delivered', icon: PackageCheck, need: 3, currentAt: -1,
      title: 'Delivery declared',
      body: 'Buyer confirms receipt, or funds release automatically after the confirmation window',
      ev: first('delivered'),
    },
    {
      key: 'released', icon: Banknote, need: 4,
      title: 'Funds released to dealer',
      body: 'Sale complete — Vehicle Passport NFT transferred to the buyer',
      ev: first('released'),
    },
  ];

  return (
    <div>
      {disputed && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-xl p-3 flex gap-2">
          <Scale className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
          <p className="text-xs text-red-700"><b>Dispute open.</b> Remaining funds are frozen until the arbiter resolves the case.{first('disputed')?.note ? ` Reason: “${first('disputed').note}”` : ''}</p>
        </div>
      )}
      {resolved && (
        <div className="mb-4 bg-purple-50 border border-purple-200 rounded-xl p-3 flex gap-2">
          <Scale className="w-4 h-4 text-purple-500 shrink-0 mt-0.5" />
          <p className="text-xs text-purple-700"><b>Dispute resolved by arbiter.</b> {first('resolved')?.note || 'Funds were split on-chain.'}</p>
        </div>
      )}

      <ol className="relative">
        {steps.map((st, i) => {
          const done = level >= st.need && !(st.key === 'transit' && level < 3);
          const current = !done && !refunded && !disputed && !resolved && level === (st.currentAt ?? st.need - 1);
          const Icon = st.icon;
          const last = i === steps.length - 1 && !refunded;
          return (
            <li key={st.key} className="flex gap-3 pb-5 last:pb-0 relative">
              {!last && <span className={`absolute left-[15px] top-8 bottom-0 w-0.5 ${done ? 'bg-emerald-300' : 'bg-slate-200'}`} />}
              <div className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center shrink-0 border-2 transition-all
                ${done ? 'bg-emerald-500 border-emerald-500 text-white' : current ? 'bg-amber-50 border-amber-500 text-amber-600 animate-pulse' : 'bg-white border-slate-200 text-slate-300'}`}>
                {done ? <Check className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
              </div>
              <div className="flex-1 min-w-0 pt-0.5">
                <p className={`text-sm font-semibold ${done || current ? 'text-slate-900' : 'text-slate-400'}`}>{st.title}</p>
                {st.body && <p className={`text-xs mt-0.5 ${done || current ? 'text-slate-600' : 'text-slate-400'}`}>{st.body}</p>}
                {st.milestones?.map((m) => (
                  <div key={m.id} className="mt-1.5 pl-2 border-l-2 border-emerald-200">
                    <p className="text-xs font-medium text-slate-800">{m.label}</p>
                    {m.note && <p className="text-[11px] text-slate-500">{m.note}</p>}
                    <p className="text-[10px] text-slate-400 flex items-center gap-2 flex-wrap">{fmtTime(m.created_at)} <TxLink hash={m.tx_hash} /></p>
                  </div>
                ))}
                {st.ev && (
                  <p className="text-[10px] text-slate-400 mt-1 flex items-center gap-2 flex-wrap">
                    {fmtTime(st.ev.created_at)} <TxLink hash={st.ev.tx_hash} />
                  </p>
                )}
              </div>
            </li>
          );
        })}
        {refunded && (
          <li className="flex gap-3 relative">
            <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 bg-blue-500 border-2 border-blue-500 text-white"><Undo2 className="w-4 h-4" /></div>
            <div className="pt-0.5">
              <p className="text-sm font-semibold text-slate-900">Refunded to buyer</p>
              <p className="text-xs text-slate-600">The dealer missed the shipping deadline, so the full amount returned to the buyer's wallet.</p>
              {first('refunded') && <p className="text-[10px] text-slate-400 mt-1 flex gap-2">{fmtTime(first('refunded').created_at)} <TxLink hash={first('refunded').tx_hash} /></p>}
            </div>
          </li>
        )}
      </ol>
    </div>
  );
}
