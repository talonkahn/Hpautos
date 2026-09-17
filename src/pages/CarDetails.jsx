import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getCarById, createEnquiry, ADMIN_WHATSAPP } from '@/lib/supabase';
import { useAuth } from '@/lib/AuthContext';
import AuthModal from '@/components/AuthModal';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Car, MapPin, Gauge, Fuel, Calendar, CheckCircle2, Star, MessageSquare, ChevronLeft, ChevronRight, ArrowLeft, Send, Store, Loader2, Key, ZoomIn } from 'lucide-react';
import { formatPrice } from '@/components/shared/NigerianStates';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import ImageLightbox from '@/components/cars/ImageLightbox';
import CryptoPaymentModal from '@/components/CryptoPaymentModal';


// WhatsApp SVG icon
const WAIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current shrink-0" xmlns="http://www.w3.org/2000/svg">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
    <path d="M12 0C5.373 0 0 5.373 0 12c0 2.125.554 4.122 1.52 5.859L0 24l6.335-1.505C8.05 23.443 9.99 24 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.833 0-3.552-.497-5.03-1.362l-.36-.213-3.761.894.952-3.666-.236-.375A9.937 9.937 0 0 1 2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
  </svg>
);

const conditionLabels = { brand_new: 'Brand New', foreign_used: 'Foreign Used', nigerian_used: 'Nigerian Used' };

