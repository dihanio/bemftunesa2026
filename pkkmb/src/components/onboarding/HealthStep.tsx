"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  Pencil,
  Loader2,
  ChevronDown,
  Check,
} from "lucide-react";

const CATEGORIES = [
  "Pernapasan",
  "Jantung",
  "Pencernaan",
  "Saraf",
  "Alergi",
  "Kronis",
  "Lainnya",
];

// Daftar penyakit umum utk dropdown "Nama Penyakit / Kondisi" (bisa di-custom).
const DISEASES = [
  "Asma",
  "Gastritis / Maag",
  "Epilepsi",
  "Hipertensi",
  "Diabetes",
  "Alergi makanan",
  "Alergi obat",
  "Rhinitis / Alergi debu",
  "Jantung / Penyakit jantung",
  "Kolesterol tinggi",
  "Anemia",
  "Migrain",
  "Tifus",
  "Demam Berdarah",
  "Tuberkulosis (TBC)",
  "Sakit maag / GERD",
  "Gangguan pernapasan (bronkitis)",
  "Kulit / Eksim",
  "Lainnya",
];

const CUSTOM_DISEASE_VALUE = "__custom__";

const CONDITION_STATUSES = [
  "Sudah sembuh",
  "Terkontrol",
  "Masih aktif",
  "Sering kambuh",
];

const EMERGENCY_RELATIONS = ["Ayah", "Ibu", "Wali", "Saudara", "Keluarga lainnya"];

interface HealthRecord {
  id?: string;
  name: string;
  category: string;
  yearStart: string;
  conditionStatus: string;
  needsMedication: boolean;
  notes: string;
}

interface HealthStepProps {
  apiUrl: string;
  onComplete: () => void;
  onBack: () => void;
}

export interface HealthStepHandle {
  submit: () => Promise<void>;
}

