import React, { useEffect, useState } from 'react';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, BadgeCheck, Zap, Banknote } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { roqqu, useRoqquHealth } from '@/lib/roqquClient';
import TestModeBanner from './TestModeBanner';

const TONE = { confirmed: 'bg-emerald-100 text-emerald-700', paid: 'bg-emerald-100 text-emerald-700', verified: 'bg-emerald-100 text-emerald-700',
  awaiting_payment: 'bg-amber-100 text-amber-700', awaiting_deposit: 'bg-amber-100 text-amber-700', rejected: 'bg-red-100 text-red-700',
  expired: 'bg-slate-200 text-slate-600', failed: 'bg-red-100 text-red-700' };
const Pill = ({ s }) => <Badge className={`${TONE[s] || 'bg-slate-100 text-slate-600'} border-0 text-[10px]`}>{s?.replace('_', ' ')}</Badge>;
const ago = (iso) => new Date(iso).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

export default function AdminRoqquPanel() {
  const health = useRoqquHealth();
  const [rows, setRows] = useState(null);
  const [busy, setBusy] = useState('');

  const load = async () => {
    const [p, o, d] = await Promise.all([
      supabase.from('crypto_payments').select('*').order('created_at', { ascending: false }).limit(50),
      supabase.from('payouts').select('*').order('created_at', { ascending: false }).limit(50),
      supabase.from('dealer_profiles').select('*').order('created_at', { ascending: false }).limit(50),
    ]);
    setRows({ payments: p.data || [], payouts: o.data || [], dealers: d.data || [] });
  };
  useEffect(() => { load(); }, []);

  const confirm = async (kind, id) => {
    setBusy(id);
    try { await roqqu('mock_confirm', { kind, id }); toast.success('Marked as complete (test mode)'); await load(); }
    catch (e) { toast.error(e.message); } finally { setBusy(''); }
  };

  if (!rows) return <div className="flex justify-center py-12"><Loader2 className="w-7 h-7 animate-spin text-amber-500" /></div>;
  const isMock = health?.mode === 'mock';

  return (
    <div className="space-y-6">
      <TestModeBanner />
      {health && health.mode !== 'unreachable' && !health.serviceRole && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-xs text-red-700">SUPABASE_SERVICE_ROLE_KEY is not set on the server, so payments, cash-outs and dealer verification cannot be saved. Add it (without a VITE_ prefix) and restart.</div>
      )}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white border rounded-xl p-3"><p className="text-xs text-slate-500">Crypto payments</p><p className="text-xl font-bold">{rows.payments.length}</p></div>
        <div className="bg-white border rounded-xl p-3"><p className="text-xs text-slate-500">Cash-outs</p><p className="text-xl font-bold">{rows.payouts.length}</p></div>
        <div className="bg-white border rounded-xl p-3"><p className="text-xs text-slate-500">Verified dealers</p><p className="text-xl font-bold text-emerald-600">{rows.dealers.filter((d) => d.status === 'verified').length}</p></div>
      </div>

      <section>
        <h3 className="font-semibold text-slate-900 flex items-center gap-2 mb-2"><Zap className="w-4 h-4 text-indigo-500" />Crypto payments</h3>
        <div className="space-y-2">
          {rows.payments.length === 0 && <p className="text-sm text-slate-400">None yet.</p>}
          {rows.payments.map((p) => (
            <div key={p.id} className="bg-white border rounded-xl p-3 flex items-center justify-between gap-3 flex-wrap text-sm">
              <div className="min-w-0"><p className="font-medium truncate">{p.car_title}</p><p className="text-xs text-slate-500">{p.amount_crypto} {p.asset?.replace('_', ' ')} · ${Number(p.amount_usd).toLocaleString()} · {ago(p.created_at)}</p></div>
              <div className="flex items-center gap-2"><Pill s={p.status} />{isMock && p.status === 'awaiting_payment' && <Button size="sm" variant="outline" disabled={busy === p.id} onClick={() => confirm('payment', p.id)} className="h-7 text-xs">Confirm</Button>}</div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h3 className="font-semibold text-slate-900 flex items-center gap-2 mb-2"><Banknote className="w-4 h-4 text-emerald-500" />Dealer cash-outs</h3>
        <div className="space-y-2">
          {rows.payouts.length === 0 && <p className="text-sm text-slate-400">None yet.</p>}
          {rows.payouts.map((p) => (
            <div key={p.id} className="bg-white border rounded-xl p-3 flex items-center justify-between gap-3 flex-wrap text-sm">
              <div><p className="font-medium">${Number(p.amount_usdc).toLocaleString()} → ₦{Number(p.amount_ngn).toLocaleString()}</p><p className="text-xs text-slate-500">{p.bank_name} ****{p.account_last4} · {ago(p.created_at)}</p></div>
              <div className="flex items-center gap-2"><Pill s={p.status} />{isMock && p.status === 'awaiting_deposit' && <Button size="sm" variant="outline" disabled={busy === p.id} onClick={() => confirm('cashout', p.id)} className="h-7 text-xs">Mark paid</Button>}</div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h3 className="font-semibold text-slate-900 flex items-center gap-2 mb-2"><BadgeCheck className="w-4 h-4 text-emerald-500" />Dealer verification</h3>
        <div className="space-y-2">
          {rows.dealers.length === 0 && <p className="text-sm text-slate-400">None yet.</p>}
          {rows.dealers.map((d) => (
            <div key={d.id} className="bg-white border rounded-xl p-3 flex items-center justify-between gap-3 flex-wrap text-sm">
              <div><p className="font-medium">{d.business_name}</p><p className="text-xs text-slate-500">{d.bank_name} ****{d.account_number?.slice(-4)} · {[d.bvn_verified && 'BVN ✓', d.nin_verified && 'NIN ✓'].filter(Boolean).join(' ') || 'no ID verified'}</p>{d.reject_reason && <p className="text-xs text-red-600">{d.reject_reason}</p>}</div>
              <Pill s={d.status} />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
