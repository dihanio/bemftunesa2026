"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// Halaman "Penugasan PKKMB" lama sudah dikonsolidasikan ke halaman
// "Aktivitas Saya" (/dashboard/assignments) — semua alur submit tugas, status,
// dan logika ketua gugus ada di sana. Redirect agar link lama tidak 404.
export default function TugasMabaPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/dashboard/assignments");
  }, [router]);

  return null;
}
