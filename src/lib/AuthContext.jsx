import React, { createContext, useState, useContext, useEffect } from 'react';
import { supabase, signInWithGoogle, signOut, getUserProfile, upsertProfile, subscribeNewsletter } from '@/lib/supabase';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        handleUser(session.user);
      } else {
        setIsLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        await handleUser(session.user);
      } else {
        setUser(null);
        setProfile(null);
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleUser = async (authUser) => {
    setUser(authUser);
    try {
      let prof = await getUserProfile(authUser.id);
      if (!prof) {
        // First time sign in — create profile
        prof = await upsertProfile({
          id: authUser.id,
          email: authUser.email,
          full_name: authUser.user_metadata?.full_name || authUser.email?.split('@')[0],
          avatar_url: authUser.user_metadata?.avatar_url || null,
          is_admin: false,
          subscription_status: 'free',
          whatsapp: '',
          phone: ''
        });
        // Subscribe to newsletter
        await subscribeNewsletter(authUser.email, authUser.id).catch(() => {});
      }
      setProfile(prof);
    } catch (err) {
      console.error('Profile load error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshProfile = async () => {
    if (user) {
      const prof = await getUserProfile(user.id);
      setProfile(prof);
      return prof;
    }
  };

  const logout = async () => {
    await signOut();
    setUser(null);
    setProfile(null);
  };

  const login = async () => {
    await signInWithGoogle();
  };

  return (
    <AuthContext.Provider value={{
      user,
      profile,
      isLoading,
      isAuthenticated: !!user,
      isAdmin: profile?.is_admin === true,
      login,
      logout,
      refreshProfile
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
