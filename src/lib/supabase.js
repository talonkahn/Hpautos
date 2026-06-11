import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { autoRefreshToken: true, persistSession: true, detectSessionInUrl: true }
});

// ─── CONFIG ───────────────────────────────────────────────────────────────────
export const ADMIN_EMAIL = 'samuelivere92@gmail.com';
export const ADMIN_WHATSAPP = '2348146730044';
export const SELLER_FEE_NGN = 3000;
export const SELLER_FEE_USDT = 5;
export const SELLER_DURATION_DAYS = 14;

// ─── AUTH — email/password only ───────────────────────────────────────────────
export const signUpWithEmail = async (email, password, fullName, phone) => {
  const { data, error } = await supabase.auth.signUp({
    email, password,
    options: { data: { full_name: fullName, phone } }
  });
  if (error) throw error;
  return data;
};

export const signInWithEmail = async (email, password) => {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};

export const resetPassword = async (email) => {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/ResetPassword`
  });
  if (error) throw error;
};

// ─── PROFILES ─────────────────────────────────────────────────────────────────
export const getUserProfile = async (userId) => {
  const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
  if (error && error.code !== 'PGRST116') throw error;
  return data;
};
export const upsertProfile = async (profile) => {
  const { data, error } = await supabase.from('profiles').upsert(profile, { onConflict: 'id' }).select().single();
  if (error) throw error;
  return data;
};
export const getAllUsersAdmin = async () => {
  const { data, error } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
};

// ─── CARS ─────────────────────────────────────────────────────────────────────
export const getCars = async (filters = {}, limit = 100) => {
  let q = supabase.from('cars').select(`*, profiles(full_name, whatsapp, avatar_url), stores(name, logo_url, rc_number)`);
  if (filters.status)  q = q.eq('status', filters.status);
  if (filters.country) q = q.eq('country', filters.country);
  if (filters.seller_id) q = q.eq('seller_id', filters.seller_id);
  if (filters.store_id) q = q.eq('store_id', filters.store_id);
  if (filters.state) q = q.eq('state', filters.state);
  if (filters.make) q = q.eq('make', filters.make);
  if (filters.condition) q = q.eq('condition', filters.condition);
  if (filters.transmission) q = q.eq('transmission', filters.transmission);
  if (filters.is_featured) q = q.eq('is_featured', true);
  if (filters.minPrice) q = q.gte('price', filters.minPrice);
  if (filters.maxPrice) q = q.lte('price', filters.maxPrice);
  if (filters.minYear) q = q.gte('year', filters.minYear);
  if (filters.maxYear) q = q.lte('year', filters.maxYear);
  if (filters.search) q = q.or(`title.ilike.%${filters.search}%,make.ilike.%${filters.search}%,model.ilike.%${filters.search}%`);
  q = q.order('created_at', { ascending: false }).limit(limit);
  const { data, error } = await q;
  if (error) throw error;
  return data || [];
};
export const getCarById = async (id) => {
  const { data, error } = await supabase.from('cars').select(`*, profiles(full_name, whatsapp, phone, avatar_url, email), stores(name, logo_url, rc_number, whatsapp, address, city, state)`).eq('id', id).single();
  if (error) throw error;
  await supabase.from('cars').update({ views: (data.views || 0) + 1 }).eq('id', id);
  // log page view
  await logVisit('car', id).catch(() => {});
  return data;
};
export const createCar = async (car) => {
  const { data, error } = await supabase.from('cars').insert(car).select().single();
  if (error) throw error;
  return data;
};
export const updateCar = async (id, updates) => {
  const { data, error } = await supabase.from('cars').update(updates).eq('id', id).select().single();
  if (error) throw error;
  return data;
};
export const deleteCar = async (id) => { const { error } = await supabase.from('cars').delete().eq('id', id); if (error) throw error; };
export const getAllCarsAdmin = async () => {
  const { data, error } = await supabase.from('cars').select(`*, profiles(full_name, email, whatsapp), stores(name)`).order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
};

// ─── STORES ───────────────────────────────────────────────────────────────────
export const getStores = async (approvedOnly = true) => {
  let q = supabase.from('stores').select('*').order('created_at', { ascending: false });
  if (approvedOnly) q = q.eq('status', 'approved');
  const { data, error } = await q;
  if (error) throw error;
  return data || [];
};
export const getStoreById = async (id) => {
  const { data, error } = await supabase.from('stores').select(`*, cars(*)`).eq('id', id).single();
  if (error) throw error;
  return data;
};
export const createStore = async (store) => {
  const { data, error } = await supabase.from('stores').insert(store).select().single();
  if (error) throw error;
  return data;
};
export const updateStore = async (id, updates) => {
  const { data, error } = await supabase.from('stores').update(updates).eq('id', id).select().single();
  if (error) throw error;
  return data;
};
export const deleteStore = async (id) => { const { error } = await supabase.from('stores').delete().eq('id', id); if (error) throw error; };
export const getAllStoresAdmin = async () => {
  const { data, error } = await supabase.from('stores').select(`*, profiles(full_name, email)`).order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
};

// ─── SELLER REQUESTS ──────────────────────────────────────────────────────────
export const createSellerRequest = async (req) => {
  const { data, error } = await supabase.from('seller_requests').insert(req).select().single();
  if (error) throw error;
  return data;
};
export const getSellerRequests = async () => {
  const { data, error } = await supabase.from('seller_requests').select(`*, profiles(full_name, email, whatsapp)`).order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
};
export const updateSellerRequest = async (id, updates) => {
  const { data, error } = await supabase.from('seller_requests').update(updates).eq('id', id).select().single();
  if (error) throw error;
  return data;
};
export const getUserSellerRequest = async (userId) => {
  const { data, error } = await supabase.from('seller_requests').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(1).single();
  if (error && error.code !== 'PGRST116') throw error;
  return data;
};

// ─── ENQUIRIES ────────────────────────────────────────────────────────────────
export const createEnquiry = async (enquiry) => {
  const { data, error } = await supabase.from('enquiries').insert(enquiry).select().single();
  if (error) throw error;
  return data;
};
export const getEnquiries = async () => {
  const { data, error } = await supabase.from('enquiries').select(`*, cars(title, price, images), profiles(full_name, email, whatsapp)`).order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
};

// ─── REVENUE TRACKING ────────────────────────────────────────────────────────
export const logRevenue = async (entry) => {
  await supabase.from('revenue_log').insert(entry).catch(() => {});
};
export const getRevenueLog = async () => {
  const { data, error } = await supabase.from('revenue_log').select('*').order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
};

// ─── VISITOR TRACKING ────────────────────────────────────────────────────────
export const logVisit = async (page = 'home', ref = null) => {
  await supabase.from('site_visits').insert({ page, ref, visited_at: new Date().toISOString() }).catch(() => {});
};
export const getVisitStats = async () => {
  const today = new Date(); today.setHours(0,0,0,0);
  const week = new Date(today); week.setDate(week.getDate() - 7);
  const month = new Date(today); month.setDate(1);
  const [total, todayR, weekR, monthR] = await Promise.all([
    supabase.from('site_visits').select('id', { count: 'exact', head: true }),
    supabase.from('site_visits').select('id', { count: 'exact', head: true }).gte('visited_at', today.toISOString()),
    supabase.from('site_visits').select('id', { count: 'exact', head: true }).gte('visited_at', week.toISOString()),
    supabase.from('site_visits').select('id', { count: 'exact', head: true }).gte('visited_at', month.toISOString()),
  ]);
  return {
    total: total.count || 0,
    today: todayR.count || 0,
    thisWeek: weekR.count || 0,
    thisMonth: monthR.count || 0
  };
};

// ─── CHAT / MESSAGES ──────────────────────────────────────────────────────────
export const getConversations = async (userId) => {
  const { data, error } = await supabase.from('conversations').select(`*, cars(title, images, price), buyer:profiles!conversations_buyer_id_fkey(full_name, avatar_url), seller:profiles!conversations_seller_id_fkey(full_name, avatar_url)`).or(`buyer_id.eq.${userId},seller_id.eq.${userId}`).order('updated_at', { ascending: false });
  if (error) throw error;
  return data || [];
};
export const getMessages = async (conversationId) => {
  const { data, error } = await supabase.from('messages').select(`*, sender:profiles!messages_sender_id_fkey(full_name, avatar_url)`).eq('conversation_id', conversationId).order('created_at', { ascending: true });
  if (error) throw error;
  return data || [];
};
export const sendMessage = async (conversationId, senderId, content) => {
  const { data, error } = await supabase.from('messages').insert({ conversation_id: conversationId, sender_id: senderId, content }).select().single();
  if (error) throw error;
  await supabase.from('conversations').update({ last_message: content, updated_at: new Date().toISOString() }).eq('id', conversationId);
  return data;
};
export const getOrCreateConversation = async (buyerId, sellerId, carId) => {
  const { data: existing } = await supabase.from('conversations').select('*').eq('buyer_id', buyerId).eq('seller_id', sellerId).eq('car_id', carId).single();
  if (existing) return existing;
  const { data, error } = await supabase.from('conversations').insert({ buyer_id: buyerId, seller_id: sellerId, car_id: carId }).select().single();
  if (error) throw error;
  return data;
};

// ─── SPOTLIGHT ADS ────────────────────────────────────────────────────────────
export const getActiveAds = async () => {
  const now = new Date().toISOString();
  const { data, error } = await supabase.from('spotlight_ads').select('*').eq('is_active', true).gte('expires_at', now).order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
};
export const createAd = async (ad) => { const { data, error } = await supabase.from('spotlight_ads').insert(ad).select().single(); if (error) throw error; return data; };
export const updateAd = async (id, u) => { const { data, error } = await supabase.from('spotlight_ads').update(u).eq('id', id).select().single(); if (error) throw error; return data; };
export const deleteAd = async (id) => { const { error } = await supabase.from('spotlight_ads').delete().eq('id', id); if (error) throw error; };

// ─── NEWSLETTER ───────────────────────────────────────────────────────────────
export const subscribeNewsletter = async (email, userId) => {
  await supabase.from('newsletter_subscribers').upsert({ email, user_id: userId, subscribed: true }, { onConflict: 'email' });
};

// ─── NOTIFICATIONS ────────────────────────────────────────────────────────────
export const sendEmailNotification = async ({ to, subject, html }) => {
  const { error } = await supabase.functions.invoke('send-email', { body: { to, subject, html, bcc: ADMIN_EMAIL } });
  if (error) console.error('Email error:', error);
};
export const notifyAdminWhatsApp = (message) => `https://wa.me/${ADMIN_WHATSAPP}?text=${encodeURIComponent(message)}`;

// ─── STORAGE ──────────────────────────────────────────────────────────────────
export const uploadFile = async (file, bucket = 'cars') => {
  const ext = file.name.split('.').pop();
  const fileName = `${Date.now()}-${Math.random().toString(36).substr(2,9)}.${ext}`;
  const { error } = await supabase.storage.from(bucket).upload(fileName, file, { upsert: false });
  if (error) throw error;
  const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(fileName);
  return publicUrl;
};

// ─── ADMIN STATS ──────────────────────────────────────────────────────────────
export const getAdminStats = async () => {
  const [cars, users, stores, requests, enquiries, revenue, visits] = await Promise.all([
    supabase.from('cars').select('id, status, views'),
    supabase.from('profiles').select('id', { count: 'exact', head: true }),
    supabase.from('stores').select('id, status'),
    supabase.from('seller_requests').select('id, status, amount_paid, currency'),
    supabase.from('enquiries').select('id', { count: 'exact', head: true }),
    supabase.from('revenue_log').select('amount, currency, created_at'),
    getVisitStats(),
  ]);
  const allCars = cars.data || [];
  const allStores = stores.data || [];
  const allReqs = requests.data || [];
  const revData = revenue.data || [];
  const totalRevenueNGN = revData.filter(r => r.currency === 'NGN').reduce((s, r) => s + (r.amount || 0), 0);
  const totalRevenueUSDT = revData.filter(r => r.currency === 'USDT').reduce((s, r) => s + (r.amount || 0), 0);
  return {
    totalCars: allCars.length,
    pendingCars: allCars.filter(c => c.status === 'pending').length,
    approvedCars: allCars.filter(c => c.status === 'approved').length,
    totalUsers: users.count || 0,
    totalStores: allStores.length,
    pendingStores: allStores.filter(s => s.status === 'pending').length,
    approvedStores: allStores.filter(s => s.status === 'approved').length,
    pendingSellerRequests: allReqs.filter(r => r.status === 'pending').length,
    approvedSellerRequests: allReqs.filter(r => r.status === 'approved').length,
    totalEnquiries: enquiries.count || 0,
    totalViews: allCars.reduce((s, c) => s + (c.views || 0), 0),
    revenueNGN: totalRevenueNGN,
    revenueUSDT: totalRevenueUSDT,
    visits,
  };
};
