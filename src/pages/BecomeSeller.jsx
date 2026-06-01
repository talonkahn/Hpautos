import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { createSellerRequest, getUserSellerRequest, upsertProfile, sendEmailNotification, SELLER_FEE_NGN, SELLER_FEE_USDT, SELLER_DURATION_DAYS, ADMIN_WHATSAPP, ADMIN_EMAIL } from '@/lib/supabase';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { UserCheck, CheckCircle2, Clock, AlertCircle, MessageSquare, Loader2, Star, Car, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

const BENEFITS = [
  'Request admin to list your cars on H-Autos',
  'Your listings stay live for 14 days',
  'Admin-approved for maximum buyer trust',
  'WhatsApp enquiries go directly to you',
  'Listed on Nigeria\'s fastest-growing car marketplace',
  'Seller badge on your profile',
];

export default function BecomeSeller() {
  const { user, profile, isAuthenticated, login, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [existing, setExisting] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ full_name: '', phone: '', whatsapp: '', payment_method: 'naira', payment_ref: '' });

  useEffect(() => {
    if (profile) setForm(f => ({ ...f, full_name: profile.full_name || '', phone: profile.phone || '', whatsapp: profile.whatsapp || '' }));
    if (user) {
      getUserSellerRequest(user.id).then(r => { setExisting(r); setLoading(false); }).catch(() => setLoading(false));
    } else { setLoading(false); }
  }, [user, profile]);

  const handleSubmit = async () => {
    if (!form.full_name || !form.phone || !form.whatsapp) { toast.error('Fill in all fields'); return; }
    if (!form.payment_ref.trim()) { toast.error('Enter your payment reference / transaction ID'); return; }
    const waClean = form.whatsapp.replace(/\D/g, '');
    if (waClean.length < 10) { toast.error('Enter a valid WhatsApp number'); return; }
    setSubmitting(true);
    try {
      await createSellerRequest({
        user_id: user.id, full_name: form.full_name, phone: form.phone,
        whatsapp: form.whatsapp, payment_method: form.payment_method,
        payment_ref: form.payment_ref,
        amount_paid: form.payment_method === 'naira' ? SELLER_FEE_NGN : SELLER_FEE_USDT,
        currency: form.payment_method === 'naira' ? 'NGN' : 'USDT',
        status: 'pending',
      });
      await upsertProfile({ id: user.id, phone: form.phone, whatsapp: form.whatsapp, full_name: form.full_name });
      await sendEmailNotification({
        to: ADMIN_EMAIL,
        subject: `New Seller Request – ${form.full_name}`,
        html: `<h2>New Seller Subscription Request</h2><p><b>Name:</b> ${form.full_name}<br/><b>Email:</b> ${user.email}<br/><b>WhatsApp:</b> ${form.whatsapp}<br/><b>Payment:</b> ${form.payment_method === 'naira' ? '₦3,000' : '$5 USDT'}<br/><b>Ref:</b> ${form.payment_ref}</p><p>Please verify payment and approve in Admin Dashboard.</p>`
      });
      const waMsg = encodeURIComponent(`📋 New Seller Request!\nName: ${form.full_name}\nEmail: ${user.email}\nWhatsApp: ${form.whatsapp}\nPayment: ${form.payment_method === 'naira' ? '₦3,000' : '$5 USDT'}\nRef: ${form.payment_ref}\nPlease verify and approve.`);
      window.open(`https://wa.me/${ADMIN_WHATSAPP}?text=${waMsg}`, '_blank');
      await getUserSellerRequest(user.id).then(setExisting);
      toast.success('Request submitted! Admin will review and activate your seller access.');
    } catch(e) { console.error(e); toast.error('Submission failed. Try again.'); }
    finally { setSubmitting(false); }
  };

  if (!isAuthenticated) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <Card className="max-w-md w-full p-8 text-center">
        <UserCheck className="w-16 h-16 text-amber-500 mx-auto mb-4"/>
        <h2 className="text-2xl font-bold mb-2">Sign in to become a seller</h2>
        <p className="text-slate-500 mb-6">Create an account with Google to get started.</p>
        <Button onClick={login} className="w-full bg-amber-500 hover:bg-amber-600 text-white h-12">Sign in with Google</Button>
      </Card>
    </div>
  );

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-amber-500"/></div>;

  // Already an active seller
  if (profile?.seller_active) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <Card className="max-w-md w-full p-8 text-center">
        <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6"><CheckCircle2 className="w-10 h-10 text-emerald-500"/></div>
        <Badge className="mb-4 bg-emerald-100 text-emerald-700 px-4 py-1">Active Seller</Badge>
        <h2 className="text-2xl font-bold mb-2">You're an active seller!</h2>
        <p className="text-slate-500 mb-2">Your seller access is active.</p>
        {profile.seller_expiry && <p className="text-sm text-slate-400 mb-6">Expires: {new Date(profile.seller_expiry).toLocaleDateString('en-NG', {day:'numeric',month:'long',year:'numeric'})}</p>}
        <p className="text-slate-600 mb-6">Contact admin on WhatsApp to submit car listing requests.</p>
        <a href={`https://wa.me/${ADMIN_WHATSAPP}?text=Hi%2C%20I%20am%20an%20active%20seller%20on%20H-Autos.%20I%20would%20like%20to%20submit%20a%20car%20for%20listing.`} target="_blank" rel="noopener noreferrer">
          <Button className="w-full bg-green-500 hover:bg-green-600 text-white h-12 gap-2"><MessageSquare className="w-5 h-5"/>Submit Car to Admin</Button>
        </a>
      </Card>
    </div>
  );

  // Pending request
  if (existing && existing.status === 'pending') return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <Card className="max-w-md w-full p-8 text-center">
        <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6"><Clock className="w-10 h-10 text-amber-500"/></div>
        <Badge className="mb-4 bg-amber-100 text-amber-700 px-4 py-1">Pending Review</Badge>
        <h2 className="text-2xl font-bold mb-2">Request Under Review</h2>
        <p className="text-slate-500 mb-6">Your seller request has been submitted. Admin will verify your payment and activate your account within 24 hours.</p>
        <a href={`https://wa.me/${ADMIN_WHATSAPP}?text=Hi%2C%20I%20submitted%20a%20seller%20request%20on%20H-Autos.%20My%20email%20is%20${user?.email}.%20Payment%20ref%3A%20${existing.payment_ref}`} target="_blank" rel="noopener noreferrer">
          <Button variant="outline" className="w-full h-12 gap-2 border-green-300 text-green-700"><MessageSquare className="w-4 h-4"/>Follow up on WhatsApp</Button>
        </a>
      </Card>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white py-16">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <Badge className="mb-6 bg-amber-500/20 text-amber-400 border-amber-500/30 px-4 py-2">Seller Subscription</Badge>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Sell Your Car on H-Autos</h1>
          <p className="text-xl text-slate-300 max-w-2xl mx-auto">Pay a one-time fee to become a verified seller. Admin lists your cars directly — maximum trust, maximum buyers.</p>
          <div className="flex flex-wrap justify-center gap-8 mt-10">
            <div className="text-center"><p className="text-3xl font-bold text-amber-400">₦3,000</p><p className="text-slate-400 text-sm">or $5 USDT</p></div>
            <div className="text-center"><p className="text-3xl font-bold text-amber-400">{SELLER_DURATION_DAYS} Days</p><p className="text-slate-400 text-sm">active seller access</p></div>
            <div className="text-center"><p className="text-3xl font-bold text-amber-400">Admin</p><p className="text-slate-400 text-sm">lists your car for you</p></div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-12 grid md:grid-cols-2 gap-8">
        {/* Benefits */}
        <div>
          <h2 className="text-2xl font-bold text-slate-900 mb-6">What you get</h2>
          <div className="space-y-4">
            {BENEFITS.map((b, i) => (
              <motion.div key={i} initial={{opacity:0,x:-20}} animate={{opacity:1,x:0}} transition={{delay:i*0.08}} className="flex items-start gap-3">
                <div className="w-6 h-6 bg-emerald-100 rounded-full flex items-center justify-center shrink-0 mt-0.5"><CheckCircle2 className="w-4 h-4 text-emerald-600"/></div>
                <p className="text-slate-700">{b}</p>
              </motion.div>
            ))}
          </div>
          <div className="mt-8 bg-amber-50 border border-amber-200 rounded-xl p-5">
            <h3 className="font-bold text-amber-800 mb-2 flex items-center gap-2"><Star className="w-4 h-4"/>How it works</h3>
            <ol className="space-y-2 text-sm text-amber-700">
              <li>1. Pay ₦3,000 via bank transfer or $5 USDT to our wallet</li>
              <li>2. Submit your payment reference below</li>
              <li>3. Admin verifies & activates your seller account (within 24hrs)</li>
              <li>4. Send your car details to admin via WhatsApp</li>
              <li>5. Admin lists your car — buyers start reaching out!</li>
            </ol>
          </div>
          <div className="mt-6 bg-slate-100 rounded-xl p-4">
            <p className="font-semibold text-slate-900 mb-1 text-sm">Payment Details</p>
            <p className="text-sm text-slate-600">🏦 Bank Transfer: Contact admin for account details</p>
            <p className="text-sm text-slate-600 mt-1">💰 USDT (TRC20/ERC20): Contact admin for wallet address</p>
            <a href={`https://wa.me/${ADMIN_WHATSAPP}?text=Hi%2C%20I%20want%20to%20become%20a%20seller%20on%20H-Autos.%20Please%20send%20me%20payment%20details.`} target="_blank" rel="noopener noreferrer" className="block mt-3">
              <Button variant="outline" size="sm" className="w-full gap-2 border-green-300 text-green-700 hover:bg-green-50"><MessageSquare className="w-4 h-4"/>Get Payment Details on WhatsApp</Button>
            </a>
          </div>
        </div>

        {/* Form */}
        <div>
          <Card className="shadow-lg">
            <CardContent className="p-6 space-y-5">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Submit Seller Request</h2>
                <p className="text-slate-500 text-sm mt-1">Fill this after making payment</p>
              </div>
              <div><Label>Full Name *</Label><Input value={form.full_name} onChange={e=>setForm(f=>({...f,full_name:e.target.value}))} placeholder="Your full name" className="mt-1"/></div>
              <div><Label>Phone Number *</Label><Input type="tel" value={form.phone} onChange={e=>setForm(f=>({...f,phone:e.target.value}))} placeholder="08012345678" className="mt-1"/></div>
              <div>
                <Label>WhatsApp Number * <Badge className="ml-1 text-[10px] bg-green-100 text-green-700 border-green-200">Required</Badge></Label>
                <Input type="tel" value={form.whatsapp} onChange={e=>setForm(f=>({...f,whatsapp:e.target.value}))} placeholder="+2348012345678" className="mt-1"/>
                <p className="text-xs text-slate-500 mt-1">Buyers will contact you here directly</p>
              </div>
              <div>
                <Label>Payment Method *</Label>
                <div className="grid grid-cols-2 gap-3 mt-2">
                  {[['naira',`₦${SELLER_FEE_NGN.toLocaleString()} NGN`],['usdt',`$${SELLER_FEE_USDT} USDT`]].map(([v,l])=>(
                    <button key={v} onClick={()=>setForm(f=>({...f,payment_method:v}))} className={`p-3 rounded-xl border-2 text-sm font-semibold transition-all ${form.payment_method===v?'border-amber-500 bg-amber-50 text-amber-700':'border-slate-200 hover:border-amber-200 text-slate-700'}`}>{l}</button>
                  ))}
                </div>
              </div>
              <div>
                <Label>Payment Reference / TxID *</Label>
                <Input value={form.payment_ref} onChange={e=>setForm(f=>({...f,payment_ref:e.target.value}))} placeholder="Bank ref, USDT transaction ID..." className="mt-1"/>
                <p className="text-xs text-slate-500 mt-1">The reference from your bank transfer or crypto transaction</p>
              </div>
              <Button onClick={handleSubmit} disabled={submitting} className="w-full h-12 bg-amber-500 hover:bg-amber-600 text-white font-semibold">
                {submitting ? <Loader2 className="w-5 h-5 animate-spin"/> : <>Submit Seller Request — {form.payment_method==='naira'?`₦${SELLER_FEE_NGN.toLocaleString()}`:`$${SELLER_FEE_USDT} USDT`}</>}
              </Button>
              <p className="text-xs text-slate-400 text-center">By submitting, your request will be sent directly to admin via WhatsApp for verification.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
