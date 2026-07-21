import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, FileText, CheckCircle2, ShieldCheck, Clock } from "lucide-react";
import Link from "next/link";

export const metadata = {
  title: "Transparansi Publik",
  description:
    "Dashboard transparansi BEM FT UNESA — program kerja, persuratan, dan verifikasi dokumen resmi.",
};

export default async function TransparansiPage() {
  return (
    <div className="container mx-auto px-4 py-16 max-w-5xl">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-extrabold tracking-tight mb-4">
          Dashboard Transparansi Publik
        </h1>
        <p className="text-lg text-foreground/60 max-w-2xl mx-auto">
          Wujud komitmen BEM FT UNESA untuk memberikan akses informasi terbuka
          terkait program kerja dan persuratan organisasi kepada seluruh elemen
          mahasiswa.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-3 mb-12">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Program Kerja Aktif</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-accent-blue" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">—</div>
            <p className="text-xs text-foreground/50">Data tersedia setelah integrasi IMS</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Surat Resmi Diterbitkan</CardTitle>
            <FileText className="h-4 w-4 text-accent-blue" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">—</div>
            <p className="text-xs text-foreground/50">Dokumen digital tervalidasi</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aspirasi Ditangani</CardTitle>
            <Clock className="h-4 w-4 text-accent-blue" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">—</div>
            <p className="text-xs text-foreground/50">Aspirasi mahasiswa direspons</p>
          </CardContent>
        </Card>
      </div>

      {/* Info Panels */}
      <div className="grid gap-8 md:grid-cols-2">
        {/* Verifikasi Dokumen */}
        <div className="bg-accent-blue/5 rounded-2xl p-8 border border-accent-blue/15">
          <ShieldCheck className="h-12 w-12 text-accent-blue mb-4" />
          <h2 className="text-2xl font-bold mb-2">Verifikasi Dokumen Resmi</h2>
          <p className="text-foreground/60 mb-6">
            Seluruh dokumen persuratan dari BEM FT UNESA dilengkapi dengan Tanda
            Tangan Digital berupa QR Code. Anda dapat memverifikasi keaslian
            dokumen secara realtime.
          </p>
          <Link
            href="/verify"
            className="btn-strategic text-xs px-5 py-2.5 inline-flex items-center gap-2"
          >
            Mulai Verifikasi
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Program Kerja */}
        <div className="rounded-2xl p-8 border border-accent-blue/15 bg-slate-800/20 dark:bg-slate-800/10 flex flex-col justify-center">
          <CheckCircle2 className="h-12 w-12 text-accent-blue mb-4" />
          <h2 className="text-2xl font-bold mb-2">Laporan Program Kerja</h2>
          <p className="text-foreground/60 mb-4">
            Status realisasi setiap program kerja departemen akan dipublikasikan
            secara berkala sebagai bentuk akuntabilitas kepada mahasiswa FT UNESA.
          </p>
          <div className="w-full bg-accent-blue/10 h-2 rounded-full overflow-hidden">
            <div className="bg-accent-blue/50 h-full w-1/3 rounded-full" />
          </div>
          <p className="text-xs text-foreground/40 mt-2 text-right">Tahap Pengembangan</p>
        </div>
      </div>
    </div>
  );
}
