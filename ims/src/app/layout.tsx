import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import "./components.css";
import { Providers } from "./providers";

const geistSans = { variable: "font-sans" };
const geistMono = { variable: "font-mono" };

export const metadata: Metadata = {
  title: "Integrated Management System | BEM FT UNESA 2026",
  description: "Portal internal fungsionaris BEM Fakultas Teknik Universitas Negeri Surabaya Kabinet Danadyaksa 2026.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="id"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
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
      <body className="min-h-full flex flex-col bg-canvas text-ink">
        <Providers>
          {children}
        </Providers>
        <Script 
          src="https://cdn.jsdelivr.net/npm/@stisla/vanilla@3/dist/stisla.js"
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}
