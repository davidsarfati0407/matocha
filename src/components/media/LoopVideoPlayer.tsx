"use client";

import { useEffect, useRef, useState } from "react";
import type { VideoSources } from "./LoopVideo";

/** Client half of LoopVideo: still first, video only near the viewport and with motion allowed. */
export function LoopVideoPlayer({
  sources,
  poster,
  label,
  children,
  className,
}: {
  sources: VideoSources;
  poster?: string;
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  const box = useRef<HTMLDivElement>(null);
  const [play, setPlay] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const el = box.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => e.isIntersecting && (setPlay(true), io.disconnect()), { rootMargin: "200px" });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={box} className={className}>
      {play ? (
        <video autoPlay muted loop playsInline poster={poster} aria-label={label} className="block h-auto w-full">
          {sources.webm && <source src={sources.webm} type="video/webm" />}
          {sources.mp4 && <source src={sources.mp4} type="video/mp4" />}
        </video>
      ) : (
        children
      )}
    </div>
  );
}
