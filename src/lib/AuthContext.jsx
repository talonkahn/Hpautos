import React, { createContext, useState, useContext, useEffect } from 'react';
import { supabase, signInWithEmail, signUpWithEmail, signOut, getUserProfile, upsertProfile, subscribeNewsletter, ADMIN_EMAIL } from '@/lib/supabase';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) handleUser(session.user);
      else setIsLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) await handleUser(session.user);
      else { setUser(null); setProfile(null); setIsLoading(false); }
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleUser = async (authUser) => {
    setUser(authUser);
    try {
      let prof = await getUserProfile(authUser.id);
      if (!prof) {
        prof = await upsertProfile({
          id: authUser.id,
          email: authUser.email,
          full_name: authUser.user_metadata?.full_name || authUser.email?.split('@')[0],
          is_admin: authUser.email === ADMIN_EMAIL,
          subscription_status: 'free',
          whatsapp: authUser.user_metadata?.phone || '',
          phone: authUser.user_metadata?.phone || '',
        });
        await subscribeNewsletter(authUser.email, authUser.id).catch(() => {});
      } else if (!prof.is_admin && authUser.email === ADMIN_EMAIL) {
        // auto-elevate admin email
        prof = await upsertProfile({ ...prof, is_admin: true });
      }
      setProfile(prof);
    } catch (err) { console.error('Profile error:', err); }
    finally { setIsLoading(false); }
  };

  const refreshProfile = async () => {
    if (user) { const p = await getUserProfile(user.id); setProfile(p); return p; }
  };

  const login = async (email, password) => {
    const data = await signInWithEmail(email, password);
    return data;
  };

  const register = async (email, password, fullName, phone) => {
    const data = await signUpWithEmail(email, password, fullName, phone);
    return data;
  };

  const logout = async () => { await signOut(); setUser(null); setProfile(null); };

  return (
    <AuthContext.Provider value={{
      user, profile, isLoading,
      isAuthenticated: !!user,
      isAdmin: profile?.is_admin === true || user?.email === ADMIN_EMAIL,
      login, register, logout, refreshProfile
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
};
