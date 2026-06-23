import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getStoreById, getCars } from '@/lib/supabase';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Phone, Globe, CheckCircle2, Store, ArrowLeft, Building2, Car, MessageSquare } from 'lucide-react';
import CarCard from '@/components/cars/CarCard';
import { Skeleton } from "@/components/ui/skeleton";

export default function StoreDetails() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');
  const navigate = useNavigate();

  const { data: store, isLoading } = useQuery({ queryKey: ['store', id], queryFn: () => getStoreById(id), enabled: !!id });
  const { data: cars = [] } = useQuery({ queryKey: ['storeCars', id], queryFn: () => getCars({ store_id: id, status: 'approved' }), enabled: !!id });

  if (isLoading) return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-4 border-slate-200 border-t-amber-500 rounded-full animate-spin"/></div>;
  if (!store) return (
    <div className="min-h-screen flex items-center justify-center text-center px-4">
      <div><Store className="w-16 h-16 text-slate-300 mx-auto mb-4"/><h2 className="text-2xl font-bold text-slate-900 mb-4">Store not found</h2><Button onClick={()=>navigate('/Stores')} className="bg-amber-500 hover:bg-amber-600 text-white">Browse Stores</Button></div>
    </div>
  );

  const waLink = `https://wa.me/${(store.whatsapp||'').replace(/\D/g,'')}?text=${encodeURIComponent(`Hi, I found your store on H-Autos Nigeria. I'm interested in your cars.`)}`;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Banner */}
      <div className="h-52 bg-gradient-to-br from-slate-800 to-slate-900 relative overflow-hidden">
        {store.banner_url && <img src={store.banner_url} alt="" className="w-full h-full object-cover opacity-50"/>}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"/>
        <div className="absolute top-4 left-4"><Button variant="ghost" onClick={()=>navigate(-1)} className="text-white hover:bg-white/20 gap-2"><ArrowLeft className="w-4 h-4"/>Back</Button></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 -mt-16 relative z-10">
        <div className="flex items-end gap-6 mb-8">
          <div className="w-24 h-24 rounded-2xl bg-white shadow-xl overflow-hidden border-4 border-white shrink-0">
            {store.logo_url ? <img src={store.logo_url} alt={store.name} className="w-full h-full object-cover"/> : <div className="w-full h-full flex items-center justify-center bg-amber-100"><Store className="w-12 h-12 text-amber-600"/></div>}
          </div>
          <div className="pb-2">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-3xl font-bold text-white drop-shadow-lg">{store.name}</h1>
              {store.is_verified && <Badge className="bg-emerald-500 border-0 shadow"><CheckCircle2 className="w-3 h-3 mr-1"/>RC Verified</Badge>}
            </div>
            {store.specialization && <p className="text-amber-400 font-medium mt-1">{store.specialization}</p>}
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            {store.description && (
              <Card className="mb-6"><CardContent className="p-6">
                <h2 className="font-bold text-slate-900 mb-3">About This Store</h2>
                <p className="text-slate-600 leading-relaxed">{store.description}</p>
              </CardContent></Card>
            )}
            <h2 className="font-bold text-xl text-slate-900 mb-4 flex items-center gap-2"><Car className="w-5 h-5 text-amber-500"/>Available Cars ({cars.length})</h2>
            {cars.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-2xl border"><Car className="w-12 h-12 text-slate-200 mx-auto mb-3"/><p className="text-slate-500">No cars listed yet</p></div>
            ) : (
              <div className="grid md:grid-cols-2 gap-6">{cars.map(car=><CarCard key={car.id} car={car}/>)}</div>
            )}
          </div>

          <div>
            <Card className="sticky top-24 shadow-lg">
              <CardContent className="p-6 space-y-4">
                <h3 className="font-bold text-slate-900">Contact This Store</h3>
                <a href={waLink} target="_blank" rel="noopener noreferrer">
                  <Button className="w-full bg-green-500 hover:bg-green-600 text-white h-12 gap-2"><MessageSquare className="w-5 h-5"/>WhatsApp Store</Button>
                </a>
                {store.phone && <a href={`tel:${store.phone}`}><Button variant="outline" className="w-full h-12 gap-2 border-slate-200 mt-2"><Phone className="w-5 h-5"/>Call Store</Button></a>}
                {store.website && <a href={store.website} target="_blank" rel="noopener noreferrer"><Button variant="outline" className="w-full h-12 gap-2 border-slate-200 mt-2"><Globe className="w-5 h-5"/>Visit Website</Button></a>}

                <div className="pt-3 border-t border-slate-100 space-y-2">
                  {(store.city||store.state) && <div className="flex items-center gap-2 text-sm text-slate-600"><MapPin className="w-4 h-4 text-slate-400"/>{store.city?`${store.city}, `:''}{store.state}</div>}
                  {store.address && <p className="text-sm text-slate-500 pl-6">{store.address}</p>}
                  {store.rc_number && <div className="flex items-center gap-2 text-sm text-slate-600"><Building2 className="w-4 h-4 text-slate-400"/>RC: {store.rc_number}</div>}
                  {store.years_in_business && <p className="text-sm text-slate-500 pl-6">{store.years_in_business} years in business</p>}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
