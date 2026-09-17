import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { COUNTRIES, getRegions } from './LocationData';

// Country selector dropdown
export function CountrySelector({ value, onChange, className = '' }) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className={className}>
        <SelectValue placeholder="Select country">
          {value && (() => {
            const c = COUNTRIES.find(x => x.code === value);
            return c ? <span className="flex items-center gap-2">{c.flag} {c.name}</span> : null;
          })()}
        </SelectValue>
      </SelectTrigger>
      <SelectContent className="max-h-72">
        {COUNTRIES.map(c => (
          <SelectItem key={c.code} value={c.code}>
            <span className="flex items-center gap-2">{c.flag} {c.name}</span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

// Region/State selector — changes based on selected country
export function RegionSelector({ countryCode, value, onChange, className = '' }) {
  const regions = getRegions(countryCode || 'NG');
  return (
    <Select value={value} onValueChange={onChange} disabled={!countryCode}>
      <SelectTrigger className={className}>
        <SelectValue placeholder={countryCode ? 'Select state / region' : 'Select country first'} />
      </SelectTrigger>
      <SelectContent className="max-h-72">
        {regions.map(r => (
          <SelectItem key={r} value={r}>{r}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
