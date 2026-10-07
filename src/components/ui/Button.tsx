import Link from "next/link";
import { cn } from "@/lib/utils";

type Variant = "solid" | "light" | "outline" | "outlineLight";
type Size = "md" | "lg";

/*
 * Buttons stay rectangular and typographic (v1). Forêt carries the main
 * action; on hover a field of matcha rises from the bottom, like a glass
 * filling.
 */
const VARIANTS: Record<Variant, { base: string; wipe: string }> = {
  solid: { base: "bg-foret text-lait hover:text-encre", wipe: "bg-matcha" },
  light: { base: "bg-lait text-encre", wipe: "bg-mousse" },
  outline: { base: "border border-encre/35 text-encre", wipe: "bg-mousse" },
  outlineLight: { base: "border border-lait/45 text-lait hover:text-encre", wipe: "bg-mousse" },
};

const SIZES: Record<Size, string> = {
  md: "min-h-12 px-6 text-[0.75rem]",
  lg: "min-h-14 px-8 text-[0.8rem]",
};

type CommonProps = {
  variant?: Variant;
  size?: Size;
  full?: boolean;
  className?: string;
  children: React.ReactNode;
};

function classes({ variant = "solid", size = "lg", full, className }: CommonProps) {
  return cn(
    "group relative inline-flex items-center justify-center overflow-hidden rounded-full",
    "u-label font-semibold text-center",
    "transition-[color,transform] duration-[180ms] ease-out active:scale-[0.98]",
    "disabled:pointer-events-none disabled:opacity-45",
    VARIANTS[variant].base,
    SIZES[size],
    full && "w-full",
    className,
  );
}

/** Hover: a field rises from the bottom edge, like liquid filling. */
function Inner({
  variant = "solid",
  children,
}: {
  variant?: Variant;
  children: React.ReactNode;
}) {
  return (
    <>
      <span
        aria-hidden="true"
        className={cn(
          "absolute inset-0 origin-bottom scale-y-0 transition-transform duration-[180ms] ease-out group-hover:scale-y-100 group-focus-visible:scale-y-100",
          VARIANTS[variant].wipe,
        )}
      />
      <span className="relative z-10">{children}</span>
    </>
  );
}

export function Button({
  type = "button",
  onClick,
  disabled,
  ...props
}: CommonProps & {
  type?: "button" | "submit";
  onClick?: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={classes(props)}
    >
      <Inner variant={props.variant}>{props.children}</Inner>
    </button>
  );
}

export function ButtonLink({
  href,
  onClick,
  ...props
}: CommonProps & { href: string; onClick?: () => void }) {
  return (
    <Link href={href} onClick={onClick} className={classes(props)}>
      <Inner variant={props.variant}>{props.children}</Inner>
    </Link>
  );
}

/** Secondary action: an underlined label. No arrow, no box. */
export function TextLink({
  href,
  children,
  className,
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex min-h-11 items-center font-semibold underline decoration-matcha decoration-2 underline-offset-[6px] transition-colors hover:decoration-foret",
        className,
      )}
    >
      {children}
    </Link>
  );
}
