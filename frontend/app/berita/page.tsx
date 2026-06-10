import BeritaClient from "@/components/berita/BeritaClient";
import { Metadata } from "next";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";

export const metadata: Metadata = {
  title: "Kabar Teknik | BEM FT UNESA",
  description:
    "Portal berita dan media resmi BEM FT UNESA. Dapatkan informasi terbaru mengenai kegiatan, prestasi, dan pengumuman di lingkungan Fakultas Teknik.",
};

export default function BeritaPage() {
  return (
    <div className="pt-44 md:pt-52 pb-24 px-6 max-w-7xl mx-auto relative z-10">
      <Breadcrumbs items={[{ label: "Kabar Teknik", isCurrent: true }]} />
      <BeritaClient />
    </div>
  );
}
