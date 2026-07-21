"use client";
 
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, Activity, Sun, Moon } from "lucide-react";
import Image from "next/image";
import { useModeAnimation, ThemeAnimationType } from "react-theme-switch-animation";

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();

  const { ref: themeRef, toggleSwitchTheme, isDarkMode } = useModeAnimation({
    animationType: ThemeAnimationType.CIRCLE,
    duration: 500,
    easing: "ease-in-out",
  });

  useEffect(() => {
    setMounted(true);
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { name: "Beranda", path: "/" },
    {
      name: "Profil",
      isDropdown: true,
      children: [
        { name: "Tentang Kami", path: "/tentang" },
        { name: "Struktur Kabinet", path: "/struktur" },
        { name: "Kontak", path: "/kontak" },
      ],
    },
    {
      name: "Informasi",
      isDropdown: true,
      children: [
        { name: "Berita & Artikel", path: "/berita" },
        { name: "Galeri Kegiatan", path: "/galeri" },
        { name: "Open Recruitment", path: "/oprec" },
      ],
    },
  ];

  return (
    <nav
      className={`fixed top-0 left-0 w-full z-50 transition-all duration-500 ${
        isScrolled
          ? "py-4 glass-overlay shadow-md border-b border-white dark:border-accent-blue/20"
          : "py-6 bg-transparent border-b border-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
        {/* Logo Section */}
        <Link href="/" className="flex items-center gap-4 group shrink-0">
          <div className="flex items-center gap-2">
            <Image src="/logobemft.png" alt="BEM FT UNESA" width={44} height={44} className="object-contain filter drop-shadow-[0_0_10px_rgba(59,130,246,0.5)] transition-transform duration-300 group-hover:scale-105 shrink-0" />
            <Image src="/logo_kabinet.png" alt="Kabinet BEM FT" width={44} height={44} className="object-contain filter drop-shadow-[0_0_10px_rgba(59,130,246,0.5)] transition-transform duration-300 group-hover:scale-105 shrink-0" />
          </div>
          <div className="flex flex-col border-l border-foreground/20 pl-3 ml-1">
            <span className="text-lg font-extrabold text-foreground tracking-tight leading-tight">BEM FT UNESA</span>
            <span className="text-[10px] font-bold text-accent-gold tracking-widest uppercase">Kabinet Danadyaksa</span>
          </div>
        </Link>

        {/* Desktop Links */}
        <div className="hidden xl:flex items-center gap-6 xl:gap-10 mx-auto">
          {navLinks.map((link, idx) => {
            if (link.isDropdown) {
              const isActive = link.children?.some(child => pathname === child.path);
              return (
                <div key={idx} className="relative group py-2">
                  <button
                    className={`text-xs font-bold uppercase tracking-widest transition-colors duration-300 relative py-1 flex items-center gap-1 ${
                      isActive ? "text-accent-gold" : "text-foreground/70 hover:text-foreground"
                    }`}
                  >
                    {link.name}
                    <svg className="w-3 h-3 transition-transform duration-300 group-hover:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                    {isActive && (
                      <span className="absolute bottom-0 left-0 w-full h-[2px] bg-accent-gold rounded-full" />
                    )}
                  </button>

                  {/* Dropdown Menu */}
                  <div className="absolute top-full left-1/2 -translate-x-1/2 pt-4 opacity-0 translate-y-2 pointer-events-none group-hover:opacity-100 group-hover:translate-y-0 group-hover:pointer-events-auto transition-all duration-300 z-50">
                    <div className="glass-active border border-white dark:border-accent-blue/20 rounded-2xl shadow-xl shadow-black/10 py-3 w-56 flex flex-col relative overflow-hidden">
                      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-accent-gold to-yellow-400" />
                      {link.children?.map((child) => (
                        <Link
                          key={child.path}
                          href={child.path}
                          className={`px-5 py-2.5 text-xs font-bold tracking-widest uppercase transition-colors hover:bg-accent-blue/20 ${
                            pathname === child.path ? "text-accent-gold" : "text-foreground/75 hover:text-foreground"
                          }`}
                        >
                          {child.name}
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              );
            }

            const isActive = pathname === link.path;
            return (
              <Link
                key={link.path as string}
                href={link.path as string}
                className={`text-xs font-bold uppercase tracking-widest transition-colors duration-300 relative py-1 ${
                  isActive
                    ? "text-accent-gold"
                    : "text-foreground/70 hover:text-foreground"
                }`}
              >
                {link.name}
                {isActive && (
                  <span className="absolute bottom-0 left-0 w-full h-[2px] bg-accent-gold rounded-full" />
                )}
              </Link>
            );
          })}
        </div>

        {/* Desktop CTA */}
        <div className="hidden xl:flex items-center gap-3 xl:gap-4 shrink-0">
          <button
            ref={themeRef}
            onClick={() => toggleSwitchTheme()}
            className="p-2.5 rounded-full border border-white dark:border-accent-blue/20 bg-accent-blue/10 dark:bg-slate-800/40 text-accent-blue hover:text-accent-gold hover:bg-accent-blue/20 transition-all duration-300 cursor-pointer"
            aria-label="Toggle theme"
          >
            {mounted && isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
          <Link
            href="/aspirasi"
            className="px-5 py-2.5 rounded-full border border-accent-gold/30 bg-transparent text-[10px] font-bold uppercase tracking-widest text-accent-gold hover:bg-accent-blue hover:text-white border-accent-blue transition-all duration-300 flex items-center gap-2"
          >
            <Activity className="w-3 h-3 text-accent-gold" />
            Kanal Aspirasi
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="xl:hidden p-2 rounded-xl text-foreground/75 hover:text-foreground hover:bg-accent-blue/10 transition-colors focus:outline-none"
          aria-label="Toggle navigation menu"
        >
          {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Links Dropdown */}
      {isOpen && (
        <div className="xl:hidden absolute top-full left-0 w-full glass-overlay border-b border-white dark:border-accent-blue/20 py-6 px-6 shadow-2xl flex flex-col gap-4 animate-in fade-in slide-in-from-top-5 duration-300 max-h-[80vh] overflow-y-auto">
          {navLinks.map((link, idx) => {
            if (link.isDropdown) {
              return (
                <div key={idx} className="flex flex-col gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-accent-blue px-3 pt-2">
                    {link.name}
                  </span>
                  {link.children?.map((child) => {
                    const isActive = pathname === child.path;
                    return (
                      <Link
                        key={child.path}
                        href={child.path}
                        onClick={() => setIsOpen(false)}
                        className={`text-xs font-bold uppercase tracking-widest py-2 px-3 rounded-xl transition-all duration-300 ml-2 ${
                          isActive
                            ? "bg-accent-blue/10 text-accent-gold border-l-2 border-accent-gold pl-4"
                            : "text-foreground/75 hover:bg-accent-blue/10 hover:text-foreground"
                        }`}
                      >
                        {child.name}
                      </Link>
                    );
                  })}
                </div>
              );
            }

            const isActive = pathname === link.path;
            return (
              <Link
                key={link.path as string}
                href={link.path as string}
                onClick={() => setIsOpen(false)}
                className={`text-xs font-bold uppercase tracking-widest py-2 px-3 rounded-xl transition-all duration-300 ${
                  isActive
                    ? "bg-accent-blue/10 text-accent-gold border-l-2 border-accent-gold pl-4"
                    : "text-foreground/75 hover:bg-accent-blue/10 hover:text-foreground"
                }`}
              >
                {link.name}
              </Link>
            );
          })}
          <div className="w-full h-px bg-accent-blue/20 my-2" />
          <button
            onClick={() => {
              toggleSwitchTheme();
              setIsOpen(false);
            }}
            className="flex items-center justify-between text-xs font-bold uppercase tracking-widest py-2 px-3 rounded-xl text-foreground/75 hover:bg-accent-blue/10 hover:text-foreground transition-all duration-300 w-full text-left cursor-pointer"
          >
            <span>Tema: {mounted && isDarkMode ? "Gelap" : "Terang"}</span>
            {mounted && isDarkMode ? <Sun className="w-4 h-4 text-accent-gold" /> : <Moon className="w-4 h-4 text-accent-gold" />}
          </button>

          <Link
            href="/aspirasi"
            onClick={() => setIsOpen(false)}
            className="mt-2 w-full text-center px-5 py-3 rounded-full bg-accent-blue text-white font-bold text-xs uppercase tracking-widest hover:bg-accent-blue/80 transition-all duration-300"
          >
            Kirim Aspirasi
          </Link>
        </div>
      )}
    </nav>
  );
}

export default Navbar;
