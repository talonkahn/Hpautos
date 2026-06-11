import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Search, SlidersHorizontal, X, Globe } from 'lucide-react';
import { COUNTRIES, getRegions, CAR_MAKES } from '@/components/shared/LocationData';
import { CountrySelector, RegionSelector } from '@/components/shared/LocationSelector';

export default function SearchFilters({ filters, onFilterChange }) {
  const [open, setOpen] = useState(false);

  const set = (k, v) => onFilterChange({ [k]: v });

  const activeCount = [
    filters.country, filters.state, filters.make, filters.condition,
    filters.transmission, filters.minYear, filters.maxYear,
    filters.minPrice > 0 && filters.minPrice,
    filters.maxPrice < 100000000 && filters.maxPrice,
  ].filter(Boolean).length;

  const clear = () => onFilterChange({
    search: '', country: '', state: '', make: '', condition: '',
    transmission: '', minPrice: 0, maxPrice: 100000000, minYear: '', maxYear: ''
  });

  return (
    <div className="space-y-4">
      {/* Search bar + filter toggle */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            value={filters.search}
            onChange={e => set('search', e.target.value)}
            placeholder="Search make, model, keyword..."
            className="pl-10 bg-white h-11"
          />
        </div>
        <Button
          variant="outline"
          onClick={() => setOpen(o => !o)}
          className={`h-11 gap-2 shrink-0 ${open ? 'border-amber-500 text-amber-600 bg-amber-50' : ''}`}
        >
          <SlidersHorizontal className="w-4 h-4" />
          Filters
          {activeCount > 0 && (
            <Badge className="bg-amber-500 text-white text-[10px] px-1.5 py-0 ml-1">{activeCount}</Badge>
          )}
        </Button>
        {activeCount > 0 && (
          <Button variant="ghost" onClick={clear} className="h-11 gap-1 text-slate-500 shrink-0">
            <X className="w-4 h-4" /> Clear
          </Button>
        )}
      </div>

      {/* Expanded filters */}
      {open && (
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">

            {/* Country */}
            <div>
              <Label className="text-xs text-slate-500 mb-1 block flex items-center gap-1">
                <Globe className="w-3 h-3" /> Country
              </Label>
              <CountrySelector
                value={filters.country}
                onChange={v => onFilterChange({ country: v, state: '' })}
                className="h-9"
              />
            </div>

            {/* State / Region */}
            <div>
              <Label className="text-xs text-slate-500 mb-1 block">State / Region</Label>
              <RegionSelector
                countryCode={filters.country}
                value={filters.state}
                onChange={v => set('state', v)}
                className="h-9"
              />
            </div>

            {/* Make */}
            <div>
              <Label className="text-xs text-slate-500 mb-1 block">Make</Label>
              <Select value={filters.make} onValueChange={v => set('make', v)}>
                <SelectTrigger className="h-9"><SelectValue placeholder="All makes" /></SelectTrigger>
                <SelectContent className="max-h-64">
                  {CAR_MAKES.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {/* Condition */}
            <div>
              <Label className="text-xs text-slate-500 mb-1 block">Condition</Label>
              <Select value={filters.condition} onValueChange={v => set('condition', v)}>
                <SelectTrigger className="h-9"><SelectValue placeholder="All conditions" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="brand_new">Brand New</SelectItem>
                  <SelectItem value="foreign_used">Foreign Used</SelectItem>
                  <SelectItem value="nigerian_used">Locally Used</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Transmission */}
            <div>
              <Label className="text-xs text-slate-500 mb-1 block">Transmission</Label>
              <Select value={filters.transmission} onValueChange={v => set('transmission', v)}>
                <SelectTrigger className="h-9"><SelectValue placeholder="Any" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="automatic">Automatic</SelectItem>
                  <SelectItem value="manual">Manual</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Year From */}
            <div>
              <Label className="text-xs text-slate-500 mb-1 block">Year From</Label>
              <Input
                type="number" value={filters.minYear}
                onChange={e => set('minYear', e.target.value)}
                placeholder="e.g. 2015" className="h-9" min={1990} max={2026}
              />
            </div>

            {/* Year To */}
            <div>
              <Label className="text-xs text-slate-500 mb-1 block">Year To</Label>
              <Input
                type="number" value={filters.maxYear}
                onChange={e => set('maxYear', e.target.value)}
                placeholder="e.g. 2024" className="h-9" min={1990} max={2026}
              />
            </div>

          </div>

          {/* Active filter chips */}
          {activeCount > 0 && (
            <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-slate-100">
              {filters.country && (() => { const c = COUNTRIES.find(x => x.code === filters.country); return c ? <Badge key="country" variant="outline" className="gap-1 text-xs">{c.flag} {c.name}<button onClick={() => onFilterChange({ country: '', state: '' })}><X className="w-3 h-3" /></button></Badge> : null; })()}
              {filters.state && <Badge key="state" variant="outline" className="gap-1 text-xs">{filters.state}<button onClick={() => set('state', '')}><X className="w-3 h-3" /></button></Badge>}
              {filters.make && <Badge key="make" variant="outline" className="gap-1 text-xs">{filters.make}<button onClick={() => set('make', '')}><X className="w-3 h-3" /></button></Badge>}
              {filters.condition && <Badge key="cond" variant="outline" className="gap-1 text-xs capitalize">{filters.condition.replace('_', ' ')}<button onClick={() => set('condition', '')}><X className="w-3 h-3" /></button></Badge>}
              {filters.transmission && <Badge key="trans" variant="outline" className="gap-1 text-xs capitalize">{filters.transmission}<button onClick={() => set('transmission', '')}><X className="w-3 h-3" /></button></Badge>}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
