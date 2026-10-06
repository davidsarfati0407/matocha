import { cn } from "@/lib/utils";

/** M13 — loading indicator: a stylised whisk turning. */
export function Whisk({ className, label }: { className?: string; label?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      className={cn("whisk-spin", className)}
      role={label ? "img" : undefined}
      aria-hidden={label ? undefined : true}
      aria-label={label}
    >
      <g fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <path d="M16 3 C8 10 8 22 16 29 C24 22 24 10 16 3 Z" />
        <path d="M16 3 C12 12 12 20 16 29 M16 3 C20 12 20 20 16 29" />
      </g>
    </svg>
  );
}

/** Skeleton block at the final dimensions of what it stands for. */
export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden="true" className={cn("animate-pulse rounded bg-lait-profond", className)} />;
}
