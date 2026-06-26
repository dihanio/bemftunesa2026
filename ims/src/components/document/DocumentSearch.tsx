"use client";

import React from 'react';
import { Search } from 'lucide-react';

interface DocumentSearchProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function DocumentSearch({ value, onChange, placeholder = "Cari dokumen..." }: DocumentSearchProps) {
  return (
    <div className="relative">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <Search className="h-4 w-4 text-white/40" />
      </div>
      <input
        type="text"
        className="block w-full pl-10 pr-3 py-2 border border-white/10 rounded-xl leading-5 bg-white/5 text-foreground placeholder-white/40 focus:outline-none focus:bg-white/10 focus:border-sage focus:ring-1 focus:ring-sage sm:text-sm transition-colors"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
