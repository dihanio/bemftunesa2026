import React from 'react';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'rectangular' | 'circular';
}

export function Skeleton({ className = '', variant = 'rectangular' }: SkeletonProps) {
  const variantClass = {
    text: 'h-4 w-full rounded-sm',
    rectangular: 'rounded-md',
    circular: 'rounded-full',
  }[variant];

  return (
    <div
      className={`animate-pulse bg-white/10 ${variantClass} ${className}`}
      style={{
        backgroundImage:
          'linear-gradient(90deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.09) 50%, rgba(255,255,255,0.03) 100%)',
        backgroundSize: '200% 100%',
      }}
    />
  );
}
