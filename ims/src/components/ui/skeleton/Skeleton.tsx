import React from 'react';

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className = '' }: SkeletonProps) {
  return (
    <div className={`animate-pulse bg-surface-2 rounded ${className}`} />
  );
}

export function SkeletonStatWidget() {
  return (
    <div className="p-6 border border-hairline rounded-xl bg-surface-1 shadow-md h-full">
      <Skeleton className="h-4 w-24 mb-3" />
      <div className="flex items-end justify-between">
        <Skeleton className="h-8 w-16" />
        <Skeleton className="h-4 w-12" />
      </div>
    </div>
  );
}

export function SkeletonListWidget() {
  return (
    <div className="p-0 border border-hairline rounded-xl bg-surface-1 shadow-md overflow-hidden h-full flex flex-col">
      <div className="p-5 border-b border-hairline">
        <Skeleton className="h-5 w-32" />
      </div>
      <div className="p-4 space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex gap-4">
            <Skeleton className="h-4 w-1/4" />
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-4 w-1/5" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function SkeletonQuickActionWidget() {
  return (
    <div className="p-6 border border-hairline rounded-xl bg-surface-1 shadow-md h-full">
      <Skeleton className="h-4 w-24 mb-5" />
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex flex-col items-center justify-center p-4 border border-hairline rounded-lg bg-surface-2">
            <Skeleton className="w-10 h-10 rounded-full mb-2" />
            <Skeleton className="h-3 w-16" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function SkeletonTimelineWidget() {
  return (
    <div className="p-6 border border-hairline rounded-xl bg-surface-1 shadow-md h-full">
      <Skeleton className="h-5 w-32 mb-6" />
      <div className="space-y-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex gap-4">
            <Skeleton className="w-5 h-5 rounded-full flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function SkeletonDashboardHero() {
  return (
    <div className="space-y-6">
      {/* Hero Skeleton */}
      <div className="relative overflow-hidden rounded-2xl bg-surface-2 p-8 shadow-lg">
        <Skeleton className="h-10 w-64 mb-3" />
        <Skeleton className="h-4 w-96" />
      </div>

      {/* Summary Cards Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="rounded-xl bg-surface-1 border border-hairline p-5 shadow-md">
            <div className="flex items-start justify-between mb-3">
              <Skeleton className="w-10 h-10 rounded-lg" />
            </div>
            <Skeleton className="h-8 w-16 mb-1" />
            <Skeleton className="h-3 w-24" />
          </div>
        ))}
      </div>
    </div>
  );
}