const HealthStep = forwardRef<HealthStepHandle, HealthStepProps>(
  function HealthStep({ apiUrl, onComplete, onBack }: HealthStepProps, ref) {
  const [hasHistory, setHasHistory] = useState<"none" | "yes" | null>(null);
  const [records, setRecords] = useState<HealthRecord[]>([]);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  // Disabilitas
  const [disability, setDisability] = useState<"yes" | "no" | null>(null);
  const [disabilityDesc, setDisabilityDesc] = useState("");

  // BPJS
  const [bpjs, setBpjs] = useState<"yes" | "no" | null>(null);
  const [bpjsNumber, setBpjsNumber] = useState("");
  const [bpjsStatus, setBpjsStatus] = useState("");

  // Kontak darurat
  const [emergencyName, setEmergencyName] = useState("");
  const [emergencyRelation, setEmergencyRelation] = useState("");
  const [emergencyPhone, setEmergencyPhone] = useState("");
  const [relOpen, setRelOpen] = useState(false);
  const [relSearch, setRelSearch] = useState("");
  const relRef = useRef<HTMLDivElement>(null);
  const [hydrated, setHydrated] = useState(false);

  // Auto-save data kesehatan ke localStorage saat berubah (refresh-safe).
  useEffect(() => {
    try {
      const raw = localStorage.getItem("onboardingHealth");
      if (raw) {
        const d = JSON.parse(raw);
        if (d.hasHistory) setHasHistory(d.hasHistory);
        if (Array.isArray(d.records)) setRecords(d.records);
        if (d.disability) setDisability(d.disability);
        if (typeof d.disabilityDesc === "string") setDisabilityDesc(d.disabilityDesc);
        if (d.bpjs) setBpjs(d.bpjs);
        if (typeof d.bpjsNumber === "string") setBpjsNumber(d.bpjsNumber);
        if (typeof d.bpjsStatus === "string") setBpjsStatus(d.bpjsStatus);
        if (typeof d.emergencyName === "string") setEmergencyName(d.emergencyName);
        if (typeof d.emergencyRelation === "string") setEmergencyRelation(d.emergencyRelation);
        if (typeof d.emergencyPhone === "string") setEmergencyPhone(d.emergencyPhone);
      }
    } catch {}
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(
        "onboardingHealth",
        JSON.stringify({
          hasHistory,
          records,
          disability,
          disabilityDesc,
          bpjs,
          bpjsNumber,
          bpjsStatus,
          emergencyName,
          emergencyRelation,
          emergencyPhone,
        }),
      );
    } catch {}
  }, [hasHistory, records, disability, disabilityDesc, bpjs, bpjsNumber, bpjsStatus, emergencyName, emergencyRelation, emergencyPhone, hydrated]);

  useEffect(() => {
    if (!relOpen) return;
    const onDown = (e: MouseEvent | TouchEvent) => {
      if (relRef.current && !relRef.current.contains(e.target as Node)) {
        setRelOpen(false);
        setRelSearch("");
      }
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("touchstart", onDown);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("touchstart", onDown);
    };
  }, [relOpen]);

  // Editor riwayat
  const [editor, setEditor] = useState<HealthRecord>({
    name: "",
    category: "",
    yearStart: "",
    conditionStatus: "Masih aktif",
    needsMedication: false,
    notes: "",
  });
  const [showEditor, setShowEditor] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [customDisease, setCustomDisease] = useState(false);

  const openAdd = () => {
    setEditor({ name: "", category: "", yearStart: "", conditionStatus: "Masih aktif", needsMedication: false, notes: "" });
    setCustomDisease(false);
    setEditingIndex(null);
    setShowEditor(true);
  };

  const openEdit = (idx: number) => {
    setEditor(records[idx]);
    setEditingIndex(idx);
    setShowEditor(true);
    // Jika nama penyakit lama tidak ada di daftar, aktifkan mode ketik sendiri.
    setCustomDisease(!!records[idx]?.name && !DISEASES.includes(records[idx].name));
  };

  const saveRecord = () => {
    if (!editor.name.trim()) {
      setError("Nama penyakit wajib diisi.");
      setTimeout(() => setError(null), 4000);
      return;
    }
    if (!editor.category) {
      setError("Pilih kategori penyakit.");
      setTimeout(() => setError(null), 4000);
      return;
    }
    if (editingIndex !== null) {
      setRecords((prev) => prev.map((r, i) => (i === editingIndex ? editor : r)));
    } else {
      setRecords((prev) => [...prev, editor]);
    }
    setShowEditor(false);
    setError(null);
  };

  const removeRecord = (idx: number) => {
    setRecords((prev) => prev.filter((_, i) => i !== idx));
  };

  const submit = async () => {
    setError(null);

    if (!hasHistory) {
      setError("Pilih status riwayat penyakit terlebih dahulu.");
      setTimeout(() => setError(null), 4000);
      return;
    }
    if (hasHistory === "yes" && records.length === 0) {
      setError("Anda menyatakan memiliki riwayat penyakit, tambahkan minimal satu.");
      setTimeout(() => setError(null), 4000);
      return;
    }
    if (!emergencyName.trim() || !emergencyRelation || !emergencyPhone.trim()) {
      setError("Lengkapi kontak darurat (nama, hubungan, nomor WhatsApp).");
      setTimeout(() => setError(null), 4000);
      return;
    }
    if (!disability) {
      setError("Pilih status disabilitas terlebih dahulu.");
      setTimeout(() => setError(null), 4000);
      return;
    }
    if (disability === "yes" && !disabilityDesc.trim()) {
      setError("Lengkapi keterangan jenis disabilitas.");
      setTimeout(() => setError(null), 4000);
      return;
    }
    if (disability === "yes" && disabilityDesc.trim().length > 300) {
      setError("Keterangan disabilitas maksimal 300 karakter.");
      setTimeout(() => setError(null), 4000);
      return;
    }
    if (bpjs === "yes") {
      const digits = bpjsNumber.replace(/\D/g, "");
      if (digits.length < 11 || digits.length > 13) {
        setError("Nomor BPJS tidak valid (11-13 digit).");
        setTimeout(() => setError(null), 4000);
        return;
      }
    }

    setSaving(true);
    try {
      const payload = {
        hasMedicalHistory: hasHistory === "yes",
        isDisabled: disability === "yes",
        disabilityDescription: disability === "yes" ? disabilityDesc.trim() : undefined,
        bpjsNumber: bpjs === "yes" ? digits(bpjsNumber) : undefined,
        bpjsStatus: bpjs === "yes" ? bpjsStatus || "Aktif" : undefined,
        emergencyContactName: emergencyName,
        emergencyContactRelation: emergencyRelation,
        emergencyContactPhone: emergencyPhone,
        records:
          hasHistory === "yes"
            ? records.map((r) => ({
                name: r.name,
                category: r.category,
                yearStart: r.yearStart ? Number(r.yearStart) : undefined,
                conditionStatus: r.conditionStatus,
                needsMedication: r.needsMedication,
                notes: r.notes,
              }))
            : [],
      };
      const res = await fetch(`${apiUrl}/api/v1/pkkmb/health/me`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        credentials: "include",
      });
      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        setError(e.message || "Gagal menyimpan data kesehatan.");
        setSaving(false);
        return;
      }
      onComplete();
    } catch {
      setError("Gagal terhubung ke server.");
      setSaving(false);
    }
  };

  useImperativeHandle(ref, () => ({ submit }));

  const riskLabel =
    records.length === 0 ? "RENDAH" : riskOf(records);

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 flex flex-col flex-1">
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">Profil Kesehatan Mahasiswa</h2>
        <p className="text-white/50 text-sm mb-4">
          Data ini digunakan panitia untuk mitigasi risiko selama PKKMB. Hanya tim kesehatan yang berwenang yang dapat mengakses.
        </p>
      </div>

      {/* Riwayat penyakit */}
      <div className="space-y-4">
        <p className="font-bold text-white">Apakah Anda memiliki riwayat penyakit?</p>
        <div className="flex flex-col gap-3">
          {(["none", "yes"] as const).map((opt) => (
            <label key={opt} className={`flex items-center gap-3 border rounded-xl px-5 py-4 cursor-pointer transition-all ${hasHistory === opt ? "bg-gold-500/10 border-gold-500 text-gold-400 font-bold" : "bg-white/5 border-white/10 text-white/70 hover:bg-white/10"}`}>
              <input type="radio" name="hasHistory" checked={hasHistory === opt} onChange={() => { setHasHistory(opt); setShowEditor(false); }} className="accent-gold-500" />
              {opt === "none" ? "Tidak memiliki riwayat penyakit" : "Memiliki riwayat penyakit"}
            </label>
          ))}
        </div>

        {hasHistory === "none" && (
          <div className="flex items-center gap-2 p-4 bg-green-500/10 border border-green-500/20 rounded-xl text-green-400 text-sm">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>Anda menyatakan tidak memiliki riwayat penyakit.</span>
          </div>
        )}

        {hasHistory === "yes" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="font-bold text-white">Daftar Riwayat Penyakit</p>
              <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gold-500/10 border border-gold-500/30 text-gold-400 text-sm font-bold hover:bg-gold-500/20 transition-colors">
                <Plus className="w-4 h-4" /> Tambah Riwayat Penyakit
              </button>
            </div>

            {records.length === 0 && (
              <p className="text-sm text-white/40 italic">Belum ada riwayat penyakit. Klik &quot;Tambah Riwayat Penyakit&quot;.</p>
            )}

            <div className="space-y-3">
              {records.map((r, idx) => (
                <div key={idx} className="bg-white/5 border border-white/10 rounded-2xl p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-bold text-white">{r.name}</p>
                      <p className="text-xs text-white/40">{r.category} · Mulai {r.yearStart || "-"} · {r.conditionStatus} · Obat rutin: {r.needsMedication ? "Ya" : "Tidak"}</p>
                      {r.notes && <p className="text-xs text-white/40 mt-1">{r.notes}</p>}
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <button onClick={() => openEdit(idx)} className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-colors"><Pencil className="w-4 h-4" /></button>
                      <button onClick={() => removeRecord(idx)} className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <AnimatePresence>
              {showEditor && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                  <div className="bg-[#111] border border-white/10 rounded-2xl p-5 space-y-4">
                    <div>
                      <label className="text-xs font-bold text-white/50 uppercase tracking-wider block mb-2">Nama Penyakit / Kondisi</label>
                      {!customDisease ? (
                        <select
                          value={DISEASES.includes(editor.name) ? editor.name : CUSTOM_DISEASE_VALUE}
                          onChange={(e) => {
                            if (e.target.value === CUSTOM_DISEASE_VALUE) {
                              setCustomDisease(true);
                              setEditor({ ...editor, name: "" });
                            } else {
                              setEditor({ ...editor, name: e.target.value });
                            }
                          }}
                          className="w-full px-4 py-2.5 text-white bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-gold-500"
                        >
                          <option value="">Pilih penyakit / kondisi</option>
                          {DISEASES.map((d) => (<option key={d} value={d}>{d}</option>))}
                        </select>
                      ) : (
                        <div className="flex flex-col gap-2">
                          <input
                            type="text"
                            value={editor.name}
                            onChange={(e) => setEditor({ ...editor, name: e.target.value })}
                            className="w-full px-4 py-2.5 text-white bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-gold-500"
                            placeholder="Ketik nama penyakit / kondisi"
                            autoFocus
                          />
                          <button
                            type="button"
                            onClick={() => { setCustomDisease(false); setEditor({ ...editor, name: "" }); }}
                            className="text-xs text-gold-400 hover:text-gold-300 self-start"
                          >
                            ← Pilih dari daftar
                          </button>
                        </div>
                      )}
                    </div>
                    <div>
                      <label className="text-xs font-bold text-white/50 uppercase tracking-wider block mb-2">Kategori Penyakit</label>
                      <select value={editor.category} onChange={(e) => setEditor({ ...editor, category: e.target.value })} className="w-full px-4 py-2.5 text-white bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-gold-500">
                        <option value="">Pilih kategori</option>
                        {CATEGORIES.map((c) => (<option key={c} value={c}>{c}</option>))}
                      </select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-bold text-white/50 uppercase tracking-wider block mb-2">Tahun Mulai</label>
                        <input type="number" value={editor.yearStart} onChange={(e) => setEditor({ ...editor, yearStart: e.target.value })} className="w-full px-4 py-2.5 text-white bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-gold-500" placeholder="cth. 2020" />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-white/50 uppercase tracking-wider block mb-2">Status Kondisi</label>
                        <select value={editor.conditionStatus} onChange={(e) => setEditor({ ...editor, conditionStatus: e.target.value })} className="w-full px-4 py-2.5 text-white bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-gold-500">
                          {CONDITION_STATUSES.map((s) => (<option key={s} value={s}>{s}</option>))}
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-white/50 uppercase tracking-wider block mb-2">Membutuhkan Obat Rutin?</label>
                      <div className="flex gap-3">
                        {[true, false].map((v) => (
                          <label key={String(v)} className={`flex items-center gap-2 border rounded-xl px-4 py-2.5 cursor-pointer ${editor.needsMedication === v ? "bg-gold-500/10 border-gold-500 text-gold-400" : "bg-white/5 border-white/10 text-white/70"}`}>
                            <input type="radio" checked={editor.needsMedication === v} onChange={() => setEditor({ ...editor, needsMedication: v })} className="accent-gold-500" />
                            {v ? "Ya" : "Tidak"}
                          </label>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-white/50 uppercase tracking-wider block mb-2">Keterangan Tambahan</label>
                      <textarea value={editor.notes} onChange={(e) => setEditor({ ...editor, notes: e.target.value })} rows={2} className="w-full px-4 py-2.5 text-white bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-gold-500" />
                    </div>
                    <div className="flex justify-end gap-3">
                      <button onClick={() => setShowEditor(false)} className="px-4 py-2 rounded-xl text-white/50 hover:text-white transition-colors">Batal</button>
                      <button onClick={saveRecord} className="px-5 py-2 rounded-xl bg-gold-500 text-black font-bold hover:bg-gold-400 transition-colors">Simpan Riwayat</button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Disabilitas */}
      <div className="space-y-3">
        <p className="font-bold text-white">Apakah Anda merupakan mahasiswa dengan disabilitas?</p>
        <p className="text-xs text-white/40">
          Informasi ini digunakan panitia untuk menyediakan akomodasi yang sesuai selama kegiatan PKKMB (misal: prioritas tempat duduk, pendamping khusus). Hanya tim yang berwenang yang dapat mengaksesnya.
        </p>
        <div className="flex gap-3">
          {(["yes", "no"] as const).map((opt) => (
            <label key={opt} className={`flex-1 flex items-center gap-2 border rounded-xl px-5 py-3 cursor-pointer transition-all ${disability === opt ? "bg-gold-500/10 border-gold-500 text-gold-400 font-bold" : "bg-white/5 border-white/10 text-white/70 hover:bg-white/10"}`}>
              <input type="radio" name="disability" checked={disability === opt} onChange={() => setDisability(opt)} className="accent-gold-500" />
              {opt === "yes" ? "Ya" : "Tidak"}
            </label>
          ))}
        </div>
        {disability === "yes" && (
          <div>
            <label className="text-xs font-bold text-white/50 uppercase tracking-wider block mb-2">Jenis / Keterangan Disabilitas</label>
            <input
              type="text"
              value={disabilityDesc}
              onChange={(e) => setDisabilityDesc(e.target.value)}
              maxLength={300}
              className="w-full px-4 py-2.5 text-white bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-gold-500"
              placeholder="cth. Disabilitas fisik (kursi roda), tuna netra, tuna rungu, dll."
            />
          </div>
        )}
        {disability === "no" && (
          <div className="flex items-center gap-2 p-4 bg-green-500/10 border border-green-500/20 rounded-xl text-green-400 text-sm">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>Anda menyatakan bukan mahasiswa dengan disabilitas.</span>
          </div>
        )}
      </div>

      {/* BPJS */}
      <div className="space-y-3">
        <p className="font-bold text-white">Apakah Anda memiliki BPJS Kesehatan?</p>
        <div className="flex gap-3">
          {(["yes", "no"] as const).map((opt) => (
            <label key={opt} className={`flex items-center gap-2 border rounded-xl px-5 py-3 cursor-pointer ${bpjs === opt ? "bg-gold-500/10 border-gold-500 text-gold-400 font-bold" : "bg-white/5 border-white/10 text-white/70"}`}>
              <input type="radio" name="bpjs" checked={bpjs === opt} onChange={() => setBpjs(opt)} className="accent-gold-500" />
              {opt === "yes" ? "Ya" : "Tidak"}
            </label>
          ))}
        </div>
        {bpjs === "yes" && (
          <div className="grid grid-cols-1 gap-3">
            <div>
              <label className="text-xs font-bold text-white/50 uppercase tracking-wider block mb-2">Nomor BPJS</label>
              <input type="text" inputMode="numeric" value={bpjsNumber} onChange={(e) => setBpjsNumber(e.target.value.replace(/\D/g, ""))} className="w-full px-4 py-2.5 text-white bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-gold-500" placeholder="11-13 digit" />
            </div>
            <div>
              <label className="text-xs font-bold text-white/50 uppercase tracking-wider block mb-2">Status Kepesertaan (opsional)</label>
              <input type="text" value={bpjsStatus} onChange={(e) => setBpjsStatus(e.target.value)} className="w-full px-4 py-2.5 text-white bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-gold-500" placeholder="cth. Aktif / PBI / Mandiri" />
            </div>
          </div>
        )}
      </div>

      {/* Kontak darurat */}
      <div className="space-y-3">
        <p className="font-bold text-white">Kontak Darurat</p>
        <div className="grid grid-cols-1 gap-3">
          <div>
            <label className="text-xs font-bold text-white/50 uppercase tracking-wider block mb-2">Nama Kontak Darurat</label>
            <input type="text" value={emergencyName} onChange={(e) => setEmergencyName(e.target.value)} className="w-full px-4 py-2.5 text-white bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-gold-500" />
          </div>
          <div ref={relRef} className="relative">
            <label className="text-xs font-bold text-white/50 uppercase tracking-wider block mb-2">Hubungan dengan Mahasiswa</label>
            <div
              onClick={() => setRelOpen(!relOpen)}
              className="w-full flex items-center justify-between px-4 py-2.5 text-white bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-gold-500 cursor-pointer"
            >
              <span className={emergencyRelation ? "text-white" : "text-white/40"}>{emergencyRelation || "Pilih hubungan"}</span>
              <ChevronDown className={`w-4 h-4 text-white/40 transition-transform ${relOpen ? "rotate-180" : ""}`} />
            </div>
            <AnimatePresence>
              {relOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.15 }}
                  className="absolute top-full left-0 right-0 mt-1 z-50 bg-[#111] border border-white/10 rounded-xl overflow-hidden shadow-2xl"
                >
                  <input
                    type="text"
                    value={relSearch}
                    onChange={(e) => setRelSearch(e.target.value)}
                    placeholder="Cari hubungan..."
                    className="w-full px-4 py-2.5 text-white bg-white/5 border-b border-white/10 focus:outline-none focus:border-gold-500"
                  />
                  <div className="max-h-40 overflow-y-auto custom-scrollbar" data-lenis-prevent>
                    {EMERGENCY_RELATIONS.filter((r) => r.toLowerCase().includes(relSearch.toLowerCase())).map((r) => (
                      <div
                        key={r}
                        onClick={() => {
                          setEmergencyRelation(r);
                          setRelOpen(false);
                          setRelSearch("");
                        }}
                        className={`px-4 py-3 cursor-pointer transition-colors flex items-center justify-between ${emergencyRelation === r ? "bg-gold-500/10 text-gold-500 font-bold" : "text-white/70 hover:bg-white/5 hover:text-white"}`}
                      >
                        {r}
                        {emergencyRelation === r && <Check className="w-4 h-4 text-gold-500" />}
                      </div>
                    ))}
                    {EMERGENCY_RELATIONS.filter((r) => r.toLowerCase().includes(relSearch.toLowerCase())).length === 0 && (
                      <div className="px-4 py-3 text-white/50 text-sm">Hubungan tidak ditemukan</div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <div>
            <label className="text-xs font-bold text-white/50 uppercase tracking-wider block mb-2">Nomor WhatsApp Kontak Darurat</label>
            <input type="tel" value={emergencyPhone} onChange={(e) => setEmergencyPhone(e.target.value)} className="w-full px-4 py-2.5 text-white bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-gold-500" placeholder="08xxxxxxxxxx" />
          </div>
        </div>
      </div>

      {/* Ringkasan & klasifikasi risiko */}
      <div className="p-5 rounded-2xl bg-gradient-to-b from-gold-500/10 to-transparent border border-gold-500/20 space-y-2">
        <p className="font-bold text-white">Ringkasan Profil Kesehatan</p>
        <p className="text-sm text-white/60">Disabilitas: <strong className="text-white">{disability === "yes" ? "Ya" + (disabilityDesc ? ` — ${disabilityDesc}` : "") : disability === "no" ? "Tidak" : "Tidak diisi"}</strong></p>
        <p className="text-sm text-white/60">Jumlah riwayat penyakit: <strong className="text-white">{records.length}</strong></p>
        <p className="text-sm text-white/60">Status risiko (otomatis): <strong className={riskColor(riskLabel)}>{riskLabel}</strong></p>
        <p className="text-sm text-white/60">BPJS: <strong className="text-white">{bpjs === "yes" ? "Terdaftar" : bpjs === "no" ? "Tidak memiliki" : "Tidak diisi"}</strong></p>
        <p className="text-xs text-white/40">Klasifikasi risiko ditentukan sistem dari master data penyakit (administratif, bukan diagnosis medis).</p>
      </div>

      {/* Error toast */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-3 px-5 py-3 bg-[#1a0a0a] border border-red-500/30 text-red-300 text-sm rounded-2xl shadow-2xl"
          >
            <AlertCircle className="w-5 h-5 shrink-0 text-red-400" />
            <span>{error}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
});

export default HealthStep;
function digits(s: string): string {
  return s.replace(/\D/g, "");
}

function riskOf(records: HealthRecord[]): string {
  const order: Record<string, number> = { RENDAH: 0, SEDANG: 1, TINGGI: 2 };
  let worst = "RENDAH";
  // Heuristik: jika tidak ada master risk, gunakan kategori tertentu.
  for (const r of records) {
    const catRisk = categoryRisk(r.category);
    if (order[catRisk] > order[worst]) worst = catRisk;
  }
  return worst;
}

function categoryRisk(category: string): "RENDAH" | "SEDANG" | "TINGGI" {
  switch (category) {
    case "Saraf":
      return "TINGGI";
    case "Jantung":
      return "TINGGI";
    case "Pernapasan":
      return "SEDANG";
    case "Kronis":
      return "SEDANG";
    default:
      return "RENDAH";
  }
}

function riskColor(level: string): string {
  return level === "TINGGI" ? "text-red-400" : level === "SEDANG" ? "text-yellow-400" : "text-green-400";
}
