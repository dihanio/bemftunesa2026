"use client";

import React, { useState } from 'react';
import {
  Calendar,
  MapPin,
  Clock,
  BookOpen,
  AlertTriangle,
  Phone,
  ChevronDown,
  Shield,
  Shirt,
  Users,
} from 'lucide-react';

const jadwal = [
  { hari: 'Hari 1', tanggal: '18 Agustus 2026', kegiatan: 'Pembukaan PKKMB FT UNESA', waktu: '07.00 – 16.00 WIB', lokasi: 'Gedung A10 FT UNESA' },
  { hari: 'Hari 2', tanggal: '19 Agustus 2026', kegiatan: 'Pengenalan Jurusan & Program Studi', waktu: '07.00 – 16.00 WIB', lokasi: 'Masing-masing Gedung Jurusan' },
  { hari: 'Hari 3', tanggal: '20 Agustus 2026', kegiatan: 'Pengenalan Organisasi & UKM FT', waktu: '07.00 – 15.00 WIB', lokasi: 'Gedung A10 FT UNESA' },
  { hari: 'Hari 4', tanggal: '21 Agustus 2026', kegiatan: 'Penutupan & Pentas Seni', waktu: '07.00 – 17.00 WIB', lokasi: 'Gedung A10 FT UNESA' },
];

const tataTertib = [
  { icon: Clock, text: 'Wajib hadir tepat waktu sesuai jadwal yang telah ditentukan.' },
  { icon: Shirt, text: 'Mengenakan pakaian sesuai dresscode: kemeja putih, celana/rok hitam, sepatu hitam, dan almamater (hari tertentu).' },
  { icon: Shield, text: 'Dilarang membawa dan mengonsumsi narkoba, minuman keras, dan rokok di area kegiatan.' },
  { icon: BookOpen, text: 'Wajib membawa alat tulis dan catatan selama kegiatan berlangsung.' },
  { icon: Users, text: 'Wajib mengikuti seluruh rangkaian kegiatan hingga selesai.' },
  { icon: AlertTriangle, text: 'Dilarang melakukan tindakan kekerasan, bullying, atau perundungan dalam bentuk apapun.' },
  { icon: Phone, text: 'Handphone wajib dalam mode silent selama kegiatan berlangsung.' },
];

const kontakPanitia = [
  { name: 'Helpdesk PKKMB FT', role: 'Panitia Pusat' },
  { name: 'Divisi Presensi', role: 'Koordinator' },
  { name: 'Divisi Penugasan', role: 'Koordinator' },
];

function Accordion({ title, icon: Icon, children, defaultOpen = false }: {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="glass-subtle rounded-2xl border border-white/10 overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-3 p-5 text-left cursor-pointer hover:bg-white/[0.02] transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-sage/10 flex items-center justify-center shrink-0">
            <Icon className="h-4.5 w-4.5 text-sage" />
          </div>
          <span className="text-base font-bold">{title}</span>
        </div>
        <ChevronDown className={`h-5 w-5 text-foreground/40 transition-transform duration-300 ${open ? 'rotate-180' : ''}`} />
      </button>
      <div className={`grid transition-[grid-template-rows] duration-300 ${open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
        <div className="overflow-hidden">
          <div className="px-5 pb-5 pt-0">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function InformasiPage() {
  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <h2 className="text-xl font-extrabold">Informasi PKKMB FT</h2>

      {/* Jadwal */}
      <Accordion title="Jadwal Kegiatan" icon={Calendar} defaultOpen>
        <div className="space-y-3">
          {jadwal.map((item, i) => (
            <div key={i} className="flex gap-3 items-start">
              <div className="h-10 w-10 rounded-xl bg-sage/10 flex flex-col items-center justify-center text-sage font-bold text-xs shrink-0">
                <span className="text-[10px] text-foreground/40">Hari</span>
                <span>{i + 1}</span>
              </div>
              <div className="space-y-0.5 min-w-0">
                <div className="text-sm font-bold">{item.kegiatan}</div>
                <div className="text-xs text-foreground/50 flex flex-wrap gap-x-3 gap-y-0.5">
                  <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{item.tanggal}</span>
                  <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{item.waktu}</span>
                  <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{item.lokasi}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
        <p className="text-[11px] text-foreground/30 mt-4">
          * Jadwal dapat berubah sewaktu-waktu. Pantau terus portal ini untuk informasi terbaru.
        </p>
      </Accordion>

      {/* Tata Tertib */}
      <Accordion title="Tata Tertib" icon={BookOpen}>
        <ol className="space-y-3">
          {tataTertib.map(({ icon: Icon, text }, i) => (
            <li key={i} className="flex items-start gap-3">
              <div className="h-7 w-7 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0 mt-0.5">
                <Icon className="h-3.5 w-3.5 text-accent-gold" />
              </div>
              <span className="text-sm text-foreground/70 leading-relaxed">{text}</span>
            </li>
          ))}
        </ol>
      </Accordion>

      {/* Kontak Panitia */}
      <Accordion title="Kontak Panitia" icon={Phone}>
        <div className="space-y-3">
          {kontakPanitia.map((contact, i) => (
            <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/5">
              <div className="h-9 w-9 rounded-xl bg-sage/10 flex items-center justify-center shrink-0">
                <Users className="h-4 w-4 text-sage" />
              </div>
              <div className="min-w-0">
                <div className="text-sm font-bold truncate">{contact.name}</div>
                <div className="text-xs text-foreground/40">{contact.role}</div>
              </div>
            </div>
          ))}
        </div>
        <p className="text-[11px] text-foreground/30 mt-4">
          Informasi kontak lengkap akan diumumkan melalui grup WhatsApp kelompok masing-masing.
        </p>
      </Accordion>
    </div>
  );
}
