import { cn } from "@/lib/utils";

/**
 * Continuously scrolling brand strip. The track holds the item list twice and
 * translates by exactly -50%, so the loop is seamless. Movement is CSS-driven
 * (compositor only) and is switched off by `prefers-reduced-motion`.
 */
export function Marquee({
  items,
  className,
  duration = 52,
  reverse = false,
  separator = "✦",
  separatorClassName = "text-coral",
}: {
  items: readonly string[];
  className?: string;
  /** Seconds for one full pass. Higher is slower. */
  duration?: number;
  reverse?: boolean;
  separator?: string;
  separatorClassName?: string;
}) {
  const sequence = [...items, ...items];

  return (
    <div
      className={cn("relative flex w-full overflow-hidden", className)}
      aria-hidden="true"
    >
      <div
        className="marquee-track flex w-max shrink-0 items-center"
        style={{
          ["--marquee-duration" as string]: `${duration}s`,
          animationDirection: reverse ? "reverse" : "normal",
        }}
      >
        {sequence.map((item, index) => (
          <span key={`${item}-${index}`} className="flex items-center">
            <span className="u-caps px-[0.4em] text-[clamp(1.7rem,4vw,3.2rem)] whitespace-nowrap">
              {item}
            </span>
            <span
              className={cn(
                "px-[0.4em] text-[clamp(0.7rem,1.4vw,1.05rem)]",
                separatorClassName,
              )}
            >
              {separator}
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}
