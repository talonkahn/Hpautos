import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { getActiveAds } from '@/lib/supabase';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Car, Menu, Heart, LogOut, LayoutDashboard, Search, Shield, MessageSquare, X, ExternalLink, Store, UserCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

function SpotlightBanner() {
  const [ads, setAds] = useState([]);
  const [current, setCurrent] = useState(null);
  const [visible, setVisible] = useState(false);
  const [idx, setIdx] = useState(0);
  useEffect(() => { getActiveAds().then(setAds).catch(() => {}); }, []);
  useEffect(() => {
    if (!ads.length) return;
    const show = () => { setCurrent(ads[idx % ads.length]); setIdx(i => i+1); setVisible(true); setTimeout(() => setVisible(false), 15000); };
    show();
    const iv = setInterval(show, 2*60*1000);
    return () => clearInterval(iv);
  }, [ads]);
  if (!visible || !current) return null;
  return (
    <motion.div initial={{opacity:0,y:-60}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-60}} className="fixed top-0 left-0 right-0 z-[100] bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-4">
        {current.image_url && <img src={current.image_url} alt="Ad" className="h-10 w-16 object-cover rounded shrink-0"/>}
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm truncate">🔥 SPOTLIGHT: {current.title}</p>
          {current.description && <p className="text-xs text-white/80 truncate">{current.description}</p>}
        </div>
        {current.link_url && <a href={current.link_url} target="_blank" rel="noopener noreferrer"><Button size="sm" className="bg-white text-amber-600 hover:bg-amber-50 h-8 text-xs shrink-0">View <ExternalLink className="w-3 h-3 ml-1"/></Button></a>}
        <Button size="icon" variant="ghost" onClick={() => setVisible(false)} className="h-8 w-8 text-white hover:bg-white/20 shrink-0"><X className="w-4 h-4"/></Button>
      </div>
    </motion.div>
  );
}

