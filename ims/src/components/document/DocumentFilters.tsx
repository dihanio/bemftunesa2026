"use client";

import React from 'react';

export interface FilterOption {
  label: string;
  value: string;
}

interface DocumentFiltersProps {
  label: string;
  options: FilterOption[];
  value: string;
  onChange: (value: string) => void;
}

export function DocumentFilters({ label, options, value, onChange }: DocumentFiltersProps) {
  return (
    <div className="flex items-center gap-2">
      <label className="text-sm text-white/60">{label}</label>
      <select
        className="block w-full pl-3 pr-8 py-2 text-sm border border-white/10 rounded-xl leading-5 bg-white/5 text-foreground focus:outline-none focus:bg-white/10 focus:border-sage focus:ring-1 focus:ring-sage transition-colors appearance-none"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">Semua</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
