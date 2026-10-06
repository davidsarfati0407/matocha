import Link from "next/link";
import { cn } from "@/lib/utils";

/*
 * Buttons are rectangular and typographic — no pills, no shadows.
 * Deep green carries the commerce actions; coral arrives on hover, which is
 * where the accent earns its place without ever becoming a surface.
 */

type Variant = "solid" | "coral" | "ivory" | "outline" | "outlineLight";
type Size = "md" | "lg";

const VARIANTS: Record<Variant, { base: string; wipe: string }> = {
  /* The commerce action on ivory grounds. */
  solid: {
    base: "bg-green text-ivory hover:text-black",
    wipe: "bg-coral",
  },
  /* The accent CTA, used once per page at most. */
  coral: {
    base: "bg-coral text-black hover:text-ivory",
    wipe: "bg-green",
  },
  /* The commerce action on green grounds. */
  ivory: {
    base: "bg-ivory text-black hover:text-black",
    wipe: "bg-coral",
  },
  /* Secondary on ivory. */
  outline: {
    base: "border border-black/25 text-black hover:text-black",
    wipe: "bg-coral",
  },
  /* Secondary on green. */
  outlineLight: {
    base: "border border-ivory/35 text-ivory hover:text-black",
    wipe: "bg-coral",
  },
};

const SIZES: Record<Size, string> = {
  md: "h-12 px-6 text-[0.7rem]",
  lg: "h-14 px-8 text-[0.72rem] sm:h-16 sm:px-10",
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
    "group relative inline-flex items-center justify-center overflow-hidden",
    "u-label font-semibold whitespace-nowrap",
    "transition-colors duration-500 ease-[var(--ease-matocha)]",
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
          "absolute inset-0 origin-bottom scale-y-0 transition-transform duration-500 ease-[var(--ease-matocha)] group-hover:scale-y-100",
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

/**
 * Secondary action: a label, a rule that redraws on hover, and an arrow that
 * steps forward. No box.
 */
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
        "group u-label relative inline-flex items-center gap-2 pb-1 font-semibold",
        className,
      )}
    >
      {children}
      <span
        aria-hidden="true"
        className="transition-transform duration-500 ease-[var(--ease-matocha)] group-hover:translate-x-1"
      >
        →
      </span>
      <span className="absolute inset-x-0 bottom-0 h-px origin-left scale-x-100 bg-current opacity-30 transition-transform duration-500 ease-[var(--ease-matocha)] group-hover:scale-x-0" />
      <span className="absolute inset-x-0 bottom-0 h-px origin-right scale-x-0 bg-coral transition-transform delay-150 duration-500 ease-[var(--ease-matocha)] group-hover:origin-left group-hover:scale-x-100" />
    </Link>
  );
}
