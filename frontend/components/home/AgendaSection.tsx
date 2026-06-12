"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import {
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  ChevronLeft,
  ChevronRight,
  Info,
  CalendarRange,
} from "lucide-react";
import { useEvents } from "@/hooks/useEvents";

export function AgendaSection() {
  const { data: eventsData } = useEvents();

  // Convert API ISO dates to Date objects for the calendar
  const events = useMemo(() => {
    return (eventsData?.data || []).map((e) => ({
      ...e,
      date: new Date(e.date),
    }));
  }, [eventsData]);

  // Current month being viewed
  const [viewDate, setViewDate] = useState(new Date());
  // Specific day user clicked
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // Ref for auto-scrolling on mobile
  const detailsRef = useRef<HTMLDivElement>(null);

  // Auto scroll to details on mobile when date is selected
  useEffect(() => {
    if (selectedDate && detailsRef.current && window.innerWidth < 1024) {
      setTimeout(() => {
        detailsRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 100);
    }
  }, [selectedDate]);

  // --- Dynamic Calendar Logic ---
  const { monthName, days, padding } = useMemo(() => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();

    // Get first day of month and total days
    const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0 for Sunday, 1 for Monday...
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const monthName = new Intl.DateTimeFormat("id-ID", {
      month: "long",
      year: "numeric",
    }).format(viewDate);

    return {
      monthName,
      days: Array.from({ length: daysInMonth }, (_, i) => i + 1),
      padding: Array.from({ length: firstDayOfMonth }, () => null),
    };
  }, [viewDate]);

  const handlePrevMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
    setSelectedDate(null);
  };

  const handleNextMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
    setSelectedDate(null);
  };

  const isSameDay = (d1: Date, d2: Date) => {
    return (
      d1.getDate() === d2.getDate() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getFullYear() === d2.getFullYear()
    );
  };

  const getEventsForDay = (day: number) => {
    const d = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
    return events.filter((e) => isSameDay(e.date, d));
  };

  const selectedDayEvents = selectedDate
    ? events.filter((e) => isSameDay(e.date, selectedDate))
    : [];
  const upcomingEvents = events
    .filter((e) => e.date >= new Date())
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .slice(0, 3);

  return (
    <section className="w-full max-w-5xl mx-auto px-6 relative z-10 py-24">
      <div className="flex flex-col lg:flex-row gap-8 lg:gap-16">
        {/* Left: Interactive Calendar Grid */}
        <div className="lg:w-1/2">
          <div className="flex justify-between items-end mb-8">
            <div>
              <h2 className="text-3xl font-bold text-white mb-2 font-sans tracking-tight">
                Agenda Strategis
              </h2>
              <p className="text-[#10b981] text-sm font-mono uppercase tracking-widest">
                {"// Schedule Protocol v2.5"}
              </p>
            </div>
            <div className="flex items-center gap-4 text-white">
              <span className="text-sm font-bold font-mono uppercase tracking-tighter text-right leading-tight">
                {monthName}
              </span>
              <div className="flex gap-1">
                <button
                  onClick={handlePrevMonth}
                  className="p-2 border border-white/10 rounded-lg hover:bg-[#12331e]/30 hover:border-[#10b981]/50 transition-all active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#10b981]"
                  title="Previous Month"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={handleNextMonth}
                  className="p-2 border border-white/10 rounded-lg hover:bg-[#12331e]/30 hover:border-[#10b981]/50 transition-all active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#10b981]"
                  title="Next Month"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-7 border-t border-l border-white/10 rounded-tl-xl overflow-hidden shadow-2xl">
            {["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"].map((day, i) => (
              <div
                key={i}
                className="aspect-square flex items-center justify-center text-[10px] font-mono text-gray-400 border-r border-b border-white/10 bg-white/3 uppercase tracking-tighter"
              >
                {day}
              </div>
            ))}
            {(padding as (number | null)[])
              .concat(days as (number | null)[])
              .map((day, i) => {
                if (day === null)
                  return (
                    <div
                      key={i}
                      className="aspect-square border-r border-b border-white/10 bg-white/1"
                    />
                  );

                const currentDayDate = new Date(
                  viewDate.getFullYear(),
                  viewDate.getMonth(),
                  day,
                );
                const dayEvents = getEventsForDay(day);
                const hasEvent = dayEvents.length > 0;
                const isSelected =
                  selectedDate && isSameDay(selectedDate, currentDayDate);
                const isToday = isSameDay(new Date(), currentDayDate);
                const isPast = currentDayDate < new Date(new Date().setHours(0, 0, 0, 0));

                return (
                  <button
                    key={i}
                    onClick={() => setSelectedDate(currentDayDate)}
                    className={`aspect-square min-h-[44px] relative border-r border-b border-white/10 flex flex-col p-2 group transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#10b981]
                    ${isSelected ? "bg-[#12331e]/40" : "hover:bg-white/5"}
                  `}
                    aria-label={`Pilih tanggal ${day}`}
                  >
                    <span
                      className={`text-xs font-mono transition-colors
                    ${isSelected ? "text-[#10b981] font-bold scale-110" : hasEvent ? (isPast ? "text-gray-400 font-medium" : "text-[#f5f2eb] font-semibold") : "text-gray-400 opacity-40"}
                    ${isToday ? "px-1.5 bg-white text-[#091c11] rounded-sm font-bold" : ""}
                  `}
                    >
                      {day < 10 ? `0${day}` : day}
                    </span>

                    {hasEvent && (
                      <div
                        className={`absolute bottom-2 right-2 w-1.5 h-1.5 rounded-full transition-all duration-300
                      ${
                        isSelected
                          ? "bg-white scale-125 shadow-[0_0_12px_#fff]"
                          : isPast
                            ? "bg-gray-500/50"
                            : "bg-[#10b981] shadow-[0_0_8px_rgba(16, 185, 129,0.8)]"
                      }
                    `}
                      />
                    )}

                    {/* Architectural active border */}
                    {isSelected && (
                      <div className="absolute inset-0 border-2 border-[#10b981] pointer-events-none z-20 shadow-[inset_0_0_15px_rgba(16, 185, 129,0.2)]" />
                    )}
                  </button>
                );
              })}
          </div>

          <div className="mt-6 flex flex-wrap justify-between items-center gap-4 px-1">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-sm bg-white" />
              <span className="text-[10px] font-mono text-gray-300 uppercase tracking-widest">
                Hari Ini
              </span>
              <span className="w-2 h-2 rounded-full bg-[#10b981] ml-4" />
              <span className="text-[10px] font-mono text-gray-300 uppercase tracking-widest">
                Mendatang
              </span>
              <span className="w-2 h-2 rounded-full bg-gray-500/50 ml-4" />
              <span className="text-[10px] font-mono text-gray-300 uppercase tracking-widest">
                Selesai
              </span>
            </div>
            <span className="text-[10px] font-mono text-gray-300 uppercase tracking-widest">
              Jadwal diperbarui berkala dari server
            </span>
          </div>
        </div>

        {/* Right: Event Detail / Upcoming List */}
        <div ref={detailsRef} className="lg:w-1/2 flex flex-col scroll-mt-24">
          <div className="p-8 rounded-3xl border border-white/10 bg-[#0a2214]/60 backdrop-blur-xl relative overflow-hidden grow shadow-[0_20px_50px_rgba(0,0,0,0.3)]">
            {/* Context Header */}
            <div className="flex items-center justify-between mb-8 border-b border-white/10 pb-6">
              <h3 className="text-xl font-bold text-white flex items-center gap-4">
                <div className="relative p-1.5 flex items-center justify-center">
                  <div className="absolute top-0 left-0 w-1.5 h-1.5 border-t border-l border-[#10b981]/40 opacity-50" />
                  <div className="absolute bottom-0 right-0 w-1.5 h-1.5 border-b border-r border-[#10b981]/40 opacity-50" />
                  <div className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center">
                    {selectedDate ? (
                      <CalendarIcon className="w-5 h-5 text-[#10b981]" />
                    ) : (
                      <CalendarRange className="w-5 h-5 text-[#10b981]" />
                    )}
                  </div>
                </div>
                {selectedDate ? "Detail Agenda" : "Highlight Mendatang"}
              </h3>
              {selectedDate && (
                <button
                  onClick={() => setSelectedDate(null)}
                  className="text-[10px] font-mono text-[#10b981] uppercase tracking-widest hover:text-white transition-colors"
                >
                  [ View All ]
                </button>
              )}
            </div>

            <div className="space-y-6">
              {/* MODE 1: Selected Date View */}
              {selectedDate && (
                <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                  <span className="text-[11px] font-mono text-[#10b981] uppercase tracking-[0.2em] block mb-4 bg-[#12331e]/20 w-fit px-3 py-1 rounded-full border border-[#10b981]/20">
                    {new Intl.DateTimeFormat("id-ID", {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    }).format(selectedDate)}
                  </span>

                  {selectedDayEvents.length > 0 ? (
                    <div className="space-y-8 mt-6">
                      {selectedDayEvents.map((event) => (
                        <div key={event._id} className="group">
                          {event.type === "Proker" ? (
                            <span className="text-[10px] inline-flex items-center font-mono font-bold tracking-widest text-[#e2b76c] uppercase bg-[#e2b76c]/10 border border-[#e2b76c]/30 px-2.5 py-0.5 rounded-full mb-3 shadow-[0_0_12px_rgba(226,183,108,0.1)]">
                              Program Kerja
                            </span>
                          ) : (
                            <span className="text-[10px] inline-flex items-center font-mono font-bold tracking-widest text-[#10b981] uppercase bg-[#10b981]/10 border border-[#10b981]/30 px-2.5 py-0.5 rounded-full mb-3 shadow-[0_0_12px_rgba(16, 185, 129,0.1)]">
                              Agenda BEM FT
                            </span>
                          )}

                          <span className={`ml-2 text-[10px] inline-flex items-center font-mono font-bold tracking-widest uppercase px-2.5 py-0.5 rounded-full mb-3
                            ${event.status === 'Completed' ? 'text-gray-400 bg-gray-400/10 border border-gray-400/30' : 
                              event.status === 'Ongoing' ? 'text-blue-400 bg-blue-400/10 border border-blue-400/30 animate-pulse' : 
                              'text-white/70 bg-white/5 border border-white/10'}
                          `}>
                            {event.status}
                          </span>

                          <h4 className={`text-2xl font-bold mb-4 transition-colors leading-tight ${event.status === 'Completed' ? 'text-gray-500 group-hover:text-gray-400' : 'text-white group-hover:text-[#10b981]'}`}>
                            {event.title}
                          </h4>
                          <p className="text-gray-300 text-sm leading-relaxed mb-6 border-l-2 border-[#10b981]/30 pl-4 py-1">
                            {event.description}
                          </p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5">
                              <Clock className="w-4 h-4 text-[#10b981]" />
                              <span className="text-sm text-gray-300">
                                {event.time}
                              </span>
                            </div>
                            <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5">
                              <MapPin className="w-4 h-4 text-[#10b981]" />
                              <span className="text-sm text-gray-300">
                                {event.location}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-20 flex flex-col items-center justify-center text-center opacity-30">
                      <div className="w-16 h-16 border border-white/10 rounded-full flex items-center justify-center mb-4">
                        <span className="text-2xl">?</span>
                      </div>
                      <p className="text-sm font-mono uppercase tracking-widest">
                        Tidak ada agenda untuk tanggal ini.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* MODE 2: Upcoming Highlights View (Fallback) */}
              {!selectedDate && (
                <div className="space-y-8 animate-in fade-in slide-in-from-left-4 duration-500">
                  {upcomingEvents.map((event) => (
                    <div
                      key={event._id}
                      onClick={() => setSelectedDate(event.date)}
                      className="relative pl-6 border-l-2 border-white/10 hover:border-[#10b981] transition-all group cursor-pointer py-1"
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-[10px] font-mono text-[#10b981] uppercase tracking-widest opacity-70">
                          {new Intl.DateTimeFormat("id-ID", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          }).format(event.date)}
                        </span>
                        {event.type === "Proker" ? (
                          <span className="text-[8px] font-mono font-bold tracking-widest text-[#e2b76c] uppercase bg-[#e2b76c]/10 border border-[#e2b76c]/20 px-1.5 py-0.2 rounded">
                            Proker
                          </span>
                        ) : (
                          <span className="text-[8px] font-mono font-bold tracking-widest text-[#10b981] uppercase bg-[#10b981]/10 border border-[#10b981]/20 px-1.5 py-0.2 rounded">
                            Agenda
                          </span>
                        )}
                      </div>
                      <h4 className="text-lg font-bold text-white group-hover:text-[#f5f2eb] transition-colors mb-2">
                        {event.title}
                      </h4>
                      <div className="flex items-center gap-3 text-xs text-gray-400 font-mono">
                        <span>{event.time}</span>
                        <span className="text-gray-600">{"//"}</span>
                        <span>{event.location.split(",")[0]}</span>
                      </div>
                    </div>
                  ))}

                  <button className="flex items-center gap-2 mt-8 text-[11px] font-bold uppercase tracking-[0.2em] text-white/40 hover:text-[#10b981] transition-colors group">
                    Lihat Seluruh Kalender{" "}
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
