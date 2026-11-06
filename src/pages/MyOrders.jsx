import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { getMyOrders } from '@/lib/orders';
import { isEscrowConfigured } from '@/lib/web3';
import AuthModal from '@/components/AuthModal';
import WalletButton from '@/components/WalletButton';
import OrderCard from '@/components/escrow/OrderCard';
import { Button } from "@/components/ui/button";
import { Loader2, PackageSearch, ShieldCheck } from 'lucide-react';

export default function MyOrders() {
  const { user, isAuthenticated } = useAuth();
  const [orders, setOrders] = useState(null);
  const [showAuth, setShowAuth] = useState(false);

  useEffect(() => {
    if (!user) { setOrders(null); return; }
    getMyOrders(user.id).then(setOrders).catch(() => setOrders([]));
  }, [user]);

  if (!isAuthenticated) return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="text-center max-w-sm">
        <ShieldCheck className="w-14 h-14 text-emerald-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold mb-2">Sign in to track your orders</h2>
        <p className="text-slate-500 mb-6">See every escrow order, its shipping progress, and release funds when your car arrives.</p>
        <Button onClick={() => setShowAuth(true)} className="bg-amber-500 hover:bg-amber-600 text-white h-12 px-8">Sign In / Register</Button>
      </div>
      <AuthModal open={showAuth} onClose={() => setShowAuth(false)} />
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b">
        <div className="max-w-3xl mx-auto px-3 sm:px-4 py-5 sm:py-8 flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h1 className="text-xl sm:text-3xl font-bold text-slate-900">My Orders</h1>
            <p className="text-sm text-slate-500 mt-1">Escrow-protected purchases and live shipping status</p>
          </div>
          <WalletButton />
        </div>
      </div>
      <div className="max-w-3xl mx-auto px-3 sm:px-4 py-5 sm:py-8 space-y-5">
        {!isEscrowConfigured && <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800">Escrow contract not configured yet — see README_WEB3.md.</div>}
        {orders === null ? <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-amber-500" /></div>
          : orders.length === 0 ? (
            <div className="text-center py-20">
              <PackageSearch className="w-14 h-14 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-900">No orders yet</h3>
              <p className="text-slate-500 text-sm mb-5">Open any car and tap “Buy with Escrow”.</p>
              <Link to="/Browse"><Button className="bg-amber-500 hover:bg-amber-600 text-white">Browse cars</Button></Link>
            </div>
          ) : orders.map((o) => <OrderCard key={o.id} order={o} />)}
      </div>
    </div>
  );
}
