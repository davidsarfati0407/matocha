import { cn } from "@/lib/utils";

/*
 * Editorial annotations.
 *
 * Small labels tied to a composition by a hairline and a dot — the language of
 * a product diagram, borrowed for a campaign. They carry real information (2G,
 * 30 STICKS, SEALED) so they add density without adding filler.
 */

export function Annotation({
  children,
  className,
  /** Which side the connecting rule leaves from. */
  from = "left",
  length = "3rem",
  tone = "dark",
}: {
  children: React.ReactNode;
  className?: string;
  from?: "left" | "right";
  length?: string;
  tone?: "dark" | "light";
}) {
  const line = tone === "dark" ? "bg-black/30" : "bg-ivory/40";
  const dot = tone === "dark" ? "bg-coral" : "bg-coral";

  return (
    <span
      className={cn(
        "u-label pointer-events-none inline-flex items-center gap-2 whitespace-nowrap",
        from === "right" && "flex-row-reverse",
        className,
      )}
    >
      <span className="inline-flex items-center gap-2">
        <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", dot)} />
        <span className={cn("h-px shrink-0", line)} style={{ width: length }} />
      </span>
      <span className={tone === "dark" ? "opacity-70" : "opacity-80"}>
        {children}
      </span>
    </span>
  );
}

/** A hand-drawn-ish curved arrow, for pointing at the product. */
export function CurvedArrow({
  className,
  tone = "dark",
  flip = false,
}: {
  className?: string;
  tone?: "dark" | "light" | "coral";
  flip?: boolean;
}) {
  const stroke =
    tone === "light" ? "#F3EFE5" : tone === "coral" ? "#E07A5F" : "#161713";

  return (
    <svg
      viewBox="0 0 90 60"
      className={cn("h-full w-full", flip && "-scale-x-100", className)}
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M4 8 C 26 2, 58 8, 74 34"
        stroke={stroke}
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      <path
        d="M64 30 L75 36 L70 24"
        stroke={stroke}
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * Coordinate-style micro type: `01 / 30`, `JAPAN`, `MATCHA`.
 * Fills the corners of a composition the way a contact sheet does.
 */
export function MicroMark({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span className={cn("u-label opacity-40", className)}>{children}</span>
  );
}
