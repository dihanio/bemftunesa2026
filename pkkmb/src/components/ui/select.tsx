"use client";

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, Loader2 } from 'lucide-react';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface SelectProps {
  options: (SelectOption | string)[];
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  label?: string;
  error?: string;
  disabled?: boolean;
  loading?: boolean;
  className?: string;
  id?: string;
}

export function Select({
  options,
  value,
  onChange,
  placeholder = '-- Pilih --',
  label,
  error,
  disabled = false,
  loading = false,
  className = '',
  id,
}: SelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const listboxRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);

  const formattedOptions: SelectOption[] = options.map((opt) =>
    typeof opt === 'string' ? { value: opt, label: opt } : opt
  );

  const selectedOption = formattedOptions.find((opt) => opt.value === value);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (focusedIndex >= 0 && itemRefs.current[focusedIndex]) {
      itemRefs.current[focusedIndex]?.scrollIntoView({ block: 'nearest' });
    }
  }, [focusedIndex]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled || loading) return;

    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (!isOpen) {
        setIsOpen(true);
      } else if (focusedIndex >= 0 && focusedIndex < formattedOptions.length) {
        const option = formattedOptions[focusedIndex];
        if (!option.disabled) {
          onChange?.(option.value);
          setIsOpen(false);
        }
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!isOpen) {
        setIsOpen(true);
      } else {
        setFocusedIndex((prev) => (prev < formattedOptions.length - 1 ? prev + 1 : 0));
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (!isOpen) {
        setIsOpen(true);
      } else {
        setFocusedIndex((prev) => (prev > 0 ? prev - 1 : formattedOptions.length - 1));
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  return (
    <div className={`space-y-1.5 w-full relative ${className}`} ref={containerRef}>
      {label && (
        <label
          htmlFor={id}
          className="block text-[11px] font-mono font-bold text-[var(--accent)] uppercase tracking-wider"
        >
          {label}
        </label>
      )}

      <div className="relative">
        <button
          type="button"
          id={id}
          disabled={disabled || loading}
          onClick={() => setIsOpen((prev) => !prev)}
          onKeyDown={handleKeyDown}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          className={`w-full flex items-center justify-between px-3.5 py-2.5 bg-[var(--bg-surface)] border rounded text-xs font-mono transition-all text-left outline-none ${
            disabled
              ? 'opacity-50 cursor-not-allowed border-[var(--border-subtle)]'
              : error
              ? 'border-[var(--semantic-danger)] focus:ring-2 focus:ring-red-500/30'
              : isOpen
              ? 'border-[var(--accent)] ring-2 ring-[var(--accent-muted)] text-[var(--text-primary)]'
              : 'border-[var(--border-default)] hover:border-[var(--accent-hover)] focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-muted)] text-[var(--text-primary)]'
          }`}
        >
          <span className={selectedOption ? 'text-[var(--text-primary)]' : 'text-[var(--text-muted)]'}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin text-[var(--accent)]" />
          ) : (
            <ChevronDown
              className={`h-4 w-4 text-[var(--text-secondary)] transition-transform duration-200 ${
                isOpen ? 'rotate-180 text-[var(--accent)]' : ''
              }`}
            />
          )}
        </button>

        {/* Custom Dropdown List */}
        {isOpen && (
          <div
            ref={listboxRef}
            role="listbox"
            tabIndex={-1}
            data-lenis-prevent="true"
            className="absolute z-50 mt-1 w-full max-h-60 overflow-y-auto overscroll-contain bg-[var(--bg-surface-elevated)] border border-[var(--border-emphasis)] rounded shadow-2xl animate-scale-in py-1"
          >
            {formattedOptions.length === 0 ? (
              <div className="px-3.5 py-2.5 text-xs text-[var(--text-muted)] font-mono text-center">
                Tidak ada pilihan
              </div>
            ) : (
              formattedOptions.map((option, idx) => {
                const isSelected = option.value === value;
                const isFocused = focusedIndex === idx;

                return (
                  <div
                    key={option.value}
                    ref={(el) => {
                      itemRefs.current[idx] = el;
                    }}
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => {
                      if (!option.disabled) {
                        onChange?.(option.value);
                        setIsOpen(false);
                      }
                    }}
                    onMouseEnter={() => setFocusedIndex(idx)}
                    className={`flex items-center justify-between px-3.5 py-2.5 text-xs font-mono cursor-pointer transition-colors ${
                      option.disabled
                        ? 'opacity-40 cursor-not-allowed'
                        : isSelected
                        ? 'bg-[var(--accent-muted)] text-[var(--accent)] font-bold'
                        : isFocused
                        ? 'bg-white/5 text-[var(--text-primary)]'
                        : 'text-[var(--text-secondary)] hover:bg-white/5 hover:text-[var(--text-primary)]'
                    }`}
                  >
                    <span>{option.label}</span>
                    {isSelected && <Check className="h-3.5 w-3.5 text-[var(--accent)]" />}
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {error && <p className="text-[10px] font-mono text-[var(--semantic-danger)] mt-1">{error}</p>}
    </div>
  );
}
