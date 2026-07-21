"use client";

export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from "react";
import DashboardShell from "@/components/DashboardShell";
import { CustomSelect } from "@/components/ui/CustomSelect";
import ImsApiService, { API_BASE_URL } from "@/lib/api";
import { Clock, Plus, Loader2, Calendar, MapPin, QrCode, AlertCircle, Eye, Edit3, Download, UserPlus } from "lucide-react";

interface MabaItem {
  _id: string;
  nim: string;
  name: string;
  kelompok: string;
}

interface AttendanceEvent {
  _id: string;
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  qrCodeToken?: string;
  coordinates?: { latitude: number; longitude: number; radiusMeter: number };
  isActive?: boolean;
}

interface AttendanceLog {
  _id: string;
  mabaId: MabaItem;
  status: "present" | "late" | "excused" | string;
  createdAt: string;
}

export default function PkkmbPresensiPage() {
  const [events, setEvents] = useState<AttendanceEvent[]>([]);
  const [loading, setLoading] = useState(true);

  // Form Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    date: "",
    startTime: "",
    endTime: "",
    qrCodeToken: "",
    latitude: "",
    longitude: "",
    radiusMeter: 50,
  });

  // Logs Modal State
  const [logsModalOpen, setLogsModalOpen] = useState(false);
  const [logsLoading, setLogsLoading] = useState(false);
  const [logsList, setLogsList] = useState<AttendanceLog[]>([]);
  const [activeEventTitle, setActiveEventTitle] = useState("");
  const [activeEventId, setActiveEventId] = useState("");

  const [mabaList, setMabaList] = useState<MabaItem[]>([]);
  const [manualCheckin, setManualCheckin] = useState({ mabaId: "", status: "present" });
  const [isManualChecking, setIsManualChecking] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await ImsApiService.getPkkmbAttendanceEvents<AttendanceEvent>();
      if (res.success && res.data) {
        setEvents(res.data);
      }
    } catch (err) {
      console.error("Failed to load attendance events:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenCreate = () => {
    setIsEditing(false);
    setEditingId("");
    setFormData({
      title: "",
      date: new Date().toISOString().split("T")[0],
      startTime: "07:00",
      endTime: "17:00",
      qrCodeToken: "",
      latitude: "",
      longitude: "",
      radiusMeter: 50,
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (event: AttendanceEvent) => {
    setIsEditing(true);
    setEditingId(event._id);
    setFormData({
      title: event.title,
      date: event.date,
      startTime: event.startTime,
      endTime: event.endTime,
      qrCodeToken: event.qrCodeToken || "",
      latitude: event.coordinates?.latitude?.toString() || "",
      longitude: event.coordinates?.longitude?.toString() || "",
      radiusMeter: event.coordinates?.radiusMeter || 50,
    });
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    const payload = {
      title: formData.title,
      date: formData.date,
      startTime: formData.startTime,
      endTime: formData.endTime,
      qrCodeToken: formData.qrCodeToken || undefined,
      latitude: formData.latitude ? parseFloat(formData.latitude) : undefined,
      longitude: formData.longitude ? parseFloat(formData.longitude) : undefined,
      radiusMeter: formData.latitude && formData.longitude ? Number(formData.radiusMeter) : undefined,
    };

    try {
      let res: { success?: boolean };
      if (isEditing) {
        res = await ImsApiService.updatePkkmbAttendanceEvent(editingId, payload);
      } else {
        res = await ImsApiService.createPkkmbAttendanceEvent(payload);
      }

      if (res.success) {
        setModalOpen(false);
        fetchData();
      }
    } catch (err) {
      console.error("Failed to save attendance event:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleViewLogs = async (event: AttendanceEvent) => {
    setActiveEventTitle(event.title);
    setActiveEventId(event._id);
    setLogsModalOpen(true);
    setLogsLoading(true);
    setLogsList([]);

    try {
      const [resLogs, resMaba] = await Promise.all([
        ImsApiService.getPkkmbAttendanceLogs<AttendanceLog>(event._id),
        ImsApiService.getMabaList<MabaItem>()
      ]);
      if (resLogs.success && resLogs.data) {
        setLogsList(resLogs.data);
      }
      if (resMaba.success && resMaba.data) {
        setMabaList(resMaba.data);
      }
    } catch (err) {
      console.error("Failed to load logs or maba:", err);
    } finally {
      setLogsLoading(false);
    }
  };

  const handleExportCsv = () => {
    fetch(`${API_BASE_URL}/pkkmb/admin/attendance/export/${activeEventId}`, {
      credentials: 'include'
    })
      .then(res => res.blob())
      .then(blob => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `presensi-${activeEventId}.csv`;
        a.click();
      });
  };

  const handleManualCheckin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCheckin.mabaId) return;
    setIsManualChecking(true);
    try {
      const res = await ImsApiService.adminManualCheckinPkkmb(activeEventId, manualCheckin.mabaId, manualCheckin.status);
      if (res.success) {
        setManualCheckin({ mabaId: "", status: "present" });
        // Refresh logs
        const logsRes = await ImsApiService.getPkkmbAttendanceLogs<AttendanceLog>(activeEventId);
        if (logsRes.success) setLogsList(logsRes.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsManualChecking(false);
    }
  };

  const formatDateTime = (dateStr: string, timeStr?: string) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    const d = new Date(dateStr);
    const formattedDate = `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
    return timeStr ? `${formattedDate} pukul ${timeStr}` : formattedDate;
  };

  return (
    <DashboardShell requirePkkmbAccess>
      <div className="flex flex-col gap-6 p-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex flex-col gap-1.5">
            <h1 className="text-2xl font-extrabold tracking-tight text-ink sm:text-3xl flex items-center gap-2">
              <Clock className="w-8 h-8 text-amber-500" />
              <span>Sesi Presensi Maba</span>
            </h1>
            <p className="text-sm text-ink-muted">
              Kelola sesi kehadiran PKKMB FT 2026, generate QR Code, dan atur batasan Geofencing GPS.
            </p>
          </div>

          <button
            onClick={handleOpenCreate}
            className="btn-primary shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Buat Sesi Presensi</span>
          </button>
        </div>

        {/* Sessions list */}
        {loading ? (
          <div className="w-full py-16 flex flex-col items-center justify-center text-ink-muted">
            <Loader2 className="w-8 h-8 animate-spin text-amber-500 mb-3" />
            <p className="text-sm">Memuat sesi presensi...</p>
          </div>
        ) : events.length === 0 ? (
          <div className="bg-surface-1 border border-hairline rounded-xl p-12 text-center text-ink-muted">
            Belum ada sesi presensi yang dibuat. Klik tombol di kanan atas untuk membuat sesi baru.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {events.map((event) => {
              const hasGps = !!event.coordinates?.latitude;
              const hasQr = !!event.qrCodeToken;

              return (
                <div key={event._id} className="bg-surface-1 border border-hairline rounded-xl p-6 flex flex-col justify-between gap-6 relative overflow-hidden">
                  <div className="space-y-3">
                    <div className="flex justify-between items-start gap-4">
                      <h3 className="text-lg font-extrabold text-ink">{event.title}</h3>
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        event.isActive
                          ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                          : "bg-surface-2 text-ink-muted border border-foreground/5"
                      }`}>
                        {event.isActive ? "Aktif" : "Selesai"}
                      </span>
                    </div>

                    <div className="text-xs text-ink-muted space-y-1.5">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-ink-muted" />
                        <span>{formatDateTime(event.date, `${event.startTime} - ${event.endTime}`)}</span>
                      </div>
                      {hasGps && (
                        <div className="flex items-center gap-2 text-emerald-500">
                          <MapPin className="w-4 h-4" />
                          <span>GPS: {event.coordinates?.latitude}, {event.coordinates?.longitude} ({event.coordinates?.radiusMeter}m)</span>
                        </div>
                      )}
                      {hasQr && (
                        <div className="flex items-center gap-2 text-amber-500">
                          <QrCode className="w-4 h-4" />
                          <span>QR Token: <strong className="font-mono">{event.qrCodeToken}</strong></span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 border-t border-hairline pt-4">
                    <button
                      onClick={() => handleViewLogs(event)}
                      className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-surface-2 hover:bg-surface-2 border border-hairline py-2 px-3 text-xs font-bold text-ink cursor-pointer transition-all"
                    >
                      <Eye className="w-4 h-4" />
                      <span>Lihat Kehadiran</span>
                    </button>
                    <button
                      onClick={() => handleOpenEdit(event)}
                      className="flex items-center justify-center gap-2 rounded-xl border border-hairline hover:bg-surface-2 p-2 text-ink cursor-pointer transition-all"
                      title="Edit Sesi"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>

      {/* FORM MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg bg-surface-1 border border-hairline rounded-xl p-6 sm:p-8 space-y-6 relative">
            <h3 className="text-xl font-extrabold text-ink">
              {isEditing ? "Edit Sesi Presensi" : "Buat Sesi Presensi Baru"}
            </h3>

            <form onSubmit={handleSave} className="space-y-4">
              <div className="space-y-1.5">
                <label className="field-label">Judul Sesi</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: PKKMB Day 1 - Pembukaan"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="input-field"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1.5 col-span-1">
                  <label className="field-label">Tanggal</label>
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="input-field"
                  />
                </div>
                <div className="space-y-1.5 col-span-1">
                  <label className="field-label">Mulai</label>
                  <input
                    type="time"
                    required
                    value={formData.startTime}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    className="input-field"
                  />
                </div>
                <div className="space-y-1.5 col-span-1">
                  <label className="field-label">Selesai</label>
                  <input
                    type="time"
                    required
                    value={formData.endTime}
                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                    className="input-field"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="field-label">QR Code Token (Opsional)</label>
                <input
                  type="text"
                  placeholder="Kosongkan jika tidak menggunakan QR"
                  value={formData.qrCodeToken}
                  onChange={(e) => setFormData({ ...formData, qrCodeToken: e.target.value })}
                  className="input-field font-mono"
                />
              </div>

              <div className="border-t border-hairline pt-4 space-y-4">
                <div className="text-xs font-bold text-ink-muted">Pengaturan Geofencing GPS (Opsional)</div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <label className="field-label">Latitude</label>
                    <input
                      type="text"
                      placeholder="-7.3001"
                      value={formData.latitude}
                      onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                      className="input-field"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="field-label">Longitude</label>
                    <input
                      type="text"
                      placeholder="112.6738"
                      value={formData.longitude}
                      onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                      className="input-field"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="field-label">Radius (Meter)</label>
                    <input
                      type="number"
                      value={formData.radiusMeter}
                      onChange={(e) => setFormData({ ...formData, radiusMeter: Number(e.target.value) })}
                      className="input-field"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-hairline">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="btn-secondary text-xs"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="btn-primary text-xs"
                >
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Simpan Sesi"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* LOGS MODAL */}
      {logsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-4xl h-[80vh] flex flex-col justify-between bg-canvas border border-hairline rounded-xl p-6 sm:p-8 space-y-6 relative overflow-hidden">
            <div className="flex flex-col gap-1 shrink-0">
              <h3 className="text-xl font-extrabold text-ink">Riwayat Kehadiran Mahasiswa</h3>
              <p className="text-xs text-ink-muted">{activeEventTitle}</p>
            </div>

            {/* Table */}
            <div className="flex-1 overflow-y-auto border border-hairline rounded-xl">
              {logsLoading ? (
                <div className="w-full h-full flex flex-col items-center justify-center text-ink-muted">
                  <Loader2 className="w-8 h-8 animate-spin text-amber-500 mb-2" />
                  <p className="text-xs">Memproses log kehadiran...</p>
                </div>
              ) : logsList.length === 0 ? (
                <div className="w-full h-full flex items-center justify-center text-ink-muted py-16 text-sm">
                  Belum ada log kehadiran untuk sesi ini.
                </div>
              ) : (
                <table className="w-full border-collapse text-left text-xs">
                  <thead>
                    <tr className="border-b border-hairline bg-surface-2 text-ink-muted font-bold sticky top-0 bg-canvas z-10">
                      <th className="px-4 py-3">NIM</th>
                      <th className="px-4 py-3">Nama</th>
                      <th className="px-4 py-3">Kelompok</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Waktu Masuk</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-hairline">
                    {logsList.map((log) => (
                      <tr key={log._id} className="hover:bg-surface-2">
                        <td className="px-4 py-3 font-mono font-bold">{log.mabaId?.nim}</td>
                        <td className="px-4 py-3 font-extrabold">{log.mabaId?.name}</td>
                        <td className="px-4 py-3 text-ink-muted">{log.mabaId?.kelompok}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-2xs font-semibold ${
                            log.status === "present"
                              ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                              : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                          }`}>
                            {log.status === "present" ? "Tepat Waktu" : "Terlambat"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-ink-muted">{new Date(log.createdAt).toLocaleTimeString('id-ID')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between shrink-0 pt-2 border-t border-hairline mt-4 gap-4">
              <form onSubmit={handleManualCheckin} className="flex items-center gap-2 w-full sm:w-auto">
                <div className="w-[180px]">
                  <CustomSelect 
                    value={manualCheckin.mabaId}
                    onChange={val => setManualCheckin({...manualCheckin, mabaId: val})}
                    options={[
                      { value: "", label: "-- Pilih Maba --" },
                      ...mabaList.map(m => ({ value: m._id, label: `${m.nim} - ${m.name}` }))
                    ]}
                    placeholder="-- Pilih Maba --"
                    className="bg-surface-2 border-hairline py-1.5 px-3 text-xs"
                  />
                </div>
                <div className="w-[160px]">
                  <CustomSelect 
                    value={manualCheckin.status}
                    onChange={val => setManualCheckin({...manualCheckin, status: val})}
                    options={[
                      { value: "present", label: "Hadir (Tepat Waktu)" },
                      { value: "late", label: "Hadir (Terlambat)" },
                      { value: "excused", label: "Izin / Sakit" }
                    ]}
                    className="bg-surface-2 border-hairline py-1.5 px-3 text-xs"
                  />
                </div>
                <button type="submit" disabled={isManualChecking || !manualCheckin.mabaId} className="flex items-center gap-2 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary py-2 px-3 text-xs font-bold transition-all disabled:opacity-50">
                  {isManualChecking ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                  Manual Check-in
                </button>
              </form>

              <div className="flex items-center gap-3">
                <button
                  onClick={handleExportCsv}
                  className="flex items-center gap-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 border border-amber-500/20 py-2.5 px-4 text-xs font-bold transition-all"
                >
                  <Download className="w-4 h-4" />
                  Export CSV
                </button>
                <button
                  type="button"
                  onClick={() => setLogsModalOpen(false)}
                  className="rounded-xl border border-hairline hover:bg-surface-2 py-2.5 px-5 text-xs font-bold transition-all text-ink cursor-pointer"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}
