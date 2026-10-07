import { LoopVideoPlayer } from "./LoopVideoPlayer";

export type VideoSources = { webm?: string; mp4?: string };

/**
 * Ready for a future 3–5 s product loop. No video exists yet: without
 * sources this renders the still `children` and ships no JavaScript.
 *
 * When a validated loop is added (wordmark and seals kept exactly, no
 * morphing), pass its WebM/MP4 and a poster taken from the same render; the
 * player loads it only near the viewport and never plays in reduced motion.
 */
export function LoopVideo({
  sources,
  poster,
  label,
  children,
  className,
}: {
  sources?: VideoSources;
  poster?: string;
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  if (!sources?.webm && !sources?.mp4) return <>{children}</>;
  return (
    <LoopVideoPlayer sources={sources} poster={poster} label={label} className={className}>
      {children}
    </LoopVideoPlayer>
  );
}
