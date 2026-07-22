"use client";

import React from 'react';
import { ShieldAlert, Users, Activity } from 'lucide-react';

export default function AdminDashboardPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-8">
        <div className="h-12 w-12 rounded-xl bg-red-500/20 flex items-center justify-center text-red-500 border border-red-500/20">
          <ShieldAlert className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Admin Dashboard</h1>
          <p className="text-sm text-foreground/60">Pusat kendali utama sistem PKKMB BEM FT.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white/5 rounded-2xl p-6 border border-white/5 relative overflow-hidden group">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-blue-500/10 rounded-xl text-blue-400">
              <Users className="h-6 w-6" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-bold mb-1">0</div>
            <div className="text-sm text-foreground/60 font-medium">Total Users</div>
          </div>
        </div>

        <div className="bg-white/5 rounded-2xl p-6 border border-white/5 relative overflow-hidden group">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-red-500/10 rounded-xl text-red-400">
              <Activity className="h-6 w-6" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-bold mb-1">0</div>
            <div className="text-sm text-foreground/60 font-medium">Active Sessions</div>
          </div>
        </div>
      </div>
    </div>
  );
}
