import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "IMS - BEM FT UNESA",
  description: "Internal Management System BEM FT UNESA 2026",
};

import { AuthProvider } from "@/components/providers/auth-provider";
import { QueryProvider } from "@/components/providers/query-provider";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta
          name="apple-mobile-web-app-status-bar-style"
          content="black-translucent"
        />
        <meta name="apple-mobile-web-app-title" content="IMS BEMFT" />
        <link rel="apple-touch-icon" href="/logobemft.png" />
        <meta name="theme-color" content="#091c11" />
      </head>
      <body className="min-h-full flex flex-col bg-[#091c11]">
        <AuthProvider>
          <QueryProvider>{children}</QueryProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
