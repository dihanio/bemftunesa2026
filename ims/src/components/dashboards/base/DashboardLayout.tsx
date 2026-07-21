import React, { ReactNode } from 'react';
import { useDashboardContext } from '../provider/DashboardProvider';

interface DashboardLayoutProps {
  sidebar?: ReactNode;
  header?: ReactNode;
  content?: ReactNode;
  footer?: ReactNode;
}

/**
 * Pure layout component.
 * It knows NOTHING about roles, permissions, or widgets.
 * It simply arranges the provided nodes into a grid/flex layout.
 */
export function DashboardLayout({ sidebar, header, content, footer }: DashboardLayoutProps) {
  return (
    <div className="flex h-screen w-full bg-surface-2 overflow-hidden text-ink">
      
      {/* Sidebar Area */}
      {sidebar && (
        <aside className="w-64 flex-shrink-0 h-full border-r border-hairline bg-surface-1">
          {sidebar}
        </aside>
      )}

      {/* Main Container */}
      <div className="flex flex-col flex-1 h-full min-w-0 overflow-hidden">
        
        {/* Header Area */}
        {header && (
          <header className="h-16 flex-shrink-0 border-b border-hairline bg-surface-1 px-6 flex items-center justify-between">
            {header}
          </header>
        )}

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-8 scrollbar-hide">
          <div className="max-w-7xl mx-auto space-y-8">
            {content}
          </div>
        </main>

        {/* Footer Area */}
        {footer && (
          <footer className="py-4 px-6 border-t border-hairline text-sm text-ink-tertiary bg-surface-1 text-center">
            {footer}
          </footer>
        )}
      </div>
    </div>
  );
}
