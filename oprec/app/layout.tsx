import "./globals.css";
import type { Metadata } from "next";
import Image from "next/image";
import { QueryProvider } from "@/providers/QueryProvider";

export const metadata: Metadata = {
  title: "Open Recruitment BEM FT UNESA 2026",
  description:
    "Portal Pendaftaran Open Recruitment BEM FT UNESA Kabinet Danadyaksa 2026. Sinergi Nyata, Teknik Berdaya.",
  icons: {
    icon: "/logobemft.png",
    shortcut: "/logobemft.png",
    apple: "/logobemft.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body className="bg-[#091c11] text-white antialiased">
        <QueryProvider>
          <div className="relative flex min-h-screen flex-col">
            {/* Dedicated Floating Navbar for Oprec Subdomain */}
            <header className="fixed top-0 left-0 right-0 z-50 flex justify-center w-full px-4 sm:px-8 mt-6 pointer-events-none">
              <div className="pointer-events-auto flex w-full max-w-[1200px] items-center justify-between rounded-full border border-army-accent/30 bg-army-dark/85 px-4 py-2.5 shadow-[0_12px_40px_-12px_rgba(0,0,0,0.6)] backdrop-blur-xl transition-premium hover:border-army-accent/60">
                {/* Brand */}
                <a
                  href="https://bemftunesa.org"
                  className="flex items-center gap-3 group pl-1"
                >
                  <div className="flex items-center -space-x-2 shrink-0">
                    <Image
                      src="/logobemft.png"
                      alt="Logo BEM FT"
                      width={44}
                      height={44}
                      className="object-contain drop-shadow-md group-hover:scale-105 transition-premium"
                    />
                    <Image
                      src="/logo kabinet.png"
                      alt="Logo Kabinet Danadyaksa"
                      width={52}
                      height={52}
                      className="object-contain drop-shadow-sm group-hover:scale-105 transition-premium"
                    />
                  </div>
                  <div className="flex flex-col text-left">
                    <span className="font-bold text-xs md:text-sm tracking-[0.2em] text-white uppercase font-sans leading-none mb-1">
                      BEM FT UNESA
                    </span>
                    <span className="text-[8px] md:text-[9px] tracking-widest text-[#10b981] uppercase font-semibold leading-none">
                      Kabinet Danadyaksa
                    </span>
                  </div>
                </a>

                {/* Navigation Links */}
                <div className="hidden sm:flex items-center gap-6">
                  <a
                    href="https://bemftunesa.org"
                    className="text-[10px] font-bold tracking-[0.2em] uppercase text-white/50 hover:text-white transition-premium py-2"
                  >
                    Profil Utama
                  </a>
                  <a
                    href="https://bemftunesa.org/proker"
                    className="text-[10px] font-bold tracking-[0.2em] uppercase text-white/50 hover:text-white transition-premium py-2"
                  >
                    Program Kerja
                  </a>
                </div>

                {/* CTA Login IMS */}
                <div className="flex items-center">
                  <a
                    href="https://ims.bemftunesa.org"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center px-5 py-2 text-[10px] font-bold tracking-wider text-army-dark bg-white rounded-full hover:bg-[#10b981] hover:text-[#091c11] hover:shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-premium uppercase"
                  >
                    Login IMS
                  </a>
                </div>
              </div>
            </header>

            <main className="flex-1">{children}</main>

            {/* Simple Branded Footer for Oprec */}
            <footer className="w-full bg-[#06130b] border-t border-white/10 rounded-t-[40px] pt-12 pb-6 relative z-10 text-gray-400 text-center">
              <div className="max-w-6xl mx-auto px-6 space-y-4">
                <p className="text-xs font-mono tracking-widest uppercase">
                  Sinergi Nyata, Teknik Berdaya // Danadyaksa 2026
                </p>
                <div className="flex justify-center gap-6 text-[10px] font-mono uppercase tracking-widest">
                  <a
                    href="https://bemftunesa.org"
                    className="hover:text-[#10b981] transition-colors"
                  >
                    Website Utama
                  </a>
                  <span>•</span>
                  <a
                    href="https://ims.bemftunesa.org"
                    className="hover:text-[#10b981] transition-colors"
                  >
                    Portal IMS
                  </a>
                </div>
                <p className="text-[9px] font-mono text-gray-600 uppercase tracking-widest pt-2">
                  © {new Date().getFullYear()} BEM FT UNESA. Didesain &
                  Dikembangkan oleh Departemen Riset dan Teknologi.
                </p>
              </div>
            </footer>
          </div>
        </QueryProvider>
      </body>
    </html>
  );
}
