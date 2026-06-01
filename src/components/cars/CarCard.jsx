import React from 'react';
import { Link } from 'react-router-dom';
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart, MapPin, Gauge, Fuel, Calendar, CheckCircle2, Star } from 'lucide-react';
import { formatPrice } from '../shared/NigerianStates';
import { motion } from 'framer-motion';

export default function CarCard({ car, onSave, isSaved: isSavedProp }) {
  const conditionLabels = { brand_new:'Brand New', foreign_used:'Foreign Used', nigerian_used:'Nigerian Used' };
  const savedIds = JSON.parse(localStorage.getItem('savedCars') || '[]');
  const isSaved = isSavedProp ?? savedIds.includes(car.id);

  const toggle = (e) => {
    e.preventDefault();
    const saved = JSON.parse(localStorage.getItem('savedCars') || '[]');
    const next = saved.includes(car.id) ? saved.filter(x=>x!==car.id) : [...saved, car.id];
    localStorage.setItem('savedCars', JSON.stringify(next));
    onSave?.(car.id);
  };

  return (
    <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} whileHover={{y:-4}} transition={{duration:0.3}}>
      <Card className="group overflow-hidden bg-white border-0 shadow-sm hover:shadow-xl transition-all duration-500">
        <div className="relative aspect-[4/3] overflow-hidden">
          <Link to={`/CarDetails?id=${car.id}`}>
            <img src={car.images?.[0]||'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=600'} alt={car.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"/>
          </Link>
          <div className="absolute top-3 left-3 flex flex-col gap-2">
            {car.is_featured && <Badge className="bg-gradient-to-r from-amber-500 to-yellow-500 text-white border-0 shadow-lg"><Star className="w-3 h-3 mr-1"/>Featured</Badge>}
            {car.is_verified && <Badge className="bg-emerald-500 text-white border-0 shadow-lg"><CheckCircle2 className="w-3 h-3 mr-1"/>Verified</Badge>}
          </div>
          <Button size="icon" variant="ghost" onClick={toggle} className={`absolute top-3 right-3 h-10 w-10 rounded-full backdrop-blur-md transition-all ${isSaved?'bg-red-500 text-white hover:bg-red-600':'bg-white/80 text-slate-600 hover:bg-white hover:text-red-500'}`}>
            <Heart className={`w-5 h-5 ${isSaved?'fill-current':''}`}/>
          </Button>
          <div className="absolute bottom-3 left-3">
            <Badge variant="secondary" className={`backdrop-blur-md border-0 ${car.condition==='brand_new'?'bg-emerald-500/90 text-white':car.condition==='foreign_used'?'bg-blue-500/90 text-white':'bg-slate-700/90 text-white'}`}>
              {conditionLabels[car.condition]||'Used'}
            </Badge>
          </div>
        </div>
        <CardContent className="p-5">
          <Link to={`/CarDetails?id=${car.id}`}>
            <h3 className="font-semibold text-lg text-slate-900 mb-1 line-clamp-1 group-hover:text-amber-600 transition-colors">{car.title}</h3>
            <p className="text-sm text-slate-500 mb-3">{car.make} {car.model}</p>
          </Link>
          <div className="flex items-center gap-4 text-sm text-slate-500 mb-4">
            <span className="flex items-center gap-1"><Calendar className="w-4 h-4"/>{car.year}</span>
            {car.mileage && <span className="flex items-center gap-1"><Gauge className="w-4 h-4"/>{(car.mileage/1000).toFixed(0)}k km</span>}
            <span className="flex items-center gap-1 capitalize"><Fuel className="w-4 h-4"/>{car.fuel_type||'Petrol'}</span>
          </div>
          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <p className="text-2xl font-bold text-slate-900">{formatPrice(car.price)}</p>
            <div className="flex items-center text-sm text-slate-500"><MapPin className="w-4 h-4 mr-1"/>{car.state}</div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
