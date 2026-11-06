import React, { useEffect, useState, useRef } from 'react';
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, Copy, Check, CheckCircle2, Clock, AlertTriangle, Zap } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { toast } from 'sonner';
import { useAuth } from '@/lib/AuthContext';
import AuthModal from '@/components/AuthModal';
import TestModeBanner from './TestModeBanner';
import { roqqu, useRoqquHealth } from '@/lib/roqquClient';
import { ADMIN_WHATSAPP } from '@/lib/supabase';
import { carPriceUSD } from '@/lib/pricing';

const COINS = [
  { id: 'USDT_TRC20', label: 'USDT', sub: 'Tron (TRC-20)', color: '#26A17B', icon: '₮' },
  { id: 'USDT_ERC20', label: 'USDT', sub: 'Ethereum (ERC-20)', color: '#26A17B', icon: '₮' },
  { id: 'ETH', label: 'ETH', sub: 'Ethereum', color: '#627EEA', icon: 'Ξ' },
  { id: 'BTC', label: 'BTC', sub: 'Bitcoin', color: '#F7931A', icon: '₿' },
  { id: 'SOL', label: 'SOL', sub: 'Solana', color: '#9945FF', icon: '◎' },
];

const useCountdown = (iso) => {
  const [left, setLeft] = useState(0);
  useEffect(() => {
    if (!iso) return;
    const tick = () => setLeft(Math.max(0, Math.floor((new Date(iso) - Date.now()) / 1000)));
    tick(); const t = setInterval(tick, 1000); return () => clearInterval(t);
  }, [iso]);
  return `${String(Math.floor(left / 60)).padStart(2, '0')}:${String(left % 60).padStart(2, '0')}`;
};

