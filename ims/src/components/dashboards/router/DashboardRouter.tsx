import React, { useState, useEffect } from 'react';
import { useDashboardContext } from '../provider/DashboardProvider';
import { getDashboardConfig } from '../../../config/dashboard-registry';
import { composeDashboard } from '../../../core/dashboard/widget-composer';
import { composeNavigation } from '../../../core/dashboard/navigation-composer';
import { DashboardLayout } from '../base/DashboardLayout';
import { NoPermissionState } from '../../ui/states/NoPermissionState';
import { EmptyState } from '../../ui/states/EmptyState';
import { WidgetFactory } from './WidgetFactory';
import { DashboardHeader } from '../../layout/DashboardHeader';
import { DesktopSidebar } from '../../layout/DesktopSidebar';
import { MobileSidebar } from '../../layout/MobileSidebar';
import { DashboardHero } from '../containers/DashboardHero';
import { getWidgetGroupTitle } from '../../../utils/widget-helpers';

export function DashboardRouter() {
  const { profile, activeContext } = useDashboardContext();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Redirect to pending page if user has no role
  useEffect(() => {
    if (!activeContext?.role?.slug && typeof window !== 'undefined') {
      window.location.href = '/pending';
    }
  }, [activeContext]);

  if (!activeContext?.role?.slug) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-canvas">
        <p className="text-sm text-ink-muted">Mengarahkan ke halaman persetujuan...</p>
      </div>
    );
  }

  // 1. Get registry config based on pure role slug
  const dashboardConfig = getDashboardConfig(activeContext.role.slug);

  // 2. Compose widgets (core logic, checking permissions)
  const composedGroups = composeDashboard(profile, dashboardConfig);
  
  // 3. Compose navigation based on permissions
  const navSections = composeNavigation(profile);

  const handleLogout = () => {
    // Temporary client-side logout since auth layer doesn't have it yet
    // ponytail: Implement real logout when auth service provides it
    // Add when: Auth service logout API is implemented.
    document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    window.location.href = '/login';
  };

  // 4. Map composed structural array to actual React Components
  const content = (
    <div className="space-y-10">
      {/* Hero Section with Summary Cards */}
      <DashboardHero 
        userName={profile?.name || 'User'}
        stats={{
          activeEvents: 12,
          totalMembers: 45,
          pendingDocuments: 8,
          completionRate: 87,
        }}
      />

      {/* Render Composed Widget Groups */}
      {composedGroups.map(group => {
        const groupInfo = getWidgetGroupTitle(group.groupId);
        const GroupIcon = groupInfo.icon;
        
        return (
          <section key={group.groupId} className="space-y-5">
            {/* Section Header */}
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-primary/10">
                <GroupIcon className="w-5 h-5 text-primary" />
              </div>
              <h2 className="text-lg font-semibold text-ink">{groupInfo.title}</h2>
              <div className="flex-1 h-px bg-hairline" />
            </div>

            {/* Widget Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {group.widgets.map((widget, index) => {
                const animationDelay = `animate-delay-${Math.min(index * 100, 400)}`;
                
                if (!widget.isPermitted) {
                  return (
                    <div 
                      key={widget.id} 
                      style={{ gridColumn: `span ${widget.defaultPosition.w}` }}
                      className={`animate-fade-in-up ${animationDelay}`}
                    >
                      <NoPermissionState title="Akses Ditolak" message="Membutuhkan permission spesifik" className="h-full" />
                    </div>
                  );
                }

                return (
                  <div 
                    key={widget.id} 
                    style={{ gridColumn: `span ${widget.defaultPosition.w}` }}
                    className={`animate-fade-in-up ${animationDelay}`}
                  >
                    <WidgetFactory componentName={widget.componentName} />
                  </div>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );

  return (
    <>
      <DashboardLayout 
        header={
          <DashboardHeader 
            profile={profile}
            onOpenSidebar={() => setIsSidebarOpen(true)}
          />
        }
        sidebar={
          <DesktopSidebar 
            sections={navSections}
            onLogout={handleLogout}
            roleName={activeContext.role.name}
          />
        }
        content={content}
        footer={<p>&copy; {new Date().getFullYear()} BEM FT UNESA</p>}
      />
      <MobileSidebar 
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        sections={navSections}
        onLogout={handleLogout}
      />
    </>
  );
}
