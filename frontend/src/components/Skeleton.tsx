"use client";
import { cn } from "@/lib/utils";

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-white/8",
        className
      )}
    />
  );
}

export function SkeletonCard({ rows = 3 }: { rows?: number }) {
  return (
    <div className="bg-bg-elevated border border-border rounded-xl p-5 space-y-3">
      <div className="flex items-center justify-between">
        <Skeleton className="h-5 w-28" />
        <Skeleton className="h-5 w-16" />
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className={`h-4 ${i === rows - 1 ? "w-2/3" : "w-full"}`} />
      ))}
      <div className="flex gap-2 pt-1">
        <Skeleton className="h-7 w-20 rounded-full" />
        <Skeleton className="h-7 w-20 rounded-full" />
      </div>
    </div>
  );
}

export function SkeletonTripCard() {
  return (
    <div className="bg-bg-elevated border border-border rounded-xl p-4 flex gap-4">
      <Skeleton className="w-10 h-10 rounded-lg flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-3 w-32" />
        <Skeleton className="h-3 w-24" />
      </div>
      <Skeleton className="h-8 w-20 rounded-lg self-center" />
    </div>
  );
}

export function SkeletonSearchResult() {
  return (
    <div className="bg-bg-elevated border border-border rounded-xl p-5">
      <div className="flex items-start justify-between mb-4">
        <div className="space-y-2">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-3 w-24" />
        </div>
        <div className="text-right space-y-2">
          <Skeleton className="h-6 w-20" />
          <Skeleton className="h-3 w-16" />
        </div>
      </div>
      <div className="flex items-center gap-6 mb-4">
        <div className="space-y-1">
          <Skeleton className="h-6 w-16" />
          <Skeleton className="h-3 w-12" />
        </div>
        <Skeleton className="flex-1 h-px" />
        <div className="space-y-1 text-right">
          <Skeleton className="h-6 w-16" />
          <Skeleton className="h-3 w-12" />
        </div>
      </div>
      <div className="flex gap-2">
        {[60, 72, 80, 56].map((w, i) => (
          <Skeleton key={i} className={`h-6 w-${w} rounded-full`} />
        ))}
      </div>
    </div>
  );
}
