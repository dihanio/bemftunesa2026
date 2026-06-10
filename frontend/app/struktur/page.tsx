import StrukturClient from "@/components/struktur/StrukturClient";
import { Metadata } from "next";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";

export const metadata: Metadata = {
  title: "Struktur Organisasi | BEM FT UNESA",
  description:
    "Kenali fungsionaris dan struktur kepengurusan BEM FT UNESA Kabinet Danadyaksa 2026. Sinergi departemen dan biro untuk kemajuan Fakultas Teknik.",
};

export default function StrukturPage() {
  return (
    <div className="pt-44 md:pt-52 pb-24 px-6 max-w-7xl mx-auto relative z-10">
      <Breadcrumbs items={[{ label: "Sinergi Kabinet", isCurrent: true }]} />
      <StrukturClient />
    </div>
  );
}
