import React, { createContext, useContext, ReactNode } from 'react';
import { UserProfileBase, ActiveContext } from '../../../types/rbac';
import { useAuth } from '../../../core/auth/useAuth';
import { LoadingState } from '../../ui/states/LoadingState';
import { ErrorState } from '../../ui/states/ErrorState';

interface DashboardContextValue {
  profile: UserProfileBase | null;
  activeContext: ActiveContext | null;
  isLoading: boolean;
  error: Error | null;
  reloadProfile: () => Promise<void>;
}

const DashboardContext = createContext<DashboardContextValue | undefined>(undefined);

export function DashboardProvider({ children }: { children: ReactNode }) {
  const { profile, activeContext, isLoading, error, reload } = useAuth();

  if (isLoading) {
    return (
      <>
        <style dangerouslySetInnerHTML={{__html: `
          @keyframes progressSlide {
            0% { transform: translateX(-100%); }
            50% { transform: translateX(250%); }
            100% { transform: translateX(-100%); }
          }
        `}} />
        <div className="h-screen w-full flex items-center justify-center bg-canvas">
          <div className="w-64 space-y-3">
            {/* Minimalist horizontal progress bar */}
            <div className="h-1 w-full bg-ink/5 rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary rounded-full"
                style={{
                  width: '40%',
                  animation: 'progressSlide 1.5s ease-in-out infinite',
                }}
              />
            </div>
            <p className="text-xs text-ink-muted text-center font-medium">Memuat Sesi...</p>
          </div>
        </div>
      </>
    );
  }

  if (error) {
    return <ErrorState title="Gagal Memuat Sesi" error={error} retry={reload} className="h-screen border-none" />;
  }

  // Check if user has no role assigned
  if (profile && !profile.role) {
    if (typeof window !== 'undefined') {
      window.location.href = '/pending';
    }
    return (
      <div className="h-screen w-full flex items-center justify-center bg-canvas">
        <p className="text-sm text-ink-muted">Mengarahkan ke halaman persetujuan...</p>
      </div>
    );
  }

  return (
    <DashboardContext.Provider value={{ profile, activeContext, isLoading, error, reloadProfile: reload }}>
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboardContext() {
  const context = useContext(DashboardContext);
  if (context === undefined) {
    throw new Error('useDashboardContext must be used within a DashboardProvider');
  }
  return context;
}
