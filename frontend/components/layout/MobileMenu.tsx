"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { motion, AnimatePresence, Variants } from "framer-motion";
import { X, Globe, Camera, Play, ArrowRight } from "lucide-react";

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  links: { href: string; label: string }[];
}

export function MobileMenu({ isOpen, onClose, links }: MobileMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  // Focus trap and ESC key handling
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      const handleEsc = (e: KeyboardEvent) => {
        if (e.key === "Escape") onClose();
      };
      window.addEventListener("keydown", handleEsc);

      // Auto-focus the close button for accessibility
      const closeBtn = menuRef.current?.querySelector("button");
      closeBtn?.focus();

      return () => {
        document.body.style.overflow = "unset";
        window.removeEventListener("keydown", handleEsc);
      };
    }
  }, [isOpen, onClose]);

  const menuVariants: Variants = {
    closed: {
      x: "100%",
      transition: {
        type: "spring",
        stiffness: 400,
        damping: 40,
        staggerChildren: 0.05,
        staggerDirection: -1,
      },
    },
    open: {
      x: 0,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 30,
        staggerChildren: 0.08,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    closed: { x: 40, opacity: 0 },
    open: { x: 0, opacity: 1 },
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop Blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-60 bg-[#06130b]/60 backdrop-blur-md"
            aria-hidden="true"
          />

          {/* Menu Panel */}
          <motion.div
            ref={menuRef}
            variants={menuVariants}
            initial="closed"
            animate="open"
            exit="closed"
            role="dialog"
            aria-modal="true"
            aria-label="Mobile Navigation Menu"
            className="fixed inset-y-0 right-0 z-70 w-full max-w-sm bg-[#06130b] border-l border-white/10 shadow-[0_0_100px_rgba(0,0,0,0.5)] flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-8 border-b border-white/5">
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-mono text-[#10b981] uppercase tracking-[0.3em]">
                  {"// NAV PROTOCOL"}
                </span>
                <span className="text-[8px] font-mono text-gray-600 uppercase">
                  AEC_DANADYAKSA_v2.0
                </span>
              </div>
              <button
                onClick={onClose}
                aria-label="Close Menu"
                className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-white hover:bg-[#10b981] hover:text-[#091c11] transition-all group active:scale-90 focus:outline-none focus:ring-2 focus:ring-[#10b981] focus:ring-offset-2 focus:ring-offset-[#06130b]"
              >
                <X className="w-6 h-6 group-hover:rotate-90 transition-transform duration-300" />
              </button>
            </div>

            {/* Links */}
            <nav className="flex-1 px-8 py-12 flex flex-col gap-2 overflow-y-auto">
              {links.map((link) => (
                <motion.div key={link.href} variants={itemVariants}>
                  <Link
                    href={link.href}
                    onClick={onClose}
                    className="flex items-center justify-between py-4 group border-b border-white/2 hover:border-[#10b981]/20 transition-all"
                  >
                    <span className="text-3xl font-bold text-white group-hover:text-[#10b981] font-sans group-hover:translate-x-2 transition-all duration-300">
                      {link.label}
                    </span>
                    <ArrowRight className="w-6 h-6 text-[#10b981] opacity-0 group-hover:opacity-100 -translate-x-4 group-hover:translate-x-0 transition-all duration-300" />
                  </Link>
                </motion.div>
              ))}
            </nav>

            {/* Footer / Socials */}
            <div className="p-10 border-t border-white/5 bg-white/1 space-y-10">
              <a
                href={
                  process.env.NEXT_PUBLIC_IMS_URL ||
                  "https://ims.bemftunesa.org"
                }
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center w-full py-5 bg-white text-army-dark font-bold rounded-2xl hover:bg-army-accent transition-all group active:scale-95"
              >
                LOGIN IMS{" "}
                <ArrowRight className="w-5 h-5 ml-3 group-hover:translate-x-1 transition-transform" />
              </a>

              <div className="flex flex-col gap-8">
                <div className="flex justify-between items-center">
                  <p className="text-[9px] font-mono text-gray-500 uppercase tracking-widest">
                    Digital Synergy
                  </p>
                  <div className="flex gap-5">
                    {[Camera, Play, Globe].map((Icon, i) => (
                      <a
                        key={i}
                        href="#"
                        className="text-gray-400 hover:text-[#10b981] transition-colors"
                        aria-label={`Social link ${i + 1}`}
                      >
                        <Icon className="w-5 h-5" />
                      </a>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col gap-1.5 opacity-40">
                  <p className="text-[8px] font-mono text-white/60 uppercase tracking-widest">
                    BEM FT UNESA // DANADYAKSA 2026
                  </p>
                  <p className="text-[8px] font-mono text-white/40 uppercase tracking-tighter italic">
                    &quot;Empowering the Future of Engineering&quot;
                  </p>
                </div>
              </div>
            </div>

            {/* Decorative Grid Line */}
            <div className="absolute top-0 right-12 w-px h-full bg-white/5 pointer-events-none" />
            <div className="absolute top-1/2 left-0 w-full h-px bg-white/2 pointer-events-none" />
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
