import React, { useEffect, useRef, useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loader2, Banknote, Copy, Check, CheckCircle2, ArrowRight, AlertTriangle, Landmark } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { toast } from 'sonner';
import { useAuth } from '@/lib/AuthContext';
import { useWallet } from '@/lib/WalletContext';
import { roqqu, useRoqquHealth, getMyPayouts } from '@/lib/roqquClient';
import { readUsdcBalance, fmtUsd, isEscrowConfigured } from '@/lib/web3';

const ngn = (n) => `₦${Number(n || 0).toLocaleString()}`;
const STATUS = { awaiting_deposit: ['Awaiting deposit', 'bg-amber-100 text-amber-700'], paid: ['Paid to bank', 'bg-emerald-100 text-emerald-700'], failed: ['Failed', 'bg-red-100 text-red-700'] };

export default function DealerCashout({ profile }) {
  const { user } = useAuth();
  const wallet = useWallet();
  const health = useRoqquHealth();
  const [amount, setAmount] = useState('');
  const [quote, setQuote] = useState(null);
  const [payout, setPayout] = useState(null);
  const [balance, setBalance] = useState(null);
  const [history, setHistory] = useState([]);
  const [busy, setBusy] = useState('');
  const [copied, setCopied] = useState(false);
  const poll = useRef(null);

  const loadHistory = () => user && getMyPayouts(user.id).then(setHistory);
  useEffect(() => { loadHistory(); }, [user, payout?.status]);
  useEffect(() => {
    if (!wallet.address || !isEscrowConfigured || wallet.wrongChain) { setBalance(null); return; }
    readUsdcBalance(wallet.address).then(setBalance).catch(() => setBalance(null));
  }, [wallet.address, wallet.chainId]);

  // keep polling while we wait for the deposit to land
  useEffect(() => {
    clearInterval(poll.current);
    if (!payout || payout.status !== 'awaiting_deposit') return;
    poll.current = setInterval(async () => {
      try { const p = await roqqu('cashout_status', { id: payout.id }); if (p.status !== payout.status) setPayout(p); } catch { /* retry */ }
    }, 5000);
    return () => clearInterval(poll.current);
  }, [payout?.id, payout?.status]);

  const amt = Number(amount);
  const validAmt = amt >= 10 && amt <= 50000;
  const walletMismatch = wallet.address && profile?.wallet_address && wallet.address.toLowerCase() !== profile.wallet_address;

  const getQuote = async () => {
    if (!validAmt) return toast.error('Enter an amount between $10 and $50,000');
    setBusy('quote');
    try { setQuote(await roqqu('quote_cashout', { amountUsdc: amt })); } catch (e) { toast.error(e.message); } finally { setBusy(''); }
  };
  const start = async () => {
    if (!wallet.address) return wallet.openModal();
    setBusy('start');
    try { setPayout(await roqqu('create_cashout', { amountUsdc: amt, walletAddress: wallet.address })); setQuote(null); }
    catch (e) { toast.error(e.message); } finally { setBusy(''); }
  };
  const simulate = async () => {
    setBusy('sim');
    try { setPayout(await roqqu('mock_confirm', { kind: 'cashout', id: payout.id })); } catch (e) { toast.error(e.message); } finally { setBusy(''); }
  };

  if (profile?.status !== 'verified') return (
    <Card className="border-dashed"><CardContent className="p-4 text-sm text-slate-500 flex items-center gap-2"><Banknote className="w-5 h-5 text-slate-400" />Verify your dealership above to unlock naira cash-out.</CardContent></Card>
  );

  return (
    <Card className="border-slate-200">
      <CardContent className="p-4 sm:p-5 space-y-4">
        <div>
          <h3 className="font-bold text-slate-900 flex items-center gap-2"><Banknote className="w-5 h-5 text-emerald-600" />Cash out to naira</h3>
          <p className="text-xs text-slate-500 mt-1 flex items-center gap-1"><Landmark className="w-3.5 h-3.5" />Payout to {profile.bank_name} ****{profile.account_number?.slice(-4)} ({profile.account_name})</p>
        </div>

        {!payout && (
          <>
            {walletMismatch && <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-xs text-red-700">Connect your registered payout wallet ({profile.wallet_address.slice(0, 8)}…{profile.wallet_address.slice(-4)}) to cash out.</div>}
            <div>
              <div className="flex items-center justify-between"><Label className="text-xs">Amount (USDC)</Label>{balance !== null && <button onClick={() => setAmount(String(Math.floor(balance)))} className="text-[11px] text-amber-600 hover:underline">Max {fmtUsd(balance)}</button>}</div>
              <Input type="number" min="10" value={amount} onChange={(e) => { setAmount(e.target.value); setQuote(null); }} className="mt-1" placeholder="e.g. 1000" />
            </div>
            {quote ? (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 space-y-1.5">
                <div className="flex justify-between text-xs text-slate-600"><span>Rate</span><span>1 USDC = {ngn(quote.rate)}</span></div>
                <div className="flex justify-between text-xs text-slate-600"><span>Fee</span><span>{fmtUsd(quote.feeUsdc)}</span></div>
                <div className="flex justify-between items-baseline pt-1 border-t border-emerald-200"><span className="text-sm text-slate-700">You receive</span><span className="text-2xl font-bold text-emerald-700">{ngn(quote.amountNgn)}</span></div>
                <p className="text-[11px] text-slate-500">Quote valid for 10 minutes.</p>
              </div>
            ) : null}
            {!quote
              ? <Button onClick={getQuote} disabled={busy === 'quote' || !validAmt} variant="outline" className="w-full h-11">{busy === 'quote' ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Get naira quote'}</Button>
              : <Button onClick={start} disabled={busy === 'start' || walletMismatch} className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-2">{busy === 'start' ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Continue <ArrowRight className="w-4 h-4" /></>}</Button>}
          </>
        )}

        {payout && payout.status === 'awaiting_deposit' && (
          <div className="space-y-3">
            <div className="bg-slate-50 rounded-xl p-3 text-center"><p className="text-xs text-slate-500">Send</p><p className="text-2xl font-bold text-slate-900">{fmtUsd(payout.amount_usdc)} USDC</p><p className="text-xs text-slate-500">on <b>{payout.network}</b> → you receive <b>{ngn(payout.amount_ngn)}</b></p></div>
            <div className="flex justify-center"><div className="bg-white p-3 rounded-2xl border shadow"><QRCodeSVG value={payout.deposit_address} size={140} /></div></div>
            <div className="flex gap-2">
              <div className="flex-1 bg-slate-50 border rounded-xl px-3 py-2.5 font-mono text-xs break-all">{payout.deposit_address}</div>
              <button onClick={() => { navigator.clipboard.writeText(payout.deposit_address); setCopied(true); setTimeout(() => setCopied(false), 2000); }} className={`w-10 h-10 shrink-0 rounded-xl flex items-center justify-center ${copied ? 'bg-green-500 text-white' : 'bg-slate-100 text-slate-600'}`}>{copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}</button>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-600 bg-slate-50 rounded-xl px-3 py-2.5"><Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600" />Waiting for your deposit — naira is sent to your bank the moment it lands.</div>
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-[11px] text-amber-800 flex gap-2"><AlertTriangle className="w-4 h-4 shrink-0" />Send from the payout wallet you registered, on the network shown. Anything else may be lost.</div>
            {health?.mode === 'mock' && <Button onClick={simulate} disabled={busy === 'sim'} variant="outline" className="w-full border-dashed border-amber-400 text-amber-700 hover:bg-amber-50">{busy === 'sim' ? <Loader2 className="w-4 h-4 animate-spin" /> : '🧪 Simulate deposit & payout (test mode)'}</Button>}
          </div>
        )}

        {payout?.status === 'paid' && (
          <div className="text-center space-y-3 py-1">
            <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center mx-auto"><CheckCircle2 className="w-8 h-8 text-emerald-600" /></div>
            <div><h4 className="font-bold text-slate-900 text-lg">{ngn(payout.amount_ngn)} sent</h4><p className="text-xs text-slate-500">to {payout.bank_name} ****{payout.account_last4}</p></div>
            <Button onClick={() => { setPayout(null); setAmount(''); }} variant="outline" className="w-full">New cash-out</Button>
          </div>
        )}
        {payout?.status === 'failed' && (
          <div className="text-center space-y-2"><AlertTriangle className="w-8 h-8 text-red-500 mx-auto" /><p className="text-sm font-semibold">Cash-out failed</p><p className="text-xs text-slate-500">If you already sent funds, contact admin with ref <span className="font-mono">{payout.roqqu_ref}</span>.</p><Button onClick={() => setPayout(null)} variant="outline" className="w-full">Try again</Button></div>
        )}

        {history.length > 0 && (
          <div className="pt-2 border-t">
            <p className="text-xs font-semibold text-slate-500 mb-2">Recent cash-outs</p>
            <div className="space-y-1.5">
              {history.slice(0, 5).map((h) => (
                <div key={h.id} className="flex items-center justify-between text-xs bg-slate-50 rounded-lg px-3 py-2">
                  <span className="text-slate-700">{fmtUsd(h.amount_usdc)} → <b>{ngn(h.amount_ngn)}</b></span>
                  <Badge className={`${STATUS[h.status]?.[1] || 'bg-slate-100'} border-0 text-[10px]`}>{STATUS[h.status]?.[0] || h.status}</Badge>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
