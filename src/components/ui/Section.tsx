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
