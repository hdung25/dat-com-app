import React from 'react';

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className = '' }: SkeletonProps) {
  return <div className={`skeleton ${className}`} />;
}

export function MenuCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl shadow-[0_1px_2px_rgba(0,0,0,0.04),0_4px_16px_rgba(0,0,0,0.08)] overflow-hidden">
      <Skeleton className="w-full h-48" />
      <div className="p-4 space-y-3">
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-7 w-1/3" />
        <Skeleton className="h-12 w-full rounded-xl" />
      </div>
    </div>
  );
}

export function MenuListSkeleton() {
  return (
    <div className="space-y-4 px-4">
      <MenuCardSkeleton />
      <MenuCardSkeleton />
      <MenuCardSkeleton />
    </div>
  );
}
