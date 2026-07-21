"use client";

import React, { useEffect, useState } from "react";
import { PublicApiService } from "@/lib/api";
import Image from "next/image";

export default function PartnersSection() {
  const [partners, setPartners] = useState<any[]>([]);

  useEffect(() => {
    const fetchPartners = async () => {
      try {
        const allPartnersRes = await PublicApiService.getPartners();
        const raw = allPartnersRes?.data?.data?.data || allPartnersRes?.data?.data || allPartnersRes?.data || [];
        const activePartners = Array.isArray(raw) ? raw.filter((p: any) => p.status === "active") : [];
        setPartners(activePartners);
      } catch (err) {
        console.error(err);
      }
    };
    fetchPartners();
  }, []);

  if (!partners || partners.length === 0) return null;

  return (
    <section className="py-20 px-6 max-w-6xl mx-auto w-full relative">
      <div className="text-center mb-10">
        <span className="text-xs font-semibold text-accent-blue uppercase tracking-wide">Kolaborasi</span>
        <h2 className="text-3xl md:text-4xl font-extrabold text-foreground tracking-tight mt-2">
          Mitra & <span className="text-accent-gold">Sponsor</span>
        </h2>
        <p className="text-sm text-foreground/75 mt-3 max-w-2xl mx-auto">
          Terima kasih kepada seluruh mitra dan sponsor yang telah mendukung perjalanan dan program kerja BEM FT UNESA.
        </p>
      </div>

      <div className="flex flex-wrap justify-center items-center gap-8 md:gap-12 opacity-70 hover:opacity-100 transition-opacity duration-500">
        {partners.map((partner) => (
          <a
            key={partner._id}
            href={partner.website || "#"}
            target={partner.website ? "_blank" : undefined}
            rel="noopener noreferrer"
            className="group flex items-center justify-center grayscale hover:grayscale-0 transition-all duration-300"
            title={partner.name}
          >
            {partner.logo ? (
              <Image 
                src={typeof partner.logo === 'string' ? partner.logo : partner.logo.url} 
                alt={partner.name}
                width={150}
                height={64}
                className="h-12 md:h-16 w-auto object-contain"
                style={{ width: 'auto', height: 'auto' }}
              />
            ) : (
              <span className="font-bold text-foreground text-lg">{partner.name}</span>
            )}
          </a>
        ))}
      </div>
    </section>
  );
}
