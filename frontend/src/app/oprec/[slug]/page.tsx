"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { PublicApiService, RecruitmentItem } from "@/lib/api";
import { Users, ArrowLeft, Calendar, CheckCircle2, LayoutList, ExternalLink, ShieldCheck, Phone } from "lucide-react";

export default function OprecDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [recruitment, setRecruitment] = useState<RecruitmentItem | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecruitment = async () => {
      try {
        const res = await PublicApiService.getRecruitmentBySlug(params.slug as string);
        const resData = res?.data as unknown;
        const data = (resData as {data?: RecruitmentItem})?.data || resData || res;
        if (data && typeof data === 'object' && '_id' in data) {
          setRecruitment(data as RecruitmentItem);
        } else {
          router.push("/oprec");
        }
      } catch (err) {
        console.error(err);
        router.push("/oprec");
      } finally {
        setLoading(false);
      }
    };
    
    if (params.slug) fetchRecruitment();
  }, [params.slug, router]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center pt-28">Memuat rekrutmen...</div>;
  }

  if (!recruitment) return null;

  const isOpen = recruitment.status === "open" && new Date(recruitment.closeDate) >= new Date();

  return (
    <main className="pt-28 pb-16 px-6 max-w-6xl mx-auto w-full relative min-h-screen">
      <div className="absolute top-[10%] right-0 w-[500px] h-[500px] rounded-full bg-accent-gold/5 blur-[120px] pointer-events-none -z-10" />

      <Breadcrumbs 
        items={[
          { label: "Rekrutmen", path: "/oprec" },
          { label: recruitment.title, isCurrent: true }
        ]} 
      />

      <Link 
        href="/oprec"
        className="inline-flex items-center text-xs font-bold text-accent-blue uppercase tracking-wider hover:text-accent-gold transition-colors mb-8 mt-6"
      >
        <ArrowLeft className="w-3.5 h-3.5 mr-2" />
        Kembali ke Daftar Rekrutmen
      </Link>

      <div className="flex flex-col lg:flex-row gap-12 items-start">
        {/* Left Column: Poster & CTA */}
        <div className="w-full lg:w-1/3 shrink-0 flex flex-col gap-6 sticky top-28">
          <div className="relative aspect-[3/4] rounded-3xl overflow-hidden bg-slate-800/20 border border-accent-blue/15 shadow-xl shadow-black/20">
            {recruitment.poster ? (
              <Image 
                src={typeof recruitment.poster === 'string' ? recruitment.poster : recruitment.poster.url} 
                alt={recruitment.title}
                fill
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-accent-blue/30 p-6 text-center">
                <Users className="w-16 h-16 mb-4" />
                <span className="text-sm font-medium">Poster tidak tersedia</span>
              </div>
            )}
          </div>

          <div className="glass-subtle p-6 rounded-2xl border border-accent-blue/15 flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-accent-gold shrink-0" />
              <div>
                <span className="block text-[10px] uppercase tracking-wider font-bold text-accent-blue">Masa Pendaftaran</span>
                <span className="text-sm font-medium text-foreground block">
                  {new Date(recruitment.openDate).toLocaleDateString("id-ID", { day: "numeric", month: "short" })} - {new Date(recruitment.closeDate).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                </span>
              </div>
            </div>

            {recruitment.contactPerson && (
              <div className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-accent-gold shrink-0" />
                <div>
                  <span className="block text-[10px] uppercase tracking-wider font-bold text-accent-blue">Narahubung</span>
                  <span className="text-sm font-medium text-foreground block">
                    {recruitment.contactPerson} {recruitment.contactWhatsapp && `(${recruitment.contactWhatsapp})`}
                  </span>
                </div>
              </div>
            )}

            <div className="mt-4 pt-4 border-t border-accent-blue/15">
              {isOpen && recruitment.formUrl ? (
                <a 
                  href={recruitment.formUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full bg-accent-gold hover:bg-yellow-400 text-slate-900 px-6 py-3.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-lg text-center"
                >
                  Isi Formulir Pendaftaran <ExternalLink className="w-4 h-4" />
                </a>
              ) : (
                <button 
                  disabled
                  className="w-full bg-accent-blue/10 text-accent-blue/60 px-6 py-3.5 rounded-xl text-sm font-bold cursor-not-allowed text-center border border-accent-blue/20"
                >
                  Pendaftaran {recruitment.status === "draft" ? "Belum Dibuka" : "Sudah Ditutup"}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Details */}
        <div className="flex-1 flex flex-col gap-10">
          <section>
            {recruitment.period && (
              <span className="text-sm font-bold text-accent-gold uppercase tracking-widest mb-2 block">
                Periode {recruitment.period}
              </span>
            )}
            <h1 className="text-3xl md:text-5xl font-extrabold text-foreground tracking-tight mb-6 leading-tight">
              {recruitment.title}
            </h1>
            
            <div className="prose prose-invert prose-p:text-foreground/80 prose-p:leading-relaxed max-w-none">
              <p>{recruitment.description}</p>
            </div>
          </section>

          {/* Positions */}
          {recruitment.positions && recruitment.positions.length > 0 && (
            <section>
              <h2 className="flex items-center gap-2 text-xl font-bold text-foreground mb-6 pb-2 border-b border-accent-blue/15">
                <ShieldCheck className="w-5 h-5 text-accent-gold" />
                Posisi / Divisi yang Dibutuhkan
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {recruitment.positions.map((pos, idx: number) => (
                  <div key={idx} className="glass-active border border-accent-blue/20 p-5 rounded-2xl hover:border-accent-gold/30 transition-all">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-bold text-foreground">{pos.title}</h3>
                      {pos.quota && (
                        <span className="text-xs bg-accent-gold/20 text-accent-gold px-2 py-0.5 rounded-full font-bold">
                          {pos.quota} Orang
                        </span>
                      )}
                    </div>
                    {pos.description && (
                      <p className="text-xs text-foreground/70 mb-3">{pos.description}</p>
                    )}
                    {pos.requirements && (
                      <div className="mt-3 pt-3 border-t border-accent-blue/10">
                        <span className="text-[10px] uppercase font-bold text-accent-blue tracking-wider block mb-1">Persyaratan Khusus</span>
                        <p className="text-xs text-foreground/80 whitespace-pre-line">{pos.requirements}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Timeline */}
          {recruitment.timeline && recruitment.timeline.length > 0 && (
            <section>
              <h2 className="flex items-center gap-2 text-xl font-bold text-foreground mb-6 pb-2 border-b border-accent-blue/15">
                <LayoutList className="w-5 h-5 text-accent-gold" />
                Alur & Linimasa Rekrutmen
              </h2>
              
              <div className="relative pl-6 space-y-8 before:absolute before:inset-0 before:ml-[11px] before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-accent-blue/20 before:to-transparent">
                {recruitment.timeline
                  .sort((a, b) => (Number(a.order) || 0) - (Number(b.order) || 0))
                  .map((item, idx: number) => {
                  const isCurrent = new Date() >= new Date(item.startDate) && (!item.endDate || new Date() <= new Date(item.endDate));
                  const isPast = item.endDate && new Date() > new Date(item.endDate);
                  
                  return (
                    <div key={idx} className="relative flex items-start gap-6">
                      <div className={`absolute -left-6 md:left-1/2 w-6 h-6 rounded-full flex items-center justify-center transform md:-translate-x-1/2 z-10 
                        ${isCurrent ? 'bg-accent-gold text-slate-900 ring-4 ring-accent-gold/20' : 
                          isPast ? 'bg-accent-blue text-slate-900' : 'bg-slate-800 border border-accent-blue/30 text-accent-blue'}`}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      </div>
                      
                      <div className="md:w-1/2 md:pr-12 md:text-right md:ml-auto md:order-1 hidden md:block">
                        {item.startDate && (
                          <div className={`text-xs font-bold uppercase tracking-wider mb-1 ${isCurrent ? 'text-accent-gold' : 'text-accent-blue'}`}>
                            {new Date(item.startDate).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}
                            {item.endDate && ` - ${new Date(item.endDate).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}`}
                          </div>
                        )}
                      </div>

                      <div className="flex-1 md:w-1/2 md:pl-12 pt-0.5">
                        <div className={`text-xs font-bold uppercase tracking-wider mb-1 md:hidden ${isCurrent ? 'text-accent-gold' : 'text-accent-blue'}`}>
                          {item.startDate && new Date(item.startDate).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}
                          {item.endDate && ` - ${new Date(item.endDate).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}`}
                        </div>
                        <h3 className={`font-bold text-lg mb-1 ${isCurrent ? 'text-foreground' : 'text-foreground/80'}`}>
                          {item.label}
                        </h3>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

        </div>
      </div>
    </main>
  );
}
