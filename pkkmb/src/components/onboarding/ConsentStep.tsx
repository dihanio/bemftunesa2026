"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  ShieldCheck,
} from "lucide-react";
import SignaturePad from "./SignaturePad";

interface ConsentStepProps {
  apiUrl: string;
  summary: {
    name: string;
    nim: string;
    faculty: string;
    studyProgram: string;
    phone: string;
    healthReady: boolean;
    pasfotoReady: boolean;
  };
  onBack: () => void;
  onDone: (group: { nomor: number; name: string } | null) => void;
}

const STATEMENT_TEXT = `Saya menyatakan bahwa seluruh data dan informasi yang saya berikan dalam proses onboarding mahasiswa baru Fakultas Teknik Universitas Negeri Surabaya adalah benar, lengkap, dan dapat dipertanggungjawabkan.

Saya bersedia menggunakan data tersebut untuk keperluan administrasi, pendataan, pelaksanaan, pelayanan, dan keselamatan selama rangkaian kegiatan PKKMB Fakultas Teknik UNESA.

Saya memahami bahwa data kesehatan dan informasi pribadi yang saya berikan merupakan informasi yang bersifat terbatas dan hanya dapat digunakan oleh pihak yang berwenang sesuai dengan kebutuhan pelaksanaan kegiatan.

Saya bertanggung jawab untuk memberikan informasi yang benar mengenai kondisi kesehatan saya, termasuk riwayat penyakit, kebutuhan obat rutin, dan informasi kesehatan lain yang relevan untuk keselamatan selama kegiatan.

Apabila terdapat perubahan atau kesalahan informasi, saya bersedia melakukan pembaruan data melalui mekanisme yang disediakan oleh panitia.`;

const STATEMENT_VERSION = "1.0";

export default function ConsentStep({
  apiUrl,
  summary,
  onBack,
  onDone,
}: ConsentStepProps) {
  const [agreed, setAgreed] = useState(false);
  const [signature, setSignature] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [health, setHealth] = useState<{
    overallRiskLevel: string;
    bpjs: string;
    recordsCount: number;
    emergencyContactName: string;
    emergencyContactRelation: string;
    disability: string;
    healthReady: boolean;
  }>({
    overallRiskLevel: "-",
    bpjs: "-",
    recordsCount: 0,
    emergencyContactName: "-",
    emergencyContactRelation: "-",
    disability: "Tidak",
    healthReady: true,
  });

  useEffect(() => {
    fetch(`${apiUrl}/api/v1/pkkmb/health/me`, { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => {
        const p = json?.data;
        if (!p) return;
        setHealth({
          overallRiskLevel: p.overallRiskLevel || "-",
          bpjs: p.bpjsNumber ? "Terdaftar" : "Tidak memiliki",
          recordsCount: (p.records || []).length,
          emergencyContactName: p.emergencyContact?.name || "-",
          emergencyContactRelation: p.emergencyContact?.relation || "-",
          disability: p.isDisabled ? "Ya" + (p.disabilityDescription ? ` — ${p.disabilityDescription}` : "") : "Tidak",
          healthReady: p.hasMedicalHistory === false || (p.records || []).length > 0 || p.hasMedicalHistory !== undefined,
        });
      })
      .catch(() => {});
  }, [apiUrl]);

  const canFinish =
    agreed && !!signature && summary.healthReady && summary.pasfotoReady && health.healthReady;

  const finish = async () => {
    setError(null);
    if (!agreed) {
      setError("Anda harus menyetujui pernyataan terlebih dahulu.");
      return;
    }
    if (!signature) {
      setError("Tanda tangan wajib diisi.");
      return;
    }
    if (!summary.healthReady || !summary.pasfotoReady) {
      setError("Seluruh tahapan wajib belum selesai.");
      return;
    }
    setConfirming(true);
    try {
      const res = await fetch(`${apiUrl}/api/v1/pkkmb/onboard/consent`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          statementVersion: STATEMENT_VERSION,
          statementText: STATEMENT_TEXT,
          signature,
        }),
        credentials: "include",
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.message || "Gagal menyelesaikan onboarding.");
        setConfirming(false);
        return;
      }
      const group = json?.group || null;
      onDone(
        group && group._id ? { nomor: group.nomor, name: group.name } : null,
      );
    } catch {
      setError("Gagal terhubung ke server.");
      setConfirming(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 flex flex-col flex-1">
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">Konfirmasi & Persetujuan Data</h2>
        <p className="text-white/50 text-sm">Periksa kembali seluruh informasi yang telah Anda masukkan sebelum menyelesaikan onboarding.</p>
      </div>

      {/* Ringkasan */}
      <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/10 space-y-2">
        <p className="font-bold text-white mb-2">Ringkasan Data Anda</p>
        <SummaryRow label="Nama" value={summary.name} />
        <SummaryRow label="NIM" value={summary.nim} />
        <SummaryRow label="Fakultas" value={summary.faculty} />
        <SummaryRow label="Program Studi" value={summary.studyProgram} />
        <SummaryRow label="No. WhatsApp" value={summary.phone} />
        <SummaryRow label="Kontak Darurat" value={health.emergencyContactName !== "-" ? `${health.emergencyContactName} (${health.emergencyContactRelation})` : "-"} />
        <SummaryRow label="Disabilitas" value={health.disability} />
        <SummaryRow label="Data Kesehatan" value={`${health.recordsCount} riwayat · risiko ${health.overallRiskLevel} · BPJS ${health.bpjs}`} />
        <SummaryRow label="Pasfoto" value={summary.pasfotoReady ? "Sudah diunggah" : "Belum"} />
      </div>

      {/* Pernyataan */}
      <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/10">
        <p className="font-bold text-white mb-3 flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-gold-400" /> Pernyataan Persetujuan
        </p>
        <p className="text-sm text-white/60 whitespace-pre-line leading-relaxed">{STATEMENT_TEXT}</p>
        <label className="mt-4 flex items-start gap-3 cursor-pointer">
          <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} className="mt-1 w-5 h-5 accent-gold-500" />
          <span className="text-sm text-white/80">Saya telah membaca, memahami, dan menyetujui pernyataan di atas.</span>
        </label>
      </div>

      {/* Tanda tangan */}
      <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/10 space-y-3">
        <p className="font-bold text-white">Tanda Tangan Mahasiswa</p>
        <SignaturePad onChange={setSignature} />
      </div>

      {/* Konfirmasi akhir */}
      <div className="pt-2 flex justify-end mt-auto">
        <button
          onClick={finish}
          disabled={!canFinish || confirming}
          className="flex items-center gap-2 bg-gold-500 text-black px-8 py-3.5 rounded-xl font-bold transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gold-400"
        >
          {confirming ? <><Loader2 className="w-5 h-5 animate-spin" /> Memproses...</> : <><CheckCircle2 className="w-5 h-5" /> Setujui & Selesaikan Onboarding</>}
        </button>
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
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 text-sm">
      <span className="text-white/40 shrink-0">{label}</span>
      <span className="text-white text-right">{value}</span>
    </div>
  );
}
