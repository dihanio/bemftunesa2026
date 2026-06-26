import React from 'react';

interface KPIGridProps {
  children: React.ReactNode;
}

export function KPIGrid({ children }: KPIGridProps) {
  return (
    <section className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 overflow-x-auto pb-2 -mx-4 px-4 md:mx-0 md:px-0 md:pb-0 md:overflow-visible">
      {children}
    </section>
  );
}
