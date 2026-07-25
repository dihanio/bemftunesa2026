"use client";

import React, { useState, useEffect, useRef } from 'react';
import {
  Calendar as CalendarIcon,
  Clock,
  ChevronLeft,
  ChevronRight,
  Check,
  Zap,
  X,
} from 'lucide-react';

interface DateTimePickerProps {
  value: string; // YYYY-MM-DDTHH:mm or ISO string
  onChange: (value: string) => void;
  label?: string;
  required?: boolean;
}

const MONTH_NAMES_ID = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
];

const DAY_NAMES_ID = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

const QUICK_TIME_CHIPS = [
  '23:59',
  '07:00',
  '08:00',
  '12:00',
  '13:00',
  '15:00',
  '19:00',
];

export function DateTimePicker({
  value,
  onChange,
  label,
  required = false,
}: DateTimePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Current selected date & time objects (Default time: 23:59)
  const [selectedDate, setSelectedDate] = useState<Date>(() => {
    if (value) {
      const d = new Date(value);
      if (!isNaN(d.getTime())) return d;
    }
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(23, 59, 0, 0);
    return tomorrow;
  });

  const [hours, setHours] = useState('23');
  const [minutes, setMinutes] = useState('59');

  // Calendar view navigation month & year
  const [viewYear, setViewYear] = useState(selectedDate.getFullYear());
  const [viewMonth, setViewMonth] = useState(selectedDate.getMonth());

  const [prevValue, setPrevValue] = useState(value);
  if (value !== prevValue) {
    setPrevValue(value);
    if (value) {
      const d = new Date(value);
      if (!isNaN(d.getTime())) {
        setSelectedDate(d);
        setViewYear(d.getFullYear());
        setViewMonth(d.getMonth());
        setHours(String(d.getHours()).padStart(2, '0'));
        setMinutes(String(d.getMinutes()).padStart(2, '0'));
      }
    }
  }

  // Close popover on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const emitChange = (d: Date, h: string, m: string) => {
    const yStr = d.getFullYear();
    const mStr = String(d.getMonth() + 1).padStart(2, '0');
    const dStr = String(d.getDate()).padStart(2, '0');
    const hStr = h.padStart(2, '0');
    const minStr = m.padStart(2, '0');

    onChange(`${yStr}-${mStr}-${dStr}T${hStr}:${minStr}`);
  };

  // Quick Presets Handlers
  const handlePreset = (type: 'today2359' | 'tomorrow2359' | 'tomorrow0800' | 'nextWeek2359') => {
    const now = new Date();
    const target = new Date();

    if (type === 'today2359') {
      target.setHours(23, 59, 0, 0);
      setHours('23');
      setMinutes('59');
    } else if (type === 'tomorrow2359') {
      target.setDate(now.getDate() + 1);
      target.setHours(23, 59, 0, 0);
      setHours('23');
      setMinutes('59');
    } else if (type === 'tomorrow0800') {
      target.setDate(now.getDate() + 1);
      target.setHours(8, 0, 0, 0);
      setHours('08');
      setMinutes('00');
    } else if (type === 'nextWeek2359') {
      target.setDate(now.getDate() + 7);
      target.setHours(23, 59, 0, 0);
      setHours('23');
      setMinutes('59');
    }

    setSelectedDate(target);
    setViewYear(target.getFullYear());
    setViewMonth(target.getMonth());

    const hVal = String(target.getHours()).padStart(2, '0');
    const mVal = String(target.getMinutes()).padStart(2, '0');
    emitChange(target, hVal, mVal);
  };

  // Select Date from Calendar Grid
  const handleSelectDay = (dayNum: number) => {
    const newDate = new Date(viewYear, viewMonth, dayNum);
    setSelectedDate(newDate);
    emitChange(newDate, hours, minutes);
  };

  // Month Navigation
  const prevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(viewYear - 1);
    } else {
      setViewMonth(viewMonth - 1);
    }
  };

  const nextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(viewYear + 1);
    } else {
      setViewMonth(viewMonth + 1);
    }
  };

  // Generate Calendar Days Grid
  const firstDayOfMonth = new Date(viewYear, viewMonth, 1).getDay();
  const totalDaysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const calendarCells = [];

  for (let i = 0; i < firstDayOfMonth; i++) {
    calendarCells.push(null);
  }
  for (let day = 1; day <= totalDaysInMonth; day++) {
    calendarCells.push(day);
  }

  // Formatting display label
  const formattedDisplay = value
    ? (() => {
        const d = new Date(value);
        if (isNaN(d.getTime())) return 'Pilih Tanggal & Waktu (Default 23.59)';
        const dayName = DAY_NAMES_ID[d.getDay()];
        const dayVal = String(d.getDate()).padStart(2, '0');
        const monthName = MONTH_NAMES_ID[d.getMonth()];
        const yearVal = d.getFullYear();
        const hVal = String(d.getHours()).padStart(2, '0');
        const mVal = String(d.getMinutes()).padStart(2, '0');
        return `${dayName}, ${dayVal} ${monthName} ${yearVal} • ${hVal}:${mVal} WIB`;
      })()
    : 'Pilih Tanggal & Waktu (Default 23.59)';

  return (
    <div className="space-y-1.5 relative" ref={popoverRef}>
      {label && (
        <label className="block text-[11px] font-mono font-bold text-[var(--accent)] uppercase tracking-wider">
          {label} {required && '*'}
        </label>
      )}

      {/* Main Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-[var(--bg-surface)] border border-[var(--border-default)] hover:border-[var(--accent)] px-3.5 py-2.5 text-xs font-mono text-[var(--text-primary)] rounded-lg flex items-center justify-between outline-none focus:ring-1 focus:ring-[var(--accent)] transition-all cursor-pointer shadow-sm group"
      >
        <div className="flex items-center gap-2.5 truncate">
          <CalendarIcon className="h-4 w-4 text-[var(--accent)] shrink-0 group-hover:scale-110 transition-transform" />
          <span className="truncate font-bold">{formattedDisplay}</span>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] font-mono text-[var(--accent)] bg-[var(--accent-muted)] border border-[var(--accent-glow)] px-2 py-0.5 rounded shrink-0">
          <Clock className="h-3 w-3" />
          <span>UBAH</span>
        </div>
      </button>

      {/* Interactive Popover Modal */}
      {isOpen && (
        <div className="absolute left-0 top-full mt-2 z-50 w-full sm:w-[360px] bg-[var(--bg-surface-elevated)] border border-[var(--border-emphasis)] rounded-xl shadow-2xl p-4 animate-scale-in text-[var(--text-primary)] space-y-3">
          {/* Popover Header */}
          <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-2.5">
            <span className="text-xs font-mono font-bold text-[var(--accent)] uppercase tracking-wider flex items-center gap-1.5">
              <Zap className="h-3.5 w-3.5 text-[var(--accent)]" /> PEMILIH DEADLINE (DEFAULT 23:59)
            </span>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-white/10 rounded-md transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Quick Presets (Tombol Pintas Deadline 23.59) */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-wider font-bold">
              Pilihan Pintas Deadline (23:59 WIB)
            </span>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => handlePreset('today2359')}
                className="px-2.5 py-1 text-[10px] font-mono font-bold bg-white/5 hover:bg-[var(--accent-muted)] hover:text-[var(--accent)] border border-[var(--border-subtle)] rounded transition-all cursor-pointer"
              >
                Hari Ini (23:59 WIB)
              </button>
              <button
                type="button"
                onClick={() => handlePreset('tomorrow2359')}
                className="px-2.5 py-1 text-[10px] font-mono font-bold bg-[var(--accent-muted)] text-[var(--accent)] border border-[var(--accent-glow)] rounded transition-all cursor-pointer"
              >
                🌙 Besok (23:59 WIB)
              </button>
              <button
                type="button"
                onClick={() => handlePreset('tomorrow0800')}
                className="px-2.5 py-1 text-[10px] font-mono font-bold bg-white/5 hover:bg-[var(--accent-muted)] hover:text-[var(--accent)] border border-[var(--border-subtle)] rounded transition-all cursor-pointer"
              >
                Besok Pagi (08:00)
              </button>
              <button
                type="button"
                onClick={() => handlePreset('nextWeek2359')}
                className="px-2.5 py-1 text-[10px] font-mono font-bold bg-white/5 hover:bg-[var(--accent-muted)] hover:text-[var(--accent)] border border-[var(--border-subtle)] rounded transition-all cursor-pointer"
              >
                1 Minggu (23:59)
              </button>
            </div>
          </div>

          {/* Calendar Month Header & Switcher */}
          <div className="pt-2 border-t border-[var(--border-subtle)]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-mono font-bold text-[var(--text-primary)]">
                {MONTH_NAMES_ID[viewMonth]} {viewYear}
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={prevMonth}
                  className="p-1 hover:bg-white/10 rounded transition-colors text-[var(--text-secondary)]"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={nextMonth}
                  className="p-1 hover:bg-white/10 rounded transition-colors text-[var(--text-secondary)]"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Days Header */}
            <div className="grid grid-cols-7 text-center gap-1 mb-1">
              {DAY_NAMES_ID.map((d) => (
                <span key={d} className="text-[10px] font-mono font-bold text-[var(--text-muted)]">
                  {d}
                </span>
              ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1 text-center">
              {calendarCells.map((dayNum, idx) => {
                if (dayNum === null) {
                  return <div key={`empty-${idx}`} className="h-7 w-7" />;
                }

                const isSelected =
                  selectedDate.getDate() === dayNum &&
                  selectedDate.getMonth() === viewMonth &&
                  selectedDate.getFullYear() === viewYear;

                const isToday =
                  new Date().getDate() === dayNum &&
                  new Date().getMonth() === viewMonth &&
                  new Date().getFullYear() === viewYear;

                return (
                  <button
                    key={dayNum}
                    type="button"
                    onClick={() => handleSelectDay(dayNum)}
                    className={`h-7 w-7 rounded-md font-mono text-xs flex items-center justify-center transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[var(--accent)] text-black font-bold shadow-md shadow-[var(--accent-glow)]'
                        : isToday
                        ? 'border border-[var(--accent)] text-[var(--accent)] font-bold'
                        : 'hover:bg-white/10 text-[var(--text-primary)]'
                    }`}
                  >
                    {dayNum}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Time Picker & Quick Chips */}
          <div className="pt-2 border-t border-[var(--border-subtle)] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono text-[var(--text-muted)] uppercase font-bold flex items-center gap-1">
                <Clock className="h-3 w-3 text-[var(--accent)]" /> Waktu / Jam
              </span>
              <div className="flex items-center gap-1">
                <input
                  type="text"
                  maxLength={2}
                  value={hours}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '');
                    setHours(val);
                    emitChange(selectedDate, val, minutes);
                  }}
                  className="w-8 bg-[var(--bg-surface)] border border-[var(--border-default)] text-center py-0.5 text-xs font-mono font-bold text-[var(--text-primary)] rounded outline-none focus:border-[var(--accent)]"
                />
                <span className="font-mono text-xs font-bold text-[var(--accent)]">:</span>
                <input
                  type="text"
                  maxLength={2}
                  value={minutes}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '');
                    setMinutes(val);
                    emitChange(selectedDate, hours, val);
                  }}
                  className="w-8 bg-[var(--bg-surface)] border border-[var(--border-default)] text-center py-0.5 text-xs font-mono font-bold text-[var(--text-primary)] rounded outline-none focus:border-[var(--accent)]"
                />
                <span className="text-[10px] font-mono text-[var(--text-muted)] ml-1">WIB</span>
              </div>
            </div>

            {/* Quick Time Chips */}
            <div className="flex flex-wrap gap-1 pt-1">
              {QUICK_TIME_CHIPS.map((chipTime) => (
                <button
                  key={chipTime}
                  type="button"
                  onClick={() => {
                    const [h, m] = chipTime.split(':');
                    setHours(h);
                    setMinutes(m);
                    emitChange(selectedDate, h, m);
                  }}
                  className={`px-2 py-0.5 text-[10px] font-mono rounded border transition-all cursor-pointer ${
                    `${hours}:${minutes}` === chipTime
                      ? 'bg-[var(--accent)] text-black border-[var(--accent)] font-bold'
                      : chipTime === '23:59'
                      ? 'bg-[var(--accent-muted)] border-[var(--accent-glow)] text-[var(--accent)] font-bold'
                      : 'bg-white/5 border-[var(--border-subtle)] text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  {chipTime === '23:59' ? '🌙 23:59 (Deadline)' : chipTime}
                </button>
              ))}
            </div>
          </div>

          {/* Confirm Button */}
          <div className="pt-2 border-t border-[var(--border-subtle)]">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="w-full btn-accent py-2 font-mono text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Check className="h-4 w-4" />
              <span>Gunakan Waktu Ini</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
