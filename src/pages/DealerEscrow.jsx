import React, { useEffect, useState } from 'react';
import { useWallet } from '@/lib/WalletContext';
import { getOrdersForDealer } from '@/lib/orders';
import { fmtUsd, isEscrowConfigured } from '@/lib/web3';
import { useAuth } from '@/lib/AuthContext';
import AuthModal from '@/components/AuthModal';
import WalletButton from '@/components/WalletButton';
import OrderCard from '@/components/escrow/OrderCard';
import DealerVerification from '@/components/roqqu/DealerVerification';
import DealerCashout from '@/components/roqqu/DealerCashout';
import TestModeBanner from '@/components/roqqu/TestModeBanner';
import { getMyDealerProfile } from '@/lib/roqquClient';
import { Button } from "@/components/ui/button";
import { Loader2, Wallet, Banknote, Lock, PackageCheck, Store } from 'lucide-react';

const Stat = ({ icon: Icon, label, value, tone }) => (
  <div className={`rounded-xl p-3 sm:p-4 ${tone}`}>
    <Icon className="w-5 h-5 mb-1 opacity-70" />
    <p className="text-lg sm:text-2xl font-bold">{value}</p>
    <p className="text-[11px] sm:text-xs opacity-80">{label}</p>
  </div>
);

export default function DealerEscrow() {
  const { user, isAuthenticated } = useAuth();
  const [dealer, setDealer] = useState(null);
  const wallet = useWallet();
  const [orders, setOrders] = useState(null);
  const [live, setLive] = useState({});   // per-order on-chain numbers reported by each card
  const [showAuth, setShowAuth] = useState(false);

  useEffect(() => { if (user) getMyDealerProfile(user.id).then(setDealer); else setDealer(null); }, [user]);

  useEffect(() => {
    if (!wallet.address) { setOrders(null); return; }
    getOrdersForDealer(wallet.address).then(setOrders).catch(() => setOrders([]));
  }, [wallet.address]);

  const rows = orders || [];
  const locked = rows.reduce((s, o) => s + (['funded', 'shipped', 'delivered', 'disputed'].includes((live[o.id] || o).status)
    ? Math.max(0, Number(o.amount_usd || 0) - Number((live[o.id] || o).released_usdc || 0)) : 0), 0);
  const released = rows.reduce((s, o) => s + Number((live[o.id] || o).released_usdc || 0), 0);
  const open = rows.filter((o) => ['funded', 'shipped', 'delivered'].includes((live[o.id] || o).status)).length;

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white">
        <div className="max-w-4xl mx-auto px-3 sm:px-4 py-6 sm:py-10">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <h1 className="text-xl sm:text-3xl font-bold flex items-center gap-2"><Store className="w-6 h-6 text-amber-400" />Dealer Escrow Dashboard</h1>
              <p className="text-slate-400 text-sm mt-1">Buyers' funds are already locked on-chain before you ship. Post proof, get paid.</p>
            </div>
            <WalletButton className="bg-white/10 border-white/20 text-white hover:bg-white/20 hover:text-white" />
          </div>
          {wallet.isConnected && (
            <div className="grid grid-cols-3 gap-2 sm:gap-3 mt-6">
              <Stat icon={Lock} label="Locked for you" value={fmtUsd(locked)} tone="bg-blue-500/20 text-blue-100" />
              <Stat icon={Banknote} label="Released (gross)" value={fmtUsd(released)} tone="bg-emerald-500/20 text-emerald-100" />
              <Stat icon={PackageCheck} label="Open orders" value={open} tone="bg-amber-500/20 text-amber-100" />
            </div>
          )}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-3 sm:px-4 py-5 sm:py-8 space-y-5">
        {!isEscrowConfigured && <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800">Escrow contract not configured yet — see README_WEB3.md.</div>}

        {!isAuthenticated && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-blue-800 flex items-center justify-between gap-3 flex-wrap">
            Sign in so your shipping updates can be recorded on the order timeline.
            <Button size="sm" onClick={() => setShowAuth(true)} className="bg-blue-600 hover:bg-blue-700 text-white">Sign in</Button>
          </div>
        )}

        {isAuthenticated && (
          <div className="space-y-4">
            <TestModeBanner />
            <DealerVerification profile={dealer} onChanged={setDealer} />
            <DealerCashout profile={dealer} />
          </div>
        )}

        {!wallet.isConnected ? (
          <div className="text-center py-16">
            <Wallet className="w-14 h-14 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-900">Connect your dealer payout wallet</h3>
            <p className="text-slate-500 text-sm mb-5 max-w-sm mx-auto">Orders are matched to the wallet your listings pay out to. Every action you take is signed by this wallet.</p>
            <Button onClick={wallet.openModal} className="bg-amber-500 hover:bg-amber-600 text-white h-11 px-8">Connect Wallet</Button>
          </div>
        ) : orders === null ? <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-amber-500" /></div>
          : rows.length === 0 ? <p className="text-center text-slate-500 py-16">No escrow orders for {wallet.shortAddress} yet.</p>
          : rows.map((o) => <OrderCard key={o.id} order={o} onChanged={(u) => setLive((p) => ({ ...p, [o.id]: u }))} />)}
      </div>
      <AuthModal open={showAuth} onClose={() => setShowAuth(false)} />
    </div>
  );
}
