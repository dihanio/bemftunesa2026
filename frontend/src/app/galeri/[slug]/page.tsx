"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { PublicApiService } from "@/lib/api";
import { Calendar, ArrowLeft, MapPin, Download, X } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export default function AlbumDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [album, setAlbum] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  useEffect(() => {
    const fetchAlbum = async () => {
      try {
        const res = await PublicApiService.getGalleryBySlug(params.slug as string);
        const albumData = res?.data?.data || res?.data || res;
        if (albumData && albumData._id) {
          setAlbum(albumData);
        } else {
          router.push("/galeri");
        }
      } catch (err) {
        console.error(err);
        router.push("/galeri");
      } finally {
        setLoading(false);
      }
    };
    
    if (params.slug) fetchAlbum();
  }, [params.slug, router]);

  // Handle escape key to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelectedPhoto(null);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center pt-28">Memuat album...</div>;
  }

  if (!album) return null;

  return (
    <main className="pt-28 pb-16 px-6 max-w-6xl mx-auto w-full relative min-h-screen">
      <div className="absolute top-[10%] right-0 w-[500px] h-[500px] rounded-full bg-accent-gold/5 blur-[120px] pointer-events-none -z-10" />

      <Breadcrumbs 
        items={[
          { label: "Galeri", path: "/galeri" },
          { label: album.title, isCurrent: true }
        ]} 
      />

      <Link 
        href="/galeri"
        className="inline-flex items-center text-xs font-bold text-accent-blue uppercase tracking-wider hover:text-accent-gold transition-colors mb-8 mt-6"
      >
        <ArrowLeft className="w-3.5 h-3.5 mr-2" />
        Kembali ke Galeri
      </Link>

      <div className="mb-12">
        <h1 className="text-3xl md:text-5xl font-extrabold text-foreground tracking-tight mb-4">
          {album.title}
        </h1>
        
        <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-foreground/60 mb-6">
          <div className="flex items-center bg-slate-800/10 border border-accent-blue/20 rounded-full px-3 py-1">
            <Calendar className="w-3.5 h-3.5 mr-1.5" />
            {new Date(album.eventDate).toLocaleDateString("id-ID", {
              day: "numeric", month: "long", year: "numeric"
            })}
          </div>
          
          {album.location && (
            <div className="flex items-center bg-slate-800/10 border border-accent-blue/20 rounded-full px-3 py-1">
              <MapPin className="w-3.5 h-3.5 mr-1.5" />
              {album.location}
            </div>
          )}
        </div>
        
        {album.description && (
          <p className="text-sm text-foreground/80 leading-relaxed max-w-3xl glass-subtle p-5 rounded-2xl border border-accent-blue/15">
            {album.description}
          </p>
        )}
      </div>

      {album.photos && album.photos.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {album.photos.map((photo: any, index: number) => {
            const imgUrl = typeof photo === 'string' ? photo : (photo.url || photo.mediaId?.url);
            if (!imgUrl) return null;
            
            return (
              <div 
                key={index}
                onClick={() => setSelectedPhoto(imgUrl)}
                className="group relative aspect-square rounded-2xl overflow-hidden cursor-pointer bg-slate-800/20 border border-accent-blue/15 hover:border-accent-gold/40 transition-all"
              >
                <Image 
                  src={imgUrl} 
                  alt={`Photo ${index + 1}`}
                  fill
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                  <div className="opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-300">
                    <span className="bg-background/80 backdrop-blur-sm text-foreground text-xs font-bold px-3 py-1.5 rounded-full">
                      Perbesar
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-16 bg-slate-800/5 border border-accent-blue/15 rounded-3xl">
          <p className="text-sm text-foreground/60">Tidak ada foto dalam album ini.</p>
        </div>
      )}

      {/* Fullscreen Photo Modal */}
      {selectedPhoto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <button 
            onClick={() => setSelectedPhoto(null)}
            className="absolute top-6 right-6 text-white/50 hover:text-white bg-white/10 hover:bg-white/20 p-2 rounded-full transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
          
          <Image 
            src={selectedPhoto} 
            alt="Fullscreen view" 
            width={1200}
            height={800}
            className="max-w-full max-h-[90vh] object-contain rounded-lg"
          />
          
          <a 
            href={selectedPhoto}
            target="_blank"
            rel="noopener noreferrer"
            download
            className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-accent-gold text-slate-900 font-bold text-sm px-6 py-3 rounded-full hover:bg-yellow-400 transition-colors shadow-lg"
          >
            <Download className="w-4 h-4" />
            Unduh Foto
          </a>
        </div>
      )}
    </main>
  );
}
