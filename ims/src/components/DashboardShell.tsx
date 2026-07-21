import React, { ReactNode } from 'react';
import { DashboardLayout } from './dashboards/base/DashboardLayout';

/**
 * ponytail: Temporary shim to keep old pages compiling without massive rewrites.
 * Add when: migrating those pages to the new router/provider architecture.
 */
export default function DashboardShell({ children, ...props }: { children: ReactNode; [key: string]: unknown }) {
  return <DashboardLayout content={children} />;
}
