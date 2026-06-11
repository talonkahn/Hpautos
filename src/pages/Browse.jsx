import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getCars } from '@/lib/supabase';
import { COUNTRIES, getCountry } from '@/components/shared/LocationData';
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Car, Grid3X3, List, Globe } from 'lucide-react';
import SearchFilters from '@/components/cars/SearchFilters';
import CarCard from '@/components/cars/CarCard';
import { motion, AnimatePresence } from 'framer-motion';

export default function Browse() {
  const urlParams = new URLSearchParams(window.location.search);
  const [filters, setFilters] = useState({
    search:       urlParams.get('search') || '',
    country:      urlParams.get('country') || '',
    state:        urlParams.get('state') || '',
    make:         urlParams.get('make') || '',
    condition:    '',
    transmission: '',
    minPrice:     0,
    maxPrice:     100000000,
    minYear:      '',
    maxYear:      '',
  });
  const [sortBy, setSortBy]     = useState('-created_at');
  const [viewMode, setViewMode] = useState('grid');

  const mergeFilters = (newF) => setFilters(p => ({ ...p, ...newF }));

  const { data: cars = [], isLoading } = useQuery({
    queryKey: ['cars', filters],
    queryFn: async () => {
      const q = { status: 'approved' };
      if (filters.country)      q.country      = filters.country;
      if (filters.state)        q.state        = filters.state;
      if (filters.make)         q.make         = filters.make;
      if (filters.condition)    q.condition    = filters.condition;
      if (filters.transmission) q.transmission = filters.transmission;
      if (filters.minPrice > 0)          q.minPrice = filters.minPrice;
      if (filters.maxPrice < 100000000)  q.maxPrice = filters.maxPrice;
      if (filters.minYear)      q.minYear      = filters.minYear;
      if (filters.maxYear)      q.maxYear      = filters.maxYear;
      if (filters.search)       q.search       = filters.search;
      return getCars(q, 200);
    }
  });

  const sorted = [...cars].sort((a, b) => {
    if (sortBy === '-created_at') return new Date(b.created_at) - new Date(a.created_at);
    if (sortBy === 'created_at')  return new Date(a.created_at) - new Date(b.created_at);
    if (sortBy === 'price')       return a.price - b.price;
    if (sortBy === '-price')      return b.price - a.price;
    if (sortBy === '-year')       return b.year - a.year;
    if (sortBy === 'year')        return a.year - b.year;
    return 0;
  });

  // Page title
  const activeCountry = filters.country ? getCountry(filters.country) : null;
  let title = 'All Cars';
  if (filters.make && filters.state)        title = `${filters.make} in ${filters.state}`;
  else if (filters.make && activeCountry)   title = `${filters.make} in ${activeCountry.name}`;
  else if (filters.make)                    title = `${filters.make} Cars`;
  else if (filters.state)                   title = `Cars in ${filters.state}`;
  else if (activeCountry)                   title = `Cars in ${activeCountry.flag} ${activeCountry.name}`;

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-3xl font-bold text-slate-900">{title}</h1>
            {activeCountry && (
              <Badge className="bg-amber-100 text-amber-700 border-amber-200 text-sm px-3">
                {activeCountry.flag} {activeCountry.name}
              </Badge>
            )}
          </div>
          <p className="text-slate-500 flex items-center gap-2">
            <Globe className="w-4 h-4" />
            {isLoading ? 'Searching...' : `${sorted.length.toLocaleString()} car${sorted.length !== 1 ? 's' : ''} found`}
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <SearchFilters filters={filters} onFilterChange={mergeFilters} />

        <div className="flex items-center justify-between mt-6 mb-6">
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-48 bg-white h-10">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="-created_at">Newest First</SelectItem>
              <SelectItem value="created_at">Oldest First</SelectItem>
              <SelectItem value="price">Price: Low → High</SelectItem>
              <SelectItem value="-price">Price: High → Low</SelectItem>
              <SelectItem value="-year">Year: Newest</SelectItem>
              <SelectItem value="year">Year: Oldest</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex items-center gap-1">
            <Button variant={viewMode === 'grid' ? 'default' : 'ghost'} size="icon" onClick={() => setViewMode('grid')} className={viewMode === 'grid' ? 'bg-slate-900 h-9 w-9' : 'h-9 w-9'}><Grid3X3 className="w-4 h-4" /></Button>
            <Button variant={viewMode === 'list' ? 'default' : 'ghost'} size="icon" onClick={() => setViewMode('list')} className={viewMode === 'list' ? 'bg-slate-900 h-9 w-9' : 'h-9 w-9'}><List className="w-4 h-4" /></Button>
          </div>
        </div>

        {isLoading ? (
          <div className={`grid ${viewMode === 'grid' ? 'md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' : 'grid-cols-1'} gap-6`}>
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl overflow-hidden">
                <Skeleton className="aspect-[4/3] w-full" />
                <div className="p-5"><Skeleton className="h-5 w-3/4 mb-2" /><Skeleton className="h-4 w-1/2 mb-4" /><Skeleton className="h-7 w-1/3" /></div>
              </div>
            ))}
          </div>
        ) : sorted.length === 0 ? (
          <div className="text-center py-24">
            <div className="w-20 h-20 bg-slate-100 rounded-full mx-auto mb-6 flex items-center justify-center">
              <Car className="w-10 h-10 text-slate-400" />
            </div>
            <h3 className="text-xl font-semibold text-slate-900 mb-2">No cars found</h3>
            <p className="text-slate-500 mb-6">Try a different country, region or adjust your filters</p>
            <Button variant="outline" onClick={() => mergeFilters({ search: '', country: '', state: '', make: '', condition: '', transmission: '', minPrice: 0, maxPrice: 100000000, minYear: '', maxYear: '' })}>
              Clear all filters
            </Button>
          </div>
        ) : (
          <motion.div layout className={`grid ${viewMode === 'grid' ? 'md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' : 'grid-cols-1'} gap-6`}>
            <AnimatePresence>
              {sorted.map(car => <CarCard key={car.id} car={car} />)}
            </AnimatePresence>
          </motion.div>
        )}
      </div>
    </div>
  );
}
