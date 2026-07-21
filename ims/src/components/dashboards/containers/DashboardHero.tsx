import React from 'react';
import { Activity, TrendingUp, Users, FileText } from 'lucide-react';

interface DashboardHeroProps {
  userName: string;
  stats?: {
    activeEvents?: number;
    totalMembers?: number;
    pendingDocuments?: number;
    completionRate?: number;
  };
}

export function DashboardHero({ userName, stats }: DashboardHeroProps) {
  const summaryCards = [
    {
      label: 'Event Aktif',
      value: stats?.activeEvents || 0,
      icon: Activity,
      color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
      iconBg: 'bg-blue-500',
    },
    {
      label: 'Total Anggota',
      value: stats?.totalMembers || 0,
      icon: Users,
      color: 'bg-green-500/10 text-green-600 dark:text-green-400',
      iconBg: 'bg-green-500',
    },
    {
      label: 'Dokumen Pending',
      value: stats?.pendingDocuments || 0,
      icon: FileText,
      color: 'bg-orange-500/10 text-orange-600 dark:text-orange-400',
      iconBg: 'bg-orange-500',
    },
    {
      label: 'Completion Rate',
      value: `${stats?.completionRate || 0}%`,
      icon: TrendingUp,
      color: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
      iconBg: 'bg-purple-500',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Hero Section with Gradient Background */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-primary-600 to-primary-700 p-8 shadow-lg">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-grid-white/[0.05] bg-[size:20px_20px]" />
        <div className="absolute inset-0 bg-gradient-to-t from-primary/50 to-transparent" />
        
        {/* Content */}
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Activity className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-white/80 text-sm font-medium">Dashboard Overview</p>
              <h1 className="text-2xl md:text-3xl font-bold text-white">
                Selamat datang, {userName}
              </h1>
            </div>
          </div>
          <p className="text-white/90 text-sm max-w-2xl">
            Kelola aktivitas BEM FT UNESA dengan mudah. Pantau event, dokumen, dan anggota dalam satu tempat.
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className="relative overflow-hidden rounded-xl bg-surface-1 border border-hairline p-5 shadow-md hover:shadow-lg transition-all duration-200 group cursor-pointer"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="flex items-start justify-between mb-3">
                <div className={`p-2.5 rounded-lg ${card.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className={`w-10 h-10 rounded-full ${card.iconBg} opacity-10 group-hover:opacity-20 transition-opacity absolute -right-2 -top-2`} />
              </div>
              
              <div>
                <p className="text-2xl font-bold text-ink mb-1 group-hover:scale-105 transition-transform inline-block">
                  {card.value}
                </p>
                <p className="text-xs font-medium text-ink-tertiary uppercase tracking-wide">
                  {card.label}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
