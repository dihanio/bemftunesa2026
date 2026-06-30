import React from "react";
import HeroSection from "@/components/home/HeroSection";
import StatsSection from "@/components/home/StatsSection";
import SambutanSection from "@/components/home/SambutanSection";
import NewsSection from "@/components/home/NewsSection";
import PartnersSection from "@/components/home/PartnersSection";
import AspirasiSection from "@/components/home/AspirasiSection";

export default function Home() {
  return (
    <main className="flex flex-col w-full pb-12 overflow-x-hidden">
      {/* Background radial accent glow */}
      <div className="absolute top-[20%] left-1/2 -translate-x-1/2 w-[700px] h-[700px] rounded-full bg-accent-blue/5 blur-[120px] pointer-events-none -z-10" />
      <div className="absolute bottom-[30%] left-[10%] w-[500px] h-[500px] rounded-full bg-sage/5 blur-[150px] pointer-events-none -z-10" />

      {/* Hero Header Area */}
      <HeroSection />

      {/* Stats counter details */}
      <StatsSection />

      {/* Welcoming greetings from leadership */}
      <SambutanSection />

      {/* Recent news articles list */}
      <NewsSection />

      {/* Partners & Sponsors */}
      <PartnersSection />

      {/* Student aspirations and tracking CTA */}
      <AspirasiSection />
    </main>
  );
}
