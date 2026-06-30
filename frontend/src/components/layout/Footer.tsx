import Link from "next/link";
import { Mail, Phone, MapPin, Instagram, Youtube, Globe } from "lucide-react";
import Image from "next/image";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full relative bg-slate-green/50 border-t border-sage/10 overflow-hidden pt-16 pb-10 z-10 rounded-t-[2.5rem] md:rounded-t-[3rem]">
      {/* Background Glow */}
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] rounded-full bg-accent-blue/5 blur-[100px] pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
        {/* Branding & Bio */}
        <div className="flex flex-col gap-6 md:col-span-1">
          <Link href="/" className="flex items-center gap-3.5 group">
            <Image src="/images/logo-bemft.png" alt="Logo BEM FT" width={40} height={40} className="object-contain drop-shadow-md transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3 shrink-0" />
            <div className="flex flex-col justify-center items-start">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent-gold via-yellow-400 to-accent-gold font-extrabold text-base tracking-[0.10em] leading-none mb-1">
                BEM FT UNESA
              </span>
              <span className="text-[9px] font-bold text-foreground/60 tracking-[0.15em] uppercase">
                Kabinet Danadyaksa
              </span>
            </div>
          </Link>
          <p className="text-xs text-foreground/70 leading-relaxed max-w-xs">
            Badan Eksekutif Mahasiswa Fakultas Teknik Universitas Negeri Surabaya. Wadah kolaborasi, pergerakan, dan pengabdian mahasiswa teknik.
          </p>
          <span className="text-[10px] text-foreground/40 leading-relaxed mt-2 block">Kabinet Danadyaksa · Fakultas Teknik, Ketintang, Surabaya</span>
        </div>

        {/* Quick Links */}
        <div className="flex flex-col gap-5">
          <h4 className="text-xs font-semibold uppercase tracking-wide text-sage">Peta Situs</h4>
          <ul className="flex flex-col gap-3">
            <li>
              <Link href="/" className="text-xs text-foreground/75 hover:text-accent-gold transition-colors">Beranda</Link>
            </li>
            <li>
              <Link href="/tentang" className="text-xs text-foreground/75 hover:text-accent-gold transition-colors">Tentang BEM FT</Link>
            </li>
            <li>
              <Link href="/struktur" className="text-xs text-foreground/75 hover:text-accent-gold transition-colors">Struktur Kabinet</Link>
            </li>
            <li>
              <Link href="/berita" className="text-xs text-foreground/75 hover:text-accent-gold transition-colors">Portal Berita</Link>
            </li>
          </ul>
        </div>

        {/* Advokasi & Layanan */}
        <div className="flex flex-col gap-5">
          <h4 className="text-xs font-semibold uppercase tracking-wide text-sage">Layanan & Advokasi</h4>
          <ul className="flex flex-col gap-3">
            <li>
              <Link href="/aspirasi" className="text-xs text-foreground/75 hover:text-accent-gold transition-colors">Kirim Aspirasi</Link>
            </li>
            <li>
              <Link href="/aspirasi" className="text-xs text-foreground/75 hover:text-accent-gold transition-colors">Lacak Pengaduan</Link>
            </li>
            <li>
              <Link href="/kontak" className="text-xs text-foreground/75 hover:text-accent-gold transition-colors">Pusat Bantuan & FAQ</Link>
            </li>
            <li>
              <a href="https://unesa.ac.id" target="_blank" rel="noopener noreferrer" className="text-xs text-foreground/75 hover:text-accent-gold transition-colors">Website UNESA</a>
            </li>
          </ul>
        </div>

        {/* Kontak Sekretariat */}
        <div className="flex flex-col gap-5">
          <h4 className="text-xs font-semibold uppercase tracking-wide text-sage">Sekretariat</h4>
          <ul className="flex flex-col gap-3.5">
            <li className="flex gap-3 items-start">
              <MapPin className="w-4 h-4 text-sage shrink-0 mt-0.5" />
              <span className="text-xs text-foreground/70 leading-relaxed">
                Gedung A1 Lantai 2, Kampus Ketintang, Fakultas Teknik, UNESA, Surabaya 60231
              </span>
            </li>
            <li className="flex gap-3 items-center">
              <Mail className="w-4 h-4 text-sage shrink-0" />
              <a href="mailto:bemft@unesa.ac.id" className="text-xs text-foreground/75 hover:text-accent-gold transition-colors">
                bemft@unesa.ac.id
              </a>
            </li>
            <li className="flex gap-3 items-center">
              <Phone className="w-4 h-4 text-sage shrink-0" />
              <span className="text-xs text-foreground/70">
                +62 821-3456-7890 (Humas)
              </span>
            </li>
          </ul>
        </div>
      </div>

      {/* Socials & Copyright */}
      <div className="max-w-7xl mx-auto px-6 pt-8 border-t border-sage/10 flex flex-col md:flex-row items-center justify-between gap-6">
        <span className="text-[10px] text-foreground/60">
          &copy; {currentYear} BEM FT UNESA. All rights reserved. Developed by <Link href={process.env.NEXT_PUBLIC_IMS_URL ? `${process.env.NEXT_PUBLIC_IMS_URL}/login` : "#"} className="cursor-default hover:text-foreground/70 transition-colors">Nio.</Link>
        </span>

        {/* Social Icons */}
        <div className="flex items-center gap-5">
          <a
            href="https://instagram.com/bemftunesa"
            target="_blank"
            rel="noopener noreferrer"
            className="w-8 h-8 rounded-lg bg-slate-green/70 hover:bg-foliage/20 border border-sage/10 hover:border-accent-gold flex items-center justify-center text-foreground/60 hover:text-accent-gold transition-all duration-300"
            aria-label="Instagram BEM FT UNESA"
          >
            <Instagram className="w-4 h-4" />
          </a>
          <a
            href="https://youtube.com/bemftunesa"
            target="_blank"
            rel="noopener noreferrer"
            className="w-8 h-8 rounded-lg bg-slate-green/70 hover:bg-foliage/20 border border-sage/10 hover:border-accent-gold flex items-center justify-center text-foreground/60 hover:text-accent-gold transition-all duration-300"
            aria-label="YouTube BEM FT UNESA"
          >
            <Youtube className="w-4 h-4" />
          </a>
          <a
            href="mailto:bemft@unesa.ac.id"
            className="w-8 h-8 rounded-lg bg-slate-green/70 hover:bg-foliage/20 border border-sage/10 hover:border-accent-gold flex items-center justify-center text-foreground/60 hover:text-accent-gold transition-all duration-300"
            aria-label="Email BEM FT UNESA"
          >
            <Globe className="w-4 h-4" />
          </a>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
