import logo from '@/assets/logo.jpg';
import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { getActiveAds, logVisit } from '@/lib/supabase';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Car, Menu, Heart, LogOut, LayoutDashboard, Search, Shield, MessageSquare, X, ExternalLink, Store, UserCheck } from 'lucide-react';
import AuthModal from '@/components/AuthModal';
import { motion } from 'framer-motion';

function SpotlightBanner() {
  const [ads, setAds] = useState([]);
  const [current, setCurrent] = useState(null);
  const [visible, setVisible] = useState(false);
  const [idx, setIdx] = useState(0);
  useEffect(() => { getActiveAds().then(setAds).catch(() => {}); }, []);
  useEffect(() => {
    if (!ads.length) return;
    const show = () => { setCurrent(ads[idx % ads.length]); setIdx(i => i + 1); setVisible(true); setTimeout(() => setVisible(false), 15000); };
    show();
    const iv = setInterval(show, 2 * 60 * 1000);
    return () => clearInterval(iv);
  }, [ads]);
  if (!visible || !current) return null;
  return (
    <motion.div initial={{ opacity: 0, y: -60 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -60 }} className="fixed top-0 left-0 right-0 z-[100] bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-4">
        {current.image_url && <img src={current.image_url} alt="Ad" className="h-10 w-16 object-cover rounded shrink-0" />}
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm truncate">🔥 SPOTLIGHT: {current.title}</p>
          {current.description && <p className="text-xs text-white/80 truncate">{current.description}</p>}
        </div>
        {current.link_url && <a href={current.link_url} target="_blank" rel="noopener noreferrer"><Button size="sm" className="bg-white text-amber-600 hover:bg-amber-50 h-8 text-xs shrink-0">View <ExternalLink className="w-3 h-3 ml-1" /></Button></a>}
        <Button size="icon" variant="ghost" onClick={() => setVisible(false)} className="h-8 w-8 text-white hover:bg-white/20 shrink-0"><X className="w-4 h-4" /></Button>
      </div>
    </motion.div>
  );
}

