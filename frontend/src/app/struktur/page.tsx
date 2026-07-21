"use client";

import React, { useState, useEffect, useRef } from "react";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { PublicApiService, type StructureData, type StructureLeader, type Department } from "@/lib/api";
import { User, Search, X, Building, Mail, Instagram, Linkedin, Twitter, ArrowUpRight, ChevronLeft, ChevronRight } from "lucide-react";
import { motion, useInView, useSpring } from "framer-motion";
import Image from "next/image";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Radix UI Wrappers ---
const Dialog = DialogPrimitive.Root;
const DialogPortal = DialogPrimitive.Portal;
const DialogOverlay = React.forwardRef<React.ElementRef<typeof DialogPrimitive.Overlay>, React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay className={cn("fixed inset-0 z-50 bg-black/60 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0", className)} {...props} ref={ref} />
));
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName;
const DialogContent = React.forwardRef<React.ElementRef<typeof DialogPrimitive.Content>, React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>>(({ className, children, ...props }, ref) => (
  <DialogPortal>
    <DialogOverlay />
    <DialogPrimitive.Content ref={ref} className={cn("fixed left-[50%] top-[50%] z-50 grid w-full max-w-sm sm:max-w-md translate-x-[-50%] translate-y-[-50%] bg-transparent duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] outline-none", className)} {...props}>
      {children}
    </DialogPrimitive.Content>
  </DialogPortal>
));
DialogContent.displayName = DialogPrimitive.Content.displayName;

const Sheet = DialogPrimitive.Root;
const SheetPortal = DialogPrimitive.Portal;
const SheetOverlay = React.forwardRef<React.ElementRef<typeof DialogPrimitive.Overlay>, React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay className={cn("fixed inset-0 z-40 bg-black/60 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0", className)} {...props} ref={ref} />
));
SheetOverlay.displayName = DialogPrimitive.Overlay.displayName;
const SheetContent = React.forwardRef<React.ElementRef<typeof DialogPrimitive.Content>, React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>>(({ className, children, ...props }, ref) => (
  <SheetPortal>
    <SheetOverlay />
    <DialogPrimitive.Content ref={ref} className={cn("fixed z-50 bg-background/95 backdrop-blur-2xl shadow-2xl transition ease-in-out data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:duration-300 data-[state=open]:duration-500 inset-x-0 bottom-0 border-t border-accent-blue/10 rounded-t-[32px] max-h-[85vh] overflow-hidden data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom flex flex-col xl:inset-y-0 xl:right-0 xl:left-auto xl:h-full xl:w-[450px] xl:border-l xl:border-t-0 xl:rounded-none xl:data-[state=closed]:slide-out-to-right xl:data-[state=open]:slide-in-from-right", className)} {...props}>
      {children}
    </DialogPrimitive.Content>
  </SheetPortal>
));
SheetContent.displayName = DialogPrimitive.Content.displayName;

// --- Components ---
function AnimatedCounter({ value }: { value: number }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });
  const springValue = useSpring(0, { duration: 2500, bounce: 0 });
  const [display, setDisplay] = useState(0);

  useEffect(() => { if (isInView) springValue.set(value); }, [isInView, value, springValue]);
  useEffect(() => springValue.on("change", (latest) => setDisplay(Math.round(latest))), [springValue]);

  return <span ref={ref}>{display}</span>;
}

function DragScrollContainer({ children, className }: { children: React.ReactNode, className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const startX = useRef(0);
  const scrollLeft = useRef(0);

  const onMouseDown = (e: React.MouseEvent) => {
    if (!ref.current) return;
    setIsDragging(true);
    startX.current = e.pageX - ref.current.offsetLeft;
    scrollLeft.current = ref.current.scrollLeft;
  };

  const onMouseLeave = () => setIsDragging(false);
  const onMouseUp = () => setIsDragging(false);

  const onMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !ref.current) return;
    e.preventDefault();
    const x = e.pageX - ref.current.offsetLeft;
    const walk = (x - startX.current) * 2;
    ref.current.scrollLeft = scrollLeft.current - walk;
  };

  return (
    <div
      ref={ref}
      onMouseDown={onMouseDown}
      onMouseLeave={onMouseLeave}
      onMouseUp={onMouseUp}
      onMouseMove={onMouseMove}
      className={cn("cursor-grab active:cursor-grabbing", className, isDragging ? "[&_*]:pointer-events-none" : "")}
    >
      {children}
    </div>
  );
}

