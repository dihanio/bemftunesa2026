import { HeroSection } from "@/components/home/HeroSection";
import { StatsSection } from "@/components/home/StatsSection";
import { AgendaSection } from "@/components/home/AgendaSection";
import { NewsSection } from "@/components/home/NewsSection";
import { AspirasiSection } from "@/components/home/AspirasiSection";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Beranda | BEM FT UNESA",
  description:
    "Selamat datang di website resmi BEM FT UNESA. Pusat informasi, advokasi, dan inovasi mahasiswa Fakultas Teknik UNESA.",
};

export default function Home() {
  return (
    <main className="pb-16">
      <HeroSection />
      <StatsSection />
      <AgendaSection />
      <NewsSection />
      <AspirasiSection />
    </main>
  );
}
