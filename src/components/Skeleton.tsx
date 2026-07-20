import React from 'react';

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className = '' }: SkeletonProps) {
  return (
    <div className={`animate-pulse bg-[color:var(--surface-soft)] rounded-xl ${className}`} />
  );
}

export function WatchlistSkeleton() {
  return (
    <div className="bg-[color:var(--surface)] border border-[color:var(--border)] rounded-2xl p-4 sm:p-6 shadow-sm overflow-hidden flex flex-col sm:flex-row gap-4 sm:gap-6 w-full animate-pulse">
      {/* Image Skeleton */}
      <div className="w-full sm:w-1/3 aspect-[4/3] sm:aspect-auto sm:h-48 rounded-xl bg-[color:var(--surface-soft)] flex-shrink-0" />
      
      {/* Content Skeleton */}
      <div className="flex-1 flex flex-col gap-3 py-2">
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        
        <div className="mt-4 grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-5 w-24" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-5 w-24" />
          </div>
        </div>
        
        <div className="mt-auto pt-4 flex gap-2">
          <Skeleton className="h-8 w-24 rounded-lg" />
          <Skeleton className="h-8 w-24 rounded-lg" />
        </div>
      </div>
    </div>
  );
}
