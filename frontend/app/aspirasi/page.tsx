import AspirasiClient from "@/components/aspirasi/AspirasiClient";
import { Metadata } from "next";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";

export const metadata: Metadata = {
  title: "Kanal Aspirasi | BEM FT UNESA",
  description:
    "Sampaikan aspirasi, keluhan, dan saran Anda secara aman dan terenkripsi. BEM FT UNESA hadir untuk mendengar dan memperjuangkan hak mahasiswa Teknik.",
};

export default function AspirasiPage() {
  return (
    <div className="pt-44 md:pt-52 pb-24 px-6 max-w-7xl mx-auto relative z-10">
      <Breadcrumbs items={[{ label: "Kanal Aspirasi", isCurrent: true }]} />
      <AspirasiClient />
    </div>
  );
}
