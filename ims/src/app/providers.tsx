"use client";

import React, { ReactNode } from 'react';
import { DashboardProvider } from '@/components/dashboards/provider/DashboardProvider';
import { ConfirmationProvider } from '@/components/ui/CustomConfirm';

/**
 * Client-side providers wrapper
 * Wraps children with necessary context providers for the IMS application
 */
export function Providers({ children }: { children: ReactNode }) {
  return (
    <ConfirmationProvider>
      <DashboardProvider>
        {children}
      </DashboardProvider>
    </ConfirmationProvider>
  );
}
