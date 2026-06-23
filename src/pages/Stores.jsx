import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getStores } from '@/lib/supabase';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Store, MapPin, Phone, CheckCircle2, Plus, Building2 } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Stores() {
  const { data: stores = [], isLoading } = useQuery({ queryKey: ['stores'], queryFn: () => getStores(true) });

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white py-14">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <Badge className="mb-6 bg-blue-500/20 text-blue-400 border-blue-500/30">Verified Dealerships</Badge>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Car Stores & Dealerships</h1>
          <p className="text-xl text-slate-300 max-w-xl mx-auto mb-8">Browse RC-verified car stands and dealerships on H-Autos. Every store is admin-approved.</p>
          <Link to="/RegisterStore">
            <Button className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-semibold h-12 px-8 gap-2"><Plus className="w-5 h-5"/>Register Your Store</Button>
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-12">
        {isLoading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_,i)=><Skeleton key={i} className="h-64 rounded-2xl"/>)}
          </div>
        ) : stores.length === 0 ? (
          <div className="text-center py-20">
            <Building2 className="w-16 h-16 text-slate-200 mx-auto mb-4"/>
            <h3 className="text-xl font-semibold text-slate-900 mb-2">No stores yet</h3>
            <p className="text-slate-500 mb-6">Be the first dealership on H-Autos Nigeria.</p>
            <Link to="/RegisterStore"><Button className="bg-amber-500 hover:bg-amber-600 text-white">Register Your Store</Button></Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {stores.map((store, i) => (
              <motion.div key={store.id} initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{delay:i*0.06}} whileHover={{y:-4}}>
                <Link to={`/StoreDetails?id=${store.id}`}>
                  <Card className="overflow-hidden hover:shadow-xl transition-all duration-300 group border-0 shadow-sm">
                    <div className="h-36 bg-gradient-to-br from-slate-800 to-slate-700 relative overflow-hidden">
                      {store.banner_url ? <img src={store.banner_url} alt="" className="w-full h-full object-cover opacity-60"/> : <div className="absolute inset-0 flex items-center justify-center"><Building2 className="w-16 h-16 text-white/20"/></div>}
                      <div className="absolute bottom-3 left-3">
                        <div className="w-14 h-14 rounded-xl bg-white shadow-lg overflow-hidden">
                          {store.logo_url ? <img src={store.logo_url} alt={store.name} className="w-full h-full object-cover"/> : <div className="w-full h-full flex items-center justify-center bg-amber-100"><Store className="w-7 h-7 text-amber-600"/></div>}
                        </div>
                      </div>
                      {store.is_verified && <Badge className="absolute top-3 right-3 bg-emerald-500 border-0 shadow-lg"><CheckCircle2 className="w-3 h-3 mr-1"/>RC Verified</Badge>}
                    </div>
                    <CardContent className="p-5 pt-4">
                      <h3 className="font-bold text-lg text-slate-900 group-hover:text-amber-600 transition-colors">{store.name}</h3>
                      {store.specialization && <p className="text-sm text-amber-600 font-medium mb-2">{store.specialization}</p>}
                      <div className="flex items-center gap-1 text-sm text-slate-500 mb-2"><MapPin className="w-3 h-3"/>{store.city ? `${store.city}, ` : ''}{store.state}</div>
                      {store.rc_number && <p className="text-xs text-slate-400">RC: {store.rc_number}</p>}
                      {store.years_in_business && <p className="text-xs text-slate-400">{store.years_in_business} years in business</p>}
                      <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
                        <span className="text-sm text-slate-500">View inventory</span>
                        <a href={`https://wa.me/${(store.whatsapp||'').replace(/\D/g,'')}`} target="_blank" rel="noopener noreferrer" onClick={e=>e.stopPropagation()}>
                          <Button size="sm" className="bg-green-500 hover:bg-green-600 text-white h-8 text-xs gap-1"><Phone className="w-3 h-3"/>WhatsApp</Button>
                        </a>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
