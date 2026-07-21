import React from "react";
import { Quote, User } from "lucide-react";
import Image from "next/image";
import { PublicApiService } from "@/lib/api";

const getAvatarUrl = (name: string, avatar?: string) => {
  if (!avatar) return null;
  if (avatar.startsWith("/")) return avatar.split("/").map(s => encodeURIComponent(s)).join("/");
  return avatar;
};

export async function SambutanSection() {
  const structureRes = await PublicApiService.getStructure();
  const data = structureRes.data;
  const bpi = data?.bpi || [];
  
  const ketua = bpi.find((u) => u.roleSlug === "ketubem") || bpi.find(u => u.role.toLowerCase().includes("ketua bem") && !u.role.toLowerCase().includes("wakil"));
  const wakil = bpi.find((u) => u.roleSlug === "wakabem") || bpi.find(u => u.role.toLowerCase().includes("wakil ketua"));

  return (
    <section className="w-full max-w-6xl mx-auto py-16 px-6 relative z-10 mt-12 md:mt-0">
      {/* Background Ambience */}
      <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-[400px] h-[400px] rounded-full bg-accent-gold/10 blur-[120px] pointer-events-none -z-10" />

      {/* Section Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8 border-b border-white dark:border-accent-blue/15 pb-6">
        <div>
          <span className="text-xs font-semibold text-accent-gold uppercase tracking-wide block mb-2">
            Sambutan Hangat
          </span>
          <h2 className="text-2xl md:text-4xl font-extrabold text-foreground tracking-tight">
            Ketua & Wakil Ketua BEM FT
          </h2>
        </div>
      </div>

      {/* Single Unified Card Layout */}
      <div className="w-full rounded-[32px] glass-subtle p-6 md:p-10 flex flex-col lg:flex-row items-center gap-10 shadow-2xl overflow-visible relative group border border-white dark:border-accent-blue/15 hover:border-accent-gold/30 transition-all duration-500 mt-16 md:mt-24">
        
        {/* Animated Glow inside card */}
        <div className="absolute -top-32 -left-32 w-64 h-64 bg-accent-gold/20 blur-[80px] rounded-full pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
        
        {/* Left Side: Large Photos popping out */}
        <div className="w-full lg:w-1/2 flex gap-4 lg:gap-6 relative z-20 items-start pb-12 lg:pb-0">
          {/* Ketua Photo */}
          <div className="relative w-1/2 aspect-[3/4] rounded-2xl overflow-visible transition-all duration-500 mt-8 lg:mt-0 group/ketua">
            <div className="absolute inset-0 top-12 rounded-2xl bg-slate-200/50 dark:bg-slate-800/20 border-4 border-background/50 shadow-2xl group-hover/ketua:shadow-accent-gold/20 transition-all duration-500" />
            
            {ketua && getAvatarUrl(ketua.name, ketua.avatar) ? (
              <div className="absolute inset-0 z-10 transition-transform duration-700 group-hover/ketua:-translate-y-4">
                <Image 
                  src={getAvatarUrl(ketua.name, ketua.avatar)!} 
                  alt={ketua.name} 
                  fill
                  sizes="(max-width: 768px) 50vw, 25vw"
                  className="object-contain object-bottom filter contrast-110 drop-shadow-2xl rounded-b-xl scale-[1.25] origin-bottom transition-transform duration-700 group-hover/ketua:scale-[1.30]" 
                />
              </div>
            ) : (
              <div className="absolute inset-0 top-12 flex items-center justify-center bg-slate-900/50 rounded-2xl z-10 transition-transform duration-700 group-hover/ketua:-translate-y-2">
                <User className="w-16 h-16 text-accent-blue/40" />
              </div>
            )}
            
            {/* Name Badge */}
            <div className="absolute bottom-0 left-0 w-full p-4 bg-gradient-to-t from-black/90 via-black/50 to-transparent rounded-b-2xl z-20 overflow-hidden transition-all duration-500 group-hover/ketua:pb-6">
              <h4 className="text-white text-sm md:text-base font-extrabold tracking-tight drop-shadow-md">
                {ketua?.name || "Diha Anfeu Nio Julaynda"}
              </h4>
              <p className="text-accent-gold text-[10px] uppercase font-bold tracking-widest mt-0.5">Ketua BEM</p>
            </div>
          </div>

          {/* Wakil Photo */}
          <div className="relative w-1/2 aspect-[3/4] rounded-2xl overflow-visible transition-all duration-500 mt-20 lg:mt-16 group/wakil">
            <div className="absolute inset-0 top-12 rounded-2xl bg-slate-200/50 dark:bg-slate-800/20 border-4 border-background/50 shadow-2xl group-hover/wakil:shadow-accent-blue/20 transition-all duration-500" />
            
            {wakil && getAvatarUrl(wakil.name, wakil.avatar) ? (
              <div className="absolute inset-0 z-10 transition-transform duration-700 group-hover/wakil:-translate-y-4">
                <Image 
                  src={getAvatarUrl(wakil.name, wakil.avatar)!} 
                  alt={wakil.name} 
                  fill
                  sizes="(max-width: 768px) 50vw, 25vw"
                  className="object-contain object-bottom filter contrast-110 drop-shadow-2xl rounded-b-xl scale-[1.25] origin-bottom transition-transform duration-700 group-hover/wakil:scale-[1.30]" 
                />
              </div>
            ) : (
              <div className="absolute inset-0 top-12 flex items-center justify-center bg-slate-900/50 rounded-2xl z-10 transition-transform duration-700 group-hover/wakil:-translate-y-2">
                <User className="w-16 h-16 text-accent-blue/40" />
              </div>
            )}
            
            {/* Name Badge */}
            <div className="absolute bottom-0 left-0 w-full p-4 bg-gradient-to-t from-black/90 via-black/50 to-transparent rounded-b-2xl z-20 overflow-hidden transition-all duration-500 group-hover/wakil:pb-6">
              <h4 className="text-white text-sm md:text-base font-extrabold tracking-tight drop-shadow-md">
                {wakil?.name || "Syahrul Fath"}
              </h4>
              <p className="text-accent-blue text-[10px] uppercase font-bold tracking-widest mt-0.5">Wakil Ketua BEM</p>
            </div>
          </div>
        </div>

        {/* Right Side: Quote & Content */}
        <div className="w-full lg:w-1/2 flex flex-col gap-6 relative z-10 pl-0 lg:pl-4">
          <Quote className="w-12 h-12 text-accent-gold/30 shrink-0 transform rotate-180" />
          
          <div className="flex flex-col gap-4">
            <span className="text-xs font-mono font-bold tracking-[0.25em] text-accent-gold uppercase">
              KABINET DANADYAKSA 2026
            </span>
            <p className="text-base md:text-xl text-foreground/90 leading-relaxed italic font-medium font-sans">
              &quot;Sinergi Nyata, Teknik Berdaya. Kami percaya bahwa kemajuan Fakultas Teknik Universitas Negeri Surabaya lahir dari kolaborasi yang erat, keterbukaan informasi, dan advokasi yang solutif terhadap setiap aspirasi mahasiswa. Bersama Kabinet Danadyaksa, mari kita jadikan Fakultas Teknik sebagai wadah inovasi yang unggul, inklusif, dan berdampak nyata bagi almamater dan masyarakat.&quot;
            </p>
          </div>
          
          <div className="h-[1px] bg-gradient-to-r from-accent-blue/20 to-transparent my-2" />
          
          <div className="flex flex-col gap-2">
            <p className="text-xs md:text-sm text-foreground/60 leading-relaxed font-sans">
              Selamat datang di portal resmi BEM FT UNESA. Melalui sistem terintegrasi ini, kami berkomitmen untuk mewujudkan transparansi kerja, mempermudah penyampaian aspirasi secara dinamis, serta memberikan layanan informasi terbaik untuk seluruh civitas akademika Fakultas Teknik Universitas Negeri Surabaya.
            </p>
          </div>
        </div>
        
      </div>
    </section>
  );
}

export default SambutanSection;
