import { ViewTransition } from "react";

/** Transition douce back-office ↔ map (zoom et fondu), sans rechargement. */
export default function MapLayout({ children }: { children: React.ReactNode }) {
  return (
    <ViewTransition enter="face-map-enter" exit="face-map-exit" default="none">
      {children}
    </ViewTransition>
  );
}