export default function Layout({ children }) {
  const { user, profile, isAuthenticated, isAdmin, logout } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const location = useLocation();
  const isHome = location.pathname === '/';

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', fn);
    return () => window.removeEventListener('scroll', fn);
  }, []);

  // Log page visit on route change
  useEffect(() => { logVisit(location.pathname).catch(() => {}); }, [location.pathname]);

  const hBg = isHome && !scrolled ? 'bg-transparent' : 'bg-white/95 backdrop-blur-md border-b border-slate-100 shadow-sm';
  const tc = isHome && !scrolled ? 'text-white' : 'text-slate-700';
  const lc = isHome && !scrolled ? 'text-white' : 'text-slate-900';

  return (
    <div className="min-h-screen bg-slate-50">
      <SpotlightBanner />
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${hBg}`}>
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16 md:h-20">
            {/* Logo */}
            <Link to="/" className="flex items-center">
              <img src={logo} alt="HP-Autos" className="h-10 w-auto object-contain" />
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-6">
              {[{ label: 'Browse', href: '/Browse' }, { label: 'Stores', href: '/Stores' }].map(l => (
                <Link key={l.label} to={l.href} className={`font-medium hover:opacity-70 transition-opacity ${tc}`}>{l.label}</Link>
              ))}
              <Link to="/BecomeSeller" className={`font-medium hover:opacity-70 transition-opacity ${tc}`}>Sell Your Car</Link>
            </nav>

            {/* Right */}
            <div className="flex items-center gap-2">
              <Link to="/Browse" className="hidden md:flex"><Button variant="ghost" size="icon" className={tc}><Search className="w-5 h-5" /></Button></Link>
              {isAuthenticated ? (
                <>
                  <Link to="/SavedCars" className="hidden md:flex"><Button variant="ghost" size="icon" className={tc}><Heart className="w-5 h-5" /></Button></Link>
                  <Link to="/Messages" className="hidden md:flex"><Button variant="ghost" size="icon" className={tc}><MessageSquare className="w-5 h-5" /></Button></Link>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="focus:outline-none">
                        <Avatar className="h-9 w-9 ring-2 ring-amber-200">
                          <AvatarFallback className="bg-amber-100 text-amber-700 text-sm font-bold">
                            {(profile?.full_name || user?.email || 'U')[0].toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      <div className="px-3 py-2 border-b">
                        <p className="font-semibold text-sm truncate">{profile?.full_name || 'User'}</p>
                        <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                        {profile?.seller_active && <Badge className="mt-1 text-[10px] bg-emerald-100 text-emerald-700">Active Seller</Badge>}
                      </div>
                      <DropdownMenuItem asChild><Link to="/SellerDashboard" className="flex items-center gap-2"><LayoutDashboard className="w-4 h-4" />Dashboard</Link></DropdownMenuItem>
                      <DropdownMenuItem asChild><Link to="/Messages" className="flex items-center gap-2"><MessageSquare className="w-4 h-4" />Messages</Link></DropdownMenuItem>
                      <DropdownMenuItem asChild><Link to="/SavedCars" className="flex items-center gap-2"><Heart className="w-4 h-4" />Saved Cars</Link></DropdownMenuItem>
                      <DropdownMenuItem asChild><Link to="/BecomeSeller" className="flex items-center gap-2 text-amber-600"><UserCheck className="w-4 h-4" />Sell Your Car</Link></DropdownMenuItem>
                      <DropdownMenuItem asChild><Link to="/RegisterStore" className="flex items-center gap-2"><Store className="w-4 h-4" />Register Store</Link></DropdownMenuItem>
                      {isAdmin && (<><DropdownMenuSeparator /><DropdownMenuItem asChild><Link to="/AdminDashboard" className="flex items-center gap-2 text-red-600"><Shield className="w-4 h-4" />Admin Panel</Link></DropdownMenuItem></>)}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={logout} className="text-red-600 cursor-pointer"><LogOut className="w-4 h-4 mr-2" />Sign Out</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              ) : (
                <div className="hidden md:flex gap-2">
                  <Button variant="ghost" onClick={() => setAuthOpen(true)} className={`${tc} font-medium`}>Sign In</Button>
                  <Button onClick={() => setAuthOpen(true)} className="bg-amber-500 hover:bg-amber-600 text-white h-9 px-4">Register</Button>
                </div>
              )}

              {/* Mobile menu */}
              <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
                <SheetTrigger asChild><Button variant="ghost" size="icon" className={`md:hidden ${tc}`}><Menu className="w-5 h-5" /></Button></SheetTrigger>
                <SheetContent side="right" className="w-72">
                  <div className="flex flex-col gap-4 mt-8">
                    {[{ label: 'Browse Cars', href: '/Browse' }, { label: 'Stores', href: '/Stores' }].map(l => (
                      <Link key={l.label} to={l.href} onClick={() => setMobileOpen(false)} className="text-lg font-medium text-slate-700 hover:text-amber-600">{l.label}</Link>
                    ))}
                    <Link to="/BecomeSeller" onClick={() => setMobileOpen(false)} className="text-lg font-medium text-amber-600">Sell Your Car</Link>
                    {isAuthenticated ? (
                      <>
                        <Link to="/SellerDashboard" onClick={() => setMobileOpen(false)} className="text-lg font-medium text-slate-700">Dashboard</Link>
                        <Link to="/Messages" onClick={() => setMobileOpen(false)} className="text-lg font-medium text-slate-700">Messages</Link>
                        <Link to="/SavedCars" onClick={() => setMobileOpen(false)} className="text-lg font-medium text-slate-700">Saved Cars</Link>
                        <Link to="/RegisterStore" onClick={() => setMobileOpen(false)} className="text-lg font-medium text-slate-700">Register Store</Link>
                        {isAdmin && <Link to="/AdminDashboard" onClick={() => setMobileOpen(false)} className="text-lg font-medium text-red-600">Admin Panel</Link>}
                        <Button variant="outline" onClick={() => { logout(); setMobileOpen(false); }} className="mt-2">Sign Out</Button>
                      </>
                    ) : (
                      <Button onClick={() => { setAuthOpen(true); setMobileOpen(false); }} className="bg-amber-500 text-white mt-2">Sign In / Register</Button>
                    )}
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </header>

      <main className="pt-16 md:pt-20">{children}</main>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-12 mt-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="mb-4"><img src={logo} alt="HP-Autos" className="h-10 w-auto object-contain" /></div>
              <p className="text-slate-400 text-sm">Africa's premium car marketplace. Every listing verified.</p>
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
          <div className="border-t border-slate-700 pt-6 text-center text-slate-500 text-sm">© {new Date().getFullYear()} HP-Autos. A Product of HSPR TECHNOLOGIES. All rights reserved.</div>
        </div>
      </footer>

      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
    </div>
  );
}
