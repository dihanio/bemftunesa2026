import "./globals.css";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import type { Metadata } from "next";
import { QueryProvider } from "@/providers/QueryProvider";
import { MaintenanceWrapper } from "@/providers/MaintenanceWrapper";

export const metadata: Metadata = {
  title: {
    default: "BEM FT UNESA | Kabinet Danadyaksa 2026",
    template: "%s | BEM FT UNESA",
  },
  description:
    "Website Resmi Badan Eksekutif Mahasiswa Fakultas Teknik Universitas Negeri Surabaya. Wadah aspirasi, inovasi, dan transformasi mahasiswa Teknik.",
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