export default function RoqquCheckoutModal({ open, onClose, car }) {
  const { isAuthenticated } = useAuth();
  const health = useRoqquHealth();
  const [asset, setAsset] = useState('USDT_TRC20');
  const [payment, setPayment] = useState(null);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState('');
  const [showAuth, setShowAuth] = useState(false);
  const poll = useRef(null);
  const countdown = useCountdown(payment?.expires_at);

  useEffect(() => { if (open) { setPayment(null); setCopied(''); } }, [open]);

  // Poll the server for confirmation while we wait for the deposit
  useEffect(() => {
    clearInterval(poll.current);
    if (!payment || payment.status !== 'awaiting_payment') return;
    poll.current = setInterval(async () => {
      try { const p = await roqqu('payment_status', { id: payment.id }); if (p.status !== payment.status) setPayment(p); } catch { /* keep trying */ }
    }, 4000);
    return () => clearInterval(poll.current);
  }, [payment?.id, payment?.status]);

  const start = async () => {
    if (!isAuthenticated) { setShowAuth(true); return; }
    setBusy(true);
    try { setPayment(await roqqu('create_payment', { carId: car.id, asset })); }
    catch (e) { toast.error(e.message); }
    finally { setBusy(false); }
  };

  const copy = (key, text) => { navigator.clipboard.writeText(text).then(() => { setCopied(key); setTimeout(() => setCopied(''), 2000); }); };

  const simulate = async () => {
    setBusy(true);
    try { setPayment(await roqqu('mock_confirm', { kind: 'payment', id: payment.id })); }
    catch (e) { toast.error(e.message); }
    finally { setBusy(false); }
  };

  const notifyAdmin = () => {
    const msg = `✅ *Crypto payment confirmed — HP-Autos*\n\n*Car:* ${payment.car_title}\n*Paid:* ${payment.amount_crypto} ${payment.asset.replace('_', ' ')} (≈ $${Number(payment.amount_usd).toLocaleString()})\n*Ref:* ${payment.roqqu_ref}\n\n_Please arrange delivery._`;
    window.open(`https://wa.me/${ADMIN_WHATSAPP}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  if (!car) return null;
  const coin = COINS.find((c) => c.id === (payment?.asset || asset));
  const status = payment?.status;
  const isMock = health?.mode === 'mock';

  return (
    <>
      <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
        <DialogContent className="w-[95vw] sm:w-full max-w-md rounded-2xl max-h-[92vh] overflow-y-auto p-0">
          <div className="bg-gradient-to-r from-indigo-700 to-indigo-900 px-6 py-4">
            <DialogTitle className="text-white text-lg font-bold flex items-center gap-2"><Zap className="w-5 h-5 text-yellow-300" />Pay with Crypto — auto-confirmed</DialogTitle>
            <p className="text-indigo-200 text-xs mt-0.5 truncate">{car.title}</p>
          </div>

          <div className="p-5 space-y-4">
            <TestModeBanner />

            {!payment && (
              <>
                <div className="bg-slate-50 rounded-xl p-4 flex items-baseline justify-between">
                  <span className="text-sm text-slate-600">Amount due</span>
                  <span className="text-2xl font-bold text-slate-900">${carPriceUSD(car).toLocaleString()}</span>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500 mb-2">Choose a coin</p>
                  <div className="grid grid-cols-2 gap-2">
                    {COINS.map((c) => (
                      <button key={c.id} onClick={() => setAsset(c.id)}
                        className={`flex items-center gap-2 p-2.5 rounded-xl border-2 text-left transition-all ${asset === c.id ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200 hover:border-slate-300'}`}>
                        <span className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold shrink-0" style={{ background: c.color }}>{c.icon}</span>
                        <span><span className="block text-sm font-bold text-slate-900 leading-none">{c.label}</span><span className="block text-[10px] text-slate-500 mt-0.5">{c.sub}</span></span>
                      </button>
                    ))}
                  </div>
                </div>
                <p className="text-xs text-slate-500">We generate a unique deposit address for this order. Your payment is detected and confirmed automatically — no transaction hash to paste.</p>
                <Button onClick={start} disabled={busy} className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-white font-bold">
                  {busy ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Get my deposit address →'}
                </Button>
              </>
            )}

            {payment && status === 'awaiting_payment' && (
              <div className="space-y-4">
                <div className="rounded-2xl p-4 text-center" style={{ background: `${coin.color}15`, border: `1px solid ${coin.color}40` }}>
                  <p className="text-xs text-slate-500">Send exactly</p>
                  <p className="text-3xl font-bold mt-0.5" style={{ color: coin.color }}>{payment.amount_crypto} {coin.label}</p>
                  <p className="text-xs text-slate-500 mt-1">≈ ${Number(payment.amount_usd).toLocaleString()} · on <b>{payment.network}</b></p>
                </div>
                <div className="flex justify-center"><div className="bg-white p-3 rounded-2xl shadow border"><QRCodeSVG value={payment.deposit_address} size={150} level="M" /></div></div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">Deposit address (unique to this order)</p>
                  <div className="flex gap-2">
                    <div className="flex-1 bg-slate-50 border rounded-xl px-3 py-2.5 font-mono text-xs break-all text-slate-700">{payment.deposit_address}</div>
                    <button onClick={() => copy('addr', payment.deposit_address)} className={`w-10 h-10 shrink-0 rounded-xl flex items-center justify-center ${copied === 'addr' ? 'bg-green-500 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-600'}`}>
                      {copied === 'addr' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs bg-slate-50 rounded-xl px-3 py-2.5">
                  <span className="flex items-center gap-1.5 text-slate-600"><Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-500" />Waiting for your payment…</span>
                  <span className="flex items-center gap-1 font-mono font-semibold text-slate-700"><Clock className="w-3.5 h-3.5" />{countdown}</span>
                </div>
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-[11px] text-amber-800 flex gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />Send only {coin.label} on {payment.network}. Funds sent on a different network, or after the timer ends, can be lost.
                </div>
                {isMock && <Button onClick={simulate} disabled={busy} variant="outline" className="w-full border-dashed border-amber-400 text-amber-700 hover:bg-amber-50">{busy ? <Loader2 className="w-4 h-4 animate-spin" /> : '🧪 Simulate payment (test mode)'}</Button>}
              </div>
            )}

            {payment && status === 'confirmed' && (
              <div className="text-center space-y-4 py-2">
                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto"><CheckCircle2 className="w-9 h-9 text-emerald-600" /></div>
                <div><h3 className="text-xl font-bold text-slate-900">Payment confirmed</h3><p className="text-sm text-slate-600 mt-1">We detected your deposit automatically. Reference <span className="font-mono">{payment.roqqu_ref}</span></p></div>
                <Button onClick={notifyAdmin} className="w-full h-11 bg-green-500 hover:bg-green-600 text-white font-semibold">Notify admin on WhatsApp to arrange delivery</Button>
                <Button onClick={onClose} variant="outline" className="w-full h-11">Done</Button>
              </div>
            )}

            {payment && (status === 'expired' || status === 'failed') && (
              <div className="text-center space-y-3 py-2">
                <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto" />
                <p className="font-semibold text-slate-900">{status === 'expired' ? 'This deposit address expired' : 'Payment failed'}</p>
                <p className="text-sm text-slate-500">If you already sent funds, WhatsApp admin with reference <span className="font-mono">{payment.roqqu_ref}</span>.</p>
                <Button onClick={() => setPayment(null)} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white">Start again</Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
      <AuthModal open={showAuth} onClose={() => setShowAuth(false)} defaultTab="register" redirectMessage="Create a free account to pay with crypto" />
    </>
  );
}
