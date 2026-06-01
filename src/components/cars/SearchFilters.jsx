import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { NIGERIAN_STATES, CAR_MAKES, formatPrice } from '../shared/NigerianStates';

export default function SearchFilters({ filters, onFilterChange, onSearch }) {
  const [isOpen, setIsOpen] = useState(false);
  const [priceRange, setPriceRange] = useState([0, 100000000]);

  const handlePriceChange = (value) => {
    setPriceRange(value);
    onFilterChange({ minPrice: value[0], maxPrice: value[1] });
  };

  const clearFilters = () => {
    onFilterChange({
      search: '',
      state: '',
      make: '',
      condition: '',
      transmission: '',
      minPrice: 0,
      maxPrice: 100000000,
      minYear: '',
      maxYear: ''
    });
    setPriceRange([0, 100000000]);
  };

  const FilterContent = () => (
    <div className="space-y-6">
      {/* State */}
      <div>
        <label className="text-sm font-medium text-slate-700 mb-2 block">Location</label>
        <Select value={filters.state || ''} onValueChange={(v) => onFilterChange({ state: v })}>
          <SelectTrigger className="bg-white border-slate-200">
            <SelectValue placeholder="All States" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={null}>All States</SelectItem>
            {NIGERIAN_STATES.map(state => (
              <SelectItem key={state} value={state}>{state}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Make */}
      <div>
        <label className="text-sm font-medium text-slate-700 mb-2 block">Car Make</label>
        <Select value={filters.make || ''} onValueChange={(v) => onFilterChange({ make: v })}>
          <SelectTrigger className="bg-white border-slate-200">
            <SelectValue placeholder="All Makes" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={null}>All Makes</SelectItem>
            {CAR_MAKES.map(make => (
              <SelectItem key={make} value={make}>{make}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Condition */}
      <div>
        <label className="text-sm font-medium text-slate-700 mb-2 block">Condition</label>
        <Select value={filters.condition || ''} onValueChange={(v) => onFilterChange({ condition: v })}>
          <SelectTrigger className="bg-white border-slate-200">
            <SelectValue placeholder="Any Condition" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={null}>Any Condition</SelectItem>
            <SelectItem value="brand_new">Brand New</SelectItem>
            <SelectItem value="foreign_used">Foreign Used (Tokunbo)</SelectItem>
            <SelectItem value="nigerian_used">Nigerian Used</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Transmission */}
      <div>
        <label className="text-sm font-medium text-slate-700 mb-2 block">Transmission</label>
        <Select value={filters.transmission || ''} onValueChange={(v) => onFilterChange({ transmission: v })}>
          <SelectTrigger className="bg-white border-slate-200">
            <SelectValue placeholder="Any Transmission" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={null}>Any Transmission</SelectItem>
            <SelectItem value="automatic">Automatic</SelectItem>
            <SelectItem value="manual">Manual</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Price Range */}
      <div>
        <label className="text-sm font-medium text-slate-700 mb-4 block">
          Price Range: {formatPrice(priceRange[0])} - {formatPrice(priceRange[1])}
        </label>
        <Slider
          value={priceRange}
          onValueChange={handlePriceChange}
          max={100000000}
          step={500000}
          className="my-4"
        />
      </div>

      {/* Year Range */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-sm font-medium text-slate-700 mb-2 block">Min Year</label>
          <Input
            type="number"
            placeholder="2000"
            value={filters.minYear || ''}
            onChange={(e) => onFilterChange({ minYear: e.target.value })}
            className="bg-white"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700 mb-2 block">Max Year</label>
          <Input
            type="number"
            placeholder="2024"
            value={filters.maxYear || ''}
            onChange={(e) => onFilterChange({ maxYear: e.target.value })}
            className="bg-white"
          />
        </div>
      </div>

      <Button onClick={clearFilters} variant="outline" className="w-full">
        <X className="w-4 h-4 mr-2" /> Clear All Filters
      </Button>
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <Input
            placeholder="Search cars by name, make, model..."
            value={filters.search || ''}
            onChange={(e) => onFilterChange({ search: e.target.value })}
            className="pl-12 h-14 text-lg bg-white border-slate-200 rounded-xl"
          />
        </div>
        <Button 
          onClick={onSearch}
          className="h-14 px-8 bg-slate-900 hover:bg-slate-800 rounded-xl"
        >
          Search
        </Button>
        
        {/* Mobile Filter Button */}
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" className="h-14 px-4 lg:hidden rounded-xl border-slate-200">
              <SlidersHorizontal className="w-5 h-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
            <SheetHeader>
              <SheetTitle>Filter Cars</SheetTitle>
            </SheetHeader>
            <div className="mt-6">
              <FilterContent />
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop Filters */}
      <div className="hidden lg:block bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
        <div className="grid grid-cols-5 gap-4">
          <Select value={filters.state || ''} onValueChange={(v) => onFilterChange({ state: v })}>
            <SelectTrigger className="bg-slate-50 border-0 h-12">
              <SelectValue placeholder="All States" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={null}>All States</SelectItem>
              {NIGERIAN_STATES.map(state => (
                <SelectItem key={state} value={state}>{state}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filters.make || ''} onValueChange={(v) => onFilterChange({ make: v })}>
            <SelectTrigger className="bg-slate-50 border-0 h-12">
              <SelectValue placeholder="All Makes" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={null}>All Makes</SelectItem>
              {CAR_MAKES.map(make => (
                <SelectItem key={make} value={make}>{make}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filters.condition || ''} onValueChange={(v) => onFilterChange({ condition: v })}>
            <SelectTrigger className="bg-slate-50 border-0 h-12">
              <SelectValue placeholder="Any Condition" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={null}>Any Condition</SelectItem>
              <SelectItem value="brand_new">Brand New</SelectItem>
              <SelectItem value="foreign_used">Foreign Used</SelectItem>
              <SelectItem value="nigerian_used">Nigerian Used</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filters.transmission || ''} onValueChange={(v) => onFilterChange({ transmission: v })}>
            <SelectTrigger className="bg-slate-50 border-0 h-12">
              <SelectValue placeholder="Transmission" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={null}>Any Transmission</SelectItem>
              <SelectItem value="automatic">Automatic</SelectItem>
              <SelectItem value="manual">Manual</SelectItem>
            </SelectContent>
          </Select>

          <Button onClick={clearFilters} variant="ghost" className="h-12 text-slate-500">
            <X className="w-4 h-4 mr-2" /> Clear
          </Button>
        </div>
      </div>
    </div>
  );
}