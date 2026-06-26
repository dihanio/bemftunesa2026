"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { PublicApiService } from "@/lib/api";
import { ImageIcon, Calendar, ArrowRight, Search } from "lucide-react";

export default function GaleriPage() {
  const [albums, setAlbums] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const fetchGallery = async () => {
      setLoading(true);
      try {
        const res = await PublicApiService.getGallery({ search: searchQuery || undefined });
        setAlbums(res.data.data.data || res.data.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    
    // Add debounce for search
    const timer = setTimeout(() => {
      fetchGallery();
    }, 500);
    
    return () => clearTimeout(timer);
  }, [searchQuery]);

  return (
    <main className="pt-28 pb-16 px-6 max-w-6xl mx-auto w-full relative min-h-screen">
      <div className="absolute top-[10%] left-0 w-[500px] h-[500px] rounded-full bg-accent-gold/5 blur-[120px] pointer-events-none -z-10" />

      <Breadcrumbs items={[{ label: "Galeri Kegiatan", isCurrent: true }]} />

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 mt-6">
        <div>
          <span className="text-xs font-semibold text-sage uppercase tracking-wide block mb-3">Dokumentasi</span>
          <h1 className="text-4xl md:text-5xl font-extrabold text-foreground tracking-tight">
            Galeri <span className="text-accent-gold">Kegiatan</span>
          </h1>
          <p className="text-sm text-foreground/75 mt-4 max-w-xl leading-relaxed">
            Kumpulan potret dokumentasi dan memori perjalanan Kabinet Danadyaksa dalam berbagai program kerja dan acara Fakultas Teknik UNESA.
          </p>
        </div>

        <div className="relative w-full md:w-72">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-sage/50" />
          <input
            type="text"
            placeholder="Cari album..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-green/10 border border-sage/20 rounded-full py-2.5 pl-10 pr-4 text-sm text-foreground focus:outline-none focus:border-accent-gold/50 focus:ring-1 focus:ring-accent-gold/50 transition-all placeholder:text-sage/50"
          />
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="animate-pulse flex flex-col gap-3">
              <div className="w-full aspect-[4/3] bg-sage/10 rounded-3xl" />
              <div className="h-5 bg-sage/10 rounded-md w-3/4 mt-2" />
              <div className="h-4 bg-sage/10 rounded-md w-1/2" />
            </div>
          ))}
        </div>
      ) : albums.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {albums.map((album: any) => (
            <Link 
              href={`/galeri/${album.slug}`} 
              key={album._id}
              className="group block"
            >
              <div className="glass-active border border-sage/20 rounded-3xl overflow-hidden hover:border-accent-gold/30 transition-all duration-300 h-full flex flex-col">
                <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-green/20">
                  {album.coverImage ? (
                    <Image 
                      src={typeof album.coverImage === 'string' ? album.coverImage : album.coverImage.url} 
                      alt={album.title}
                      fill
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-sage/30">
                      <ImageIcon className="w-12 h-12" />
                    </div>
                  )}
                  <div className="absolute top-4 right-4 bg-background/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-sage/20 text-[10px] font-bold text-foreground flex items-center gap-1.5">
                    <ImageIcon className="w-3 h-3 text-accent-gold" />
                    {album.photos?.length || 0} Foto
                  </div>
                </div>
                <div className="p-6 flex flex-col flex-1">
                  <div className="flex items-center gap-2 text-xs text-foreground/50 mb-3 font-medium">
                    <Calendar className="w-3.5 h-3.5" />
                    {new Date(album.eventDate).toLocaleDateString("id-ID", {
                      day: "numeric", month: "long", year: "numeric"
                    })}
                  </div>
                  <h3 className="text-lg font-bold text-foreground mb-2 group-hover:text-accent-gold transition-colors line-clamp-2">
                    {album.title}
                  </h3>
                  <p className="text-sm text-foreground/70 line-clamp-2 mb-4 flex-1">
                    {album.description}
                  </p>
                  
                  <div className="flex items-center text-xs font-bold text-accent-gold uppercase tracking-wider group-hover:gap-2 transition-all">
                    Lihat Album <ArrowRight className="w-3.5 h-3.5 ml-1" />
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 glass-subtle border border-sage/15 rounded-3xl">
          <ImageIcon className="w-12 h-12 text-sage/30 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-foreground">Tidak Ada Album</h3>
          <p className="text-sm text-foreground/60 mt-1 max-w-md mx-auto">
            Belum ada dokumentasi galeri yang dipublikasikan atau sesuai dengan kata kunci pencarian Anda.
          </p>
        </div>
      )}
    </main>
  );
}
