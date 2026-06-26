"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ShieldAlert, LogOut } from "lucide-react";
import Image from "next/image";
import { ImsApiService, type UserProfile } from "@/lib/api";
import { DesktopSidebar } from "./layout/DesktopSidebar";
import { MobileSidebar } from "./layout/MobileSidebar";
import { DashboardHeader } from "./layout/DashboardHeader";
import { getSidebarConfig } from "@/config/sidebar-registry";

interface DashboardShellProps {
  children: React.ReactNode;
}

export default function DashboardShell({ children }: DashboardShellProps) {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [noAssignments, setNoAssignments] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      const token = localStorage.getItem("ims_token");
      if (!token) {
        window.location.href = "/login";
        return;
      }

      try {
        const res = await ImsApiService.getProfile();
        if (res?.data) {
          setProfile(res.data);
          // Check if user has any active role assignments or a global role
          const hasAssignments = res.data.assignments && res.data.assignments.length > 0;
          const hasGlobalRole = !!res.data.role;
          
          if (!hasAssignments && !hasGlobalRole) {
            setNoAssignments(true);
          }
        }
        setLoading(false);
      } catch (err) {
        console.error("Profile load failed, redirecting to login:", err);
        localStorage.removeItem("ims_token");
        window.location.href = "/login";
      }
    };

    fetchProfile();
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("ims_token");
    window.location.href = "/login";
  };

  const handleSwitchRole = async (assignmentId: string) => {
    try {
      setLoading(true);
      const res = await ImsApiService.switchRole(assignmentId);
      if (res.data?.token) {
        localStorage.setItem("ims_token", res.data.token);
        const profileRes = await ImsApiService.getProfile();
        setProfile(profileRes.data);
      }
    } catch (err) {
      console.error("Failed to switch role", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-background">
        <div className="flex flex-col items-center justify-center gap-4 text-center">
          <div className="flex justify-center mb-8">
            <Image src="/images/logo-bemft.png" alt="Logo BEM FT" width={40} height={40} className="object-contain" priority />
          </div>
          <span className="text-sm text-foreground/60 font-medium">
            Memuat...
          </span>
        </div>
      </div>
    );
  }

  // User authenticated but has no role assignments
  if (noAssignments) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-background">
        <div className="glass-subtle border border-sage/10 rounded-2xl p-10 max-w-md w-full mx-4 flex flex-col items-center text-center gap-6">
          <div className="w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
            <ShieldAlert className="w-8 h-8 text-amber-400" />
          </div>
          <div className="flex flex-col gap-2">
            <h2 className="text-lg font-bold text-foreground">Menunggu Penugasan Role</h2>
            <p className="text-sm text-foreground/50 leading-relaxed">
              Akun Anda sudah terdaftar, tetapi belum memiliki role aktif di periode ini. Hubungi <span className="text-sage font-medium">Super Admin</span> untuk mendapatkan penugasan.
            </p>
          </div>
          <div className="w-full border-t border-white/5 pt-4 flex flex-col gap-2">
            <p className="text-xs text-foreground/30">Login sebagai: {profile?.email}</p>
            <button
              onClick={handleLogout}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm text-rose-400 hover:bg-rose-500/10 transition-all duration-200 cursor-pointer border border-rose-500/10"
            >
              <LogOut className="w-4 h-4" />
              Keluar & Ganti Akun
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Get active role slug
  const roleObj = typeof profile?.role === 'object' ? profile?.role : null;
  const roleSlug = profile?.activeContext?.role?.slug || roleObj?.slug || (typeof profile?.role === 'string' ? profile?.role : 'staf');
  const roleName = profile?.activeContext?.role?.name || roleObj?.name || 'Fungsionaris';
  
  // Get sidebar sections based on role
  // This logic automatically limits what a user can see in the sidebar based on their role
  const sidebarSections = getSidebarConfig(roleSlug);

  return (
    <div className="min-h-screen w-full flex bg-background text-foreground relative font-sans">
      {/* Background radial glow */}
      <div className="absolute top-[5%] left-[5%] w-[400px] h-[400px] bg-accent-blue/5 rounded-full blur-[130px] pointer-events-none -z-10" />
      <div className="absolute bottom-[5%] right-[5%] w-[400px] h-[400px] bg-sage/5 rounded-full blur-[130px] pointer-events-none -z-10" />

      {/* Sidebar - Desktop */}
      <DesktopSidebar 
        sections={sidebarSections} 
        onLogout={handleLogout} 
        roleName={roleName}
      />

      {/* Sidebar - Mobile Slide-out */}
      <MobileSidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)} 
        sections={sidebarSections} 
        onLogout={handleLogout} 
      />

      {/* Main Content */}
      <div className="flex flex-col flex-grow min-w-0">
        {/* Top Header */}
        <DashboardHeader 
          profile={profile} 
          onOpenSidebar={() => setSidebarOpen(true)} 
          onSwitchRole={handleSwitchRole}
        />

        {/* Page Content */}
        <main className="flex-grow p-6 md:p-8 max-w-7xl mx-auto w-full">
          {children}
        </main>
      </div>
    </div>
  );
}
