"use client";

import React, { useState, useEffect } from "react";
import DashboardShell from "@/components/DashboardShell";
import { DashboardRenderer } from "@/components/dashboard/DashboardRenderer";
import { getDashboardConfig } from "@/config/dashboard-registry";
import { ImsApiService, type UserProfile } from "@/lib/api";
import Image from "next/image";

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

  // Determine active role slug based on activeContext or profile role
  const roleObj = typeof profile?.role === 'object' ? profile?.role : null;
  const roleSlug = profile?.activeContext?.role?.slug || roleObj?.slug || (typeof profile?.role === 'string' ? profile?.role : 'staf');
  
  // Get layout config for the current role
  const dashboardConfig = getDashboardConfig(roleSlug);

  return (
    <DashboardShell>
      <DashboardRenderer config={dashboardConfig} profile={profile} />
    </DashboardShell>
  );
}
