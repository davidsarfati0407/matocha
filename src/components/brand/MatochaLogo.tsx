import { cn } from "@/lib/utils";

/*
 * MATOCHA wordmark — purely typographic. The drawn glass that used to sit
 * next to it is gone: the product is shown only through its renders. When the
 * packaging logo exists as a vector file, it replaces this component.
 */
export function MatochaLogo({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-baseline leading-none font-semibold tracking-[-0.05em] uppercase select-none", className)}>
      Matocha
    </span>
  );
}

/** Full-bleed footer lockup. */
export function WordmarkGiant({ className }: { className?: string }) {
  return (
    <span className={cn("block w-full leading-[0.8] font-semibold tracking-[-0.055em] uppercase", className)}>
      Matocha
    </span>
  );
}
