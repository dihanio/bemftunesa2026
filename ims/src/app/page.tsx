"use client";

import React, { useState, useEffect } from "react";
import DashboardShell from "@/components/DashboardShell";
import { ImsApiService, type UserProfile } from "@/lib/api";

export default function DashboardPage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const profileRes = await ImsApiService.getProfile();
        if (profileRes?.data) {
          setProfile(profileRes.data);
        }
      } catch (err) {
        console.error("Error loading dashboard profile:", err);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  if (loading) {
    return (
      <DashboardShell>
        <div className="flex flex-col items-center justify-center h-96 gap-4">
          <div className="w-10 h-10 animate-spin rounded-full border-4 border-sage/20 border-t-sage" />
          <span className="text-sm text-foreground/50">Memuat dashboard...</span>
        </div>
      </DashboardShell>
    );
  }

  const roleName = typeof profile?.role === 'object' ? profile?.role?.name : (profile?.role || 'Fungsionaris');

  return (
    <DashboardShell>
      <div className="flex flex-col gap-6 w-full max-w-4xl mx-auto py-8">
        <div className="glass-active rounded-3xl p-8 md:p-12 border border-sage/15 shadow-xl relative overflow-hidden bg-forest/5 backdrop-blur-md">
          {/* Accent Glow */}
          <div className="absolute -top-24 -right-24 w-48 h-48 rounded-full bg-accent-gold/10 blur-3xl pointer-events-none" />
          
          <span className="text-xs font-semibold text-accent-gold uppercase tracking-[0.2em] block mb-3">IMS BEM FT UNESA</span>
          <h1 className="text-3xl md:text-5xl font-extrabold text-foreground tracking-tight mb-4">
            Selamat Datang, <span className="text-sage">{profile?.name || 'Fungsionaris'}</span>!
          </h1>
          <p className="text-sm text-foreground/75 leading-relaxed max-w-2xl mb-2">
            Anda masuk sebagai <strong className="text-accent-gold">{roleName}</strong>. Seluruh modul operasional IMS telah dinonaktifkan sesuai kebijakan terbaru. Portal informasi publik tetap berjalan dinamis.
          </p>
        </div>
      </div>
    </DashboardShell>
  );
}
