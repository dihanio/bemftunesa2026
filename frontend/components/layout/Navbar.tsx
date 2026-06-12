"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { MobileMenu } from "./MobileMenu";

export function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navLinks = [
    { href: "/tentang", label: "Tentang Kami" },
    { href: "/struktur", label: "Struktur" },
    { href: "/proker", label: "Proker" },
    { href: "/berita", label: "Berita" },
    { href: "/aspirasi", label: "Aspirasi" },
    { href: "/verify/check", label: "Verifikasi" },
  ];

  return (
    <>
      <div className="fixed top-0 left-0 right-0 z-50 flex justify-center w-full px-4 sm:px-8 mt-6 pointer-events-none">
        {/* Floating Pill Navbar Container */}
        <nav className="pointer-events-auto flex w-full max-w-[1200px] items-center justify-between rounded-full border border-army-accent/30 bg-army-dark/85 px-3 pr-4 py-2.5 shadow-[0_12px_40px_-12px_rgba(0,0,0,0.6)] backdrop-blur-xl transition-all hover:border-army-accent/60">
          {/* Left: Logo & Brand */}
          <Link href="/" className="flex items-center gap-4 group pl-1">
            <div className="flex items-center -space-x-3">
              <div className="relative flex items-center justify-center w-16 h-16 md:w-20 md:h-20 transition-all duration-500 group-hover:scale-110 shrink-0">
                <Image
                  src="/logobemft.png"
                  alt="Logo BEM FT"
                  width={64}
                  height={64}
                  priority
                  className="object-contain drop-shadow-md"
                />
              </div>
              {/* Logo Kabinet */}
              <div className="relative flex items-center justify-center w-16 h-16 md:w-20 md:h-20 transition-all duration-500 group-hover:scale-110 shrink-0">
                <Image
                  src="/logo kabinet.png"
                  alt="Logo Kabinet Danadyaksa"
                  width={74}
                  height={74}
                  priority
                  className="object-contain drop-shadow-sm"
                />
              </div>
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-[13px] md:text-[15px] tracking-[0.2em] text-white uppercase font-sans leading-none mb-1.5">
                BEM FT UNESA
              </span>
              <span className="text-[9px] md:text-[10px] tracking-widest text-army-accent uppercase font-semibold leading-none">
                Kabinet Danadyaksa
              </span>
            </div>
          </Link>

          {/* Center: Desktop Navigation Links */}
          <div className="hidden lg:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="relative text-[10px] font-bold tracking-[0.2em] uppercase text-white/50 hover:text-white transition-all py-2 group font-sans rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#10b981] focus-visible:ring-offset-2 focus-visible:ring-offset-[#091c11]"
              >
                {link.label}
                <span className="absolute left-1/2 bottom-0 w-0 h-[1.5px] bg-[#10b981] transition-all duration-300 ease-out group-hover:w-full group-hover:left-0" />
              </Link>
            ))}
          </div>

          {/* Right: CTA Button & Mobile Menu */}
          <div className="flex items-center">
            <a
              href={process.env.NEXT_PUBLIC_IMS_URL || "https://ims.bemftunesa.org"}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden md:flex items-center justify-center px-6 py-2.5 text-[11px] font-bold tracking-wider text-army-dark bg-white rounded-full hover:bg-army-accent transition-all duration-300 hover:shadow-[0_0_20px_rgba(16, 185, 129,0.3)] hover:-translate-y-0.5 uppercase relative overflow-hidden group"
            >
              <span className="relative z-10 transition-colors group-hover:text-white">
                Login IMS
              </span>
              <div className="absolute inset-0 bg-[#12331e] opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
            </a>

            {/* Mobile Hamburger Menu Icon */}
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden flex flex-col gap-[5px] p-2 px-3 group pointer-events-auto rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#10b981] focus-visible:ring-offset-2 focus-visible:ring-offset-[#091c11]"
              aria-label="Buka menu navigasi"
            >
              <span className="block w-5 h-[2px] bg-white transition-all group-hover:bg-army-accent rounded-full" />
              <span className="block w-3 h-[2px] bg-white transition-all group-hover:w-5 group-hover:bg-army-accent rounded-full ml-auto" />
              <span className="block w-5 h-[2px] bg-white transition-all group-hover:bg-army-accent rounded-full" />
            </button>
          </div>
        </nav>
      </div>

      {/* Mobile Menu Overlay */}
      <MobileMenu
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        links={navLinks}
      />
    </>
  );
}
