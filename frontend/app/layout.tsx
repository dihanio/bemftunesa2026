import "./globals.css";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import type { Metadata } from "next";
import { QueryProvider } from "@/providers/QueryProvider";
import { MaintenanceWrapper } from "@/providers/MaintenanceWrapper";

export const metadata: Metadata = {
  metadataBase: new URL('https://www.bemftunesa.org'),
  title: {
    default: "BEM FT UNESA | Kabinet Danadyaksa 2026",
    template: "%s | BEM FT UNESA",
  },
  description:
    "Website Resmi Badan Eksekutif Mahasiswa Fakultas Teknik Universitas Negeri Surabaya. Wadah aspirasi, inovasi, dan transformasi mahasiswa Teknik.",
  keywords: [
    "BEM FT UNESA",
    "BEM Teknik UNESA",
    "Fakultas Teknik UNESA",
    "BEM FT",
    "Kabinet Danadyaksa",
    "Organisasi Mahasiswa",
    "UNESA",
  ],
  authors: [{ name: "BEM FT UNESA" }],
  creator: "BEM FT UNESA",
  openGraph: {
    type: "website",
    locale: "id_ID",
    url: "https://www.bemftunesa.org",
    title: "BEM FT UNESA | Kabinet Danadyaksa 2026",
    description: "Website Resmi Badan Eksekutif Mahasiswa Fakultas Teknik Universitas Negeri Surabaya.",
    siteName: "BEM FT UNESA",
    images: [
      {
        url: "/logobemft.png",
        width: 800,
        height: 600,
        alt: "Logo BEM FT UNESA",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "BEM FT UNESA",
    description: "Website Resmi Badan Eksekutif Mahasiswa Fakultas Teknik Universitas Negeri Surabaya.",
    images: ["/logobemft.png"],
  },
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
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              name: "BEM FT UNESA",
              url: "https://www.bemftunesa.org",
              logo: "https://www.bemftunesa.org/logobemft.png",
              description: "Badan Eksekutif Mahasiswa Fakultas Teknik Universitas Negeri Surabaya",
            }),
          }}
        />
        <QueryProvider>
          <MaintenanceWrapper>
            <div className="relative flex min-h-screen flex-col">
              <Navbar />
              <main className="flex-1">{children}</main>
              <Footer />
            </div>
          </MaintenanceWrapper>
        </QueryProvider>
      </body>
    </html>
  );
}
