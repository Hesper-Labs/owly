import { cn } from "@/lib/utils";

interface SkeletonBaseProps {
  className?: string;
}

function SkeletonPulse({ className }: SkeletonBaseProps) {
  return (
    <div
      className={cn(
        "animate-pulse rounded bg-owly-border/60",
        className
      )}
    />
  );
}

interface SkeletonLineProps extends SkeletonBaseProps {
  width?: string;
  count?: number;
}

export function SkeletonLine({
  width = "w-full",
  count = 1,
  className,
}: SkeletonLineProps) {
  return (
    <div className={cn("space-y-3", className)}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonPulse
          key={i}
          className={cn(
            "h-4",
            i === count - 1 && count > 1 ? "w-3/4" : width
          )}
        />
      ))}
    </div>
  );
}

interface SkeletonCardProps extends SkeletonBaseProps {
  count?: number;
}

export function SkeletonCard({ count = 1, className }: SkeletonCardProps) {
  return (
    <div className={cn("space-y-4", className)}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="rounded-xl border border-owly-border bg-owly-surface p-5 space-y-4"
        >
          <div className="flex items-center gap-3">
            <SkeletonPulse className="h-10 w-10 rounded-full" />
            <div className="flex-1 space-y-2">
              <SkeletonPulse className="h-4 w-1/3" />
              <SkeletonPulse className="h-3 w-1/2" />
            </div>
          </div>
          <div className="space-y-2">
            <SkeletonPulse className="h-3 w-full" />
            <SkeletonPulse className="h-3 w-5/6" />
            <SkeletonPulse className="h-3 w-2/3" />
          </div>
        </div>
      ))}
    </div>
  );
}

interface SkeletonTableProps extends SkeletonBaseProps {
  rows?: number;
  columns?: number;
}

export function SkeletonTable({
  rows = 5,
  columns = 4,
  className,
}: SkeletonTableProps) {
  return (
    <div className={cn("rounded-xl border border-owly-border bg-owly-surface overflow-hidden", className)}>
      {/* Header */}
      <div className="flex gap-4 border-b border-owly-border bg-owly-bg/50 px-5 py-3">
        {Array.from({ length: columns }).map((_, i) => (
          <SkeletonPulse
            key={i}
            className={cn("h-4 flex-1", i === 0 ? "max-w-[180px]" : "max-w-[120px]")}
          />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIdx) => (
        <div
          key={rowIdx}
          className="flex gap-4 border-b border-owly-border/50 px-5 py-4 last:border-b-0"
        >
          {Array.from({ length: columns }).map((_, colIdx) => (
            <SkeletonPulse
              key={colIdx}
              className={cn("h-4 flex-1", colIdx === 0 ? "max-w-[180px]" : "max-w-[120px]")}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

interface SkeletonAvatarProps extends SkeletonBaseProps {
  size?: "sm" | "md" | "lg";
  count?: number;
}

const avatarSizes = {
  sm: "h-8 w-8",
  md: "h-10 w-10",
  lg: "h-14 w-14",
};

export function SkeletonAvatar({
  size = "md",
  count = 1,
  className,
}: SkeletonAvatarProps) {
  return (
    <div className={cn("flex gap-2", className)}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonPulse
          key={i}
          className={cn("rounded-full", avatarSizes[size])}
        />
      ))}
    </div>
  );
}
