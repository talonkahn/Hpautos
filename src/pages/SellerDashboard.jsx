import logo from '@/assets/logo.jpg';
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { getCars, ADMIN_WHATSAPP, SELLER_DURATION_DAYS } from '@/lib/supabase';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Car, Eye, Crown, Clock, CheckCircle2, AlertCircle, MessageSquare, UserCheck, Store, ArrowRight } from 'lucide-react';
import { formatPrice } from '@/components/shared/NigerianStates';
import { motion } from 'framer-motion';

export default function SellerDashboard() {
  const { user, profile, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const { data: cars = [], isLoading } = useQuery({
    queryKey: ['sellerCars', user?.id],
    queryFn: () => getCars({ seller_id: user.id }),
    enabled: !!user?.id
  });

  const activeCars = cars.filter(c => c.status === 'approved');
  const pendingCars = cars.filter(c => c.status === 'pending');
  const totalViews = cars.reduce((s, c) => s + (c.views || 0), 0);
  const isSeller = profile?.seller_active === true;
  const isPremium = profile?.subscription_status === 'premium';
  const sellerExpiry = profile?.seller_expiry ? new Date(profile.seller_expiry) : null;
  const daysLeft = sellerExpiry ? Math.max(0, Math.ceil((sellerExpiry - new Date()) / (1000 * 60 * 60 * 24))) : 0;
  const expiringSoon = isSeller && daysLeft <= 3;

  const [showAuth, setShowAuth] = useState(false);
  if (!isAuthenticated) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <Card className="max-w-md w-full p-8 text-center">
        <div className="flex justify-center mb-4"><img src={logo} alt="HP-Autos" className="h-14 w-auto object-contain"/></div>
        <h2 className="text-2xl font-bold mb-2">Sign in to view your dashboard</h2>
        <p className="text-slate-500 mb-4">Use your email to access your seller dashboard.</p>
        <Button onClick={() => setShowAuth(true)} className="w-full bg-amber-500 hover:bg-amber-600 text-white h-12 mt-2">Sign In / Register</Button>
      </Card>
      <AuthModal open={showAuth} onClose={() => setShowAuth(false)} />
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <h1 className="text-2xl font-bold text-slate-900">My Dashboard</h1>
          <p className="text-slate-500">Welcome back, {profile?.full_name?.split(' ')[0] || 'there'}</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">

        {/* Seller Status Card */}
        {isSeller ? (
          <>
            {expiringSoon && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-red-500 shrink-0"/>
                <div className="flex-1">
                  <p className="font-semibold text-red-800">Seller access expiring in {daysLeft} day{daysLeft!==1?'s':''}!</p>
                  <p className="text-sm text-red-600">Renew now to keep your cars listed.</p>
                </div>
                <a href={`https://wa.me/${ADMIN_WHATSAPP}?text=Hi%2C%20I%20need%20to%20renew%20my%20seller%20subscription%20on%20H-Autos.%20Email%3A%20${user?.email}`} target="_blank" rel="noopener noreferrer">
                  <Button size="sm" className="bg-red-500 hover:bg-red-600 text-white shrink-0">Renew</Button>
                </a>
              </div>
            )}
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center"><CheckCircle2 className="w-6 h-6 text-emerald-600"/></div>
                  <div>
                    <p className="font-bold text-emerald-900">Active Seller Account</p>
                    {sellerExpiry && <p className="text-sm text-emerald-700">Expires {sellerExpiry.toLocaleDateString('en-NG', {day:'numeric',month:'long',year:'numeric'})} · {daysLeft} days left</p>}
                  </div>
                </div>
                <a href={`https://wa.me/${ADMIN_WHATSAPP}?text=Hi%2C%20I%20am%20an%20active%20seller%20on%20H-Autos%20(${user?.email}).%20I%20would%20like%20to%20submit%20a%20car%20for%20listing.`} target="_blank" rel="noopener noreferrer">
                  <Button className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2"><MessageSquare className="w-4 h-4"/>Submit Car to Admin</Button>
                </a>
              </div>
            </div>
          </>
        ) : (
          <div className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl p-5 text-white">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-3">
                <UserCheck className="w-10 h-10 opacity-80 shrink-0"/>
                <div>
                  <p className="font-bold text-lg">Become a Seller</p>
                  <p className="text-white/80 text-sm">Pay ₦3,000 or $5 USDT for {SELLER_DURATION_DAYS}-day seller access. Admin lists your car for you.</p>
                </div>
              </div>
              <Link to="/BecomeSeller">
                <Button className="bg-white text-amber-600 hover:bg-amber-50 font-semibold gap-2 shrink-0">Get Seller Access <ArrowRight className="w-4 h-4"/></Button>
              </Link>
            </div>
          </div>
        )}

        {/* Register Store CTA */}
        <div className="bg-slate-800 text-white rounded-xl p-5 flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <Store className="w-10 h-10 text-amber-400 shrink-0"/>
            <div>
              <p className="font-bold">Own a car stand or dealership?</p>
              <p className="text-slate-300 text-sm">Register your store for free — get an RC-verified store page on H-Autos.</p>
            </div>
          </div>
          <Link to="/RegisterStore">
            <Button className="bg-amber-500 hover:bg-amber-600 text-white font-semibold gap-2 shrink-0">Register Store <ArrowRight className="w-4 h-4"/></Button>
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            {label:'Active Listings',value:activeCars.length,icon:CheckCircle2,color:'emerald'},
            {label:'Pending Review',value:pendingCars.length,icon:Clock,color:'amber'},
            {label:'Total Views',value:totalViews,icon:Eye,color:'blue'},
            {label:'Total Listed',value:cars.length,icon:Car,color:'slate'},
          ].map(({label,value,icon:Icon,color})=>(
            <motion.div key={label} initial={{opacity:0,y:20}} animate={{opacity:1,y:0}}>
              <Card><CardContent className="p-5">
                <div className={`w-10 h-10 rounded-xl bg-${color}-100 flex items-center justify-center mb-3`}><Icon className={`w-5 h-5 text-${color}-600`}/></div>
                <p className="text-2xl font-bold text-slate-900">{value}</p>
                <p className="text-sm text-slate-500">{label}</p>
              </CardContent></Card>
            </motion.div>
          ))}
        </div>

        {/* Cars listed by admin on behalf of this seller */}
        <div>
          <h2 className="text-xl font-bold text-slate-900 mb-4">Your Listed Cars</h2>
          {isLoading ? (
            <div className="space-y-3">{[...Array(3)].map((_,i)=><Skeleton key={i} className="h-24 rounded-xl"/>)}</div>
          ) : cars.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-slate-200">
              <Car className="w-12 h-12 text-slate-300 mx-auto mb-3"/>
              <p className="font-medium text-slate-600 mb-1">No listings yet</p>
              {isSeller
                ? <><p className="text-slate-500 text-sm mb-4">Submit your car details to admin on WhatsApp to get listed.</p>
                    <a href={`https://wa.me/${ADMIN_WHATSAPP}?text=Hi%2C%20I%20am%20a%20seller%20on%20H-Autos%20(${user?.email}).%20I%20would%20like%20to%20list%20a%20car.`} target="_blank" rel="noopener noreferrer">
                      <Button className="bg-amber-500 hover:bg-amber-600 text-white gap-2"><MessageSquare className="w-4 h-4"/>Message Admin to List</Button>
                    </a></>
                : <><p className="text-slate-500 text-sm mb-4">Become a seller to get your car listed on H-Autos.</p>
                    <Link to="/BecomeSeller"><Button className="bg-amber-500 hover:bg-amber-600 text-white">Become a Seller</Button></Link></>
              }
            </div>
          ) : (
            <div className="space-y-4">
              {cars.map(car => (
                <Card key={car.id} className="overflow-hidden">
                  <CardContent className="p-0">
                    <div className="flex gap-0">
                      <img src={car.images?.[0]||'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=300'} alt={car.title} className="w-28 h-24 object-cover shrink-0"/>
                      <div className="flex-1 p-4 flex items-center justify-between gap-4">
                        <div>
                          <h3 className="font-semibold text-slate-900">{car.title}</h3>
                          <p className="text-sm text-slate-500">{car.state} · {formatPrice(car.price)}</p>
                          <div className="flex items-center gap-3 mt-1 text-sm text-slate-400">
                            <span className="flex items-center gap-1"><Eye className="w-3 h-3"/>{car.views||0} views</span>
                            <Badge className={car.status==='approved'?'bg-emerald-100 text-emerald-700':car.status==='pending'?'bg-amber-100 text-amber-700':'bg-red-100 text-red-700'}>{car.status}</Badge>
                          </div>
                        </div>
                        <Link to={`/CarDetails?id=${car.id}`}>
                          <Button size="sm" variant="outline" className="shrink-0 h-8 text-xs">View</Button>
                        </Link>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* How it works */}
        <Card className="bg-slate-50 border-slate-200">
          <CardContent className="p-6">
            <h3 className="font-bold text-slate-900 mb-4">How Selling on H-Autos Works</h3>
            <div className="grid md:grid-cols-4 gap-4">
              {[
                {step:'1',title:'Pay Seller Fee',desc:'₦3,000 or $5 USDT for 14 days'},
                {step:'2',title:'Submit Car Details',desc:'Send photos & info to admin on WhatsApp'},
                {step:'3',title:'Admin Lists for You',desc:'We create and verify your listing'},
                {step:'4',title:'Buyers Contact You',desc:'Enquiries go through admin to you'},
              ].map(({step,title,desc})=>(
                <div key={step} className="text-center">
                  <div className="w-10 h-10 bg-amber-500 text-white rounded-full flex items-center justify-center font-bold text-lg mx-auto mb-2">{step}</div>
                  <p className="font-semibold text-slate-900 text-sm">{title}</p>
                  <p className="text-xs text-slate-500 mt-1">{desc}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
