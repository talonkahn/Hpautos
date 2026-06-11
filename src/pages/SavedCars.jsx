import logo from '@/assets/logo.jpg';
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { supabase } from '@/lib/supabase';
import AuthModal from '@/components/AuthModal';
import { Button } from "@/components/ui/button";
import { Heart, Car } from 'lucide-react';
import CarCard from '@/components/cars/CarCard';

export default function SavedCars() {
  const { isAuthenticated } = useAuth();
  const [showAuth, setShowAuth] = useState(false);
  const [savedIds, setSavedIds] = useState(() => {
    try { return JSON.parse(localStorage.getItem('savedCars') || '[]'); } catch { return []; }
  });
  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!savedIds.length) { setCars([]); return; }
    setLoading(true);
    supabase.from('cars').select('*').in('id', savedIds).eq('status', 'approved')
      .then(({ data }) => { setCars(data || []); setLoading(false); });
  }, [savedIds]);

  const toggle = (id) => {
    const next = savedIds.includes(id) ? savedIds.filter(x => x !== id) : [...savedIds, id];
    setSavedIds(next);
    localStorage.setItem('savedCars', JSON.stringify(next));
  };

  if (!isAuthenticated) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="text-center">
        <Heart className="w-16 h-16 text-amber-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold mb-2">Sign in to save cars</h2>
        <p className="text-slate-500 mb-6">Create a free account to save cars and view them later.</p>
        <Button onClick={() => setShowAuth(true)} className="bg-amber-500 hover:bg-amber-600 text-white h-12 px-8">Sign In / Register</Button>
      </div>
      <AuthModal open={showAuth} onClose={() => setShowAuth(false)} />
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold text-slate-900">Saved Cars</h1>
          <p className="text-slate-500 mt-1">{cars.length} saved listing{cars.length !== 1 ? 's' : ''}</p>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 py-8">
        {loading ? <p className="text-slate-500">Loading...</p>
          : cars.length === 0 ? (
            <div className="text-center py-20">
              <Heart className="w-16 h-16 text-slate-200 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-slate-900 mb-2">No saved cars yet</h3>
              <p className="text-slate-500 mb-6">Browse cars and tap the heart icon to save them.</p>
              <Link to="/Browse"><Button className="bg-amber-500 hover:bg-amber-600 text-white">Browse Cars</Button></Link>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {cars.map(car => <CarCard key={car.id} car={car} isSaved={savedIds.includes(car.id)} onSave={toggle} />)}
            </div>
          )}
      </div>
    </div>
  );
}
