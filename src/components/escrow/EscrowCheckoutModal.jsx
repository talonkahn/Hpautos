import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loader2, ShieldCheck, Wallet, CheckCircle2, AlertTriangle, ExternalLink, Droplets, Lock } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/lib/AuthContext';
import { useWallet } from '@/lib/WalletContext';
import AuthModal from '@/components/AuthModal';
import { CountrySelector } from '@/components/shared/LocationSelector';
import { getCountry } from '@/components/shared/LocationData';
import * as web3 from '@/lib/web3';
import { createOrderRecord, addOrderEvent } from '@/lib/orders';
import { carPriceUSD, hasExactUSD } from '@/lib/pricing';
import { ADMIN_WHATSAPP } from '@/lib/supabase';

const SHIP_BPS = 2000;   // 20% released to dealer on shipping proof
const SHIP_DAYS = 14;    // dealer must ship within 14 days or buyer is refunded
const AUTO_DAYS = 7;     // buyer has 7 days after delivery is declared

export default function EscrowCheckoutModal({ open, onClose, car }) {
  const { user, profile, isAuthenticated } = useAuth();
  const wallet = useWallet();
  const navigate = useNavigate();

  const [step, setStep] = useState('details');     // details → review → done
  const [phase, setPhase] = useState('');          // '' | approve | lock | save
  const [showAuth, setShowAuth] = useState(false);
  const [balance, setBalance] = useState(null);
  const [result, setResult] = useState(null);
  const [form, setForm] = useState({ name: '', phone: '', country: 'NG', city: '', address: '' });
  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const priceUSD = carPriceUSD(car);
  const dealerWallet = car?.dealer_wallet || car?.stores?.wallet_address || web3.WEB3.defaultDealer;
  const dealerOk = web3.isAddress(dealerWallet);

  useEffect(() => { if (open) { setStep('details'); setPhase(''); setResult(null); } }, [open]);
  useEffect(() => { if (profile) setForm((p) => ({ ...p, name: p.name || profile.full_name || '', phone: p.phone || profile.whatsapp || profile.phone || '' })); }, [profile]);

  // Keep the buyer's USDC balance fresh once connected
  useEffect(() => {
    if (!open || !wallet.address || !web3.isEscrowConfigured) return;
    web3.readUsdcBalance(wallet.address).then(setBalance).catch(() => setBalance(null));
  }, [open, wallet.address, wallet.chainId, step, phase]);

  const goReview = () => {
    if (!isAuthenticated) { setShowAuth(true); return; }
    if (!form.name.trim() || !form.phone.trim() || !form.city.trim() || !form.address.trim()) {
      toast.error('Fill in your name, phone, city and delivery address'); return;
    }
    setStep('review');
  };

  const getTestUsdc = async () => {
    if (!wallet.ctx) return wallet.openModal();
    setPhase('faucet');
    try { await web3.faucetUsdc(wallet.ctx, 10_000); toast.success('10,000 test USDC added to your wallet'); setBalance(await web3.readUsdcBalance(wallet.address)); }
    catch (e) { toast.error(web3.friendlyError(e)); }
    finally { setPhase(''); }
  };

  const pay = async () => {
    if (!wallet.ctx) return wallet.openModal();
    if (wallet.wrongChain && !(await wallet.ensureChain())) return;
    if (!dealerOk) { toast.error('This listing has no dealer payout wallet yet — contact admin.'); return; }
    setPhase('approve');
    try {
      const passportURI = web3.buildPassportURI({ car, priceUSD, buyer: wallet.address });
      const res = await web3.createEscrowOrder(wallet.ctx, {
        dealer: dealerWallet, amountUsd: priceUSD, carRef: car.id, passportURI,
        shipBps: SHIP_BPS, shipDays: SHIP_DAYS, autoDays: AUTO_DAYS,
      }, setPhase);

      setPhase('save');
      const row = await createOrderRecord({
        chain_order_id: res.chainOrderId, chain_id: web3.WEB3.chainId, escrow_address: web3.WEB3.escrow,
        car_id: car.id, car_title: car.title, car_image: car.images?.[0] || null,
        buyer_id: user.id, buyer_wallet: wallet.address, dealer_wallet: dealerWallet, buyer_name: form.name.trim(),
        delivery_country: getCountry(form.country)?.name || form.country, delivery_city: form.city.trim(),
        amount_usd: priceUSD, status: 'funded', create_tx: res.hash, created_block: res.blockNumber,
      });
      await addOrderEvent({ order_id: row.id, type: 'funded', label: 'Funds locked in escrow', note: `$${priceUSD.toLocaleString()} USDC`, tx_hash: res.hash, actor_wallet: wallet.address });
      setResult({ ...res, orderRowId: row.id });
      setStep('done');
    } catch (e) {
      toast.error(web3.friendlyError(e));
    } finally { setPhase(''); }
  };

  // Shipping details go to admin on WhatsApp (never stored publicly) so they can be passed to the dealer.
  const sendDetailsToAdmin = () => {
    const msg =
      `🛡️ *Escrow order funded — HP-Autos*\n\n*Car:* ${car.title}\n*Amount locked:* $${priceUSD.toLocaleString()} USDC\n*Order #:* ${result?.chainOrderId}\n*Tx:* ${web3.explorerTx(result?.hash)}\n\n` +
      `*Buyer:* ${form.name}\n*Phone:* ${form.phone}\n*Wallet:* ${wallet.address}\n*Deliver to:*\n${form.address}\n${form.city}, ${getCountry(form.country)?.name}\n\n_Please pass delivery details to the dealer._`;
    window.open(`https://wa.me/${ADMIN_WHATSAPP}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  if (!car) return null;
  const notReady = !web3.isEscrowConfigured;
  const enoughUsdc = balance !== null && balance >= priceUSD;
  const busy = !!phase && phase !== 'faucet';

  return (
    <>
      <Dialog open={open} onOpenChange={(o) => !o && !busy && onClose()}>
        <DialogContent className="w-[95vw] sm:w-full max-w-lg rounded-2xl max-h-[92vh] overflow-y-auto p-0">
          <div className="bg-gradient-to-r from-emerald-700 to-emerald-900 px-6 py-4">
            <DialogTitle className="text-white text-lg font-bold flex items-center gap-2"><ShieldCheck className="w-5 h-5" />Buy with Escrow</DialogTitle>
            <p className="text-emerald-100 text-xs mt-0.5 truncate">{car.title}</p>
          </div>

          <div className="p-5 space-y-4">
            {notReady && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800 flex gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                Escrow isn't configured yet. Add VITE_ESCROW_ADDRESS and VITE_USDC_ADDRESS (see README_WEB3.md).
              </div>
            )}

            {/* Price + terms (always visible) */}
            <div className="bg-slate-50 rounded-xl p-4">
              <div className="flex items-baseline justify-between">
                <span className="text-sm text-slate-600">You lock</span>
                <span className="text-2xl font-bold text-slate-900">{web3.fmtUsd(priceUSD)} <span className="text-sm font-semibold text-slate-500">USDC</span></span>
              </div>
              {!hasExactUSD(car) && <p className="text-[11px] text-amber-700 mt-1">Converted from the listing price at an approximate rate. Admin can set an exact USD price.</p>}
              <ul className="mt-3 space-y-1.5 text-xs text-slate-600">
                <li className="flex gap-2"><Lock className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />Funds sit in a smart contract — not with HP-Autos or the dealer.</li>
                <li className="flex gap-2"><Lock className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />{SHIP_BPS / 100}% goes to the dealer when they post shipping proof (freight costs). The rest is released when you confirm delivery.</li>
                <li className="flex gap-2"><Lock className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />Dealer doesn't ship within {SHIP_DAYS} days → you can claim a full refund on-chain.</li>
                <li className="flex gap-2"><Lock className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />Problem with the car? Raise a dispute and the remaining funds freeze for arbitration.</li>
              </ul>
            </div>

            {step === 'details' && (
              <div className="space-y-3">
                <h4 className="font-semibold text-slate-900 text-sm">Delivery details</h4>
                <div className="grid sm:grid-cols-2 gap-3">
                  <div><Label className="text-xs">Full name *</Label><Input value={form.name} onChange={(e) => set('name', e.target.value)} className="mt-1" /></div>
                  <div><Label className="text-xs">Phone / WhatsApp *</Label><Input type="tel" value={form.phone} onChange={(e) => set('phone', e.target.value)} className="mt-1" placeholder="+234…" /></div>
                  <div><Label className="text-xs">Delivery country *</Label><CountrySelector value={form.country} onChange={(v) => set('country', v)} className="mt-1" /></div>
                  <div><Label className="text-xs">City / port *</Label><Input value={form.city} onChange={(e) => set('city', e.target.value)} className="mt-1" placeholder="e.g. Lagos (Apapa Port)" /></div>
                </div>
                <div><Label className="text-xs">Delivery address *</Label><Input value={form.address} onChange={(e) => set('address', e.target.value)} className="mt-1" placeholder="Street, area, landmark" /></div>
                <p className="text-[11px] text-slate-400">Your address and phone go to HP-Autos admin only (via WhatsApp) — they are never published or put on-chain.</p>
                <Button onClick={goReview} disabled={notReady} className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-bold">Continue →</Button>
              </div>
            )}

            {step === 'review' && (
              <div className="space-y-3">
                {!dealerOk && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-xs text-red-700">This listing has no dealer payout wallet set, so escrow can't start yet. Message admin to enable it.</div>
                )}

                {/* Wallet */}
                <div className="border rounded-xl p-3">
                  {wallet.isConnected ? (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm text-slate-700 flex items-center gap-2"><Wallet className="w-4 h-4 text-emerald-600" />{wallet.active?.info?.name} · <span className="font-mono">{wallet.shortAddress}</span></span>
                        <button onClick={wallet.openModal} className="text-xs text-amber-600 hover:underline">Change</button>
                      </div>
                      {wallet.wrongChain ? (
                        <Button size="sm" onClick={wallet.ensureChain} className="w-full bg-amber-500 hover:bg-amber-600 text-white">Switch to {wallet.expectedChain.name}</Button>
                      ) : (
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-500">USDC balance</span>
                          <span className={`font-semibold ${enoughUsdc ? 'text-emerald-600' : 'text-red-600'}`}>{balance === null ? '…' : web3.fmtUsd(balance)}</span>
                        </div>
                      )}
                      {!wallet.wrongChain && !enoughUsdc && balance !== null && (
                        web3.WEB3.usdcIsMock ? (
                          <Button size="sm" variant="outline" onClick={getTestUsdc} disabled={phase === 'faucet'} className="w-full gap-2">
                            {phase === 'faucet' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Droplets className="w-4 h-4" />}Get 10,000 free test USDC
                          </Button>
                        ) : <p className="text-[11px] text-red-600">You need {web3.fmtUsd(priceUSD)} USDC on {wallet.expectedChain.name} plus a little ETH for network fees.</p>
                      )}
                    </div>
                  ) : (
                    <Button onClick={wallet.openModal} variant="outline" className="w-full gap-2 border-amber-300 text-amber-700 h-11"><Wallet className="w-4 h-4" />Connect wallet</Button>
                  )}
                </div>

                <Button onClick={pay} disabled={busy || !wallet.isConnected || wallet.wrongChain || !enoughUsdc || !dealerOk} className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-2">
                  {busy ? <><Loader2 className="w-5 h-5 animate-spin" />
                    {phase === 'approve' ? 'Approve USDC in your wallet…' : phase === 'lock' ? 'Locking funds in escrow…' : 'Saving order…'}</>
                    : <><ShieldCheck className="w-5 h-5" />Lock {web3.fmtUsd(priceUSD)} in escrow</>}
                </Button>
                <p className="text-[11px] text-slate-400 text-center">Two wallet prompts: (1) approve exactly this amount, (2) lock it in the escrow contract.</p>
                {!busy && <button onClick={() => setStep('details')} className="w-full text-xs text-slate-400 hover:text-slate-600">← Back</button>}
              </div>
            )}

            {step === 'done' && result && (
              <div className="text-center space-y-4 py-2">
                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto"><CheckCircle2 className="w-9 h-9 text-emerald-600" /></div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900">Funds locked in escrow</h3>
                  <p className="text-sm text-slate-600 mt-1">Order #{result.chainOrderId}. The dealer can see the money is secured and will ship your vehicle.</p>
                </div>
                <a href={web3.explorerTx(result.hash)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline">View transaction <ExternalLink className="w-3 h-3" /></a>
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800 text-left">
                  <b>Last step:</b> send your delivery details to HP-Autos admin so they can pass them to the dealer.
                </div>
                <Button onClick={sendDetailsToAdmin} className="w-full h-11 bg-green-500 hover:bg-green-600 text-white font-semibold">Send delivery details on WhatsApp</Button>
                <Button onClick={() => { onClose(); navigate('/MyOrders'); }} variant="outline" className="w-full h-11">Track my order →</Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
      <AuthModal open={showAuth} onClose={() => setShowAuth(false)} defaultTab="register" redirectMessage="Create a free account to place an escrow order" />
    </>
  );
}
