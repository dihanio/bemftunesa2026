import ProkerClient from "@/components/proker/ProkerClient";
import { Metadata } from "next";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";

export const metadata: Metadata = {
  title: "Program Kerja | BEM FT UNESA",
  description:
    "Daftar inisiatif strategis dan program kerja BEM FT UNESA Kabinet Danadyaksa 2026. Pantau progres dan kontribusi kami untuk fakultas.",
};

export default function ProkerPage() {
  return (
    <div className="pt-44 md:pt-52 pb-24 px-6 max-w-7xl mx-auto relative z-10">
      <Breadcrumbs items={[{ label: "Program Kerja", isCurrent: true }]} />
      <ProkerClient />
    </div>
  );
}
