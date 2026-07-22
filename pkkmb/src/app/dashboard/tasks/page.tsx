"use client";

import React, { useState, useEffect } from 'react';
import { useAuthStore } from '@/features/auth/store/useAuthStore';
import { apiClient } from '@/shared/api/axios';
import { FileText, Calendar, Upload, Award, ExternalLink, Loader2, AlertTriangle, CheckCircle } from 'lucide-react';

export default function TasksPage() {
  // Migrate logic from MabaDashboard for Tasks
  const { user } = useAuthStore();
  const [assignments, setAssignments] = useState<any[]>([]);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [isFetchingData, setIsFetchingData] = useState(true);

  // TODO: Add Modal state and functions

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      try {
        const [assignmentsRes, submissionsRes] = await Promise.all([
          apiClient.get('/pkkmb/tasks'),
          apiClient.get('/pkkmb/tasks/my-submissions'),
        ]);
        setAssignments(assignmentsRes.data?.data || []);
        setSubmissions(submissionsRes.data?.data || []);
      } catch (err) {
        console.error(err);
      }
      setIsFetchingData(false);
    };
    fetchData();
  }, [user]);

  if (isFetchingData) {
    return (
      <div className="w-full py-16 flex flex-col items-center justify-center text-foreground/35">
        <Loader2 className="h-8 w-8 animate-spin text-sage mb-3" />
        <p className="text-sm">Memuat data penugasan...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-sage/20 flex items-center justify-center text-sage">
          <FileText className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Penugasan</h1>
          <p className="text-sm text-foreground/60">Daftar tugas yang harus Anda selesaikan.</p>
        </div>
      </div>
      
      {/* List of Tasks (Placeholder for now) */}
      <div className="bg-white/5 rounded-xl p-10 border border-white/5 text-center text-foreground/35 text-sm">
        UI List Tugas Maba
      </div>
    </div>
  );
}
