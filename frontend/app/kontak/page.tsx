import { Metadata } from "next";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import KontakClient from "@/components/kontak/KontakClient";

export const metadata: Metadata = {
  title: "Kontak | BEM FT UNESA",
  description: "Hubungi BEM FT UNESA untuk kolaborasi, pertanyaan, atau informasi lebih lanjut.",
};

export default function KontakPage() {
  return (
    <div className="pt-44 md:pt-52 pb-24 px-6 max-w-7xl mx-auto relative z-10">
      <Breadcrumbs items={[{ label: "Kontak", isCurrent: true }]} />
      <KontakClient />
    </div>
  );
}
