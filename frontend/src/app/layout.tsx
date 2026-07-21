import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

// Bypass google font fetching for offline local build stability
const plusJakartaSans = { variable: "font-sans" };
const geistMono = { variable: "font-mono" };

export const metadata: Metadata = {
  title: {
    default: "BEM FT UNESA | Kabinet Danadyaksa 2026",
    template: "%s | BEM FT UNESA",
  },
  description:
    "Portal resmi Badan Eksekutif Mahasiswa (BEM) Fakultas Teknik Universitas Negeri Surabaya Kabinet Danadyaksa 2026. Sinergi Nyata, Teknik Berdaya.",
  icons: {
    icon: "/icon.png",
  },
};

export default function RootLayout({
  children,
  pageProps,
}: Readonly<{
  children: React.ReactNode;
  pageProps?: any;
}>) {
  return (
    <html
      lang="id"
      suppressHydrationWarning
      className={`${plusJakartaSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var saved = localStorage.getItem('theme');
                  if (saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                    document.documentElement.classList.add('dark');
                  } else {
                    document.documentElement.classList.remove('dark');
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        {/* Decorative Grid Paper Texturing Overlay */}
        <div className="fixed inset-0 pointer-events-none z-0 bg-[radial-gradient(circle_at_30%_20%,rgba(59,130,246,0.02)_0%,transparent_50%),radial-gradient(circle_at_80%_80%,rgba(16,185,129,0.04)_0%,transparent_60%)]" />
        
        {/* Navigation */}
        <Navbar />

        {/* Main Workspace content */}
        <div className="flex-grow flex flex-col relative z-10">{children}</div>

        {/* Global Footer */}
        <Footer />
      </body>
    </html>
  );
}
