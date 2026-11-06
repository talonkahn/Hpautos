import React, { useEffect, useState } from 'react';
import { getAllOrders } from '@/lib/orders';
import { fmtUsd, WEB3, sameAddr, shortAddr } from '@/lib/web3';
import { useWallet } from '@/lib/WalletContext';
import OrderCard from './OrderCard';
import WalletButton from '@/components/WalletButton';
import { Loader2, Scale, ShieldAlert } from 'lucide-react';

const FILTERS = [['all', 'All'], ['disputed', 'Disputed'], ['open', 'Open'], ['done', 'Completed']];

export default function AdminEscrowPanel() {
  const wallet = useWallet();
  const [orders, setOrders] = useState(null);
  const [filter, setFilter] = useState('all');

  useEffect(() => { getAllOrders().then(setOrders).catch(() => setOrders([])); }, []);

  const rows = orders || [];
  const isOpen = (s) => ['funded', 'shipped', 'delivered'].includes(s);
  const shown = rows.filter((o) => filter === 'all' ? true : filter === 'disputed' ? o.status === 'disputed' : filter === 'open' ? isOpen(o.status) : ['released', 'refunded', 'resolved'].includes(o.status));
  const totalLocked = rows.filter((o) => isOpen(o.status) || o.status === 'disputed').reduce((s, o) => s + Math.max(0, Number(o.amount_usd || 0) - Number(o.released_usdc || 0)), 0);
  const disputes = rows.filter((o) => o.status === 'disputed').length;
  const arbiterOk = WEB3.arbiter && sameAddr(wallet.address, WEB3.arbiter);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white border rounded-xl p-3"><p className="text-xs text-slate-500">Escrow orders</p><p className="text-xl font-bold">{rows.length}</p></div>
        <div className="bg-white border rounded-xl p-3"><p className="text-xs text-slate-500">Funds held</p><p className="text-xl font-bold text-blue-600">{fmtUsd(totalLocked)}</p></div>
        <div className="bg-white border rounded-xl p-3"><p className="text-xs text-slate-500">Open disputes</p><p className={`text-xl font-bold ${disputes ? 'text-red-600' : ''}`}>{disputes}</p></div>
        <div className="bg-white border rounded-xl p-3 flex flex-col justify-between gap-2"><p className="text-xs text-slate-500">Arbiter wallet</p><WalletButton className="w-full justify-center" /></div>
      </div>

      {WEB3.arbiter && (
        <div className={`rounded-xl p-3 text-xs flex gap-2 ${arbiterOk ? 'bg-emerald-50 border border-emerald-200 text-emerald-800' : 'bg-amber-50 border border-amber-200 text-amber-800'}`}>
          {arbiterOk ? <Scale className="w-4 h-4 shrink-0" /> : <ShieldAlert className="w-4 h-4 shrink-0" />}
          {arbiterOk ? 'Arbiter wallet connected — you can resolve disputes and post milestones.' : `Connect the arbiter wallet (${shortAddr(WEB3.arbiter)}) to resolve disputes. Any other wallet can only view.`}
        </div>
      )}

      <div className="flex gap-2 flex-wrap">
        {FILTERS.map(([k, label]) => (
          <button key={k} onClick={() => setFilter(k)} className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${filter === k ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 hover:border-slate-400'}`}>{label}</button>
        ))}
      </div>

      {orders === null ? <div className="flex justify-center py-12"><Loader2 className="w-7 h-7 animate-spin text-amber-500" /></div>
        : shown.length === 0 ? <p className="text-center text-slate-500 py-12 text-sm">No orders in this view.</p>
        : <div className="grid lg:grid-cols-2 gap-4">{shown.map((o) => <OrderCard key={o.id} order={o} />)}</div>}
    </div>
  );
}
