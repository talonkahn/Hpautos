import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Heart, MapPin, Gauge, Calendar, Star } from 'lucide-react';
import { formatPrice, getCountry } from '../shared/NigerianStates';
import { motion } from 'framer-motion';

const ADMIN_WA = '2348146730044';

const getSavedIds = () => { try { return JSON.parse(localStorage.getItem('savedCars') || '[]'); } catch { return []; } };
const broadcastSave = (ids) => { localStorage.setItem('savedCars', JSON.stringify(ids)); window.dispatchEvent(new CustomEvent('savedCarsChanged', { detail: ids })); };

const WAIcon = () => (
  <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current shrink-0" xmlns="http://www.w3.org/2000/svg">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
    <path d="M12 0C5.373 0 0 5.373 0 12c0 2.125.554 4.122 1.52 5.859L0 24l6.335-1.505C8.05 23.443 9.99 24 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.833 0-3.552-.497-5.03-1.362l-.36-.213-3.761.894.952-3.666-.236-.375A9.937 9.937 0 0 1 2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
  </svg>
);

export default function CarCard({ car, onSave, isSaved: isSavedProp }) {
  const conditionLabels = { brand_new: 'New', foreign_used: 'Foreign', nigerian_used: 'Local' };
  const countryObj = car.country ? getCountry(car.country) : null;

  const [isSaved, setIsSaved] = useState(() => isSavedProp !== undefined ? isSavedProp : getSavedIds().includes(car.id));

  useEffect(() => {
    if (isSavedProp !== undefined) { setIsSaved(isSavedProp); return; }
    const handler = (e) => setIsSaved((e.detail || []).includes(car.id));
    window.addEventListener('savedCarsChanged', handler);
    return () => window.removeEventListener('savedCarsChanged', handler);
  }, [car.id, isSavedProp]);

  const toggle = (e) => {
    e.preventDefault(); e.stopPropagation();
    const current = getSavedIds();
    const next = current.includes(car.id) ? current.filter(x => x !== car.id) : [...current, car.id];
    broadcastSave(next);
    setIsSaved(next.includes(car.id));
    onSave?.(car.id);
  };

  // WhatsApp — no login needed, works for any guest
  const openWhatsApp = (e) => {
    e.preventDefault(); e.stopPropagation();
    const phone = (car.seller_whatsapp || car.profiles?.whatsapp || ADMIN_WA).replace(/\D/g, '');
    const msg = `Hi! I'm interested in the *${car.title}* on HP-Autos (${formatPrice(car.price, car.country)}). Is it still available?`;
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} whileHover={{ y: -3 }} transition={{ duration: 0.2 }}>
      <Card className="group overflow-hidden bg-white border-0 shadow-sm hover:shadow-lg transition-all duration-300 h-full">

        {/* Image */}
        <div className="relative aspect-[4/3] overflow-hidden">
          <Link to={`/CarDetails?id=${car.id}`} className="block w-full h-full">
            <img
              src={car.images?.[0] || 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=400'}
              alt={car.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              onError={e => { e.target.src = 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=400'; }}
              loading="lazy"
            />
          </Link>

          {car.is_featured && (
            <div className="absolute top-1.5 left-1.5">
              <Badge className="bg-amber-500 border-0 text-[10px] px-1.5 py-0.5 shadow"><Star className="w-2.5 h-2.5 mr-0.5 fill-white" />Top</Badge>
            </div>
          )}

          {/* Heart — top right */}
          <button onClick={toggle} aria-label="Save"
            className={`absolute top-1.5 right-1.5 w-7 h-7 rounded-full flex items-center justify-center transition-all duration-200 shadow-sm ${isSaved ? 'bg-red-500 text-white scale-110' : 'bg-white/90 text-slate-400 hover:text-red-500 hover:scale-110'}`}>
            <Heart className={`w-3.5 h-3.5 ${isSaved ? 'fill-current' : ''}`} />
          </button>

          {/* Condition — bottom left */}
          <div className="absolute bottom-1.5 left-1.5">
            <Badge className={`text-[10px] px-1.5 py-0.5 border-0 shadow ${car.condition === 'brand_new' ? 'bg-emerald-500 text-white' : car.condition === 'foreign_used' ? 'bg-blue-500 text-white' : 'bg-slate-700/90 text-white'}`}>
              {conditionLabels[car.condition] || 'Used'}
            </Badge>
          </div>

          {/* WhatsApp pill — bottom right, always visible, no login needed */}
          <button onClick={openWhatsApp}
            className="absolute bottom-1.5 right-1.5 h-6 px-2 bg-green-500 hover:bg-green-600 text-white rounded-full flex items-center gap-1 text-[10px] font-semibold shadow-md transition-all hover:scale-105 active:scale-95">
            <WAIcon /><span>Chat</span>
          </button>
        </div>

        {/* Content */}
        <CardContent className="p-2.5">
          <Link to={`/CarDetails?id=${car.id}`}>
            <h3 className="font-semibold text-slate-900 text-xs leading-tight line-clamp-1 group-hover:text-amber-600 transition-colors mb-0.5">{car.title}</h3>
          </Link>

          <div className="flex items-center gap-2 text-[10px] text-slate-400 mb-1.5 flex-wrap">
            <span className="flex items-center gap-0.5"><Calendar className="w-3 h-3" />{car.year}</span>
            {car.mileage > 0 && <span className="flex items-center gap-0.5"><Gauge className="w-3 h-3" />{(car.mileage / 1000).toFixed(0)}k</span>}
            <span className="capitalize">{car.fuel_type || 'Petrol'}</span>
          </div>

          <div className="flex items-center justify-between gap-1 mb-2">
            <p className="font-bold text-slate-900 text-sm leading-none">{formatPrice(car.price, car.country)}</p>
            <div className="flex items-center gap-0.5 text-[10px] text-slate-400 min-w-0">
              <span className="shrink-0">{countryObj ? countryObj.flag : <MapPin className="w-2.5 h-2.5" />}</span>
              <span className="truncate">{car.state || car.country}</span>
            </div>
          </div>

        </CardContent>
      </Card>
    </motion.div>
  );
}
