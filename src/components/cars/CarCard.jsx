import React from 'react';
import { Link } from 'react-router-dom';
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart, MapPin, Gauge, Calendar, CheckCircle2, Star } from 'lucide-react';
import { formatPrice, getCountry } from '../shared/NigerianStates';
import { motion } from 'framer-motion';

export default function CarCard({ car, onSave, isSaved: isSavedProp }) {
  const conditionLabels = { brand_new: 'New', foreign_used: 'Foreign', nigerian_used: 'Local' };
  const savedIds = (() => { try { return JSON.parse(localStorage.getItem('savedCars') || '[]'); } catch { return []; } })();
  const isSaved = isSavedProp ?? savedIds.includes(car.id);
  const countryObj = car.country ? getCountry(car.country) : null;

  const toggle = (e) => {
    e.preventDefault();
    const saved = (() => { try { return JSON.parse(localStorage.getItem('savedCars') || '[]'); } catch { return []; } })();
    const next = saved.includes(car.id) ? saved.filter(x => x !== car.id) : [...saved, car.id];
    localStorage.setItem('savedCars', JSON.stringify(next));
    onSave?.(car.id);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} whileHover={{ y: -3 }} transition={{ duration: 0.2 }}>
      <Card className="group overflow-hidden bg-white border-0 shadow-sm hover:shadow-lg transition-all duration-300 h-full">
        {/* Image */}
        <div className="relative aspect-[4/3] overflow-hidden">
          <Link to={`/CarDetails?id=${car.id}`}>
            <img
              src={car.images?.[0] || 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=400'}
              alt={car.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              onError={e => { e.target.src = 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=400'; }}
            />
          </Link>

          {/* Badges top-left */}
          <div className="absolute top-1.5 left-1.5 flex flex-col gap-1">
            {car.is_featured && (
              <Badge className="bg-amber-500 border-0 text-[10px] px-1.5 py-0.5 shadow">
                <Star className="w-2.5 h-2.5 mr-0.5 fill-white" />Top
              </Badge>
            )}
          </div>

          {/* Save button */}
          <button
            onClick={toggle}
            className={`absolute top-1.5 right-1.5 w-7 h-7 rounded-full flex items-center justify-center transition-all shadow-sm ${isSaved ? 'bg-red-500 text-white' : 'bg-white/90 text-slate-500 hover:text-red-500'}`}
          >
            <Heart className={`w-3.5 h-3.5 ${isSaved ? 'fill-current' : ''}`} />
          </button>

          {/* Condition badge bottom */}
          <div className="absolute bottom-1.5 left-1.5">
            <Badge className={`text-[10px] px-1.5 py-0.5 border-0 shadow ${car.condition === 'brand_new' ? 'bg-emerald-500 text-white' : car.condition === 'foreign_used' ? 'bg-blue-500 text-white' : 'bg-slate-700 text-white'}`}>
              {conditionLabels[car.condition] || 'Used'}
            </Badge>
          </div>
        </div>

        {/* Content — compact */}
        <CardContent className="p-2.5">
          <Link to={`/CarDetails?id=${car.id}`}>
            <h3 className="font-semibold text-slate-900 text-xs leading-tight line-clamp-1 group-hover:text-amber-600 transition-colors mb-0.5">
              {car.title}
            </h3>
          </Link>

          {/* Stats row */}
          <div className="flex items-center gap-2 text-[10px] text-slate-400 mb-2">
            <span className="flex items-center gap-0.5"><Calendar className="w-3 h-3" />{car.year}</span>
            {car.mileage && <span className="flex items-center gap-0.5"><Gauge className="w-3 h-3" />{(car.mileage / 1000).toFixed(0)}k</span>}
            <span className="capitalize">{car.fuel_type || 'Petrol'}</span>
          </div>

          {/* Price + location */}
          <div className="flex items-center justify-between">
            <p className="font-bold text-slate-900 text-sm">{formatPrice(car.price, car.country)}</p>
            <div className="flex items-center gap-0.5 text-[10px] text-slate-400 max-w-[45%]">
              <span>{countryObj ? countryObj.flag : <MapPin className="w-2.5 h-2.5" />}</span>
              <span className="truncate">{car.state || car.country}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
