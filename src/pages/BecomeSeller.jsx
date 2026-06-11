import logo from '@/assets/logo.jpg';
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { createSellerRequest, getUserSellerRequest, upsertProfile, sendEmailNotification, SELLER_FEE_NGN, SELLER_FEE_USDT, SELLER_DURATION_DAYS, ADMIN_WHATSAPP, ADMIN_EMAIL } from '@/lib/supabase';
import AuthModal from '@/components/AuthModal';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { UserCheck, CheckCircle2, Clock, MessageSquare, Loader2, Star, Building2, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

const BENEFITS = [
  'Request admin to list your cars on H-Autos',
  `Your listings stay active for ${SELLER_DURATION_DAYS} days`,
  'Admin-approved listings = maximum buyer trust',
  'Buyers WhatsApp you directly',
  "Listed on Nigeria's fastest-growing car marketplace",
  'Verified Seller badge on your profile',
];

export default function BecomeSeller() {
  const { user, profile, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [showAuth, setShowAuth] = useState(false);
  const [existing, setExisting] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ full_name: '', phone: '', whatsapp: '', payment_method: 'naira', payment_ref: '' });

  useEffect(() => {
    if (profile) setForm(f => ({ ...f, full_name: profile.full_name || '', phone: profile.phone || '', whatsapp: profile.whatsapp || '' }));
    if (user) { getUserSellerRequest(user.id).then(r => { setExisting(r); setLoading(false); }).catch(() => setLoading(false)); }
    else setLoading(false);
  }, [user, profile]);

  const handleSubmit = async () => {
    if (!isAuthenticated) { setShowAuth(true); return; }
    if (!form.full_name || !form.phone || !form.whatsapp) { toast.error('Fill all fields'); return; }
    if (!form.payment_ref.trim()) { toast.error('Enter your payment reference'); return; }
    if (form.whatsapp.replace(/\D/g, '').length < 10) { toast.error('Enter a valid WhatsApp number'); return; }
    setSubmitting(true);
    try {
      await createSellerRequest({ user_id: user.id, full_name: form.full_name, phone: form.phone, whatsapp: form.whatsapp, payment_method: form.payment_method, payment_ref: form.payment_ref, amount_paid: form.payment_method === 'naira' ? SELLER_FEE_NGN : SELLER_FEE_USDT, currency: form.payment_method === 'naira' ? 'NGN' : 'USDT', status: 'pending' });
      await upsertProfile({ id: user.id, phone: form.phone, whatsapp: form.whatsapp, full_name: form.full_name });
      await sendEmailNotification({ to: ADMIN_EMAIL, subject: `New Seller Request – ${form.full_name}`, html: `<h2>New Seller Request</h2><p><b>${form.full_name}</b><br/>Email: ${user.email}<br/>WhatsApp: ${form.whatsapp}<br/>Payment: ${form.payment_method === 'naira' ? '₦3,000' : '$5 USDT'}<br/>Ref: ${form.payment_ref}</p>` });
      const waMsg = `📋 New Seller Request!\nName: ${form.full_name}\nEmail: ${user.email}\nWhatsApp: ${form.whatsapp}\nPayment: ${form.payment_method === 'naira' ? '₦3,000' : '$5 USDT'}\nRef: ${form.payment_ref}`;
      window.open(`https://wa.me/${ADMIN_WHATSAPP}?text=${encodeURIComponent(waMsg)}`, '_blank');
      await getUserSellerRequest(user.id).then(setExisting);
      toast.success('Request submitted! Admin will verify your payment and activate your account.');
    } catch (e) { console.error(e); toast.error('Submission failed. Try again.'); }
    finally { setSubmitting(false); }
  };

  if (!isAuthenticated) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <Card className="max-w-md w-full p-8 text-center">
        <UserCheck className="w-16 h-16 text-amber-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold mb-2">Create an account first</h2>
        <p className="text-slate-500 mb-6">Sign up with your email to become a seller on H-Autos.</p>
        <Button onClick={() => setShowAuth(true)} className="w-full bg-amber-500 hover:bg-amber-600 text-white h-12">Sign Up / Sign In</Button>
      </Card>
      <AuthModal open={showAuth} onClose={() => setShowAuth(false)} defaultTab="register" redirectMessage="Create an account to become a seller" />
    </div>
  );

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-amber-500" /></div>;

  if (profile?.seller_active) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <Card className="max-w-md w-full p-8 text-center">
        <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6"><CheckCircle2 className="w-10 h-10 text-emerald-500" /></div>
        <Badge className="mb-4 bg-emerald-100 text-emerald-700 px-4 py-1">Active Seller</Badge>
        <h2 className="text-2xl font-bold mb-2">You're an active seller!</h2>
        {profile.seller_expiry && <p className="text-sm text-slate-400 mb-2">Expires: {new Date(profile.seller_expiry).toLocaleDateString('en-NG', { day: 'numeric', month: 'long', year: 'numeric' })}</p>}
        <p className="text-slate-600 mb-6">WhatsApp admin to submit your car for listing.</p>
        <a href={`https://wa.me/${ADMIN_WHATSAPP}?text=Hi%2C%20I'm%20an%20active%20seller%20on%20H-Autos%20(${user?.email}).%20I'd%20like%20to%20list%20a%20car.`} target="_blank" rel="noopener noreferrer">
          <Button className="w-full bg-green-500 hover:bg-green-600 text-white h-12 gap-2"><MessageSquare className="w-5 h-5" />Submit Car to Admin</Button>
        </a>
      </Card>
    </div>
  );

  if (existing?.status === 'pending') return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <Card className="max-w-md w-full p-8 text-center">
        <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6"><Clock className="w-10 h-10 text-amber-500" /></div>
        <Badge className="mb-4 bg-amber-100 text-amber-700 px-4 py-1">Pending Review</Badge>
        <h2 className="text-2xl font-bold mb-2">Request Under Review</h2>
        <p className="text-slate-500 mb-6">Admin will verify your payment and activate your account within 24 hours.</p>
        <a href={`https://wa.me/${ADMIN_WHATSAPP}?text=Hi%2C%20I%20submitted%20a%20seller%20request.%20Email%3A%20${user?.email}.%20Ref%3A%20${existing?.payment_ref}`} target="_blank" rel="noopener noreferrer">
          <Button variant="outline" className="w-full h-12 gap-2 border-green-300 text-green-700"><MessageSquare className="w-4 h-4" />Follow up on WhatsApp</Button>
        </a>
      </Card>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white py-16">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <Badge className="mb-6 bg-amber-500/20 text-amber-400 border-amber-500/30 px-4 py-2">Seller Subscription</Badge>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Sell Your Car on H-Autos</h1>
          <p className="text-xl text-slate-300 max-w-2xl mx-auto">Pay once. Admin lists your car for you — maximum trust, maximum buyers.</p>
          <div className="flex flex-wrap justify-center gap-8 mt-10">
            <div className="text-center"><p className="text-3xl font-bold text-amber-400">₦{SELLER_FEE_NGN.toLocaleString()}</p><p className="text-slate-400 text-sm">or ${SELLER_FEE_USDT} USDT</p></div>
            <div className="text-center"><p className="text-3xl font-bold text-amber-400">{SELLER_DURATION_DAYS} Days</p><p className="text-slate-400 text-sm">active access</p></div>
            <div className="text-center"><p className="text-3xl font-bold text-amber-400">Admin</p><p className="text-slate-400 text-sm">lists for you</p></div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-12 grid md:grid-cols-2 gap-8">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 mb-6">What you get</h2>
          <div className="space-y-4">
            {BENEFITS.map((b, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }} className="flex items-start gap-3">
                <div className="w-6 h-6 bg-emerald-100 rounded-full flex items-center justify-center shrink-0 mt-0.5"><CheckCircle2 className="w-4 h-4 text-emerald-600" /></div>
                <p className="text-slate-700">{b}</p>
              </motion.div>
            ))}
          </div>
          <div className="mt-8 bg-amber-50 border border-amber-200 rounded-xl p-5">
            <h3 className="font-bold text-amber-800 mb-2 flex items-center gap-2"><Star className="w-4 h-4" />How it works</h3>
            <ol className="space-y-2 text-sm text-amber-700">
              <li>1. Pay ₦3,000 via bank transfer or $5 USDT</li>
              <li>2. Submit your payment reference below</li>
              <li>3. Admin verifies & activates within 24hrs</li>
              <li>4. WhatsApp admin with your car details + photos</li>
              <li>5. Admin lists it — buyers start reaching out!</li>
            </ol>
          </div>
          <div className="mt-4 bg-slate-100 rounded-xl p-4">
            <p className="font-semibold text-slate-900 text-sm mb-2">Payment Details</p>
            <p className="text-sm text-slate-600">Contact admin for bank account / USDT wallet:</p>
            <a href={`https://wa.me/${ADMIN_WHATSAPP}?text=Hi%2C%20I%20want%20to%20become%20a%20seller%20on%20H-Autos.%20Please%20send%20payment%20details.`} target="_blank" rel="noopener noreferrer" className="block mt-2">
              <Button variant="outline" size="sm" className="w-full gap-2 border-green-300 text-green-700 hover:bg-green-50"><MessageSquare className="w-4 h-4" />Get Payment Details on WhatsApp</Button>
            </a>
          </div>
        </div>

        <div>
          <Card className="shadow-lg">
            <CardContent className="p-6 space-y-5">
              <div><h2 className="text-xl font-bold text-slate-900">Submit Seller Request</h2><p className="text-slate-500 text-sm mt-1">Fill this after making payment</p></div>
              <div><Label>Full Name *</Label><Input value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} className="mt-1" /></div>
              <div><Label>Phone *</Label><Input type="tel" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="08012345678" className="mt-1" /></div>
              <div><Label>WhatsApp * <Badge className="ml-1 text-[10px] bg-green-100 text-green-700 border-green-200">Required</Badge></Label><Input type="tel" value={form.whatsapp} onChange={e => setForm(f => ({ ...f, whatsapp: e.target.value }))} placeholder="+2348012345678" className="mt-1" /><p className="text-xs text-slate-500 mt-1">Include country code</p></div>
              <div>
                <Label>Payment Method *</Label>
                <div className="grid grid-cols-2 gap-3 mt-2">
                  {[['naira', `₦${SELLER_FEE_NGN.toLocaleString()} NGN`], ['usdt', `$${SELLER_FEE_USDT} USDT`]].map(([v, l]) => (
                    <button key={v} onClick={() => setForm(f => ({ ...f, payment_method: v }))} className={`p-3 rounded-xl border-2 text-sm font-semibold transition-all ${form.payment_method === v ? 'border-amber-500 bg-amber-50 text-amber-700' : 'border-slate-200 hover:border-amber-200 text-slate-700'}`}>{l}</button>
                  ))}
                </div>
              </div>
              <div><Label>Payment Reference / TxID *</Label><Input value={form.payment_ref} onChange={e => setForm(f => ({ ...f, payment_ref: e.target.value }))} placeholder="Bank ref or USDT TxID..." className="mt-1" /></div>
              <Button onClick={handleSubmit} disabled={submitting} className="w-full h-12 bg-amber-500 hover:bg-amber-600 text-white font-semibold">
                {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Submit — {form.payment_method === 'naira' ? `₦${SELLER_FEE_NGN.toLocaleString()}` : `$${SELLER_FEE_USDT} USDT`}</>}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
      <AuthModal open={showAuth} onClose={() => setShowAuth(false)} defaultTab="register" redirectMessage="Create an account to become a seller" />
    </div>
  );
}
