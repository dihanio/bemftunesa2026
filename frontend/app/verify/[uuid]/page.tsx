import {
  ShieldCheck,
  FileText,
  Calendar,
  UserCheck,
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
} from "lucide-react";
import Link from "next/link";
import { ApiResponse, fetcher } from "@/lib/api";

interface VerifiedDocument {
  status: "Valid" | "Pending" | "Invalid";
  message?: string;
  documentNumber?: string;
  title?: string;
  type?: string;
  signedAt?: string;
  signedBy?: {
    name: string;
    role: string;
  };
}

export default async function VerificationPage({
  params,
}: {
  params: Promise<{ uuid: string }>;
}) {
  const { uuid } = await params;

  let verification: ApiResponse<VerifiedDocument> | null = null;

  try {
    verification = await fetcher<ApiResponse<VerifiedDocument>>(
      `/public/verify/${uuid}`,
      { cache: "no-store" },
    );
  } catch {
    verification = {
      statusCode: 500,
      message: "Gagal mengambil data verifikasi",
      data: {
        status: "Invalid",
        message:
          "Layanan verifikasi sedang tidak tersedia. Coba lagi beberapa saat.",
      },
    };
  }

  const doc = verification.data;
  const statusStyles = {
    Valid: {
      header: "from-[#10B981]/10",
      badge: "text-[#10B981]",
      iconWrap: "bg-[#10B981]/20 text-[#10B981]",
      label: "Dokumen Valid",
    },
    Pending: {
      header: "from-[#F59E0B]/10",
      badge: "text-[#F59E0B]",
      iconWrap: "bg-[#F59E0B]/20 text-[#F59E0B]",
      label: "Menunggu Validasi",
    },
    Invalid: {
      header: "from-[#EF4444]/10",
      badge: "text-[#EF4444]",
      iconWrap: "bg-[#EF4444]/20 text-[#EF4444]",
      label: "Dokumen Tidak Valid",
    },
  } as const;
  const currentStyle = statusStyles[doc.status];
  const signedAtLabel = doc.signedAt
    ? new Date(doc.signedAt).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "-";

  return (
    <div className="pt-44 pb-24 px-6 max-w-4xl mx-auto relative z-10">
      {/* Back Button */}
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-sm text-gray-500 mb-12 hover:text-[#10b981] transition-colors group"
      >
        <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        Kembali ke Beranda
      </Link>

      <div className="bg-[#0a2214]/60 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
        {/* Status Header */}
        <div
          className={`p-8 md:p-12 text-center border-b border-white/5 bg-gradient-to-b ${currentStyle.header} to-transparent`}
        >
          <div
            className={`w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center animate-pulse ${currentStyle.iconWrap}`}
          >
            {doc.status === "Valid" ? (
              <ShieldCheck className="w-10 h-10" />
            ) : (
              <AlertCircle className="w-10 h-10" />
            )}
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2 font-sans tracking-tight">
            Verifikasi Dokumen
          </h1>
          <p
            className={`text-sm font-mono uppercase tracking-[0.2em] font-bold ${currentStyle.badge}`}
          >
            Status: {currentStyle.label}
          </p>
        </div>

        {/* Document Details Grid */}
        <div className="p-8 md:p-12 space-y-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <div className="space-y-6">
              <div>
                <p className="text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                  <FileText className="w-3.5 h-3.5" /> Nomor Surat
                </p>
                <p className="text-lg font-bold text-white selection:bg-[#10b981]">
                  {doc.documentNumber || "-"}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                  <ShieldCheck className="w-3.5 h-3.5" /> Jenis Dokumen
                </p>
                <p className="text-lg font-bold text-white font-sans">
                  {doc.type || "-"}
                </p>
              </div>
            </div>
            <div className="space-y-6">
              <div>
                <p className="text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5" /> Tanggal Terbit
                </p>
                <p className="text-lg font-bold text-white">{signedAtLabel}</p>
              </div>
              <div>
                <p className="text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                  <UserCheck className="w-3.5 h-3.5" /> Penandatangan
                </p>
                <p className="text-lg font-bold text-white">
                  {doc.signedBy?.name || "-"}
                </p>
              </div>
            </div>
          </div>

          <div className="pt-10 border-t border-white/5">
            <p className="text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-4">
              Perihal / Keterangan
            </p>
            <div className="p-6 rounded-2xl bg-white/5 border border-white/5 leading-relaxed text-gray-300">
              {doc.title || doc.message || "Data dokumen tidak tersedia."}
            </div>
          </div>

          {/* Security Hash / ID */}
          <div className="pt-6 flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-[9px] font-mono text-gray-600 uppercase tracking-widest">
              System integrity check: SECURE // BEMFT_ID: {uuid}
            </div>
            <div className="flex items-center gap-2 text-[#10b981]">
              <CheckCircle2 className="w-4 h-4" />
              <span className="text-[10px] font-bold uppercase tracking-widest">
                Secured by BEM FT UNESA
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Warning / Anti-Fraud */}
      <div className="mt-12 p-6 rounded-2xl border border-[#EF4444]/20 bg-[#EF4444]/5 flex items-start gap-4">
        <AlertCircle className="w-5 h-5 text-[#EF4444] shrink-0 mt-0.5" />
        <div>
          <h4 className="text-sm font-bold text-white mb-1">
            Peringatan Keamanan
          </h4>
          <p className="text-xs text-gray-500 leading-normal">
            Selalu pastikan URL yang sedang Anda akses adalah{" "}
            <strong>bemftunesa.org</strong>. Pemalsuan dokumen organisasi dapat
            ditindak secara administratif dan hukum sesuai peraturan yang
            berlaku di Universitas Negeri Surabaya.
          </p>
        </div>
      </div>
    </div>
  );
}
