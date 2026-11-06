import React, { useEffect, useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loader2, BadgeCheck, ShieldAlert, Lock, Wallet, Landmark } from 'lucide-react';
import { toast } from 'sonner';
import { useWallet } from '@/lib/WalletContext';
import { roqqu } from '@/lib/roqquClient';

const digits = (v, max) => v.replace(/\D/g, '').slice(0, max);

export default function DealerVerification({ profile, onChanged }) {
  const wallet = useWallet();
  const [banks, setBanks] = useState([]);
  const [f, setF] = useState({ businessName: '', bankCode: '', accountNumber: '', bvn: '', nin: '' });
  const [resolved, setResolved] = useState(null);
  const [busy, setBusy] = useState('');
  const [editing, setEditing] = useState(false);
  const set = (k, v) => setF((p) => ({ ...p, [k]: v }));

  useEffect(() => { roqqu('list_banks').then(setBanks).catch(() => {}); }, []);
  useEffect(() => { setResolved(null); }, [f.bankCode, f.accountNumber]);

  const checkAccount = async () => {
    if (!f.bankCode || f.accountNumber.length !== 10) return toast.error('Choose a bank and enter the 10-digit account number');
    setBusy('resolve');
    try { setResolved(await roqqu('resolve_bank', { bankCode: f.bankCode, accountNumber: f.accountNumber })); }
    catch (e) { toast.error(e.message); }
    finally { setBusy(''); }
  };

  const submit = async () => {
    if (!wallet.address) { wallet.openModal(); return; }
    if (!f.businessName.trim()) return toast.error('Enter your business name');
    if (!resolved) return toast.error('Check your bank account first');
    if (f.bvn.length !== 11 && f.nin.length !== 11) return toast.error('Enter your 11-digit BVN or NIN');
    setBusy('verify');
    try {
      const row = await roqqu('verify_dealer', { walletAddress: wallet.address, businessName: f.businessName, bankCode: f.bankCode, accountNumber: f.accountNumber, bvn: f.bvn || undefined, nin: f.nin || undefined });
      setF((p) => ({ ...p, bvn: '', nin: '' }));          // clear sensitive fields immediately
      setEditing(false);
      row.status === 'verified' ? toast.success('You are now a verified dealer') : toast.error(row.reject_reason || 'Verification failed');
      onChanged?.(row);
    } catch (e) { toast.error(e.message); }
    finally { setBusy(''); }
  };

  // ── Already verified ──
  if (profile?.status === 'verified' && !editing) return (
    <Card className="border-emerald-200 bg-emerald-50/50">
      <CardContent className="p-4 flex items-start gap-3 flex-wrap">
        <BadgeCheck className="w-8 h-8 text-emerald-600 shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap"><h3 className="font-bold text-slate-900">{profile.business_name}</h3><Badge className="bg-emerald-600 text-white border-0">Verified dealer</Badge></div>
          <p className="text-xs text-slate-600 mt-1 flex items-center gap-1"><Landmark className="w-3.5 h-3.5" />{profile.bank_name} · ****{profile.account_number?.slice(-4)} · {profile.account_name}</p>
          <p className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1"><Wallet className="w-3.5 h-3.5" />Payout wallet <span className="font-mono">{profile.wallet_address?.slice(0, 8)}…{profile.wallet_address?.slice(-4)}</span> · {[profile.bvn_verified && 'BVN', profile.nin_verified && 'NIN'].filter(Boolean).join(' + ')} checked</p>
        </div>
        <Button variant="ghost" size="sm" onClick={() => setEditing(true)} className="text-xs text-slate-500">Update</Button>
      </CardContent>
    </Card>
  );

  return (
    <Card className="border-slate-200">
      <CardContent className="p-4 sm:p-5 space-y-4">
        <div>
          <h3 className="font-bold text-slate-900 flex items-center gap-2"><ShieldAlert className="w-5 h-5 text-amber-500" />Verify your dealership</h3>
          <p className="text-xs text-slate-500 mt-1">Verified dealers get a badge on their listings and can cash out escrow earnings to a Nigerian bank account in naira.</p>
        </div>

        {profile?.status === 'rejected' && <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-xs text-red-700"><b>Last attempt failed:</b> {profile.reject_reason || 'Details did not match.'} Check your details and try again.</div>}

        <div className="grid sm:grid-cols-2 gap-3">
          <div className="sm:col-span-2"><Label className="text-xs">Business / trading name *</Label><Input value={f.businessName} onChange={(e) => set('businessName', e.target.value)} className="mt-1" placeholder="e.g. Okafor Motors Ltd" /></div>
          <div>
            <Label className="text-xs">Bank *</Label>
            <select value={f.bankCode} onChange={(e) => set('bankCode', e.target.value)} className="mt-1 w-full h-10 rounded-md border border-input bg-background px-3 text-sm">
              <option value="">Select bank</option>
              {banks.map((b) => <option key={b.code} value={b.code}>{b.name}</option>)}
            </select>
          </div>
          <div><Label className="text-xs">Account number *</Label><Input inputMode="numeric" value={f.accountNumber} onChange={(e) => set('accountNumber', digits(e.target.value, 10))} className="mt-1" placeholder="10 digits" /></div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <Button type="button" variant="outline" onClick={checkAccount} disabled={busy === 'resolve'} className="h-9 text-sm">{busy === 'resolve' ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Check account name'}</Button>
          {resolved && <span className="text-sm font-semibold text-emerald-700 flex items-center gap-1"><BadgeCheck className="w-4 h-4" />{resolved.accountName}</span>}
        </div>

        <div className="grid sm:grid-cols-2 gap-3">
          <div><Label className="text-xs">BVN</Label><Input type="password" inputMode="numeric" autoComplete="off" value={f.bvn} onChange={(e) => set('bvn', digits(e.target.value, 11))} className="mt-1" placeholder="11 digits" /></div>
          <div><Label className="text-xs">NIN</Label><Input type="password" inputMode="numeric" autoComplete="off" value={f.nin} onChange={(e) => set('nin', digits(e.target.value, 11))} className="mt-1" placeholder="11 digits" /></div>
        </div>
        <p className="text-[11px] text-slate-500 flex gap-1.5"><Lock className="w-3.5 h-3.5 shrink-0 mt-0.5" />Provide at least one. Your BVN/NIN is sent to the verifier and checked against your bank account name. It is never saved or logged by HP-Autos — only the pass/fail result is kept.</p>

        <div className="bg-slate-50 rounded-xl p-3 text-xs text-slate-600 flex items-center justify-between gap-2 flex-wrap">
          <span className="flex items-center gap-1.5"><Wallet className="w-4 h-4" />{wallet.isConnected ? <>Payout wallet: <span className="font-mono">{wallet.shortAddress}</span></> : 'Connect the wallet your escrow payouts go to'}</span>
          {!wallet.isConnected && <Button size="sm" onClick={wallet.openModal} variant="outline" className="h-8">Connect wallet</Button>}
        </div>

        <Button onClick={submit} disabled={busy === 'verify'} className="w-full h-11 bg-amber-500 hover:bg-amber-600 text-white font-bold">
          {busy === 'verify' ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Verify my dealership'}
        </Button>
      </CardContent>
    </Card>
  );
}
