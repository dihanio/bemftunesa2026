import React, { useEffect, useState } from 'react';
import { DashboardConfig } from '../../types/role-types';
import { KPICard } from './kpi/KPICard';
import { KPIGrid } from './kpi/KPIGrid';
import { QuickActions } from './actions/QuickActions';
import ImsApiService, { UserProfile } from '../../lib/api';

// Import widgets
import { ExecutiveSummary } from './widgets/ExecutiveSummary';
import { ApprovalQueue } from './widgets/ApprovalQueue';
import { CashflowChart } from './widgets/CashflowChart';
import { SystemMonitor } from './widgets/SystemMonitor';
import { AgendaCalendar } from './widgets/AgendaCalendar';
import { CorrespondenceWidget } from './widgets/CorrespondenceWidget';
import { DepartmentProgress } from './widgets/DepartmentProgress';
import { TaskList } from './widgets/TaskList';
import { ProjectTimeline } from './widgets/ProjectTimeline';
import { EventCountdown } from './widgets/EventCountdown';
import { CommitteeStructure } from './widgets/CommitteeStructure';
import { TicketSales } from './widgets/TicketSales';

// Map widget keys to actual components
const WidgetComponents: Record<string, React.FC<any>> = {
  'ExecutiveSummary': ExecutiveSummary,
  'ApprovalQueue': ApprovalQueue,
  'CashflowChart': CashflowChart,
  'SystemMonitor': SystemMonitor,
  'AgendaCalendar': AgendaCalendar,
  'CorrespondenceWidget': CorrespondenceWidget,
  'DepartmentProgress': DepartmentProgress,
  'TaskList': TaskList,
  'ProjectTimeline': ProjectTimeline,
  'EventCountdown': EventCountdown,
  'CommitteeStructure': CommitteeStructure,
  'TicketSales': TicketSales,
  
  // Placeholder for missing widgets
  default: ({ title }) => (
    <div className="glass-subtle border border-sage/10 rounded-2xl p-6 flex flex-col items-center justify-center h-48 text-foreground/40 text-sm">
      <div className="w-12 h-12 rounded-full bg-sage/5 border border-sage/10 mb-3 flex items-center justify-center">
        <span className="text-xl">🧩</span>
      </div>
      Widget: {title} (WIP)
    </div>
  )
};

interface DashboardRendererProps {
  config: DashboardConfig;
  profile: UserProfile | null;
}

export function DashboardRenderer({ config, profile }: DashboardRendererProps) {
  const [metrics, setMetrics] = useState<any>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        setLoading(true);
        const res = await ImsApiService.getDashboardMetrics();
        if (res.data) {
          setMetrics(res.data);
        }
      } catch (error) {
        console.error('Failed to fetch dashboard metrics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
  }, [config.roleSlug]);

  const getGridSpanClass = (size: string) => {
    switch(size) {
      case 'small': return 'col-span-1';
      case 'medium': return 'col-span-1 md:col-span-2 lg:col-span-1 xl:col-span-1';
      case 'large': return 'col-span-1 md:col-span-2 lg:col-span-2 xl:col-span-2';
      case 'full': return 'col-span-1 md:col-span-2 lg:col-span-3 xl:col-span-3';
      default: return 'col-span-1 md:col-span-2 lg:col-span-1';
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-8 w-full max-w-full overflow-hidden animate-pulse">
        <div className="h-32 bg-sage/5 rounded-2xl border border-sage/10"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1,2,3,4].map(i => <div key={i} className="h-32 bg-sage/5 rounded-2xl border border-sage/10"></div>)}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 w-full max-w-full overflow-hidden">
      {/* 1. Greeting Banner */}
      <section className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-active rounded-2xl p-6 md:p-8 border border-sage/10 shadow-lg relative overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-sage/5 blur-3xl rounded-full -mr-20 -mt-20 pointer-events-none" />
        
        <div className="flex flex-col gap-2 relative z-10">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-foreground font-bold text-xl md:text-2xl tracking-tight">
              {profile?.name ? `Hai, ${profile.name}` : 'Memuat...'}
            </h2>
            <span className="text-[11px] font-medium text-sage bg-sage/10 px-2.5 py-0.5 rounded-full border border-sage/20 inline-flex items-center">
              {config.roleName}
            </span>
          </div>
          <p className="text-sm text-foreground/50 leading-relaxed max-w-2xl">
            {config.greeting}
          </p>
        </div>

        {/* Quick Actions at the top for desktop, or floating in mobile */}
        <div className="relative z-10 mt-2 md:mt-0 overflow-x-auto pb-2 -mx-6 px-6 md:mx-0 md:px-0 md:pb-0 md:overflow-visible flex-nowrap md:flex-wrap flex shrink-0">
          <QuickActions actions={config.quickActions} />
        </div>
      </section>

      <KPIGrid>
        {config.kpis.map((kpi) => (
          <KPICard 
            key={kpi.id} 
            config={kpi} 
            value={metrics[kpi.valueKey] ?? '0'} 
            trend={kpi.trendKey ? metrics[kpi.trendKey] : undefined}
          />
        ))}
      </KPIGrid>

      {/* 3. Main Widget Area */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {config.widgets.map((widget) => {
          const WidgetComponent = WidgetComponents[widget.component] || WidgetComponents.default;
          return (
            <div key={widget.id} className={getGridSpanClass(widget.size)}>
              <WidgetComponent title={widget.component} metrics={metrics} {...widget.props} />
            </div>
          );
        })}
      </section>
    </div>
  );
}
