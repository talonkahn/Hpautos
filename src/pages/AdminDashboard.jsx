import logo from '@/assets/logo.jpg';
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import {
  getAllCarsAdmin, getAllUsersAdmin, getAllStoresAdmin, getSellerRequests,
  getEnquiries, updateCar, deleteCar, getAdminStats, createCar, uploadFile,
  upsertProfile, sendEmailNotification, getActiveAds, createAd, updateAd,
  deleteAd, updateSellerRequest, updateStore, deleteStore, getRevenueLog,
  logRevenue, ADMIN_WHATSAPP, ADMIN_EMAIL, SELLER_DURATION_DAYS
} from '@/lib/supabase';
import { CAR_MAKES as MAKES, NIGERIAN_STATES, COUNTRIES } from '@/components/shared/NigerianStates';
import { CountrySelector, RegionSelector } from '@/components/shared/LocationSelector';
import { formatPrice } from '@/components/shared/NigerianStates';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Car, Users, CheckCircle2, XCircle, Clock, Eye, Search, Star, Shield, Plus,
  Trash2, Edit, MessageSquare, Crown, Megaphone, Store, UserCheck, TrendingUp,
  DollarSign, BarChart3, Globe, Image as ImageIcon, Loader2, X, Activity
} from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

export default function AdminDashboard() {
  const { user, isAdmin, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({});
  const [cars, setCars] = useState([]);
  const [users, setUsers] = useState([]);
  const [stores, setStores] = useState([]);
  const [sellerReqs, setSellerReqs] = useState([]);
  const [enquiries, setEnquiries] = useState([]);
  const [ads, setAds] = useState([]);
  const [revLog, setRevLog] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showListCar, setShowListCar] = useState(false);
  const [showAdModal, setShowAdModal] = useState(false);
  const [showRevModal, setShowRevModal] = useState(false);
  const [editAd, setEditAd] = useState(null);
  const [uploadingImgs, setUploadingImgs] = useState(false);
  const [adForm, setAdForm] = useState({ title: '', description: '', link_url: '', image_url: '', is_active: true, expires_at: '' });
  const [revForm, setRevForm] = useState({ description: '', amount: '', currency: 'NGN', type: 'seller_subscription' });
  const [listForm, setListForm] = useState({
    make: '', model: '', year: new Date().getFullYear(), price: '', state: '', city: '',
    condition: 'nigerian_used', description: '', images: [], seller_name: 'H-Autos Admin',
    seller_phone: '', seller_whatsapp: '+2348146730044', fuel_type: 'petrol',
    transmission: 'automatic', mileage: '', title: '', store_id: '', country: 'NG'
  });

  useEffect(() => {
    if (!authLoading && (!user || !isAdmin)) { navigate('/'); return; }
    if (isAdmin) loadAll();
  }, [isAdmin, authLoading]);

  const loadAll = async () => {
    try {
      const [s, c, u, st, sr, enq, a, rev] = await Promise.all([
        getAdminStats(), getAllCarsAdmin(), getAllUsersAdmin(), getAllStoresAdmin(),
        getSellerRequests(), getEnquiries(), getActiveAds(), getRevenueLog()
      ]);
      setStats(s); setCars(c); setUsers(u); setStores(st);
      setSellerReqs(sr); setEnquiries(enq); setAds(a); setRevLog(rev);
    } catch (e) { toast.error('Failed to load data'); console.error(e); }
    finally { setLoading(false); }
  };

  // Car actions
  const approveCar = async (car) => {
    await updateCar(car.id, { status: 'approved' });
    setCars(cs => cs.map(c => c.id === car.id ? { ...c, status: 'approved' } : c));
    await sendEmailNotification({ to: car.seller_email || car.profiles?.email, subject: `✅ Listing Approved – ${car.title}`, html: `<h2>${car.title} is now live on H-Autos!</h2><p>Buyers can now see your listing.</p>` });
    toast.success('Car approved!');
  };
  const rejectCar = async (car) => {
    await updateCar(car.id, { status: 'rejected' });
    setCars(cs => cs.map(c => c.id === car.id ? { ...c, status: 'rejected' } : c));
    toast.success('Rejected');
  };
  const featureCar = async (car) => {
    const v = !car.is_featured;
    await updateCar(car.id, { is_featured: v });
    setCars(cs => cs.map(c => c.id === car.id ? { ...c, is_featured: v } : c));
    toast.success(v ? 'Featured!' : 'Unfeatured');
  };
  const removeCarItem = async (id) => {
    if (!confirm('Delete this listing?')) return;
    await deleteCar(id); setCars(cs => cs.filter(c => c.id !== id)); toast.success('Deleted');
  };

  // Seller request actions
  const approveSellerReq = async (req) => {
    const expiry = new Date(); expiry.setDate(expiry.getDate() + SELLER_DURATION_DAYS);
    await updateSellerRequest(req.id, { status: 'approved', approved_at: new Date().toISOString() });
    await upsertProfile({ id: req.user_id, seller_active: true, seller_expiry: expiry.toISOString(), whatsapp: req.whatsapp, phone: req.phone, full_name: req.full_name });
    // Log revenue
    await logRevenue({ description: `Seller subscription – ${req.full_name}`, amount: req.amount_paid, currency: req.currency, type: 'seller_subscription', user_id: req.user_id });
    setSellerReqs(rs => rs.map(r => r.id === req.id ? { ...r, status: 'approved' } : r));
    await sendEmailNotification({ to: req.profiles?.email, subject: '🎉 Seller Access Approved!', html: `<h2>You're now an active seller on H-Autos!</h2><p>Your ${SELLER_DURATION_DAYS}-day seller subscription is active. WhatsApp admin to submit cars: wa.me/${ADMIN_WHATSAPP}</p>` });
    toast.success('Seller approved!');
    loadAll(); // refresh stats
  };
  const rejectSellerReq = async (req) => {
    await updateSellerRequest(req.id, { status: 'rejected' });
    setSellerReqs(rs => rs.map(r => r.id === req.id ? { ...r, status: 'rejected' } : r));
    toast.success('Rejected');
  };

  // Store actions
  const approveStore = async (store) => {
    await updateStore(store.id, { status: 'approved', is_verified: !!store.rc_number });
    setStores(ss => ss.map(s => s.id === store.id ? { ...s, status: 'approved', is_verified: !!store.rc_number } : s));
    await sendEmailNotification({ to: store.profiles?.email || store.email, subject: `🏪 ${store.name} is live on H-Autos!`, html: `<h2>${store.name} approved!</h2><p>Your store is now live. Admin will list cars for your store.</p>` });
    toast.success('Store approved!');
    loadAll();
  };
  const rejectStore = async (store) => {
    await updateStore(store.id, { status: 'rejected' });
    setStores(ss => ss.map(s => s.id === store.id ? { ...s, status: 'rejected' } : s));
    toast.success('Rejected');
  };
  const removeStore = async (id) => {
    if (!confirm('Delete store?')) return;
    await deleteStore(id); setStores(ss => ss.filter(s => s.id !== id)); toast.success('Deleted');
  };

  // User actions
  const activateSeller = async (u) => {
    const expiry = new Date(); expiry.setDate(expiry.getDate() + SELLER_DURATION_DAYS);
    await upsertProfile({ id: u.id, seller_active: true, seller_expiry: expiry.toISOString() });
    setUsers(us => us.map(x => x.id === u.id ? { ...x, seller_active: true } : x));
    toast.success('Seller activated');
  };

  // Car images upload
  const handleCarImages = async (e) => {
    const files = Array.from(e.target.files);
    setUploadingImgs(true);
    for (const f of files) {
      try { const url = await uploadFile(f, 'cars'); setListForm(p => ({ ...p, images: [...p.images, url] })); }
      catch { toast.error(`Failed: ${f.name}`); }
    }
    setUploadingImgs(false);
  };

  const handleAdminList = async () => {
    if (!listForm.make || !listForm.model || !listForm.price || !listForm.state) { toast.error('Fill required fields'); return; }
    try {
      const title = listForm.title || `${listForm.year} ${listForm.make} ${listForm.model}`;
      await createCar({ ...listForm, title, price: parseFloat(listForm.price), year: parseInt(listForm.year), mileage: listForm.mileage ? parseFloat(listForm.mileage) : null, status: 'approved', is_verified: true, is_featured: false, views: 0, seller_id: user.id, seller_email: user.email, store_id: listForm.store_id || null });
      toast.success('Car listed!'); setShowListCar(false); loadAll();
    } catch (e) { console.error(e); toast.error('Failed to list'); }
  };

  const saveAd = async () => {
    try {
      if (editAd) await updateAd(editAd.id, adForm); else await createAd({ ...adForm, created_by: user.id });
      toast.success('Ad saved!'); setShowAdModal(false); setEditAd(null); getActiveAds().then(setAds);
    } catch { toast.error('Failed'); }
  };

  const saveRevEntry = async () => {
    if (!revForm.description || !revForm.amount) { toast.error('Fill all fields'); return; }
    await logRevenue({ ...revForm, amount: parseFloat(revForm.amount) });
    toast.success('Revenue logged!'); setShowRevModal(false); setRevForm({ description: '', amount: '', currency: 'NGN', type: 'seller_subscription' });
    loadAll();
  };

  // Derived data
  const pendingCars = cars.filter(c => c.status === 'pending');
  const pendingStores = stores.filter(s => s.status === 'pending');
  const pendingReqs = sellerReqs.filter(r => r.status === 'pending');
  const filtered = cars.filter(c => !search || `${c.title} ${c.make} ${c.seller_name} ${c.seller_email}`.toLowerCase().includes(search.toLowerCase()));

  // Revenue chart data — last 7 months
  const revenueByMonth = (() => {
    const months = {};
    revLog.forEach(r => {
      const m = new Date(r.created_at).toLocaleString('default', { month: 'short' });
      if (!months[m]) months[m] = { month: m, NGN: 0, USDT: 0 };
      if (r.currency === 'NGN') months[m].NGN += r.amount || 0;
      else months[m].USDT += r.amount || 0;
    });
    return Object.values(months).slice(-7);
  })();

  if (authLoading || loading) return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-4 border-slate-200 border-t-amber-500 rounded-full animate-spin" /></div>;

  const statCards = [
    { label: 'Today\'s Visitors', value: stats.visits?.today || 0, sub: `${stats.visits?.thisMonth || 0} this month`, icon: Activity, color: 'blue' },
    { label: 'Total Visitors', value: (stats.visits?.total || 0).toLocaleString(), sub: `${stats.visits?.thisWeek || 0} this week`, icon: Globe, color: 'indigo' },
    { label: 'Revenue (NGN)', value: `₦${(stats.revenueNGN || 0).toLocaleString()}`, sub: `$${stats.revenueUSDT || 0} USDT`, icon: DollarSign, color: 'emerald' },
    { label: 'Active Listings', value: stats.approvedCars || 0, sub: `${stats.pendingCars || 0} pending`, icon: Car, color: 'amber' },
    { label: 'Active Stores', value: stats.approvedStores || 0, sub: `${stats.pendingStores || 0} pending`, icon: Store, color: 'purple' },
    { label: 'Total Users', value: stats.totalUsers || 0, sub: `${stats.pendingSellerRequests || 0} seller requests`, icon: Users, color: 'rose' },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-6 flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Admin Dashboard</h1>
            <p className="text-slate-500 text-sm">samuelivere92@gmail.com · Full control</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button onClick={() => setShowRevModal(true)} variant="outline" className="gap-2 text-emerald-600 border-emerald-200"><DollarSign className="w-4 h-4" />Log Revenue</Button>
            <Button onClick={() => setShowAdModal(true)} variant="outline" className="gap-2"><Megaphone className="w-4 h-4" />New Ad</Button>
            <Button onClick={() => setShowListCar(true)} className="bg-amber-500 hover:bg-amber-600 text-white gap-2"><Plus className="w-4 h-4" />List Car</Button>
            <Badge className="bg-red-100 text-red-700 px-3 py-2 text-sm"><Shield className="w-3 h-3 mr-1 inline" />Admin</Badge>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          {statCards.map(({ label, value, sub, icon: Icon, color }, i) => (
            <motion.div key={label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <Card className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className={`w-9 h-9 rounded-xl bg-${color}-100 flex items-center justify-center mb-2`}><Icon className={`w-5 h-5 text-${color}-600`} /></div>
                  <p className="text-xl font-bold text-slate-900">{value}</p>
                  <p className="text-xs font-medium text-slate-700">{label}</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">{sub}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Revenue Chart */}
        {revenueByMonth.length > 0 && (
          <Card className="mb-8">
            <CardHeader><CardTitle className="flex items-center gap-2"><BarChart3 className="w-5 h-5 text-emerald-600" />Revenue Overview (NGN)</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={revenueByMonth}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} tickFormatter={v => `₦${(v / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v, n) => [n === 'NGN' ? `₦${v.toLocaleString()}` : `$${v}`, n]} />
                  <Bar dataKey="NGN" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Alert banners */}
        {(pendingCars.length > 0 || pendingStores.length > 0 || pendingReqs.length > 0) && (
          <div className="grid md:grid-cols-3 gap-4 mb-6">
            {pendingCars.length > 0 && <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-center gap-2"><Clock className="w-4 h-4 text-amber-600" /><p className="text-amber-800 text-sm font-medium">{pendingCars.length} car{pendingCars.length !== 1 ? 's' : ''} need approval</p></div>}
            {pendingReqs.length > 0 && <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 flex items-center gap-2"><UserCheck className="w-4 h-4 text-blue-600" /><p className="text-blue-800 text-sm font-medium">{pendingReqs.length} seller request{pendingReqs.length !== 1 ? 's' : ''} pending</p></div>}
            {pendingStores.length > 0 && <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 flex items-center gap-2"><Store className="w-4 h-4 text-emerald-600" /><p className="text-emerald-800 text-sm font-medium">{pendingStores.length} store{pendingStores.length !== 1 ? 's' : ''} need approval</p></div>}
          </div>
        )}

        <Tabs defaultValue="seller-requests">
          <TabsList className="mb-6 flex-wrap h-auto gap-1">
            <TabsTrigger value="seller-requests">Seller Requests {pendingReqs.length > 0 && <Badge className="ml-1 bg-blue-500 text-white text-[10px] px-1.5 py-0">{pendingReqs.length}</Badge>}</TabsTrigger>
            <TabsTrigger value="pending-cars">Pending Cars {pendingCars.length > 0 && <Badge className="ml-1 bg-amber-500 text-white text-[10px] px-1.5 py-0">{pendingCars.length}</Badge>}</TabsTrigger>
            <TabsTrigger value="all-cars">All Cars</TabsTrigger>
            <TabsTrigger value="stores">Stores {pendingStores.length > 0 && <Badge className="ml-1 bg-emerald-500 text-white text-[10px] px-1.5 py-0">{pendingStores.length}</Badge>}</TabsTrigger>
            <TabsTrigger value="enquiries">Enquiries</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="revenue">Revenue</TabsTrigger>
            <TabsTrigger value="ads">Ads</TabsTrigger>
          </TabsList>

          {/* SELLER REQUESTS */}
          <TabsContent value="seller-requests">
            <div className="space-y-4">
              {sellerReqs.length === 0 && <div className="text-center py-12 text-slate-400">No seller requests yet</div>}
              {sellerReqs.map(req => (
                <Card key={req.id}>
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                      <div>
                        <p className="font-semibold text-slate-900">{req.full_name}</p>
                        <p className="text-sm text-slate-500">{req.profiles?.email}</p>
                        <div className="flex gap-3 mt-1 text-sm">
                          <a href={`https://wa.me/${(req.whatsapp || '').replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="text-green-600 hover:underline">📱 {req.whatsapp}</a>
                          <span className="text-slate-500">📞 {req.phone}</span>
                        </div>
                        <div className="flex gap-2 mt-2 flex-wrap">
                          <Badge className={req.payment_method === 'naira' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}>
                            {req.payment_method === 'naira' ? `₦${Number(req.amount_paid || 3000).toLocaleString()}` : `$${req.amount_paid || 5} USDT`}
                          </Badge>
                          <Badge variant="outline" className="text-xs">Ref: {req.payment_ref}</Badge>
                          <Badge className={req.status === 'approved' ? 'bg-emerald-100 text-emerald-700' : req.status === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}>{req.status}</Badge>
                        </div>
                        <p className="text-xs text-slate-400 mt-1">{new Date(req.created_at).toLocaleString()}</p>
                      </div>
                      {req.status === 'pending' && (
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => approveSellerReq(req)} className="bg-emerald-500 hover:bg-emerald-600 text-white"><CheckCircle2 className="w-4 h-4 mr-1" />Approve</Button>
                          <Button size="sm" variant="outline" onClick={() => rejectSellerReq(req)} className="text-red-600 border-red-200"><XCircle className="w-4 h-4 mr-1" />Reject</Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* PENDING CARS */}
          <TabsContent value="pending-cars">
            <div className="space-y-4">
              {pendingCars.length === 0 && <div className="text-center py-12 text-slate-400">No pending cars 🎉</div>}
              {pendingCars.map(car => (
                <Card key={car.id}><CardContent className="p-5 flex gap-4">
                  <img src={car.images?.[0] || 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=200'} alt="" className="w-24 h-20 object-cover rounded-lg shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div>
                        <h3 className="font-semibold text-slate-900">{car.title}</h3>
                        <p className="text-sm text-slate-500">{car.profiles?.full_name || car.seller_name} · {car.seller_email || car.profiles?.email}</p>
                        <p className="text-sm text-slate-500">{car.state} · {formatPrice(car.price)}</p>
                        {car.seller_whatsapp && <a href={`https://wa.me/${car.seller_whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="text-xs text-green-600 hover:underline">📱 {car.seller_whatsapp}</a>}
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => approveCar(car)} className="bg-emerald-500 hover:bg-emerald-600 text-white"><CheckCircle2 className="w-4 h-4 mr-1" />Approve</Button>
                        <Button size="sm" variant="outline" onClick={() => rejectCar(car)} className="text-red-600 border-red-200"><XCircle className="w-4 h-4 mr-1" />Reject</Button>
                      </div>
                    </div>
                  </div>
                </CardContent></Card>
              ))}
            </div>
          </TabsContent>

          {/* ALL CARS */}
          <TabsContent value="all-cars">
            <div className="mb-4 relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" /><Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search cars..." className="pl-9" /></div>
            <div className="bg-white rounded-xl overflow-hidden border border-slate-100">
              <Table>
                <TableHeader><TableRow><TableHead>Car</TableHead><TableHead>Price</TableHead><TableHead>Status</TableHead><TableHead>Views</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
                <TableBody>
                  {filtered.map(car => (
                    <TableRow key={car.id}>
                      <TableCell><div className="flex items-center gap-3"><img src={car.images?.[0] || 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=100'} alt="" className="w-12 h-10 object-cover rounded" /><div><p className="font-medium text-sm">{car.title}</p><p className="text-xs text-slate-500">{car.state}</p></div></div></TableCell>
                      <TableCell className="font-medium text-sm">{formatPrice(car.price)}</TableCell>
                      <TableCell><Badge className={car.status === 'approved' ? 'bg-emerald-100 text-emerald-700' : car.status === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}>{car.status}</Badge></TableCell>
                      <TableCell className="text-sm text-slate-500">{car.views || 0}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {car.status === 'pending' && <Button size="sm" variant="ghost" onClick={() => approveCar(car)} className="text-emerald-600 h-8 px-2"><CheckCircle2 className="w-4 h-4" /></Button>}
                          <Button size="sm" variant="ghost" onClick={() => featureCar(car)} className={`h-8 px-2 ${car.is_featured ? 'text-amber-500' : 'text-slate-400'}`}><Star className="w-4 h-4" /></Button>
                          <Button size="sm" variant="ghost" onClick={() => removeCarItem(car.id)} className="text-red-500 h-8 px-2"><Trash2 className="w-4 h-4" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          {/* STORES */}
          <TabsContent value="stores">
            <div className="space-y-4">
              {stores.length === 0 && <div className="text-center py-12 text-slate-400">No store registrations yet</div>}
              {stores.map(store => (
                <Card key={store.id}><CardContent className="p-5">
                  <div className="flex items-start gap-4 justify-between flex-wrap">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-xl bg-slate-100 overflow-hidden flex items-center justify-center shrink-0">{store.logo_url ? <img src={store.logo_url} alt="" className="w-full h-full object-cover" /> : <Store className="w-7 h-7 text-slate-400" />}</div>
                      <div>
                        <h3 className="font-semibold text-slate-900">{store.name}</h3>
                        <p className="text-sm text-slate-500">{store.profiles?.email}</p>
                        <p className="text-sm text-slate-500">{store.state}{store.city ? `, ${store.city}` : ''}</p>
                        {store.rc_number && <p className="text-xs text-emerald-700 font-medium">RC: {store.rc_number}</p>}
                        <div className="flex items-center gap-2 mt-1">
                          <a href={`https://wa.me/${(store.whatsapp || '').replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="text-xs text-green-600 hover:underline">📱 {store.whatsapp}</a>
                          <Badge className={store.status === 'approved' ? 'bg-emerald-100 text-emerald-700' : store.status === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}>{store.status}</Badge>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      {store.status === 'pending' && <><Button size="sm" onClick={() => approveStore(store)} className="bg-emerald-500 hover:bg-emerald-600 text-white"><CheckCircle2 className="w-4 h-4 mr-1" />Approve</Button><Button size="sm" variant="outline" onClick={() => rejectStore(store)} className="text-red-600 border-red-200"><XCircle className="w-4 h-4 mr-1" />Reject</Button></>}
                      <Button size="sm" variant="ghost" onClick={() => removeStore(store.id)} className="text-red-500"><Trash2 className="w-4 h-4" /></Button>
                    </div>
                  </div>
                </CardContent></Card>
              ))}
            </div>
          </TabsContent>

          {/* ENQUIRIES */}
          <TabsContent value="enquiries">
            <div className="bg-white rounded-xl overflow-hidden border border-slate-100">
              <Table>
                <TableHeader><TableRow><TableHead>Car</TableHead><TableHead>Buyer</TableHead><TableHead>Contact</TableHead><TableHead>Message</TableHead><TableHead>Date</TableHead><TableHead>Reply</TableHead></TableRow></TableHeader>
                <TableBody>
                  {enquiries.length === 0 && <TableRow><TableCell colSpan={6} className="text-center py-12 text-slate-400">No enquiries yet</TableCell></TableRow>}
                  {enquiries.map(enq => (
                    <TableRow key={enq.id}>
                      <TableCell><p className="font-medium text-sm">{enq.car_title || enq.cars?.title}</p><p className="text-xs text-slate-500">{formatPrice(enq.car_price || enq.cars?.price)}</p></TableCell>
                      <TableCell><p className="text-sm font-medium">{enq.buyer_name}</p></TableCell>
                      <TableCell><p className="text-xs">{enq.buyer_phone}</p>{enq.buyer_whatsapp && <a href={`https://wa.me/${enq.buyer_whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="text-xs text-green-600 hover:underline">{enq.buyer_whatsapp}</a>}</TableCell>
                      <TableCell><p className="text-sm text-slate-600 max-w-[180px] truncate">{enq.message}</p></TableCell>
                      <TableCell className="text-xs text-slate-500">{new Date(enq.created_at).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <a href={`https://wa.me/${(enq.buyer_whatsapp || enq.buyer_phone || '').replace(/\D/g, '')}?text=${encodeURIComponent(`Hi ${enq.buyer_name}, regarding your enquiry on the ${enq.car_title} on H-Autos Nigeria...`)}`} target="_blank" rel="noopener noreferrer">
                          <Button size="sm" className="bg-green-500 hover:bg-green-600 text-white h-8 text-xs gap-1"><MessageSquare className="w-3 h-3" />Reply</Button>
                        </a>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          {/* USERS */}
          <TabsContent value="users">
            <div className="bg-white rounded-xl overflow-hidden border border-slate-100">
              <Table>
                <TableHeader><TableRow><TableHead>User</TableHead><TableHead>WhatsApp</TableHead><TableHead>Seller</TableHead><TableHead>Joined</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
                <TableBody>
                  {users.map(u => (
                    <TableRow key={u.id}>
                      <TableCell><p className="font-medium text-sm">{u.full_name || '—'}</p><p className="text-xs text-slate-500">{u.email}</p></TableCell>
                      <TableCell>{u.whatsapp ? <a href={`https://wa.me/${u.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="text-green-600 text-sm hover:underline">{u.whatsapp}</a> : <span className="text-slate-400 text-sm">—</span>}</TableCell>
                      <TableCell><Badge className={u.seller_active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}>{u.seller_active ? `Active${u.seller_expiry ? ` (${Math.max(0, Math.ceil((new Date(u.seller_expiry) - new Date()) / 86400000))}d)` : ''}` : '—'}</Badge></TableCell>
                      <TableCell className="text-xs text-slate-500">{u.created_at?.split('T')[0]}</TableCell>
                      <TableCell>{!u.seller_active && <Button size="sm" variant="outline" onClick={() => activateSeller(u)} className="h-8 text-xs gap-1"><UserCheck className="w-3 h-3" />Activate</Button>}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          {/* REVENUE */}
          <TabsContent value="revenue">
            <div className="mb-4 flex justify-between items-center">
              <div className="flex gap-4">
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3"><p className="text-xs text-emerald-600">Total NGN</p><p className="text-xl font-bold text-emerald-700">₦{(stats.revenueNGN || 0).toLocaleString()}</p></div>
                <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3"><p className="text-xs text-blue-600">Total USDT</p><p className="text-xl font-bold text-blue-700">${stats.revenueUSDT || 0}</p></div>
              </div>
              <Button onClick={() => setShowRevModal(true)} className="bg-emerald-500 hover:bg-emerald-600 text-white gap-2"><Plus className="w-4 h-4" />Log Entry</Button>
            </div>
            <div className="bg-white rounded-xl overflow-hidden border border-slate-100">
              <Table>
                <TableHeader><TableRow><TableHead>Description</TableHead><TableHead>Amount</TableHead><TableHead>Type</TableHead><TableHead>Date</TableHead></TableRow></TableHeader>
                <TableBody>
                  {revLog.length === 0 && <TableRow><TableCell colSpan={4} className="text-center py-12 text-slate-400">No revenue logged yet</TableCell></TableRow>}
                  {revLog.map((r, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-medium text-sm">{r.description}</TableCell>
                      <TableCell><Badge className={r.currency === 'NGN' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}>{r.currency === 'NGN' ? `₦${Number(r.amount).toLocaleString()}` : `$${r.amount} USDT`}</Badge></TableCell>
                      <TableCell className="text-sm text-slate-500 capitalize">{r.type?.replace('_', ' ')}</TableCell>
                      <TableCell className="text-xs text-slate-500">{new Date(r.created_at).toLocaleDateString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          {/* ADS */}
          <TabsContent value="ads">
            <div className="mb-4 flex justify-end"><Button onClick={() => { setEditAd(null); setAdForm({ title: '', description: '', link_url: '', image_url: '', is_active: true, expires_at: '' }); setShowAdModal(true); }} className="bg-amber-500 hover:bg-amber-600 text-white gap-2"><Plus className="w-4 h-4" />New Ad</Button></div>
            <div className="grid md:grid-cols-2 gap-4">
              {ads.length === 0 && <div className="col-span-2 text-center py-12 text-slate-400">No ads yet</div>}
              {ads.map(ad => (
                <Card key={ad.id}><CardContent className="p-4">
                  {ad.image_url && <img src={ad.image_url} alt="" className="w-full h-28 object-cover rounded-lg mb-3" />}
                  <div className="flex items-start justify-between">
                    <div><p className="font-semibold">{ad.title}</p>{ad.description && <p className="text-sm text-slate-500">{ad.description}</p>}{ad.expires_at && <p className="text-xs text-slate-400 mt-1">Expires: {ad.expires_at.split('T')[0]}</p>}</div>
                    <div className="flex gap-1">
                      <Button size="sm" variant="ghost" onClick={() => { setEditAd(ad); setAdForm(ad); setShowAdModal(true); }} className="h-8 px-2"><Edit className="w-4 h-4" /></Button>
                      <Button size="sm" variant="ghost" onClick={async () => { await deleteAd(ad.id); setAds(a => a.filter(x => x.id !== ad.id)); }} className="h-8 px-2 text-red-500"><Trash2 className="w-4 h-4" /></Button>
                    </div>
                  </div>
                </CardContent></Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* List Car Modal */}
      <Dialog open={showListCar} onOpenChange={setShowListCar}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>List New Car (Admin)</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Make *</Label><Select value={listForm.make} onValueChange={v => setListForm(p => ({ ...p, make: v }))}><SelectTrigger className="mt-1"><SelectValue placeholder="Make" /></SelectTrigger><SelectContent>{MAKES.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent></Select></div>
              <div><Label>Model *</Label><Input value={listForm.model} onChange={e => setListForm(p => ({ ...p, model: e.target.value }))} className="mt-1" placeholder="e.g. Camry" /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Year</Label><Input type="number" value={listForm.year} onChange={e => setListForm(p => ({ ...p, year: e.target.value }))} className="mt-1" min={1980} max={2026} /></div>
              <div><Label>Price (₦) *</Label><Input type="number" value={listForm.price} onChange={e => setListForm(p => ({ ...p, price: e.target.value }))} className="mt-1" placeholder="5000000" /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>State *</Label><Select value={listForm.state} onValueChange={v => setListForm(p => ({ ...p, state: v }))}><SelectTrigger className="mt-1"><SelectValue placeholder="State" /></SelectTrigger><SelectContent>{NIGERIAN_STATES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select></div>
              <div><Label>City</Label><Input value={listForm.city} onChange={e => setListForm(p => ({ ...p, city: e.target.value }))} className="mt-1" placeholder="Ikeja" /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Condition</Label><Select value={listForm.condition} onValueChange={v => setListForm(p => ({ ...p, condition: v }))}><SelectTrigger className="mt-1"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="brand_new">Brand New</SelectItem><SelectItem value="foreign_used">Foreign Used</SelectItem><SelectItem value="nigerian_used">Nigerian Used</SelectItem></SelectContent></Select></div>
              <div><Label>Mileage (km)</Label><Input type="number" value={listForm.mileage} onChange={e => setListForm(p => ({ ...p, mileage: e.target.value }))} className="mt-1" /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Fuel</Label><Select value={listForm.fuel_type} onValueChange={v => setListForm(p => ({ ...p, fuel_type: v }))}><SelectTrigger className="mt-1"><SelectValue /></SelectTrigger><SelectContent>{['petrol', 'diesel', 'electric', 'hybrid', 'CNG'].map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}</SelectContent></Select></div>
              <div><Label>Transmission</Label><Select value={listForm.transmission} onValueChange={v => setListForm(p => ({ ...p, transmission: v }))}><SelectTrigger className="mt-1"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="automatic">Automatic</SelectItem><SelectItem value="manual">Manual</SelectItem></SelectContent></Select></div>
            </div>
            <div><Label>Assign to Store</Label><Select value={listForm.store_id} onValueChange={v => setListForm(p => ({ ...p, store_id: v }))}><SelectTrigger className="mt-1"><SelectValue placeholder="No store (admin listing)" /></SelectTrigger><SelectContent><SelectItem value="">No store</SelectItem>{stores.filter(s => s.status === 'approved').map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent></Select></div>
            <div><Label>Seller WhatsApp</Label><Input value={listForm.seller_whatsapp} onChange={e => setListForm(p => ({ ...p, seller_whatsapp: e.target.value }))} className="mt-1" /></div>
            <div><Label>Custom Title</Label><Input value={listForm.title} onChange={e => setListForm(p => ({ ...p, title: e.target.value }))} className="mt-1" placeholder={`${listForm.year} ${listForm.make} ${listForm.model}`} /></div>
            <div><Label>Description</Label><Textarea value={listForm.description} onChange={e => setListForm(p => ({ ...p, description: e.target.value }))} rows={3} className="mt-1 resize-none" /></div>
            <div>
              <Label>Photos</Label>
              <label className="mt-2 flex flex-col items-center h-24 border-2 border-dashed border-slate-300 rounded-xl cursor-pointer hover:border-amber-400 hover:bg-amber-50 transition-all justify-center">
                <input type="file" multiple accept="image/*" onChange={handleCarImages} className="hidden" />
                {uploadingImgs ? <Loader2 className="w-6 h-6 animate-spin text-amber-500" /> : <><ImageIcon className="w-6 h-6 text-slate-400 mb-1" /><p className="text-xs text-slate-500">Upload photos</p></>}
              </label>
              {listForm.images.length > 0 && <div className="grid grid-cols-5 gap-2 mt-2">{listForm.images.map((url, i) => <div key={i} className="relative aspect-square rounded overflow-hidden group"><img src={url} alt="" className="w-full h-full object-cover" /><button onClick={() => setListForm(p => ({ ...p, images: p.images.filter((_, j) => j !== i) }))} className="absolute top-0.5 right-0.5 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center opacity-0 group-hover:opacity-100"><X className="w-2.5 h-2.5" /></button></div>)}</div>}
            </div>
            <Button onClick={handleAdminList} className="w-full bg-amber-500 hover:bg-amber-600 text-white h-12">Post Car Listing</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Ad Modal */}
      <Dialog open={showAdModal} onOpenChange={setShowAdModal}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editAd ? 'Edit' : 'New'} Spotlight Ad</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Title *</Label><Input value={adForm.title} onChange={e => setAdForm(p => ({ ...p, title: e.target.value }))} className="mt-1" /></div>
            <div><Label>Description</Label><Input value={adForm.description} onChange={e => setAdForm(p => ({ ...p, description: e.target.value }))} className="mt-1" /></div>
            <div><Label>Image URL</Label><Input value={adForm.image_url} onChange={e => setAdForm(p => ({ ...p, image_url: e.target.value }))} placeholder="https://..." className="mt-1" /></div>
            <div><Label>Link URL</Label><Input value={adForm.link_url} onChange={e => setAdForm(p => ({ ...p, link_url: e.target.value }))} placeholder="https://..." className="mt-1" /></div>
            <div><Label>Expires At</Label><Input type="date" value={adForm.expires_at?.split('T')[0] || ''} onChange={e => setAdForm(p => ({ ...p, expires_at: e.target.value }))} className="mt-1" /></div>
            <Button onClick={saveAd} className="w-full bg-amber-500 hover:bg-amber-600 text-white">Save Ad</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Revenue Log Modal */}
      <Dialog open={showRevModal} onOpenChange={setShowRevModal}>
        <DialogContent>
          <DialogHeader><DialogTitle>Log Revenue Entry</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Description *</Label><Input value={revForm.description} onChange={e => setRevForm(p => ({ ...p, description: e.target.value }))} className="mt-1" placeholder="e.g. Seller subscription – John Doe" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Amount *</Label><Input type="number" value={revForm.amount} onChange={e => setRevForm(p => ({ ...p, amount: e.target.value }))} className="mt-1" placeholder="3000" /></div>
              <div><Label>Currency</Label><Select value={revForm.currency} onValueChange={v => setRevForm(p => ({ ...p, currency: v }))}><SelectTrigger className="mt-1"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="NGN">NGN (₦)</SelectItem><SelectItem value="USDT">USDT ($)</SelectItem></SelectContent></Select></div>
            </div>
            <div><Label>Type</Label><Select value={revForm.type} onValueChange={v => setRevForm(p => ({ ...p, type: v }))}><SelectTrigger className="mt-1"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="seller_subscription">Seller Subscription</SelectItem><SelectItem value="store_registration">Store Registration</SelectItem><SelectItem value="spotlight_ad">Spotlight Ad</SelectItem><SelectItem value="other">Other</SelectItem></SelectContent></Select></div>
            <Button onClick={saveRevEntry} className="w-full bg-emerald-500 hover:bg-emerald-600 text-white">Log Revenue</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