export default function CarDetails() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [imgIdx, setImgIdx] = useState(0);
  const [showEnquiry, setShowEnquiry] = useState(false);
  const [showRent, setShowRent] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [pendingAction, setPendingAction] = useState(null); // 'whatsapp' | 'rent'
  const [enquiryForm, setEnquiryForm] = useState({ name: '', phone: '', whatsapp: '', message: '' });
  const [rentForm, setRentForm] = useState({ name: '', phone: '', whatsapp: '', pickupDate: '', returnDate: '', location: '', message: '' });
  const [submitting, setSubmitting] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxStart, setLightboxStart] = useState(0);
  const [cryptoOpen, setCryptoOpen] = useState(false);
  const [cryptoType, setCryptoType] = useState('buy');

  const { data: car, isLoading } = useQuery({
    queryKey: ['car', id],
    queryFn: () => getCarById(id),
    enabled: !!id
  });

  const images = car?.images?.length ? car.images : ['https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=800'];

  // ── Buy / contact seller flow ───────────────────────────────────────────
  // No login needed — any guest can WhatsApp the seller directly
  const handleWhatsAppClick = () => { openWhatsApp(); };
  const openWhatsApp = () => {
    const phone = (car.seller_whatsapp || car.profiles?.whatsapp || ADMIN_WHATSAPP).replace(/\D/g, '');
    const msg = `Hi, I found the *${car.title}* on HP-Autos for ${formatPrice(car.price, car.country)}. Is it still available?`;
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  // ── Rent flow ────────────────────────────────────────────────────────────
  const handleRentClick = () => {
    if (!isAuthenticated) { setPendingAction('rent'); setShowAuth(true); return; }
    setShowRent(true);
  };
  const handleRentSubmit = async () => {
    if (!rentForm.name || !rentForm.phone) { toast.error('Enter your name and phone'); return; }
    setSubmitting(true);
    try {
      await createEnquiry({
        car_id: car.id, car_title: car.title, car_price: car.price,
        buyer_name: rentForm.name, buyer_phone: rentForm.phone,
        buyer_whatsapp: rentForm.whatsapp || rentForm.phone,
        message: `[RENTAL REQUEST] ${rentForm.message || ''} | Pickup: ${rentForm.pickupDate || 'N/A'} | Return: ${rentForm.returnDate || 'N/A'} | Location: ${rentForm.location || 'N/A'}`,
        user_id: user?.id || null,
      });
      const msg = `🔑 *Car RENTAL Request — HP-Autos*\n\n*Car:* ${car.title}\n*Listed Price:* ${formatPrice(car.price, car.country)}\n\n*Renter:* ${rentForm.name}\n*Phone:* ${rentForm.phone}\n${rentForm.whatsapp ? `*WhatsApp:* ${rentForm.whatsapp}\n` : ''}*Pickup Date:* ${rentForm.pickupDate || 'Not specified'}\n*Return Date:* ${rentForm.returnDate || 'Not specified'}\n*Pickup Location:* ${rentForm.location || 'Not specified'}\n${rentForm.message ? `*Notes:* ${rentForm.message}\n` : ''}\n_Please confirm rental availability and pricing._`;
      window.open(`https://wa.me/${ADMIN_WHATSAPP}?text=${encodeURIComponent(msg)}`, '_blank');
      toast.success('Rental request sent! Admin will confirm availability shortly.');
      setShowRent(false);
    } catch { toast.error('Failed to send. Please try again.'); }
    finally { setSubmitting(false); }
  };

  // ── General enquiry flow ────────────────────────────────────────────────
  const handleEnquiry = async () => {
    if (!enquiryForm.name || !enquiryForm.phone) { toast.error('Enter your name and phone'); return; }
    setSubmitting(true);
    try {
      await createEnquiry({
        car_id: car.id, car_title: car.title, car_price: car.price,
        buyer_name: enquiryForm.name, buyer_phone: enquiryForm.phone,
        buyer_whatsapp: enquiryForm.whatsapp || enquiryForm.phone,
        message: enquiryForm.message || `Interested in ${car.title}`,
        user_id: user?.id || null,
      });
      const msg = `🚗 *Car Enquiry — HP-Autos*\n\n*Car:* ${car.title}\n*Price:* ${formatPrice(car.price, car.country)}\n\n*Buyer:* ${enquiryForm.name}\n*Phone:* ${enquiryForm.phone}\n${enquiryForm.whatsapp ? `*WhatsApp:* ${enquiryForm.whatsapp}\n` : ''}*Message:* ${enquiryForm.message || 'Interested, please contact me'}`;
      window.open(`https://wa.me/${ADMIN_WHATSAPP}?text=${encodeURIComponent(msg)}`, '_blank');
      toast.success('Enquiry sent! Admin will contact you shortly.');
      setShowEnquiry(false);
    } catch { toast.error('Failed to send. Try the WhatsApp button directly.'); }
    finally { setSubmitting(false); }
  };

  // After auth closes, resume whichever action was pending
  const handleAuthClose = () => {
    setShowAuth(false);
    if (isAuthenticated && car) {
      setTimeout(() => {
        if (pendingAction === 'whatsapp') openWhatsApp();
        if (pendingAction === 'rent') setShowRent(true);
        setPendingAction(null);
      }, 300);
    }
  };

  if (isLoading) return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-4 border-slate-200 border-t-amber-500 rounded-full animate-spin" /></div>;
  if (!car) return (
    <div className="min-h-screen flex items-center justify-center text-center px-4">
      <div><Car className="w-16 h-16 text-slate-300 mx-auto mb-4" /><h2 className="text-2xl font-bold mb-2">Car not found</h2><Button onClick={() => navigate('/Browse')} className="mt-4 bg-amber-500 hover:bg-amber-600 text-white">Browse Cars</Button></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-8">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4 sm:mb-6 gap-2 text-slate-600 text-sm"><ArrowLeft className="w-4 h-4" />Back</Button>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left: Images + Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Gallery */}
            <div className="relative rounded-xl sm:rounded-2xl overflow-hidden bg-black aspect-[4/3] sm:aspect-[16/10]">
              <img
                src={images[imgIdx]}
                alt={car.title}
                className="w-full h-full object-cover cursor-zoom-in"
                onClick={() => { setLightboxStart(imgIdx); setLightboxOpen(true); }}
              />
              {/* Zoom hint overlay */}
              <div
                onClick={() => { setLightboxStart(imgIdx); setLightboxOpen(true); }}
                className="absolute inset-0 flex items-end justify-end p-3 opacity-0 group-hover:opacity-100 transition-opacity cursor-zoom-in pointer-events-none"
              >
                <div className="bg-black/60 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-lg flex items-center gap-1 pointer-events-none">
                  <ZoomIn className="w-3 h-3" /> View photos
                </div>
              </div>
              {images.length > 1 && (
                <>
                  <button onClick={() => setImgIdx(i => (i - 1 + images.length) % images.length)} className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/50 text-white rounded-full w-10 h-10 flex items-center justify-center hover:bg-black/70"><ChevronLeft className="w-5 h-5" /></button>
                  <button onClick={() => setImgIdx(i => (i + 1) % images.length)} className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/50 text-white rounded-full w-10 h-10 flex items-center justify-center hover:bg-black/70"><ChevronRight className="w-5 h-5" /></button>
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                    {images.map((_, i) => <div key={i} onClick={() => setImgIdx(i)} className={`h-2 rounded-full cursor-pointer transition-all ${i === imgIdx ? 'bg-white w-4' : 'bg-white/50 w-2'}`} />)}
                  </div>
                </>
              )}
              <div className="absolute top-3 left-3 flex gap-2">
                {car.is_featured && <Badge className="bg-amber-500 border-0"><Star className="w-3 h-3 mr-1" />Featured</Badge>}
                {car.is_verified && <Badge className="bg-emerald-500 border-0"><CheckCircle2 className="w-3 h-3 mr-1" />Verified</Badge>}
              </div>
            </div>
            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {images.map((img, i) => <img key={i} src={img} alt="" onClick={() => setImgIdx(i)} className={`w-20 h-16 object-cover rounded-lg cursor-pointer shrink-0 border-2 ${i === imgIdx ? 'border-amber-500' : 'border-transparent hover:border-slate-300'}`} />)}
              </div>
            )}

            {/* Store Badge */}
            {car.stores && (
              <div className="flex items-center gap-3 bg-blue-50 border border-blue-100 rounded-xl p-4 cursor-pointer hover:bg-blue-100 transition-colors" onClick={() => navigate(`/StoreDetails?id=${car.store_id}`)}>
                <div className="w-12 h-12 rounded-xl bg-white overflow-hidden shadow-sm flex items-center justify-center border">
                  {car.stores.logo_url ? <img src={car.stores.logo_url} alt="" className="w-full h-full object-cover" /> : <Store className="w-6 h-6 text-blue-500" />}
                </div>
                <div><p className="font-semibold text-slate-900">{car.stores.name}</p>{car.stores.rc_number && <p className="text-xs text-slate-500 flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-emerald-500" />RC: {car.stores.rc_number}</p>}</div>
                <Badge className="ml-auto bg-blue-100 text-blue-700 border-0">View Store</Badge>
              </div>
            )}

            {/* Details Card */}
            <Card>
              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 sm:gap-4 mb-4">
                  <div><h1 className="text-xl sm:text-2xl font-bold text-slate-900">{car.title}</h1><p className="text-sm sm:text-base text-slate-500">{car.make} {car.model} · {car.year}</p></div>
                  <div className="sm:text-right"><p className="text-2xl sm:text-3xl font-bold text-amber-600">{formatPrice(car.price, car.country)}</p><Badge className={car.condition === 'brand_new' ? 'bg-emerald-100 text-emerald-700' : car.condition === 'foreign_used' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-700'}>{conditionLabels[car.condition] || 'Used'}</Badge></div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-4 border-y border-slate-100">
                  {[{ icon: Calendar, label: 'Year', value: car.year }, { icon: Gauge, label: 'Mileage', value: car.mileage ? `${(car.mileage / 1000).toFixed(0)}k km` : 'N/A' }, { icon: Fuel, label: 'Fuel', value: car.fuel_type || 'Petrol' }, { icon: Car, label: 'Gearbox', value: car.transmission || 'Automatic' }].map(({ icon: Icon, label, value }) => (
                    <div key={label} className="text-center"><Icon className="w-5 h-5 text-slate-400 mx-auto mb-1" /><p className="text-xs text-slate-500">{label}</p><p className="font-semibold text-slate-900 capitalize">{value}</p></div>
                  ))}
                </div>
                {car.description && <div className="mt-4"><h3 className="font-semibold text-slate-900 mb-2">Description</h3><p className="text-slate-600 leading-relaxed whitespace-pre-line">{car.description}</p></div>}
                {car.features?.length > 0 && <div className="mt-4"><h3 className="font-semibold text-slate-900 mb-3">Features</h3><div className="flex flex-wrap gap-2">{car.features.map(f => <Badge key={f} variant="outline" className="text-slate-700">{f}</Badge>)}</div></div>}
                <div className="flex items-center gap-2 mt-4 text-sm text-slate-500"><MapPin className="w-4 h-4" />{car.city ? `${car.city}, ` : ''}{car.state}</div>
              </CardContent>
            </Card>
          </div>

          {/* Right: Contact / Buy / Rent */}
          <div>
            <Card className="sticky top-28 sm:top-32 shadow-lg">
              <CardContent className="p-6 space-y-4">
                <h3 className="font-semibold text-slate-900 text-lg">Interested in this car?</h3>

<Button
                  onClick={handleWhatsAppClick}
                  className="w-full h-12 bg-green-500 hover:bg-green-600 text-white font-semibold gap-2"
                >
                  <MessageSquare className="w-5 h-5" />
                  {'WhatsApp Seller / Admin'}
                </Button>

                <Button
                  onClick={handleRentClick}
                  className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-semibold gap-2"
                >
                  <Key className="w-5 h-5" />
                  Rent This Car
                </Button>

                <Button onClick={() => setShowEnquiry(true)} variant="outline" className="w-full h-12 gap-2 border-amber-200 text-amber-700 hover:bg-amber-50">
                  <Send className="w-4 h-4" />Send Enquiry to Admin
                </Button>

                <div className="border-t border-slate-100 pt-4">
                  <p className="text-xs text-slate-500 font-semibold mb-2 flex items-center gap-1.5">₿ Pay with Crypto</p>
                  <div className="grid grid-cols-2 gap-2">
                    <button onClick={() => { setCryptoType('buy'); setCryptoOpen(true); }}
                      className="flex items-center justify-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl py-2.5 text-xs font-semibold transition-all">
                      <span>₿</span> Buy with Crypto
                    </button>
                    <button onClick={() => { setCryptoType('rent'); setCryptoOpen(true); }}
                      className="flex items-center justify-center gap-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl py-2.5 text-xs font-semibold transition-all">
                      <span>🔑</span> Rent with Crypto
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1.5 text-center">BTC · ETH · SOL · USDT · NFT wallets</p>
                </div>

                <Separator />
                <div className="text-xs text-slate-500 space-y-1.5">
                  <p className="flex items-center gap-1.5"><CheckCircle2 className="w-3 h-3 text-emerald-500" />Admin-verified listing</p>
                  <p className="flex items-center gap-1.5"><CheckCircle2 className="w-3 h-3 text-emerald-500" />All enquiries go through HP-Autos admin</p>
                  <p className="flex items-center gap-1.5"><CheckCircle2 className="w-3 h-3 text-emerald-500" />Always inspect before payment</p>
                </div>
                {car.video_url && <a href={car.video_url} target="_blank" rel="noopener noreferrer"><Button variant="outline" className="w-full gap-2 h-10">▶ Watch Video</Button></a>}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Enquiry Modal */}
      <Dialog open={showEnquiry} onOpenChange={setShowEnquiry}>
        <DialogContent className="w-[95vw] sm:w-full max-w-md rounded-2xl">
          <DialogHeader><DialogTitle>Send Car Enquiry</DialogTitle></DialogHeader>
          <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 text-sm text-amber-800 mb-2">
            <p className="font-semibold">{car.title}</p><p>{formatPrice(car.price, car.country)}</p>
          </div>
          <div className="space-y-4">
            <div><Label>Your Name *</Label><Input value={enquiryForm.name} onChange={e => setEnquiryForm(f => ({ ...f, name: e.target.value }))} className="mt-1" placeholder="Full name" /></div>
            <div><Label>Phone *</Label><Input type="tel" value={enquiryForm.phone} onChange={e => setEnquiryForm(f => ({ ...f, phone: e.target.value }))} className="mt-1" placeholder="08012345678" /></div>
            <div><Label>WhatsApp</Label><Input type="tel" value={enquiryForm.whatsapp} onChange={e => setEnquiryForm(f => ({ ...f, whatsapp: e.target.value }))} className="mt-1" placeholder="+2348012345678" /></div>
            <div><Label>Message</Label><Textarea value={enquiryForm.message} onChange={e => setEnquiryForm(f => ({ ...f, message: e.target.value }))} className="mt-1 resize-none" rows={3} placeholder="Is this car still available?" /></div>
            <p className="text-xs text-slate-500">Your enquiry will be sent to HP-Autos admin (+234 814 673 0044) who will connect you with the seller.</p>
            <Button onClick={handleEnquiry} disabled={submitting} className="w-full bg-amber-500 hover:bg-amber-600 text-white h-12">
              {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Send className="w-4 h-4 mr-2" />Send via WhatsApp</>}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Rent Modal */}
      <Dialog open={showRent} onOpenChange={setShowRent}>
        <DialogContent className="w-[95vw] sm:w-full max-w-md rounded-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><Key className="w-5 h-5 text-blue-600" />Rent This Car</DialogTitle></DialogHeader>
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 text-sm text-blue-800 mb-2">
            <p className="font-semibold">{car.title}</p><p>Listed at {formatPrice(car.price, car.country)} · {car.state}</p>
          </div>
          <div className="space-y-4">
            <div><Label>Your Name *</Label><Input value={rentForm.name} onChange={e => setRentForm(f => ({ ...f, name: e.target.value }))} className="mt-1" placeholder="Full name" /></div>
            <div><Label>Phone *</Label><Input type="tel" value={rentForm.phone} onChange={e => setRentForm(f => ({ ...f, phone: e.target.value }))} className="mt-1" placeholder="08012345678" /></div>
            <div><Label>WhatsApp</Label><Input type="tel" value={rentForm.whatsapp} onChange={e => setRentForm(f => ({ ...f, whatsapp: e.target.value }))} className="mt-1" placeholder="+2348012345678" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Pickup Date</Label><Input type="date" value={rentForm.pickupDate} onChange={e => setRentForm(f => ({ ...f, pickupDate: e.target.value }))} className="mt-1" /></div>
              <div><Label>Return Date</Label><Input type="date" value={rentForm.returnDate} onChange={e => setRentForm(f => ({ ...f, returnDate: e.target.value }))} className="mt-1" /></div>
            </div>
            <div><Label>Pickup Location</Label><Input value={rentForm.location} onChange={e => setRentForm(f => ({ ...f, location: e.target.value }))} className="mt-1" placeholder="e.g. Lagos Airport, City center..." /></div>
            <div><Label>Additional Notes</Label><Textarea value={rentForm.message} onChange={e => setRentForm(f => ({ ...f, message: e.target.value }))} className="mt-1 resize-none" rows={2} placeholder="Any special requirements?" /></div>
            <p className="text-xs text-slate-500">Your rental request will be sent to HP-Autos admin (+234 814 673 0044) to confirm availability and rates.</p>
            <Button onClick={handleRentSubmit} disabled={submitting} className="w-full bg-blue-600 hover:bg-blue-700 text-white h-12">
              {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Key className="w-4 h-4 mr-2" />Send Rental Request via WhatsApp</>}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Crypto Payment Modal */}
      <CryptoPaymentModal
        open={cryptoOpen}
        onClose={() => setCryptoOpen(false)}
        car={car}
        type={cryptoType}
        priceUSD={car ? (car.country === 'US' ? car.price : Math.round(car.price / 1600)) : 0}
      />

      {/* Image Lightbox */}
      <ImageLightbox
        images={images}
        startIndex={lightboxStart}
        open={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
      />

      {/* Auth Modal — triggered when unauthenticated user tries WhatsApp / Rent */}
      <AuthModal
        open={showAuth}
        onClose={handleAuthClose}
        defaultTab="register"
        redirectMessage={pendingAction === 'rent' ? 'Create a free account to request a rental' : 'Create a free account to contact the seller on WhatsApp'}
      />
    </div>
  );
}
