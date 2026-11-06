import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Copy, Check, ExternalLink, Wallet, AlertCircle, CheckCircle2, Loader2, Send } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { CRYPTO_WALLETS, SUPPORTED_WALLETS, usdToCrypto, buildPaymentURI } from '@/lib/crypto';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

const ADMIN_WA = '2348146730044';

// Coin selector tab
const COINS = ['USDT', 'ETH', 'BTC', 'SOL'];

const CoinIcon = ({ symbol, size = 'md' }) => {
  const cfg = CRYPTO_WALLETS[symbol];
  const s = size === 'sm' ? 'w-7 h-7 text-sm' : 'w-12 h-12 text-xl';
  return (
    <div className={`${s} rounded-full flex items-center justify-center font-bold text-white shadow-md`} style={{ background: cfg?.color || '#888' }}>
      {cfg?.icon}
    </div>
  );
};

export default function CryptoPaymentModal({ open, onClose, car, type = 'buy', priceUSD = 0 }) {
  const [coin, setCoin] = useState('USDT');
  const [copied, setCopied] = useState(false);
  const [txHash, setTxHash] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [step, setStep] = useState('coin'); // coin → pay → confirm → done
  const [sending, setSending] = useState(false);

  useEffect(() => { if (open) { setStep('coin'); setTxHash(''); setCopied(false); } }, [open]);

  const wallet = CRYPTO_WALLETS[coin];
  const cryptoAmount = usdToCrypto(priceUSD, coin);
  const paymentURI  = buildPaymentURI(coin, wallet.address, cryptoAmount);
  const label = type === 'rent' ? 'Rental Deposit' : 'Purchase';

  const copy = () => {
    navigator.clipboard.writeText(wallet.address).then(() => {
      setCopied(true);
      toast.success('Address copied!');
      setTimeout(() => setCopied(false), 2500);
    });
  };

  const openWallet = (w) => {
    const link = w.deepLink(wallet.address, cryptoAmount, coin);
    window.open(link, '_blank');
  };

  const submitProof = async () => {
    if (!txHash.trim()) { toast.error('Paste your transaction hash / ID'); return; }
    if (!name.trim())   { toast.error('Enter your name'); return; }
    setSending(true);
    try {
      const msg =
        `💰 *Crypto ${label} — HP-Autos*\n\n` +
        `*Car:* ${car?.title}\n` +
        `*Type:* ${label}\n` +
        `*Coin:* ${coin}\n` +
        `*Amount:* ${cryptoAmount} ${coin} (~$${priceUSD.toLocaleString()})\n` +
        `*Tx Hash:* ${txHash.trim()}\n` +
        `*Buyer:* ${name.trim()}\n` +
        (phone ? `*Phone:* ${phone}\n` : '') +
        `\n_Please verify and confirm the transaction._`;
      window.open(`https://wa.me/${ADMIN_WA}?text=${encodeURIComponent(msg)}`, '_blank');
      setStep('done');
    } finally { setSending(false); }
  };

  const compatibleWallets = SUPPORTED_WALLETS.filter(w => w.chains.includes(coin));

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] sm:w-full max-w-lg rounded-2xl max-h-[92vh] overflow-y-auto p-0">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-t-2xl px-6 py-4">
          <DialogTitle className="text-white text-lg font-bold flex items-center gap-2">
            <Wallet className="w-5 h-5 text-amber-400" />
            Pay with Crypto — {label}
          </DialogTitle>
          {car && <p className="text-slate-400 text-xs mt-0.5 truncate">{car.title}</p>}
        </div>

        <div className="p-5">
          <AnimatePresence mode="wait">

            {/* ── STEP 1: Choose coin ──────────────────────────────── */}
            {step === 'coin' && (
              <motion.div key="coin" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}>
                <p className="text-slate-600 text-sm mb-4">Select which cryptocurrency you want to pay with:</p>
                <div className="grid grid-cols-2 gap-3 mb-5">
                  {COINS.map(c => {
                    const cfg = CRYPTO_WALLETS[c];
                    const hasAddress = !!cfg.address;
                    return (
                      <button key={c} onClick={() => setCoin(c)} disabled={!hasAddress}
                        className={`relative p-4 rounded-2xl border-2 text-left transition-all ${coin === c ? 'border-amber-500 bg-amber-50' : 'border-slate-200 hover:border-slate-300'} ${!hasAddress ? 'opacity-40 cursor-not-allowed' : ''}`}>
                        <div className="flex items-center gap-3">
                          <CoinIcon symbol={c} size="sm" />
                          <div>
                            <p className="font-bold text-slate-900 text-sm">{c}</p>
                            <p className="text-[10px] text-slate-500">{cfg.name}</p>
                          </div>
                        </div>
                        {priceUSD > 0 && hasAddress && (
                          <p className="text-xs font-semibold mt-2" style={{ color: cfg.color }}>
                            ≈ {usdToCrypto(priceUSD, c)} {c}
                          </p>
                        )}
                        {!hasAddress && <Badge className="absolute top-2 right-2 bg-slate-100 text-slate-400 border-0 text-[9px]">Not configured</Badge>}
                        {coin === c && <div className="absolute top-2 right-2 w-5 h-5 bg-amber-500 rounded-full flex items-center justify-center"><Check className="w-3 h-3 text-white" /></div>}
                      </button>
                    );
                  })}
                </div>

                <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 mb-5 flex gap-2">
                  <AlertCircle className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                  <p className="text-xs text-blue-700">NFT holders from OpenSea can also pay — select ETH and send from your OpenSea-connected wallet (MetaMask, Coinbase Wallet, etc.)</p>
                </div>

                <Button onClick={() => setStep('pay')} disabled={!wallet.address} className="w-full h-12 bg-amber-500 hover:bg-amber-600 text-white font-bold">
                  Continue with {coin} →
                </Button>
              </motion.div>
            )}

            {/* ── STEP 2: Pay ──────────────────────────────────────── */}
            {step === 'pay' && (
              <motion.div key="pay" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="space-y-5">
                {/* Coin + amount header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CoinIcon symbol={coin} />
                    <div>
                      <p className="font-bold text-slate-900">{coin} Payment</p>
                      <p className="text-xs text-slate-500">{wallet.network}</p>
                    </div>
                  </div>
                  <button onClick={() => setStep('coin')} className="text-xs text-amber-600 hover:underline">← Change</button>
                </div>

                {/* Amount */}
                <div className="rounded-2xl p-4 text-center" style={{ background: wallet.color + '15', border: `1px solid ${wallet.color}30` }}>
                  <p className="text-3xl font-bold" style={{ color: wallet.color }}>{cryptoAmount} {coin}</p>
                  <p className="text-slate-500 text-sm mt-1">≈ ${priceUSD.toLocaleString()} USD · {label}</p>
                </div>

                {/* QR Code */}
                <div className="flex flex-col items-center gap-3">
                  <p className="text-xs text-slate-500 font-medium">Scan QR code with your wallet app</p>
                  <div className="bg-white p-3 rounded-2xl shadow-md border">
                    <QRCodeSVG value={paymentURI || wallet.address} size={160} level="M" />
                  </div>
                </div>

                {/* Address copy */}
                <div>
                  <Label className="text-xs text-slate-500 mb-1 block">Send to this address</Label>
                  <div className="flex gap-2">
                    <div className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 font-mono text-xs text-slate-700 break-all">
                      {wallet.address}
                    </div>
                    <button onClick={copy}
                      className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-all ${copied ? 'bg-green-500 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-600'}`}>
                      {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Open in wallet apps */}
                {compatibleWallets.length > 0 && (
                  <div>
                    <p className="text-xs text-slate-500 font-medium mb-2">Or open in your wallet app</p>
                    <div className="grid grid-cols-3 gap-2">
                      {compatibleWallets.map(w => (
                        <button key={w.name} onClick={() => openWallet(w)}
                          className="flex flex-col items-center gap-1.5 p-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-all">
                          <span className="text-xl">{w.icon}</span>
                          <span className="text-[10px] font-medium text-slate-700">{w.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-700">Send <b>exactly {cryptoAmount} {coin}</b> to the address above. After sending, click <b>I've Paid</b> to submit your transaction proof.</p>
                </div>

                <Button onClick={() => setStep('confirm')} className="w-full h-12 font-bold text-white" style={{ background: wallet.color }}>
                  I've Paid — Submit Proof →
                </Button>
                <button onClick={onClose} className="w-full text-center text-xs text-slate-400 hover:text-slate-600">Cancel</button>
              </motion.div>
            )}

            {/* ── STEP 3: Confirm / Submit proof ───────────────────── */}
            {step === 'confirm' && (
              <motion.div key="confirm" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="space-y-4">
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Submit Payment Proof</h3>
                  <p className="text-sm text-slate-500 mt-1">Admin will verify on-chain and confirm your {label.toLowerCase()} within 1 hour.</p>
                </div>

                <div className="bg-slate-50 rounded-xl p-3 text-xs text-slate-600 space-y-1">
                  <p><span className="font-semibold">Coin:</span> {coin}</p>
                  <p><span className="font-semibold">Amount:</span> {cryptoAmount} {coin}</p>
                  <p><span className="font-semibold">To address:</span> <span className="font-mono break-all">{wallet.address}</span></p>
                </div>

                <div>
                  <Label>Your Name *</Label>
                  <Input value={name} onChange={e => setName(e.target.value)} className="mt-1" placeholder="Full name" />
                </div>
                <div>
                  <Label>Phone / WhatsApp</Label>
                  <Input type="tel" value={phone} onChange={e => setPhone(e.target.value)} className="mt-1" placeholder="+2348012345678" />
                </div>
                <div>
                  <Label>Transaction Hash / ID *</Label>
                  <Input
                    value={txHash} onChange={e => setTxHash(e.target.value)}
                    className="mt-1 font-mono text-sm"
                    placeholder="0x1234abcd... or your TX ID"
                  />
                  <p className="text-xs text-slate-400 mt-1">Find this in your wallet's transaction history after sending.</p>
                </div>

                <Button onClick={submitProof} disabled={sending} className="w-full h-12 bg-green-500 hover:bg-green-600 text-white font-bold gap-2">
                  {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Send className="w-4 h-4" />Send Proof via WhatsApp to Admin</>}
                </Button>
                <button onClick={() => setStep('pay')} className="w-full text-center text-xs text-slate-400 hover:text-slate600">← Back</button>
              </motion.div>
            )}

            {/* ── STEP 4: Done ─────────────────────────────────────── */}
            {step === 'done' && (
              <motion.div key="done" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-6 space-y-4">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-10 h-10 text-green-500" />
                </div>
                <h3 className="text-xl font-bold text-slate-900">Proof Sent!</h3>
                <p className="text-slate-600 text-sm">Your payment proof has been sent to HP-Autos admin on WhatsApp. We'll verify on-chain and confirm your {label.toLowerCase()} within 1–3 hours.</p>
                <div className="bg-slate-50 border rounded-xl p-3 text-xs text-slate-500">
                  Admin WhatsApp: <span className="font-semibold text-slate-700">+234 814 673 0044</span>
                </div>
                <Button onClick={onClose} className="w-full bg-amber-500 hover:bg-amber-600 text-white h-11 font-semibold">Done</Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  );
}
