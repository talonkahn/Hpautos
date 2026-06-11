import AuthModal from '@/components/AuthModal';
import logo from '@/assets/logo.jpg';
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { createStore, uploadFile, sendEmailNotification, ADMIN_WHATSAPP, ADMIN_EMAIL } from '@/lib/supabase';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Store, Upload, CheckCircle2, Loader2, Building2, MessageSquare, AlertCircle } from 'lucide-react';
import { NIGERIAN_STATES } from '@/components/shared/NigerianStates';
import { CountrySelector, RegionSelector } from '@/components/shared/LocationSelector';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

const BENEFITS = [
  'Dedicated store page inside H-Autos',
  'RC number verified — investor-grade trust badge',
  'All your inventory in one branded page',
  'Buyers can browse your full stock',
  'WhatsApp enquiries direct to your line',
  'Pitch-ready for investor onboarding',
];

export default function RegisterStore() {
  const { user, profile, isAuthenticated } = useAuth();
  const [showAuth, setShowAuth] = useState(false);
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [form, setForm] = useState({
    name: '', rc_number: '', address: '', city: '', state: '',
    phone: '', whatsapp: '', email: '', website: '',
    description: '', logo_url: '', banner_url: '', years_in_business: '',
    specialization: '',
  });

  useEffect(() => {
    if (profile) setForm(f => ({ ...f, email: profile.email || user?.email || '', phone: profile.phone || '', whatsapp: profile.whatsapp || '' }));
  }, [profile]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleLogo = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingLogo(true);
    try { const url = await uploadFile(file, 'stores'); set('logo_url', url); }
    catch { toast.error('Logo upload failed'); }
    finally { setUploadingLogo(false); }
  };

  const handleSubmit = async () => {
    if (!form.name || !form.rc_number || !form.phone || !form.whatsapp || !form.state || !form.address) {
      toast.error('Fill all required fields including RC number'); return;
    }
    if (form.whatsapp.replace(/\D/g,'').length < 10) { toast.error('Enter valid WhatsApp number'); return; }
    setSubmitting(true);
    try {
      const store = await createStore({
        ...form, owner_id: user.id, owner_email: user.email,
        status: 'pending', is_verified: false,
      });
      await sendEmailNotification({
        to: ADMIN_EMAIL,
        subject: `New Store Registration – ${form.name}`,
        html: `<h2>New Store Registration</h2><p><b>${form.name}</b><br/>RC: ${form.rc_number}<br/>Owner: ${user.email}<br/>WhatsApp: ${form.whatsapp}<br/>State: ${form.state}, ${form.city}<br/>Address: ${form.address}</p><p>Please review and approve in Admin Dashboard.</p>`
      });
      const waMsg = encodeURIComponent(`🏪 New Store Registration!\n${form.name}\nRC: ${form.rc_number}\nOwner: ${user.email}\nWhatsApp: ${form.whatsapp}\n${form.state}`);
      window.open(`https://wa.me/${ADMIN_WHATSAPP}?text=${waMsg}`, '_blank');
      toast.success('Store registration submitted! Admin will review and verify your RC number.');
      navigate('/Stores');
    } catch(e) { console.error(e); toast.error('Submission failed.'); }
    finally { setSubmitting(false); }
  };

  if (!isAuthenticated) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <Card className="max-w-md w-full p-8 text-center">
        <Store className="w-16 h-16 text-amber-500 mx-auto mb-4"/>
        <h2 className="text-2xl font-bold mb-2">Sign in to register your store</h2>
        <Button onClick={() => setShowAuth(true)} className="w-full bg-amber-500 hover:bg-amber-600 text-white h-12 mt-4">Sign In / Register</Button>
      <AuthModal open={showAuth} onClose={() => setShowAuth(false)} />
      </Card>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white py-14">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <Badge className="mb-6 bg-blue-500/20 text-blue-400 border-blue-500/30 px-4 py-2">🏪 Car Stands & Dealerships</Badge>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Register Your Car Store</h1>
          <p className="text-xl text-slate-300 max-w-2xl mx-auto">Get your dealership or car stand on H-Autos. RC-verified stores build investor confidence and buyer trust.</p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-12 grid md:grid-cols-5 gap-8">
        <div className="md:col-span-2">
          <h2 className="text-xl font-bold text-slate-900 mb-5">Why register?</h2>
          <div className="space-y-3">
            {BENEFITS.map((b,i)=>(
              <motion.div key={i} initial={{opacity:0,x:-20}} animate={{opacity:1,x:0}} transition={{delay:i*0.07}} className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5"/><p className="text-slate-600 text-sm">{b}</p>
              </motion.div>
            ))}
          </div>
          <div className="mt-6 bg-blue-50 border border-blue-100 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2"><Building2 className="w-4 h-4 text-blue-600"/><p className="font-semibold text-blue-800 text-sm">Investor Pitch Ready</p></div>
            <p className="text-sm text-blue-700">H-Autos is actively building an investor-grade marketplace. RC-verified stores are featured in our pitch deck and investor reports.</p>
          </div>
          <div className="mt-4 bg-amber-50 border border-amber-100 rounded-xl p-4">
            <p className="font-semibold text-amber-800 text-sm mb-1">Free to Register</p>
            <p className="text-sm text-amber-700">Store registration is currently <b>free</b>. Admin reviews your RC number and approves within 48 hours.</p>
          </div>
        </div>

        <div className="md:col-span-3">
          <Card className="shadow-lg">
            <CardContent className="p-6 space-y-4">
              <h2 className="text-xl font-bold text-slate-900">Store Details</h2>

              {/* Logo upload */}
              <div>
                <Label>Store Logo</Label>
                <label className="mt-2 flex items-center gap-4 cursor-pointer">
                  <div className={`w-20 h-20 rounded-xl border-2 border-dashed flex items-center justify-center overflow-hidden ${form.logo_url?'border-amber-400':'border-slate-300'}`}>
                    {form.logo_url ? <img src={form.logo_url} alt="Logo" className="w-full h-full object-cover"/> : uploadingLogo ? <Loader2 className="w-6 h-6 animate-spin text-amber-500"/> : <Upload className="w-6 h-6 text-slate-400"/>}
                  </div>
                  <div><p className="text-sm font-medium text-slate-700">Upload Logo</p><p className="text-xs text-slate-500">PNG/JPG, recommended 400×400</p></div>
                  <input type="file" accept="image/*" onChange={handleLogo} className="hidden"/>
                </label>
              </div>

              <div><Label>Store / Business Name *</Label><Input value={form.name} onChange={e=>set('name',e.target.value)} placeholder="e.g. Lagos Premium Motors" className="mt-1"/></div>

              <div className="flex items-start gap-2 bg-emerald-50 border border-emerald-100 rounded-xl p-3">
                <AlertCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5"/>
                <p className="text-sm text-emerald-700"><b>RC Number required</b> — CAC-registered businesses only. Sole traders may provide BN number.</p>
              </div>
              <div><Label>RC / BN Number * <Badge className="ml-1 text-[10px] bg-blue-100 text-blue-700 border-blue-200">Verified by Admin</Badge></Label><Input value={form.rc_number} onChange={e=>set('rc_number',e.target.value)} placeholder="RC 1234567 or BN 8765432" className="mt-1"/></div>

              <div className="grid grid-cols-2 gap-4">
                <div><Label>Phone *</Label><Input type="tel" value={form.phone} onChange={e=>set('phone',e.target.value)} placeholder="08012345678" className="mt-1"/></div>
                <div><Label>WhatsApp *</Label><Input type="tel" value={form.whatsapp} onChange={e=>set('whatsapp',e.target.value)} placeholder="+2348012345678" className="mt-1"/></div>
              </div>
              <div><Label>Business Email</Label><Input type="email" value={form.email} onChange={e=>set('email',e.target.value)} placeholder="store@example.com" className="mt-1"/></div>
              <div><Label>Website (optional)</Label><Input value={form.website} onChange={e=>set('website',e.target.value)} placeholder="https://yourdealership.com" className="mt-1"/></div>
              <div><Label>Full Address *</Label><Input value={form.address} onChange={e=>set('address',e.target.value)} placeholder="123 Car Market Road" className="mt-1"/></div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>State *</Label>
  <CountrySelector value={form.country||'NG'} onChange={v=>setForm(f=>({...f,country:v,state:''}))} className="mt-1"/>
                </div>
                <div><Label>State / Region</Label><RegionSelector countryCode={form.country||'NG'} value={form.state} onChange={v=>set('state',v)} className="mt-1"/></div>
              </div>
              <div><Label>Specialization</Label><Input value={form.specialization} onChange={e=>set('specialization',e.target.value)} placeholder="e.g. Toyota Specialist, Luxury Cars, Commercial Vehicles" className="mt-1"/></div>
              <div><Label>Years in Business</Label><Input type="number" value={form.years_in_business} onChange={e=>set('years_in_business',e.target.value)} placeholder="e.g. 5" className="mt-1" min="0" max="100"/></div>
              <div><Label>About Your Store</Label><Textarea value={form.description} onChange={e=>set('description',e.target.value)} rows={3} placeholder="Tell buyers about your dealership, what you sell, your reputation..." className="mt-1 resize-none"/></div>

              <Button onClick={handleSubmit} disabled={submitting} className="w-full h-12 bg-amber-500 hover:bg-amber-600 text-white font-semibold">
                {submitting ? <Loader2 className="w-5 h-5 animate-spin"/> : <><Store className="w-5 h-5 mr-2"/>Submit Store Registration</>}
              </Button>
              <p className="text-xs text-slate-400 text-center">Admin will verify your RC number and approve within 48 hours. You'll be notified via WhatsApp.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
