"use client";

import { IdCard, UserCheck, HeartPulse, Camera, PenLine, Home, Bell, CalendarDays, LogIn } from "lucide-react";
import type { TutorialConfig } from "./InteractiveTutorial";

/** Tutorial untuk halaman Login. */
export const loginTutorial: TutorialConfig = {
  storageKey: "login",
  steps: [
    {
      selector: "h1",
      icon: <LogIn className="w-4 h-4" />,
      title: "Selamat Datang di Portal Adrata!",
      description:
        "Halaman ini adalah pintu masuk portal PKKMB FT UNESA. Untuk mulai, masuk menggunakan akun Google kampus Anda.",
      placement: "bottom",
    },
    {
      selector: "[data-login-button]",
      icon: <LogIn className="w-4 h-4" />,
      title: "Masuk dengan Google",
      description:
        "Klik tombol ini lalu pilih akun Google UNESA Anda (berakhiran @mhs.unesa.ac.id). Sistem akan mengenali Anda secara otomatis.",
      placement: "top",
    },
  ],
};

/** Tutorial untuk halaman Onboarding (proses pendaftaran maba). */
export const onboardingTutorial: TutorialConfig = {
  storageKey: "onboarding",
  steps: [
    {
      selector: "h1",
      icon: <IdCard className="w-4 h-4" />,
      title: "Selamat Datang, Maba Adrata!",
      description:
        "Sebelum memasuki dunia PKKMB, lengkapi dulu data diri Anda melalui 6 langkah singkat. Panduan ini akan menemani Anda.",
      placement: "bottom",
    },
    {
      selector: "[data-onboard-step]",
      icon: <IdCard className="w-4 h-4" />,
      title: "Progres Onboarding",
      description:
        "Baris langkah di sisi kiri menunjukkan kemajuan Anda: Upload KTMS, Konfirmasi Data, Kesehatan, Pasfoto, Persetujuan, hingga Penetapan Gugus.",
      placement: "right",
    },
    {
      selector: "input[type=file]",
      icon: <IdCard className="w-4 h-4" />,
      title: "Langkah 1 — Upload KTMS",
      description:
        "Unggah foto KTM Sementara Anda. Data di kartu akan terbaca otomatis (OCR), jadi tidak perlu mengetik manual. Pastikan foto jelas dan tidak buram.",
      placement: "top",
    },
    {
      selector: "[data-onboard-nav]",
      icon: <UserCheck className="w-4 h-4" />,
      title: "Tombol Navigasi",
      description:
        "Gunakan tombol ini untuk berpindah antar langkah. Data otomatis tersimpan saat Anda melanjutkan ke langkah berikutnya.",
      placement: "top",
    },
    {
      selector: "[data-onboard-step4]",
      icon: <Camera className="w-4 h-4" />,
      title: "Pasfoto 3x4",
      description:
        "Di langkah keempat, unggah pasfoto resmi Anda (latar merah, kemeja putih). Foto ini akan dipakai untuk ID Card Maba.",
      placement: "left",
    },
    {
      selector: "[data-onboard-consent]",
      icon: <PenLine className="w-4 h-4" />,
      title: "Persetujuan & Tanda Tangan",
      description:
        "Terakhir, Anda akan menandatangani persetujuan secara digital. Setelah itu, sistem akan menetapkan gugus Anda.",
      placement: "top",
    },
  ],
};

/** Tutorial untuk Dashboard Maba. */
export const dashboardTutorial: TutorialConfig = {
  storageKey: "dashboard",
  steps: [
    {
      selector: "[data-dash-hero]",
      icon: <Home className="w-4 h-4" />,
      title: "Dashboard Maba",
      description:
        "Ini pusat kendali Anda selama PKKMB. Di sini Anda melihat gugus, jadwal, presensi, penugasan, dan skor keaktifan.",
      placement: "bottom",
    },
    {
      selector: "[data-dash-menu]",
      icon: <Home className="w-4 h-4" />,
      title: "Menu Utama",
      description:
        "Gunakan menu di sidebar (desktop) atau bilah bawah (mobile): Beranda, Aktivitas, Jadwal, Notifikasi, dan Profil.",
      placement: "right",
    },
    {
      selector: "[data-dash-stats]",
      icon: <HeartPulse className="w-4 h-4" />,
      title: "Skor Keaktifan",
      description:
        "Pantau progres Anda: tugas terkumpul, kuis selesai, dan total poin keaktifan. Semakin aktif, semakin banyak poin!",
      placement: "top",
    },
    {
      selector: "[data-dash-bell]",
      icon: <Bell className="w-4 h-4" />,
      title: "Notifikasi & Pengumuman",
      description:
        "Semua pengumuman penting dari panitia muncul di sini. Jangan lupa cek secara rutin!",
      placement: "bottom",
    },
    {
      selector: "[data-dash-schedule]",
      icon: <CalendarDays className="w-4 h-4" />,
      title: "Jadwal & Absensi",
      description:
        "Lihat jadwal kegiatan dan lakukan presensi saat sesi berlangsung. Pastikan hadir tepat waktu!",
      placement: "bottom",
    },
  ],
};
