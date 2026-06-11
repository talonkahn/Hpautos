import logo from '@/assets/logo.jpg';
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getCars, getStores } from '@/lib/supabase';
import { COUNTRIES } from '@/components/shared/LocationData';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Search, ArrowRight, Car, Shield, Star, MapPin, ChevronRight,
  Users, CheckCircle2, Store, Building2, UserCheck, Globe
} from 'lucide-react';
import CarCard from '@/components/cars/CarCard';
import { motion } from 'framer-motion';

const POPULAR_MAKES = ['Toyota','Honda','Mercedes-Benz','BMW','Lexus','Ford','Hyundai','Tesla'];

export default function Home() {
  const [searchQuery, setSearchQuery]     = useState('');
  const [searchCountry, setSearchCountry] = useState('all');
  const navigate = useNavigate();

  const { data: featuredCars = [] } = useQuery({ queryKey: ['featuredCars'], queryFn: () => getCars({ status: 'approved', is_featured: true }, 6) });
  const { data: latestCars = []   } = useQuery({ queryKey: ['latestCars'],   queryFn: () => getCars({ status: 'approved' }, 8) });
  const { data: stores = []       } = useQuery({ queryKey: ['homeStores'],   queryFn: () => getStores(true) });

  const handleSearch = () => {
  const params = new URLSearchParams();

  if (searchQuery) {
    params.set('search', searchQuery);
  }

  if (searchCountry && searchCountry !== 'all') {
    params.set('country', searchCountry);
  }

  navigate(`/Browse?${params.toString()}`);
};
  return (
    <div className="min-h-screen bg-slate-50">
      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <section className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 overflow-hidden min-h-[88vh] flex items-center">
        <div className="absolute inset-0 opacity-5" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/svg%3E")` }} />
        <div className="relative max-w-7xl mx-auto px-4 py-28 w-full text-center">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
            <Badge className="mb-6 bg-amber-500/10 text-amber-400 border-amber-500/20 px-5 py-2 text-sm">
              Global Car Marketplace · 13 Countries
            </Badge>
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
              Find Your Perfect
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-yellow-300">
                Car, Anywhere
              </span>
            </h1>
            <p className="text-xl text-slate-300 mb-10 max-w-2xl mx-auto">
              HSPR TECH-verified listings across Nigeria, USA, UK, Japan, China, UAE and more. Every car you see is real.
            </p>
          </motion.div>

          {/* Search bar */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.2 }}
            className="bg-white/10 backdrop-blur-xl rounded-2xl p-2 max-w-4xl mx-auto mb-10">
            <div className="flex gap-2 flex-wrap md:flex-nowrap">
              {/* Country picker */}
              <Select value={searchCountry} onValueChange={setSearchCountry}>
                <SelectTrigger className="bg-white border-0 h-14 md:w-52 w-full rounded-xl text-slate-700 shrink-0">
                  <SelectValue placeholder="🌍 All countries">
                    {searchCountry && (() => {
                      const c = COUNTRIES.find(x => x.code === searchCountry);
                      return c ? <span>{c.flag} {c.name}</span> : null;
                    })()}
                  </SelectValue>
                </SelectTrigger>
               <SelectContent>
  <SelectItem value="all">
    🌍 All countries
  </SelectItem>

  {COUNTRIES.map(c => (
    <SelectItem key={c.code} value={c.code}>
      {c.flag} {c.name}
    </SelectItem>
  ))}
</SelectContent>
              </Select>
              {/* Search input */}
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <Input
                  placeholder="Search make, model, keyword..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSearch()}
                  className="pl-12 h-14 text-base bg-white border-0 rounded-xl"
                />
              </div>
              <Button onClick={handleSearch} className="h-14 px-8 bg-amber-500 hover:bg-amber-600 text-white font-semibold rounded-xl text-base shrink-0 w-full md:w-auto">
                Search
              </Button>
            </div>
          </motion.div>

          {/* Country pills */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.7, delay: 0.4 }}
            className="flex flex-wrap justify-center gap-2">
            {COUNTRIES.map(c => (
              <button key={c.code} onClick={() => navigate(`/Browse?country=${c.code}`)}
                className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white/80 hover:text-white rounded-full text-sm transition-all">
                {c.flag} {c.name}
              </button>
            ))}
          </motion.div>
        </div>
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 80" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 80L1440 80L1440 30C1200 70 960 80 720 70C480 60 240 30 0 50Z" fill="#f8fafc" />
          </svg>
        </div>
      </section>

      {/* ── Browse by Country ─────────────────────────────────────────── */}
      <section className="py-16 max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-slate-900">Browse by Country</h2>
            <p className="text-slate-500 mt-1">13 countries, thousands of verified cars</p>
          </div>
          <Link to="/Browse"><Button variant="ghost" className="text-amber-600 gap-1">View All <ChevronRight className="w-4 h-4" /></Button></Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3">
          {COUNTRIES.map((country, i) => (
            <motion.div key={country.code} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }} whileHover={{ y: -4 }}>
              <Link to={`/Browse?country=${country.code}`}>
                <div className="bg-white rounded-2xl p-4 text-center border border-slate-100 hover:border-amber-200 hover:shadow-lg transition-all cursor-pointer group">
                  <div className="text-3xl mb-2">{country.flag}</div>
                  <p className="font-semibold text-slate-900 text-xs leading-tight">{country.name}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">{country.currency}</p>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── Browse by Make ────────────────────────────────────────────── */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <div><h2 className="text-2xl md:text-3xl font-bold text-slate-900">Browse by Make</h2><p className="text-slate-500 mt-1">Your favourite brands, worldwide</p></div>
            <Link to="/Browse"><Button variant="ghost" className="text-amber-600 gap-1">View All <ChevronRight className="w-4 h-4" /></Button></Link>
          </div>
          <div className="grid grid-cols-4 md:grid-cols-8 gap-3">
            {POPULAR_MAKES.map((make, i) => (
              <motion.div key={make} whileHover={{ y: -4 }} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <Link to={`/Browse?make=${encodeURIComponent(make)}`}>
                  <div className="bg-slate-50 rounded-2xl p-4 text-center border border-slate-100 hover:border-amber-200 hover:shadow-lg hover:bg-white transition-all cursor-pointer group">
                    <Car className="w-7 h-7 text-slate-400 group-hover:text-amber-500 mx-auto mb-2 transition-colors" />
                    <p className="font-semibold text-slate-900 text-xs">{make}</p>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Featured Cars ─────────────────────────────────────────────── */}
      {featuredCars.length > 0 && (
        <section className="py-16 max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <div><h2 className="text-2xl md:text-3xl font-bold text-slate-900">⭐ Featured Cars</h2><p className="text-slate-500 mt-1">Hand-picked premium listings</p></div>
            <Link to="/Browse"><Button variant="ghost" className="text-amber-600 gap-1">View All <ChevronRight className="w-4 h-4" /></Button></Link>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredCars.map(car => <CarCard key={car.id} car={car} />)}
          </div>
        </section>
      )}

      {/* ── Latest Listings ───────────────────────────────────────────── */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <div><h2 className="text-2xl md:text-3xl font-bold text-slate-900">Latest Listings</h2><p className="text-slate-500 mt-1">Fresh cars just added globally</p></div>
            <Link to="/Browse"><Button variant="ghost" className="text-amber-600 gap-1">View All <ChevronRight className="w-4 h-4" /></Button></Link>
          </div>
          {latestCars.length === 0
            ? <div className="text-center py-16 text-slate-400"><Car className="w-12 h-12 mx-auto mb-3" /><p>No listings yet — check back soon!</p></div>
            : <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">{latestCars.map(car => <CarCard key={car.id} car={car} />)}</div>
          }
        </div>
      </section>

      {/* ── RC-Verified Stores ────────────────────────────────────────── */}
      {stores.length > 0 && (
        <section className="py-16 max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <div><h2 className="text-2xl md:text-3xl font-bold text-slate-900">🏪 Verified Car Stores</h2><p className="text-slate-500 mt-1">RC-registered dealerships and car stands</p></div>
            <Link to="/Stores"><Button variant="ghost" className="text-amber-600 gap-1">View All <ChevronRight className="w-4 h-4" /></Button></Link>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {stores.slice(0, 3).map((store, i) => (
              <motion.div key={store.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} whileHover={{ y: -4 }}>
                <Link to={`/StoreDetails?id=${store.id}`}>
                  <Card className="overflow-hidden hover:shadow-xl transition-all border-0 shadow-sm group">
                    <div className="h-28 bg-gradient-to-br from-slate-700 to-slate-900 relative">
                      {store.banner_url && <img src={store.banner_url} alt="" className="w-full h-full object-cover opacity-50" />}
                      <div className="absolute bottom-2 left-3">
                        <div className="w-12 h-12 rounded-xl bg-white shadow overflow-hidden flex items-center justify-center">
                          {store.logo_url ? <img src={store.logo_url} alt="" className="w-full h-full object-cover" /> : <Store className="w-6 h-6 text-amber-500" />}
                        </div>
                      </div>
                      {store.is_verified && <Badge className="absolute top-2 right-2 bg-emerald-500 border-0 text-xs"><CheckCircle2 className="w-3 h-3 mr-1" />RC Verified</Badge>}
                    </div>
                    <CardContent className="p-4">
                      <h3 className="font-bold text-slate-900 group-hover:text-amber-600 transition-colors">{store.name}</h3>
                      {store.specialization && <p className="text-xs text-amber-600 font-medium">{store.specialization}</p>}
                      <p className="text-xs text-slate-500 flex items-center gap-1 mt-1"><MapPin className="w-3 h-3" />{store.city ? `${store.city}, ` : ''}{store.state}</p>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* ── Sell CTA ──────────────────────────────────────────────────── */}
      <section className="py-20 bg-gradient-to-br from-slate-900 to-slate-800">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <Badge className="mb-4 bg-amber-500/10 text-amber-400 border-amber-500/20">Sell on H-Autos</Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Want to List Your Car?</h2>
            <p className="text-xl text-slate-300 max-w-xl mx-auto">All listings are posted by HSPR TECH — maximum trust for buyers worldwide.</p>
          </div>
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <Card className="bg-white/5 border-white/10 text-white">
              <CardContent className="p-6">
                <UserCheck className="w-12 h-12 text-amber-400 mb-4" />
                <h3 className="text-xl font-bold mb-2">Individual Seller</h3>
                <p className="text-slate-300 text-sm mb-4">Pay ₦3,000 / $5 USDT for 14-day seller access. Admin lists your car for you.</p>
                <ul className="space-y-2 mb-6">{['14-day seller subscription','Admin lists & verifies','WhatsApp enquiries direct to you','Global buyer reach'].map(b => <li key={b} className="flex items-center gap-2 text-sm text-slate-300"><CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />{b}</li>)}</ul>
                <Link to="/BecomeSeller"><Button className="w-full bg-amber-500 hover:bg-amber-600 text-white font-semibold h-11">Become a Seller — ₦3,000</Button></Link>
              </CardContent>
            </Card>
            <Card className="bg-white/5 border-amber-500/30 text-white relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 to-yellow-300" />
              <CardContent className="p-6">
                <Building2 className="w-12 h-12 text-amber-400 mb-4" />
                <h3 className="text-xl font-bold mb-2">Car Stand / Dealership</h3>
                <p className="text-slate-300 text-sm mb-4">Register your RC-verified business. Get a branded store page, global visibility.</p>
                <ul className="space-y-2 mb-6">{['Dedicated store page','RC number verification','Investor pitch ready','Full inventory management','Global buyer reach'].map(b => <li key={b} className="flex items-center gap-2 text-sm text-slate-300"><CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />{b}</li>)}</ul>
                <Link to="/RegisterStore"><Button className="w-full bg-gradient-to-r from-amber-400 to-yellow-400 text-slate-900 font-semibold h-11">Register Your Store — Free</Button></Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* ── Trust ─────────────────────────────────────────────────────── */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: Shield,    title: 'Admin-Controlled',    desc: 'Every listing on H-Autos is posted and verified by admin. No fake listings, no scams.' },
              { icon: Globe,     title: '13 Countries',        desc: 'From Nigeria to Japan, USA to UAE — one marketplace, global reach.' },
              { icon: Building2, title: 'RC-Verified Stores',  desc: 'Dealerships verified by RC number. Investor-grade trust for every store on the platform.' },
            ].map((item, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} className="text-center">
                <div className="w-16 h-16 bg-amber-100 rounded-2xl mx-auto mb-4 flex items-center justify-center"><item.icon className="w-8 h-8 text-amber-600" /></div>
                <h3 className="font-bold text-xl text-slate-900 mb-2">{item.title}</h3>
                <p className="text-slate-500">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
