import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { upsertProfile } from '@/lib/supabase';
import { Button } from "@/components/ui/button";
import { CheckCircle2, Crown } from 'lucide-react';
import { toast } from 'sonner';

export default function PaymentSuccess() {
  const { user, refreshProfile } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      // Mark user as premium after successful payment
      upsertProfile({ id: user.id, subscription_status: 'premium' })
        .then(() => refreshProfile())
        .then(() => toast.success('Your account has been upgraded to Premium! 🎉'))
        .catch(console.error);
    }
  }, [user]);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center bg-white rounded-2xl p-10 shadow-sm">
        <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <Crown className="w-10 h-10 text-amber-500" />
        </div>
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Payment Successful!</h1>
        <p className="text-slate-500 mb-8">Welcome to H-Autos Premium. You can now list unlimited cars.</p>
        <div className="space-y-3">
          <Link to="/SellCar">
            <Button className="w-full bg-amber-500 hover:bg-amber-600 text-white h-12">List a Car Now</Button>
          </Link>
          <Link to="/SellerDashboard">
            <Button variant="outline" className="w-full h-12">Go to Dashboard</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