export default function StrukturPage() {
  const [data, setData] = useState<StructureData | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProfile, setSelectedProfile] = useState<StructureLeader | null>(null);
  const [selectedDept, setSelectedDept] = useState<Department | null>(null);
  const [isDeptDrawerOpen, setIsDeptDrawerOpen] = useState(false);

  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, align: 'center', skipSnaps: false }, [
    Autoplay({ delay: 4000, stopOnInteraction: true, stopOnMouseEnter: true })
  ]);
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    if (!emblaApi) return;
    emblaApi.on("select", () => setSelectedIndex(emblaApi.selectedScrollSnap()));
  }, [emblaApi]);

  useEffect(() => {
    PublicApiService.getStructure().then((res) => {
      if (res?.data) setData(res.data);
      setLoading(false);
    }).catch((err) => {
      console.error(err);
      setLoading(false);
    });
  }, []);

  const bpi = data?.bpi || [];
  const departments = data?.departments || [];
  const members = data?.members || [];

  const ketua = bpi.find((u) => u.roleSlug === "kabem" || u.roleSlug === "super-admin");
  const wakil = bpi.find((u) => u.roleSlug === "wakabem");
  const sekretarisList = bpi.filter((u) => u.roleSlug?.includes("sekretaris"));
  const bendaharaList = bpi.filter((u) => u.roleSlug?.includes("bendahara"));

  const getAvatarUrl = (name: string, avatar?: string) => {
    if (!avatar) return null;
    if (avatar.startsWith("/")) return avatar.split("/").map(s => encodeURIComponent(s)).join("/");
    return avatar;
  };

  const filteredMembers = members.filter(m => m.name.toLowerCase().includes(searchQuery.toLowerCase()) || m.role.toLowerCase().includes(searchQuery.toLowerCase()));

  const BpiCard = ({ profile, title, className }: { profile: StructureLeader | undefined, title: string, className?: string }) => (
    <motion.div 
      whileHover={{ y: -5, scale: 1.02 }}
      onClick={() => { if (profile) setSelectedProfile(profile) }}
      className={cn("relative group cursor-pointer w-full max-w-[260px]", className || "mt-24", profile ? "opacity-100" : "opacity-50")}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-accent-gold/20 to-transparent rounded-[32px] blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      <div className="relative h-full pt-36 pb-10 px-6 rounded-[32px] bg-background/50 backdrop-blur-md border border-accent-blue/15 shadow-[0_15px_40px_-10px_rgba(0,0,0,0.2)] dark:shadow-[0_15px_40px_-10px_rgba(0,0,0,0.5)] group-hover:shadow-[0_25px_50px_-10px_rgba(234,179,8,0.25)] transition-all duration-500 group-hover:border-accent-gold/40 flex flex-col items-center justify-end text-center">
        
        {/* 3D Pop-out Avatar */}
        <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-32 h-48 flex items-end justify-center z-10 transition-all duration-500 group-hover:-translate-y-4">
          {/* Frame Background */}
          <div className="absolute bottom-0 w-32 h-36 rounded-[1.5rem] bg-slate-100 dark:bg-slate-800 border-[6px] border-background shadow-[0_20px_40px_-5px_rgba(0,0,0,0.3)] dark:shadow-[0_20px_40px_-5px_rgba(0,0,0,0.6)]" />
          
          {/* Photo (Taller than frame) */}
          {profile && getAvatarUrl(profile.name, profile.avatar) ? (
            <Image src={getAvatarUrl(profile.name, profile.avatar)!} alt={profile.name} width={128} height={192} className="relative z-10 w-full h-[110%] object-cover object-bottom rounded-b-[1.2rem] drop-shadow-2xl transition-transform duration-500 group-hover:scale-110 origin-bottom" />
          ) : (
            <User className="relative z-10 w-12 h-12 text-accent-blue mb-10" />
          )}
        </div>

        <h4 className="text-base font-extrabold text-foreground leading-tight mt-2">{profile?.name || "Belum Ditentukan"}</h4>
        <p className="text-[11px] text-accent-gold font-bold uppercase tracking-wider mt-1.5">{title}</p>
      </div>
    </motion.div>
  );

  if (loading) {
    return (
      <main className="min-h-screen pt-32 pb-16 px-6 flex items-center justify-center">
        <div className="flex flex-col items-center gap-6 animate-pulse">
          <div className="w-16 h-16 border-4 border-accent-gold/30 border-t-accent-gold rounded-full animate-spin" />
          <p className="text-sm font-semibold text-foreground/50 tracking-widest uppercase">Memuat Struktur...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen pb-24 relative overflow-hidden">
      <div className="fixed inset-0 pointer-events-none -z-10 bg-[radial-gradient(ellipse_at_top_right,rgba(234,179,8,0.05),transparent_50%),radial-gradient(ellipse_at_bottom_left,rgba(16,185,129,0.05),transparent_50%)]" />

      {/* Hero Section */}
      <section className="pt-32 pb-16 px-6 max-w-7xl mx-auto text-center relative">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <Breadcrumbs items={[{ label: "Sinergi Kabinet", isCurrent: true }]} />
          <h1 className="mt-8 text-4xl md:text-6xl font-extrabold text-foreground tracking-tight leading-tight">
            Kabinet <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent-gold to-yellow-400">Danadyaksa</span>
          </h1>
          <p className="mt-6 text-sm md:text-base text-foreground/60 max-w-2xl mx-auto leading-relaxed">
            Sinergi taktis dan inklusif antar biro dan departemen untuk mewujudkan Fakultas Teknik UNESA yang adaptif, inovatif, dan berdaya saing global.
          </p>
        </motion.div>
        
        {/* Animated Stats */}
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2, duration: 0.6 }} className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto">
          {[
            { label: "Departemen", value: departments.length },
            { label: "BPI", value: bpi.length },
            { label: "Fungsionaris", value: members.length + bpi.length },
          ].map((stat, i) => (
            <div key={i} className="p-6 rounded-[24px] bg-background/40 backdrop-blur-md border border-accent-blue/10 text-center shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)] dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]">
              <h3 className="text-3xl md:text-4xl font-extrabold text-foreground"><AnimatedCounter value={stat.value} /></h3>
              <p className="text-[10px] md:text-xs font-semibold text-foreground/50 uppercase tracking-widest mt-2">{stat.label}</p>
            </div>
          ))}
        </motion.div>
      </section>

      {/* BPI Hierarchy */}
      <section className="py-20 px-6 max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-2xl md:text-3xl font-extrabold text-foreground tracking-tight">Badan Pengurus Inti</h2>
        </div>
        
        <div className="flex flex-col items-center">
          <div className="flex flex-col md:flex-row gap-8 justify-center items-start w-full z-10">
            <BpiCard profile={ketua} title="Ketua BEM" className="mt-16 md:mt-8" />
            <div className="hidden md:block w-16 h-px bg-accent-blue/30 md:mt-48" />
            <div className="md:hidden w-px h-8 bg-accent-blue/30" />
            <BpiCard profile={wakil} title="Wakil Ketua BEM" className="mt-0 md:mt-24" />
          </div>
          
          <div className="w-px h-12 bg-accent-blue/30 z-0" />
          <div className="w-full max-w-[600px] h-px bg-accent-blue/30 z-0" />
          <div className="flex justify-between w-full max-w-[600px]">
            <div className="w-px h-8 bg-accent-blue/30" />
            <div className="w-px h-8 bg-accent-blue/30" />
          </div>

          <div className="flex flex-col md:flex-row gap-8 justify-between w-full max-w-[800px] z-10">
            <div className="flex flex-col gap-4 items-center">
              {sekretarisList.length > 0 ? sekretarisList.map(s => <BpiCard key={s._id} profile={s} title={s.role} />) : <BpiCard profile={undefined} title="Sekretaris" />}
            </div>
            <div className="flex flex-col gap-4 items-center">
              {bendaharaList.length > 0 ? bendaharaList.map(b => <BpiCard key={b._id} profile={b} title={b.role} />) : <BpiCard profile={undefined} title="Bendahara" />}
            </div>
          </div>
        </div>
      </section>

      {/* Carousel */}
      <section className="py-20 mt-10">
        <div className="px-6 max-w-7xl mx-auto mb-12 flex flex-col md:flex-row justify-between items-end gap-6">
          <div>
            <h2 className="text-2xl md:text-3xl font-extrabold text-foreground tracking-tight">Departemen</h2>
            <p className="text-sm text-foreground/60 mt-2">Geser untuk melihat detail seluruh departemen.</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => emblaApi?.scrollPrev()} className="p-3 rounded-full border border-accent-blue/20 bg-background/50 hover:bg-accent-blue/10 hover:border-accent-blue/40 transition-colors text-foreground"><ChevronLeft className="w-5 h-5" /></button>
            <button onClick={() => emblaApi?.scrollNext()} className="p-3 rounded-full border border-accent-blue/20 bg-background/50 hover:bg-accent-blue/10 hover:border-accent-blue/40 transition-colors text-foreground"><ChevronRight className="w-5 h-5" /></button>
          </div>
        </div>

        <div className="overflow-hidden w-full pt-20 -mt-20" ref={emblaRef}>
          <div className="flex touch-pan-y items-end gap-6 px-4 md:px-8">
            {departments.map((dept, index) => {
              const isActive = index === selectedIndex;
              const deptMembers = members.filter(m => m.departmentId === dept._id);
              const head = deptMembers.find(m => m.role.toLowerCase().includes("kepala") || m.role.toLowerCase().includes("kadep") || (m.role.toLowerCase().includes("ketua") && !m.role.toLowerCase().includes("wakil")) || m.role.toLowerCase().includes("menteri"));
              
              return (
                <div key={dept._id} className={cn("flex-[0_0_100%] min-w-0 transition-all duration-700 ease-out px-4 md:px-8", isActive ? "opacity-100 scale-100" : "opacity-0 scale-95")}>
                  <div className="w-full max-w-6xl mx-auto pb-10">
                    <div className={cn("flex flex-col relative group gap-8 md:gap-16 items-center justify-between", index % 2 === 1 ? "md:flex-row-reverse" : "md:flex-row")}>
                      
                      {/* Text Section */}
                      <div className="w-full md:w-5/12 flex flex-col justify-center relative z-10 text-left pt-6 md:pt-0">
                        <span className="text-xs font-bold text-accent-gold tracking-widest uppercase mb-3">{dept.code || dept.slug.replace(/-/g, ' ')}</span>
                        <h3 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-foreground leading-tight mb-4">{dept.name}</h3>
                        <p className="text-sm md:text-base text-foreground/70 leading-relaxed mb-8">
                          {dept.description || "Unit pelaksana teknis program kerja BEM FT UNESA."}
                        </p>
                        <button 
                          onClick={() => { setSelectedDept(dept); setIsDeptDrawerOpen(true); }}
                          className="self-start flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-foreground text-background text-xs font-bold uppercase tracking-wider hover:bg-accent-gold transition-colors"
                        >
                          Lihat Detail Anggota
                          <ArrowUpRight className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Photos Slideshow */}
                      <div className="w-full md:w-7/12 relative z-10 flex overflow-visible">
                        <DragScrollContainer className="flex overflow-x-auto gap-4 pb-6 pt-4 px-2 snap-x [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] mask-linear-fade w-full">
                          
                          {/* Kadep */}
                          {head && (
                              <div className="relative w-40 h-56 md:w-48 md:h-64 shrink-0 flex items-end justify-center z-10 transition-all duration-300 hover:-translate-y-3 hover:z-30 cursor-pointer group/staff snap-start" onClick={(e) => { e.stopPropagation(); setSelectedProfile(head); }}>
                                {getAvatarUrl(head.name, head.avatar) ? (
                                  <Image src={getAvatarUrl(head.name, head.avatar)!} alt={head.name} width={192} height={256} className="relative z-10 w-full h-full object-cover object-center rounded-[24px] shadow-[0_15px_30px_rgba(0,0,0,0.15)] dark:shadow-[0_15px_30px_rgba(0,0,0,0.4)] transition-transform group-hover/staff:scale-[1.03]" />
                                ) : (
                                  <div className="relative z-10 w-full h-full rounded-[24px] bg-slate-200 dark:bg-slate-800 flex items-center justify-center shadow-[0_15px_30px_rgba(0,0,0,0.15)] dark:shadow-[0_15px_30px_rgba(0,0,0,0.4)]">
                                    <User className="w-10 h-10 text-accent-blue" />
                                  </div>
                                )}
                                <div className="absolute inset-x-0 bottom-0 h-3/5 bg-gradient-to-t from-black/90 via-black/40 to-transparent rounded-b-[24px] z-20 flex flex-col items-center justify-end pb-4 px-4 text-center">
                                  <span className="text-[10px] md:text-xs font-bold text-accent-gold tracking-widest uppercase mb-1.5 drop-shadow-md">{head.role}</span>
                                  <span className="text-sm md:text-base font-extrabold text-white tracking-wider truncate w-full drop-shadow-md">{head.name.split(' ')[0]}</span>
                                </div>
                              </div>
                          )}

                          {/* Staf */}
                          {(() => {
                             const staffList = deptMembers.filter(m => m._id !== head?._id);
                             return staffList.map(staff => (
                               <div key={staff._id} className="relative w-32 h-48 md:w-40 md:h-56 shrink-0 flex items-end justify-center z-10 transition-all duration-300 hover:-translate-y-3 hover:z-30 cursor-pointer group/staff snap-start mt-auto" onClick={(e) => { e.stopPropagation(); setSelectedProfile(staff); }}>
                                 {getAvatarUrl(staff.name, staff.avatar) ? (
                                   <Image src={getAvatarUrl(staff.name, staff.avatar)!} alt={staff.name} width={160} height={224} className="relative z-10 w-full h-full object-cover object-center rounded-[20px] shadow-[0_10px_25px_rgba(0,0,0,0.15)] dark:shadow-[0_10px_25px_rgba(0,0,0,0.4)] transition-transform group-hover/staff:scale-[1.03]" />
                                 ) : (
                                 <div className="relative z-10 w-full h-full rounded-[20px] bg-slate-200 dark:bg-slate-800 flex items-center justify-center shadow-[0_10px_25px_rgba(0,0,0,0.15)] dark:shadow-[0_10px_25px_rgba(0,0,0,0.4)]">
                                     <User className="w-8 h-8 text-accent-blue" />
                                   </div>
                                 )}
                                 <div className="absolute inset-x-0 bottom-0 h-3/5 bg-gradient-to-t from-black/90 via-black/40 to-transparent rounded-b-[20px] z-20 flex flex-col items-center justify-end pb-4 px-3 text-center">
                                   <span className="text-[9px] md:text-[10px] font-bold text-foreground/50 tracking-widest uppercase mb-1.5 drop-shadow-md">{staff.role}</span>
                                   <span className="text-xs md:text-sm font-extrabold text-white tracking-wider truncate w-full drop-shadow-md">{staff.name.split(' ')[0]}</span>
                                 </div>
                               </div>
                             ));
                          })()}
                        </DragScrollContainer>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Directory Search */}
      <section className="py-20 px-6 max-w-4xl mx-auto border-t border-accent-blue/10">
        <div className="text-center mb-12">
          <h2 className="text-2xl font-extrabold text-foreground tracking-tight mb-4">Direktori Pengurus</h2>
          <div className="relative max-w-xl mx-auto group">
            <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
              <Search className="w-5 h-5 text-foreground/40 group-focus-within:text-accent-gold transition-colors" />
            </div>
            <input 
              type="text" 
              placeholder="Cari nama atau jabatan pengurus..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-6 py-4 rounded-full bg-background/50 backdrop-blur-md border border-accent-blue/20 shadow-sm focus:border-accent-gold focus:ring-4 focus:ring-accent-gold/10 outline-none text-sm font-medium transition-all"
            />
          </div>
        </div>

        {searchQuery && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {filteredMembers.length > 0 ? filteredMembers.map(member => (
              <div 
                key={member._id} 
                onClick={() => setSelectedProfile(member)}
                className="p-4 rounded-[20px] bg-background/50 backdrop-blur-md border border-accent-blue/10 hover:border-accent-gold/40 shadow-sm hover:shadow-[0_10px_30px_rgba(0,0,0,0.08)] dark:hover:shadow-[0_10px_30px_rgba(0,0,0,0.2)] cursor-pointer transition-all flex items-center gap-4 group"
              >
                <div className="w-14 h-14 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-800 shrink-0 border-4 border-background shadow-[0_5px_15px_rgba(0,0,0,0.1)] dark:shadow-[0_5px_15px_rgba(0,0,0,0.3)] transition-transform group-hover:scale-110">
                  {getAvatarUrl(member.name, member.avatar) ? <Image src={getAvatarUrl(member.name, member.avatar)!} alt={member.name} width={56} height={56} className="w-full h-full object-cover" /> : <User className="w-7 h-7 m-2.5 text-accent-blue" />}
                </div>
                <div className="min-w-0">
                  <h4 className="text-sm font-bold text-foreground truncate">{member.name}</h4>
                  <p className="text-[10px] font-semibold text-accent-gold uppercase tracking-wider truncate mt-0.5">{member.role}</p>
                </div>
              </div>
            )) : (
              <div className="col-span-full text-center py-8 text-foreground/50 text-sm">Tidak ada pengurus yang cocok dengan "{searchQuery}"</div>
            )}
          </div>
        )}
      </section>

      {/* Modals & Drawers */}
      <Dialog open={!!selectedProfile} onOpenChange={(open) => !open && setSelectedProfile(null)}>
        <DialogContent>
          {selectedProfile && (
            <div className="relative w-full rounded-[32px] overflow-hidden bg-background border border-accent-blue/10 shadow-2xl">
              <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-br from-accent-gold/20 via-slate-800/40 to-slate-800/30" />
              <DialogPrimitive.Close className="absolute right-4 top-4 z-10 p-2 rounded-full bg-black/20 text-white hover:bg-black/40 transition-colors backdrop-blur-md focus:outline-none">
                <X className="w-4 h-4" />
              </DialogPrimitive.Close>
              
              <div className="pt-24 px-6 pb-8 flex flex-col items-center relative z-10">
                {/* 3D Pop-out Dialog Avatar */}
                <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-32 h-48 flex items-end justify-center z-10">
                  <div className="absolute bottom-0 w-32 h-36 rounded-[1.5rem] bg-slate-100 dark:bg-slate-800 border-[8px] border-background shadow-2xl" />
                  {getAvatarUrl(selectedProfile.name, selectedProfile.avatar) ? (
                    <Image src={getAvatarUrl(selectedProfile.name, selectedProfile.avatar)!} alt={selectedProfile.name} width={128} height={192} className="relative z-10 w-full h-[110%] object-cover object-bottom rounded-b-[1.2rem] drop-shadow-2xl" />
                  ) : (
                    <User className="relative z-10 w-16 h-16 text-accent-blue mb-10" />
                  )}
                </div>
                
                <h3 className="text-xl font-extrabold text-foreground text-center tracking-tight">{selectedProfile.name}</h3>
                <p className="text-sm font-semibold text-accent-gold mt-1 uppercase tracking-wider">{selectedProfile.role}</p>
                
                <div className="w-full h-px bg-gradient-to-r from-transparent via-accent-blue/20 to-transparent my-6" />
                
                <div className="w-full space-y-4 text-sm text-foreground/80">
                   {selectedProfile.departmentId && (
                     <div className="flex items-center gap-3">
                       <Building className="w-4 h-4 text-accent-gold shrink-0" />
                       <span>{departments.find(d => d._id === selectedProfile.departmentId)?.name || 'Departemen'}</span>
                     </div>
                   )}
                   <div className="flex items-center gap-3">
                     <Mail className="w-4 h-4 text-accent-gold shrink-0" />
                     <span>{selectedProfile.name.toLowerCase().replace(/\s+/g, '')}@mhs.unesa.ac.id</span>
                   </div>
                   <div className="flex items-center gap-4 justify-center mt-6 pt-4">
                     <button className="p-2.5 rounded-full bg-slate-100 dark:bg-slate-800/50 text-foreground/60 hover:text-accent-gold transition-colors"><Instagram className="w-4 h-4" /></button>
                     <button className="p-2.5 rounded-full bg-slate-100 dark:bg-slate-800/50 text-foreground/60 hover:text-accent-gold transition-colors"><Linkedin className="w-4 h-4" /></button>
                     <button className="p-2.5 rounded-full bg-slate-100 dark:bg-slate-800/50 text-foreground/60 hover:text-accent-gold transition-colors"><Twitter className="w-4 h-4" /></button>
                   </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Sheet open={isDeptDrawerOpen} onOpenChange={setIsDeptDrawerOpen}>
        <SheetContent>
          {selectedDept && (
            <>
              <div className="p-6 border-b border-accent-blue/10 flex items-center justify-between bg-background/50 backdrop-blur-md shrink-0">
                <div>
                  <p className="text-[10px] font-bold text-accent-gold uppercase tracking-widest">{selectedDept.code || selectedDept.slug.replace(/-/g, ' ')}</p>
                  <h3 className="text-xl font-extrabold text-foreground mt-1">{selectedDept.name}</h3>
                </div>
                <DialogPrimitive.Close className="p-2 rounded-full bg-slate-100 dark:bg-slate-800/50 hover:bg-slate-200 dark:hover:bg-slate-800 text-foreground/60 hover:text-foreground transition-colors focus:outline-none">
                  <X className="w-5 h-5" />
                </DialogPrimitive.Close>
              </div>
              
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                <div className="space-y-3">
                  <h4 className="text-xs font-semibold text-foreground/40 uppercase tracking-widest">Kepala Departemen</h4>
                  {(() => {
                    const head = members.find(m => m.departmentId === selectedDept._id && (m.role.toLowerCase().includes("kepala") || m.role.toLowerCase().includes("kadep") || (m.role.toLowerCase().includes("ketua") && !m.role.toLowerCase().includes("wakil")) || m.role.toLowerCase().includes("menteri")));
                    if (!head) return <p className="text-sm text-foreground/50">Belum ditentukan.</p>;
                    return (
                      <div onClick={() => setSelectedProfile(head)} className="p-4 rounded-2xl bg-foreground/5 border border-accent-blue/10 hover:border-accent-gold/40 cursor-pointer flex items-center gap-4 transition-all group hover:shadow-[0_10px_30px_rgba(0,0,0,0.05)] dark:hover:shadow-[0_10px_30px_rgba(0,0,0,0.2)]">
                        <div className="w-14 h-14 rounded-xl overflow-hidden bg-foreground/10 shrink-0 border-4 border-background shadow-[0_5px_15px_rgba(0,0,0,0.1)] transition-transform group-hover:scale-110">
                          {getAvatarUrl(head.name, head.avatar) ? <Image src={getAvatarUrl(head.name, head.avatar)!} alt={head.name} width={56} height={56} className="w-full h-full object-cover" /> : <User className="w-7 h-7 m-2.5 text-accent-blue" />}
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-sm font-bold text-foreground truncate">{head.name}</h4>
                          <p className="text-[10px] text-accent-gold uppercase tracking-wider font-semibold mt-0.5 truncate">{head.role}</p>
                        </div>
                      </div>
                    )
                  })()}
                </div>

                <div className="space-y-3">
                  <h4 className="text-xs font-semibold text-foreground/40 uppercase tracking-widest">Staf Departemen</h4>
                  <div className="grid grid-cols-1 gap-3">
                    {(() => {
                      const head = members.find(m => m.departmentId === selectedDept._id && (m.role.toLowerCase().includes("kepala") || m.role.toLowerCase().includes("kadep") || (m.role.toLowerCase().includes("ketua") && !m.role.toLowerCase().includes("wakil")) || m.role.toLowerCase().includes("menteri")));
                      const staffList = members.filter(m => m.departmentId === selectedDept._id && m._id !== head?._id);
                      if (staffList.length === 0) return <p className="text-sm text-foreground/50">Belum ada staf terdaftar.</p>;
                      return staffList.map(staff => (
                        <div key={staff._id} onClick={() => setSelectedProfile(staff)} className="p-4 rounded-[20px] bg-background border border-accent-blue/10 hover:border-accent-gold/40 cursor-pointer flex items-center gap-4 transition-all group hover:shadow-[0_8px_25px_rgba(0,0,0,0.05)] dark:hover:shadow-[0_8px_25px_rgba(0,0,0,0.2)]">
                          <div className="w-12 h-12 rounded-xl overflow-hidden bg-foreground/5 shrink-0 border-4 border-background shadow-[0_4px_12px_rgba(0,0,0,0.08)] transition-transform group-hover:scale-110">
                            {getAvatarUrl(staff.name, staff.avatar) ? <Image src={getAvatarUrl(staff.name, staff.avatar)!} alt={staff.name} width={48} height={48} className="w-full h-full object-cover" /> : <User className="w-6 h-6 m-2 text-accent-blue" />}
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-sm font-bold text-foreground truncate">{staff.name}</h4>
                            <p className="text-[10px] text-foreground/50 uppercase tracking-wider font-semibold mt-0.5 truncate">{staff.role}</p>
                          </div>
                        </div>
                      ))
                    })()}
                  </div>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </main>
  );
}
