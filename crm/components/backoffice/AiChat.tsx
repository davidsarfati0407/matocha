"use client";
/** Conversation avec l'assistant (implémentation complète dans le module IA). */
export function AiChat({ compact = false }: { compact?: boolean }) {
  return <div className={`p-4 text-sm text-muted ${compact ? "" : ""}`}>Assistant en cours d’installation.</div>;
}
