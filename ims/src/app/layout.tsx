import type { Metadata } from "next";
import "./globals.css";

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
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}
    >
      <body className="min-h-full flex flex-col bg-[#040914] text-[#f0f4f9]">
        {children}
      </body>
    </html>
  );
}
