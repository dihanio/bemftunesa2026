import type { Metadata } from "next";
import { Outfit, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import SmoothScrolling from "@/components/layout/SmoothScrolling";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

export const metadata: Metadata = {
  title: "PKKMB FT UNESA 2026 — Adrata: Portal Insinyur Muda",
  description:
    "Portal resmi Pengenalan Kehidupan Kampus Mahasiswa Baru (PKKMB) Fakultas Teknik Universitas Negeri Surabaya 2026. Tema Adrata — Salam Rumah Kita Insinyur Muda!",
  metadataBase: new URL("https://pkkmb.bemft.unesa.ac.id"),
  icons: {
    icon: "/icon-adrata.webp",
  },
  openGraph: {
    title: "PKKMB FT UNESA 2026 — Adrata",
    description: "Portal resmi PKKMB Fakultas Teknik UNESA 2026. Daftarkan dirimu, Insinyur Muda!",
    images: ["/og-image-pkkmb-2026.webp"],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
  },
};

import { Toaster } from 'react-hot-toast';

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id" className={`${outfit.variable} ${plusJakarta.variable}`} data-scroll-behavior="smooth">
      <body className="antialiased font-body bg-black text-white selection:bg-gold-500/30">
        <SmoothScrolling>
          <div className="noise-overlay" aria-hidden="true" />
          {children}
          <Toaster 
            position="top-center"
            toastOptions={{
              className: '!bg-neutral-900 !text-white !border !border-white/10 !rounded-2xl',
            }}
          />
        </SmoothScrolling>
      </body>
    </html>
  );
}
