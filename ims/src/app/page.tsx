'use client';

import { DashboardProvider } from '@/components/dashboards/provider/DashboardProvider';
import { DashboardRouter } from '@/components/dashboards/router/DashboardRouter';

/**
 * Murni Entry Point
 * Mount the Dashboard Provider which injects the context for the Router.
 */
export default function Page() {
  return (
    <DashboardProvider>
      <DashboardRouter />
    </DashboardProvider>
  );
}
