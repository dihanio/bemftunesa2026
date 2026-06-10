"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ShieldAlert, ArrowLeft, Home } from "lucide-react";

export default function AccessDeniedPage() {
  const router = useRouter();

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-4 space-y-6">
      <div className="relative">
        <div className="absolute inset-0 bg-red-500/10 blur-xl rounded-full" />
        <ShieldAlert className="relative h-20 w-20 text-destructive animate-pulse" />
      </div>

      <div className="space-y-2 max-w-md">
        <h1 className="text-3xl font-black text-white uppercase tracking-wider">
          Akses Ditolak (403)
        </h1>
        <p className="text-sm text-[#a9b49c]">
          Anda tidak memiliki izin otorisasi yang cukup untuk mengakses halaman
          ini. Halaman ini diproteksi oleh RBAC Danadyaksa ERP BEM FT.
        </p>
      </div>

      <div className="flex gap-4">
        <Button
          variant="outline"
          onClick={() => router.back()}
          className="border-white/10 bg-white/5 text-white"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Kembali
        </Button>
        <Button
          onClick={() => router.push("/")}
          className="bg-[#10b981] text-[#091c11] hover:bg-[#a7f3d0]"
        >
          <Home className="mr-2 h-4 w-4" />
          Dashboard Utama
        </Button>
      </div>
    </div>
  );
}