export default function Layout({ children }) {
  const { user, profile, isAuthenticated, isAdmin, login, logout } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const isHome = location.pathname === '/';
  useEffect(() => { const fn = () => setScrolled(window.scrollY > 10); window.addEventListener('scroll', fn); return () => window.removeEventListener('scroll', fn); }, []);
  const hBg = isHome && !scrolled ? 'bg-transparent' : 'bg-white/95 backdrop-blur-md border-b border-slate-100 shadow-sm';
  const tc = isHome && !scrolled ? 'text-white' : 'text-slate-700';
  const lc = isHome && !scrolled ? 'text-white' : 'text-slate-900';

  return (
    <div className="min-h-screen bg-slate-50">
      <SpotlightBanner />
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${hBg}`}>
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16 md:h-20">
            <Link to="/" className="flex items-center gap-2">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isHome&&!scrolled?'bg-white/10':'bg-amber-500'}`}>
                <Car className={`w-6 h-6 ${isHome&&!scrolled?'text-amber-400':'text-white'}`}/>
              </div>
              <span className={`text-xl font-bold ${lc}`}>HP Autos</span>
              <Badge className="hidden md:flex text-[10px] bg-amber-100 text-amber-700 border-amber-200">NG</Badge>
            </Link>
            <nav className="hidden md:flex items-center gap-6">
              {[{label:'Browse',href:'/Browse'},{label:'Stores',href:'/Stores'}].map(l=>(
                <Link key={l.label} to={l.href} className={`font-medium hover:opacity-70 transition-opacity ${tc}`}>{l.label}</Link>
              ))}
              {!isAuthenticated && (
                <Link to="/BecomeSeller" className={`font-medium hover:opacity-70 transition-opacity ${tc}`}>Become a Seller</Link>
              )}
            </nav>
            <div className="flex items-center gap-2">
              <Link to="/Browse" className="hidden md:flex"><Button variant="ghost" size="icon" className={tc}><Search className="w-5 h-5"/></Button></Link>
              {isAuthenticated ? (
                <>
                  <Link to="/SavedCars" className="hidden md:flex"><Button variant="ghost" size="icon" className={tc}><Heart className="w-5 h-5"/></Button></Link>
                  <Link to="/Messages" className="hidden md:flex"><Button variant="ghost" size="icon" className={tc}><MessageSquare className="w-5 h-5"/></Button></Link>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="flex items-center gap-2 rounded-full focus:outline-none">
                        <Avatar className="h-9 w-9 ring-2 ring-amber-200">
                          <AvatarImage src={profile?.avatar_url}/>
                          <AvatarFallback className="bg-amber-100 text-amber-700 text-sm font-bold">{(profile?.full_name||user?.email||'U')[0].toUpperCase()}</AvatarFallback>
                        </Avatar>
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      <div className="px-3 py-2 border-b">
                        <p className="font-semibold text-sm truncate">{profile?.full_name||'User'}</p>
                        <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                        {profile?.seller_active && <Badge className="mt-1 text-[10px] bg-emerald-100 text-emerald-700">Active Seller</Badge>}
                      </div>
                      <DropdownMenuItem asChild><Link to="/SellerDashboard" className="flex items-center gap-2"><LayoutDashboard className="w-4 h-4"/>Dashboard</Link></DropdownMenuItem>
                      <DropdownMenuItem asChild><Link to="/Messages" className="flex items-center gap-2"><MessageSquare className="w-4 h-4"/>Messages</Link></DropdownMenuItem>
                      <DropdownMenuItem asChild><Link to="/SavedCars" className="flex items-center gap-2"><Heart className="w-4 h-4"/>Saved Cars</Link></DropdownMenuItem>
                      {!profile?.seller_active && <DropdownMenuItem asChild><Link to="/BecomeSeller" className="flex items-center gap-2 text-amber-600"><UserCheck className="w-4 h-4"/>Become a Seller</Link></DropdownMenuItem>}
                      <DropdownMenuItem asChild><Link to="/RegisterStore" className="flex items-center gap-2"><Store className="w-4 h-4"/>Register Store</Link></DropdownMenuItem>
                      {isAdmin && (<><DropdownMenuSeparator/><DropdownMenuItem asChild><Link to="/AdminDashboard" className="flex items-center gap-2 text-red-600"><Shield className="w-4 h-4"/>Admin Panel</Link></DropdownMenuItem></>)}
                      <DropdownMenuSeparator/>
                      <DropdownMenuItem onClick={logout} className="text-red-600 cursor-pointer"><LogOut className="w-4 h-4 mr-2"/>Sign Out</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              ) : (
                <Button onClick={login} className="bg-amber-500 hover:bg-amber-600 text-white h-9 px-4 gap-2">
                  <svg className="w-4 h-4" viewBox="0 0 24 24"><path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                  Sign in
                </Button>
              )}
              <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
                <SheetTrigger asChild><Button variant="ghost" size="icon" className={`md:hidden ${tc}`}><Menu className="w-5 h-5"/></Button></SheetTrigger>
                <SheetContent side="right" className="w-72">
                  <div className="flex flex-col gap-4 mt-8">
                    {[{label:'Browse Cars',href:'/Browse'},{label:'Stores',href:'/Stores'}].map(l=>(
                      <Link key={l.label} to={l.href} onClick={()=>setMobileOpen(false)} className="text-lg font-medium text-slate-700 hover:text-amber-600">{l.label}</Link>
                    ))}
                    {isAuthenticated ? (
                      <>
                        <Link to="/SellerDashboard" onClick={()=>setMobileOpen(false)} className="text-lg font-medium text-slate-700">Dashboard</Link>
                        <Link to="/Messages" onClick={()=>setMobileOpen(false)} className="text-lg font-medium text-slate-700">Messages</Link>
                        <Link to="/SavedCars" onClick={()=>setMobileOpen(false)} className="text-lg font-medium text-slate-700">Saved Cars</Link>
                        <Link to="/BecomeSeller" onClick={()=>setMobileOpen(false)} className="text-lg font-medium text-amber-600">Become a Seller</Link>
                        <Link to="/RegisterStore" onClick={()=>setMobileOpen(false)} className="text-lg font-medium text-slate-700">Register Store</Link>
                        {isAdmin && <Link to="/AdminDashboard" onClick={()=>setMobileOpen(false)} className="text-lg font-medium text-red-600">Admin Panel</Link>}
                        <Button variant="outline" onClick={()=>{logout();setMobileOpen(false)}} className="mt-4">Sign Out</Button>
                      </>
                    ) : (
                      <>
                        <Link to="/BecomeSeller" onClick={()=>setMobileOpen(false)} className="text-lg font-medium text-amber-600">Become a Seller</Link>
                        <Button onClick={()=>{login();setMobileOpen(false)}} className="bg-amber-500 text-white mt-4">Sign in with Google</Button>
                      </>
                    )}
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </header>
      <main className="pt-16 md:pt-20">{children}</main>
      <footer className="bg-slate-900 text-white py-12 mt-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4"><div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center"><Car className="w-5 h-5 text-white"/></div><span className="font-bold text-lg">H-Autos Nigeria</span></div>
              <p className="text-slate-400 text-sm">Nigeria's premium car marketplace. Buy from verified admin-listed cars with confidence.</p>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Marketplace</h4>
              <ul className="space-y-2 text-slate-400 text-sm">
                <li><Link to="/Browse" className="hover:text-amber-400">Browse Cars</Link></li>
                <li><Link to="/Stores" className="hover:text-amber-400">Car Stores</Link></li>
                <li><Link to="/BecomeSeller" className="hover:text-amber-400">Become a Seller</Link></li>
                <li><Link to="/RegisterStore" className="hover:text-amber-400">Register Your Store</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Account</h4>
              <ul className="space-y-2 text-slate-400 text-sm">
                <li><Link to="/SellerDashboard" className="hover:text-amber-400">My Dashboard</Link></li>
                <li><Link to="/Messages" className="hover:text-amber-400">Messages</Link></li>
                <li><Link to="/SavedCars" className="hover:text-amber-400">Saved Cars</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Contact Admin</h4>
              <ul className="space-y-2 text-slate-400 text-sm">
                <li>📧 samuelivere92@gmail.com</li>
                <li><a href="https://wa.me/2348146730044" target="_blank" rel="noopener noreferrer" className="hover:text-amber-400">📱 +234 814 673 0044</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-700 pt-6 text-center text-slate-500 text-sm">© {new Date().getFullYear()} HP Autos Nigeria. All listings managed by HSPR TECHNOLOGIES.</div>
        </div>
      </footer>
    </div>
  );
}
