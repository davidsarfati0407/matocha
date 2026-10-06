import { cn } from "@/lib/utils";

/** Page gutter, consistent across every section. */
export function Container({
  children,
  className,
  wide = false,
}: {
  children: React.ReactNode;
  className?: string;
  wide?: boolean;
}) {
  return (
    <div
      className={cn(
        "mx-auto w-full px-5 sm:px-8 lg:px-12",
        wide ? "max-w-[1600px]" : "max-w-[1360px]",
        className,
      )}
    >
      {children}
    </div>
  );
}

/** Editorial label: `01 — DAILY BOX`, wide tracking, with a small coral dot. */
export function EditorialLabel({
  index,
  children,
  className,
  dot = true,
}: {
  index?: string;
  children: React.ReactNode;
  className?: string;
  dot?: boolean;
}) {
  return (
    <p className={cn("u-label flex items-center gap-3", className)}>
      {dot && (
        <span
          aria-hidden="true"
          className="h-1.5 w-1.5 shrink-0 rounded-full bg-coral"
        />
      )}
      {index && (
        <>
          <span className="tabular-nums opacity-60">{index}</span>
          <span aria-hidden="true" className="h-px w-6 bg-current opacity-30" />
        </>
      )}
      <span className="opacity-60">{children}</span>
    </p>
  );
}
