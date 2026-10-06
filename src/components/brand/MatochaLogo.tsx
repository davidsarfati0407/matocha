import { MatochaGlass, MatochaWave } from "./MatochaGlass";
import { cn } from "@/lib/utils";

/*
 * MATOCHA wordmark and lockups.
 *
 * The wordmark is purely typographic — tight caps, no leaf, no letter swapped
 * for a symbol. Recognition comes from the glass sitting next to it, not from
 * decorating the letters.
 */

export function Wordmark({
  className,
  compact = false,
}: {
  className?: string;
  /** Drops the descriptor, leaving MATOCHA alone. */
  compact?: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-baseline gap-[0.45em] leading-none uppercase select-none",
        className,
      )}
    >
      <span className="font-semibold tracking-[-0.05em]">Matocha</span>
      {!compact && (
        <span className="text-[0.58em] font-normal tracking-[0.2em] opacity-65">
          Matcha
        </span>
      )}
    </span>
  );
}

/**
 * Lockups.
 *
 * `inline`   — glass, then wordmark. The header default.
 * `stacked`  — wordmark over the glass. Vertical space, print, packaging.
 * `wave`     — wordmark with the liquid wave under it.
 * `wordmark` — type alone.
 * `glass`    — object alone: favicon, avatar, sticker, micro-interaction.
 */
export function MatochaLogo({
  variant = "inline",
  className,
  glassVariant = "classic",
  ink,
  liquid,
}: {
  variant?: "inline" | "stacked" | "wave" | "wordmark" | "glass";
  className?: string;
  glassVariant?: "classic" | "pour" | "ice" | "whisked" | "empty";
  ink?: string;
  liquid?: string;
}) {
  if (variant === "glass") {
    return (
      <span className={cn("inline-block", className)}>
        <MatochaGlass
          variant={glassVariant}
          ink={ink}
          liquid={liquid}
          title={"Matocha"}
        />
      </span>
    );
  }

  if (variant === "wordmark") {
    return <Wordmark className={className} compact />;
  }

  if (variant === "stacked") {
    return (
      <span className={cn("inline-flex flex-col items-center gap-3", className)}>
        <Wordmark compact className="text-[1.6em]" />
        <span className="block h-[2.4em] w-[2.4em]">
          <MatochaGlass variant={glassVariant} ink={ink} liquid={liquid} />
        </span>
      </span>
    );
  }

  if (variant === "wave") {
    return (
      <span className={cn("inline-flex flex-col items-start gap-2", className)}>
        <Wordmark compact />
        <MatochaWave className="h-[0.4em]" color={liquid} />
      </span>
    );
  }

  return (
    <span className={cn("inline-flex items-center gap-[0.5em]", className)}>
      <span className="block h-[1.35em] w-[1.35em] shrink-0">
        <MatochaGlass variant={glassVariant} ink={ink} liquid={liquid} />
      </span>
      <Wordmark compact />
    </span>
  );
}

/** Full-bleed footer lockup. */
export function WordmarkGiant({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "block w-full leading-[0.8] font-semibold tracking-[-0.055em] uppercase",
        className,
      )}
    >
      Matocha
    </span>
  );
}
