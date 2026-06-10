"use client";

import { useState, useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { meetingsService } from "@/lib/api/meetings";
import { prokerService } from "@/lib/api/proker";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Plus,
  X,
  Trash2,
  CalendarDays,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface CalendarEvent {
  id: string;
  title: string;
  date: string; // Format: YYYY-MM-DD
  time: string;
  location: string;
  category: "Rapat" | "Proker" | "Kepanitiaan" | "Penting" | "Lainnya";
}

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [manualAgendas, setManualAgendas] = useState<CalendarEvent[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);

  // Form fields state
  const [newTitle, setNewTitle] = useState("");
  const [newDate, setNewDate] = useState("");
  const [newTime, setNewTime] = useState("");
  const [newLocation, setNewLocation] = useState("");
  const [newCategory, setNewCategory] =
    useState<CalendarEvent["category"]>("Lainnya");

  // Load from local storage on mount
  useEffect(() => {
    const saved = localStorage.getItem("ims-manual-agendas");
    if (saved) {
      try {
        setManualAgendas(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse manual agendas", e);
      }
    }
  }, []);

  // Fetch real meetings from API
  const { data: meetingsResponse, isLoading: isMeetingsLoading } = useQuery({
    queryKey: ["ims-calendar-meetings"],
    queryFn: () => meetingsService.list({ limit: 100 }),
  });

  // Fetch real prokers from API
  const { data: prokerResponse, isLoading: isProkerLoading } = useQuery({
    queryKey: ["ims-calendar-proker"],
    queryFn: () => prokerService.list({ limit: 100 }),
  });

  const meetings = meetingsResponse?.data || [];
  const prokers = prokerResponse?.data || [];

  // Helper to format date safely to YYYY-MM-DD
  const formatDateString = (dateInput: string | Date | undefined) => {
    if (!dateInput) return "";
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return "";

    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const date = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${date}`;
  };

  // Merge and transform into calendar events
  const events = useMemo(() => {
    const list: CalendarEvent[] = [];

    // Map API meetings
    meetings.forEach((m) => {
      const datePart = formatDateString(m.date);
      let timePart = "Agenda Rapat";
      if (m.date) {
        const d = new Date(m.date);
        if (!isNaN(d.getTime())) {
          timePart =
            d.toLocaleTimeString("id-ID", {
              hour: "2-digit",
              minute: "2-digit",
            }) + " WIB";
        }
      }
      if (datePart) {
        list.push({
          id: `meeting-${m._id}`,
          title: m.title,
          date: datePart,
          time: timePart,
          location: m.location || "Gedung FT UNESA",
          category: "Rapat",
        });
      }
    });

    // Map API prokers
    prokers.forEach((p) => {
      const datePart = formatDateString(p.startDate);
      if (datePart) {
        list.push({
          id: `proker-${p._id}`,
          title: p.title,
          date: datePart,
          time: p.endDate
            ? `Hingga ${new Date(p.endDate).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}`
            : "Agenda Proker",
          location: p.location || "Fakultas Teknik",
          category: "Proker",
        });
      }
    });

    // Merge manual custom agendas
    manualAgendas.forEach((item) => {
      list.push(item);
    });

    return list;
  }, [meetings, prokers, manualAgendas]);

  const handleAddAgenda = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newDate) return;

    const newEvent: CalendarEvent = {
      id: `manual-${Date.now()}`,
      title: newTitle.trim(),
      date: newDate,
      time: newTime || "Agenda Mandiri",
      location: newLocation || "BEM FT UNESA",
      category: newCategory,
    };

    const updated = [...manualAgendas, newEvent];
    setManualAgendas(updated);
    localStorage.setItem("ims-manual-agendas", JSON.stringify(updated));

    // Reset Form fields
    setNewTitle("");
    setNewDate("");
    setNewTime("");
    setNewLocation("");
    setNewCategory("Lainnya");
    setShowAddModal(false);
  };

  const handleDeleteAgenda = (id: string) => {
    const updated = manualAgendas.filter((item) => item.id !== id);
    setManualAgendas(updated);
    localStorage.setItem("ims-manual-agendas", JSON.stringify(updated));
  };

  const handleDayClick = (day: number) => {
    const formattedDate = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    setNewDate(formattedDate);
    setShowAddModal(true);
  };

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const monthNames = [
    "Januari",
    "Februari",
    "Maret",
    "April",
    "Mei",
    "Juni",
    "Juli",
    "Agustus",
    "September",
    "Oktober",
    "November",
    "Desember",
  ];

  const getEventForDay = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return events.filter((e) => e.date === dateStr);
  };

  const getCategoryColor = (cat: CalendarEvent["category"]) => {
    switch (cat) {
      case "Rapat":
        return "bg-blue-500/10 text-blue-400 border-blue-500/20";
      case "Proker":
        return "bg-emerald-500/10 text-[#a7f3d0] border-[#10b981]/25";
      case "Kepanitiaan":
        return "bg-purple-500/10 text-purple-400 border-purple-500/20";
      case "Penting":
        return "bg-red-500/10 text-red-400 border-red-500/20";
      case "Lainnya":
        return "bg-[#f0c36a]/15 text-[#f0c36a] border-[#f0c36a]/30";
      default:
        return "bg-slate-500/10 text-slate-450 border-slate-500/20";
    }
  };

  // Calendar rendering days list
  const calendarCells = useMemo(() => {
    const cells = [];

    // Empty blocks for first week offsets
    for (let i = 0; i < firstDay; i++) {
      cells.push(
        <div
          key={`empty-${i}`}
          className="h-28 border border-white/5 bg-white/1 opacity-20"
        />,
      );
    }

    // Days of month
    for (let d = 1; d <= daysInMonth; d++) {
      const dayEvents = getEventForDay(d);
      cells.push(
        <div
          key={`day-${d}`}
          onClick={() => handleDayClick(d)}
          className="h-28 border border-white/10 bg-white/2 p-2 flex flex-col justify-between hover:bg-white/5 hover:border-[#10b981]/40 cursor-pointer transition-all group/cell"
          title="Klik untuk tambah agenda"
        >
          <span className="text-xs font-black text-[#a9b49c] group-hover/cell:text-[#10b981] transition-colors">
            {d}
          </span>
          <div className="space-y-1 overflow-y-auto max-h-[70px] custom-scrollbar scrollbar-none">
            {dayEvents.map((e) => (
              <div
                key={e.id}
                className={`text-[8px] font-bold p-1 rounded border truncate leading-tight ${getCategoryColor(e.category)}`}
                title={`${e.title} (${e.time})`}
                onClick={(ev) => {
                  // Prevent triggering the day click event
                  ev.stopPropagation();
                }}
              >
                {e.title}
              </div>
            ))}
          </div>
        </div>,
      );
    }

    return cells;
  }, [firstDay, daysInMonth, events, year, month]);

  const isLoading = isMeetingsLoading || isProkerLoading;

  // Next 5 upcoming events sorted by date from local today
  const upcomingEvents = useMemo(() => {
    const today = new Date();
    const nowStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
    return events
      .filter((e) => e.date >= nowStr)
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(0, 5);
  }, [events]);

  return (
    <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500 ease-out">
      {/* Header Banner */}
      <section className="relative overflow-hidden rounded-xl border border-white/10 bg-white/7 p-6 shadow-[0_24px_80px_rgba(0,0,0,0.25)] backdrop-blur-2xl">
        <div className="absolute inset-0 bg-linear-to-r from-white/8 via-transparent to-[#10b981]/10" />
        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="min-w-0">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#10b981]/25 bg-[#10b981]/10 px-3 py-1 text-[11px] font-semibold text-[#a7f3d0]">
              <CalendarIcon className="h-3.5 w-3.5 animate-pulse" />
              Organizational Agenda Sync
            </div>
            <h1 className="mt-4 text-3xl font-black leading-tight text-white md:text-4xl">
              Master Kalender Agenda
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#c8d2bd]">
              Sinkronisasi jadwal rapat fungsionaris, program kerja kabinet, dan
              kegiatan mandiri BEM FT UNESA secara dinamis.
            </p>
          </div>

          <Button
            onClick={() => {
              setNewDate(formatDateString(new Date()));
              setShowAddModal(true);
            }}
            className="group relative overflow-hidden h-11 rounded-full bg-white px-5 text-[#091c11] font-bold hover:bg-[#a7f3d0] hover:shadow-[0_0_24px_rgba(167, 243, 208,0.45)] hover:-translate-y-0.5 transition-all duration-300 active:translate-y-0 cursor-pointer shrink-0"
          >
            <div className="absolute top-0 -left-full h-full w-[40%] bg-linear-to-r from-transparent via-white/40 to-transparent -skew-x-25 transition-all duration-1000 ease-out group-hover:left-[120%]" />
            <Plus className="relative z-10 h-4.5 w-4.5 mr-1" />
            <span className="relative z-10">Tambah Agenda</span>
          </Button>
        </div>
      </section>

      {/* Main Grid: Calendar Grid & Upcoming Event Cards */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Calendar View Card */}
        <div className="relative overflow-hidden rounded-xl border border-white/10 bg-white/7 p-5 shadow-[0_20px_70px_rgba(0,0,0,0.22)] backdrop-blur-2xl md:p-6 lg:col-span-2">
          <div className="flex flex-row items-center justify-between pb-4 border-b border-white/10 mb-4">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-black text-white">
                {monthNames[month]} {year}
              </h2>
              {isLoading && (
                <Loader2 className="w-4 h-4 text-[#10b981] animate-spin" />
              )}
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 border-white/10 hover:bg-white/5 text-white"
                onClick={prevMonth}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 border-white/10 hover:bg-white/5 text-white"
                onClick={nextMonth}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div>
            {/* Weekdays Labels */}
            <div className="grid grid-cols-7 text-center text-xs font-black text-[#a9b49c] pb-2">
              {[
                "Minggu",
                "Senin",
                "Selasa",
                "Rabu",
                "Kamis",
                "Jumat",
                "Sabtu",
              ].map((w) => (
                <div key={w}>{w.slice(0, 3)}</div>
              ))}
            </div>

            {/* Monthly Grid */}
            <div className="grid grid-cols-7 mt-2 border-l border-t border-white/10 rounded-lg overflow-hidden bg-[#091c11]/20">
              {calendarCells}
            </div>
          </div>
        </div>

        {/* Upcoming events list */}
        <div className="relative overflow-hidden rounded-xl border border-white/10 bg-white/7 p-5 shadow-[0_20px_70px_rgba(0,0,0,0.22)] backdrop-blur-2xl md:p-6 h-fit">
          <div className="border-b border-white/10 pb-4 mb-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-[#10b981]" />
              Agenda Terdekat
            </h2>
            <p className="text-xs text-[#a9b49c] mt-1">
              Daftar pertemuan, proker, & kegiatan aktif dalam waktu dekat.
            </p>
          </div>

          <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1 custom-scrollbar">
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="p-4 rounded-xl border border-white/10 bg-white/4 space-y-2 animate-pulse"
                >
                  <div className="h-4 w-1/3 bg-white/10 rounded" />
                  <div className="h-5 w-2/3 bg-white/10 rounded" />
                  <div className="h-4 w-1/2 bg-white/10 rounded" />
                </div>
              ))
            ) : upcomingEvents.length > 0 ? (
              upcomingEvents.map((e) => {
                const isManual = e.id.startsWith("manual-");
                return (
                  <div
                    key={e.id}
                    className="group relative overflow-hidden rounded-xl border border-white/8 bg-white/4 p-4 transition-all hover:bg-white/7"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-2 min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                          <Badge
                            className={`font-bold text-[10px] uppercase border shrink-0 ${getCategoryColor(e.category)}`}
                          >
                            {e.category}
                          </Badge>
                          <span className="text-[10px] text-[#a9b49c] font-mono flex items-center gap-1">
                            <Clock className="w-3 h-3 text-[#10b981]" />{" "}
                            {new Date(e.date).toLocaleDateString("id-ID", {
                              day: "numeric",
                              month: "short",
                            })}
                          </span>
                        </div>
                        <h3 className="font-bold text-sm text-white line-clamp-1 group-hover:text-[#a7f3d0] transition-colors">
                          {e.title}
                        </h3>
                        <div className="flex items-center gap-1 text-[10px] text-[#a9b49c]">
                          <MapPin className="w-3.5 h-3.5 shrink-0 text-[#10b981]" />
                          <span className="truncate">{e.location}</span>
                        </div>
                        <div className="text-[9px] text-[#a9b49c] font-semibold italic">
                          Waktu: {e.time}
                        </div>
                      </div>

                      {isManual && (
                        <button
                          onClick={() => handleDeleteAgenda(e.id)}
                          className="h-7 w-7 rounded-lg border border-white/10 bg-white/5 text-[#ff7a7a] opacity-0 group-hover:opacity-100 hover:bg-[#ff7a7a]/15 hover:text-white flex items-center justify-center transition-all shrink-0 cursor-pointer"
                          title="Hapus Agenda"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="py-8 text-center text-xs text-[#a9b49c] italic">
                Tidak ada agenda terdekat yang terdaftar.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MODAL: TAMBAH AGENDA MANUAL */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="relative w-full max-w-md overflow-hidden rounded-xl border border-white/12 bg-[#091c11]/98 p-5 shadow-[0_24px_80px_rgba(0,0,0,0.6)] backdrop-blur-3xl md:p-6"
            >
              <div className="absolute inset-0 bg-linear-to-r from-white/3 via-transparent to-[#10b981]/5" />

              <div className="relative flex items-center justify-between border-b border-white/10 pb-4">
                <div className="flex items-center gap-2">
                  <CalendarDays className="h-5 w-5 text-[#10b981]" />
                  <h3 className="text-lg font-bold text-white">
                    Tambah Agenda Mandiri
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex h-7 w-7 items-center justify-center rounded-full bg-white/5 text-[#c8d2bd] hover:bg-white/10 hover:text-white transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <form
                onSubmit={handleAddAgenda}
                className="relative mt-4 space-y-4"
              >
                {/* Title */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#a9b49c] uppercase tracking-wider block">
                    Nama Kegiatan
                  </label>
                  <Input
                    required
                    placeholder="Contoh: Rapat Koordinasi Kabinet"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="bg-white/8 border-white/10 text-white placeholder-[#a9b49c]/60 focus:ring-2 focus:ring-[#10b981]/30 focus:border-[#10b981]"
                  />
                </div>

                {/* Date and Time */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[#a9b49c] uppercase tracking-wider block">
                      Tanggal
                    </label>
                    <Input
                      required
                      type="date"
                      value={newDate}
                      onChange={(e) => setNewDate(e.target.value)}
                      className="bg-white/8 border-white/10 text-white focus:ring-2 focus:ring-[#10b981]/30 focus:border-[#10b981]"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[#a9b49c] uppercase tracking-wider block">
                      Waktu
                    </label>
                    <Input
                      placeholder="Contoh: 13:00 - Selesai"
                      value={newTime}
                      onChange={(e) => setNewTime(e.target.value)}
                      className="bg-white/8 border-white/10 text-white focus:ring-2 focus:ring-[#10b981]/30 focus:border-[#10b981]"
                    />
                  </div>
                </div>

                {/* Location */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#a9b49c] uppercase tracking-wider block">
                    Lokasi / Tautan
                  </label>
                  <Input
                    placeholder="Contoh: Gedung A1.02 / Zoom Meeting"
                    value={newLocation}
                    onChange={(e) => setNewLocation(e.target.value)}
                    className="bg-white/8 border-white/10 text-white placeholder-[#a9b49c]/60 focus:ring-2 focus:ring-[#10b981]/30 focus:border-[#10b981]"
                  />
                </div>

                {/* Category */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#a9b49c] uppercase tracking-wider block">
                    Kategori
                  </label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as any)}
                    className="w-full h-10 px-3 bg-white/8 border border-white/10 rounded-lg text-white focus:ring-2 focus:ring-[#10b981]/30 focus:border-[#10b981] outline-none"
                  >
                    <option className="bg-[#091c11] text-white" value="Rapat">
                      Rapat
                    </option>
                    <option className="bg-[#091c11] text-white" value="Proker">
                      Proker
                    </option>
                    <option
                      className="bg-[#091c11] text-white"
                      value="Kepanitiaan"
                    >
                      Kepanitiaan
                    </option>
                    <option className="bg-[#091c11] text-white" value="Penting">
                      Penting
                    </option>
                    <option className="bg-[#091c11] text-white" value="Lainnya">
                      Agenda Lainnya
                    </option>
                  </select>
                </div>

                <div className="pt-4 flex justify-end gap-3 border-t border-white/10">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setShowAddModal(false)}
                    className="h-10 rounded-lg text-white hover:bg-white/5"
                  >
                    Batal
                  </Button>
                  <Button
                    type="submit"
                    className="h-10 rounded-lg bg-white text-[#091c11] hover:bg-[#a7f3d0] font-bold px-5"
                  >
                    Simpan Agenda
                  </Button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
