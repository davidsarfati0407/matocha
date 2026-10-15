"use client";
/**
 * Flux d'événements en direct (activity_events) pour la map.
 * 1. Supabase Realtime (Postgres Changes) quand il est disponible ;
 * 2. NEXT_PUBLIC_REALTIME=sse : flux SSE du serveur Next (Postgres LISTEN/NOTIFY),
 *    pour une stack sans serveur Realtime — même latence (< 1 s) ;
 * 3. sinon, repli automatique sur un sondage toutes les secondes, signalé à
 *    l'interface (mode « sondage ») : on ne prétend pas faire du temps réel.
 */
import type { SupabaseClient } from "@supabase/supabase-js";

export interface ActivityEvent {
  id: string;
  type: string;
  entity: string;
  entity_id: string | null;
  payload: Record<string, unknown>;
  at: string;
}

export type RealtimeMode = "connexion" | "temps_reel" | "sondage";

export function subscribeActivity(
  supabase: SupabaseClient,
  orgId: string,
  onEvent: (e: ActivityEvent) => void,
  onMode: (m: RealtimeMode) => void,
): () => void {
  let stopped = false;
  let pollTimer: ReturnType<typeof setTimeout> | null = null;
  let subscribed = false;
  let lastAt = new Date().toISOString();
  const seen = new Set<string>();
  const emit = (e: ActivityEvent) => {
    if (seen.has(e.id)) return;
    seen.add(e.id);
    if (e.at > lastAt) lastAt = e.at;
    onEvent(e);
  };

  const poll = async () => {
    if (stopped) return;
    const { data } = await supabase.from("activity_events").select("id, type, entity, entity_id, payload, at").gt("at", lastAt).order("at").limit(50);
    for (const e of data ?? []) emit(e as ActivityEvent);
    pollTimer = setTimeout(poll, document.hidden ? 4000 : 1000);
  };
  const startPolling = () => {
    if (pollTimer || stopped) return;
    onMode("sondage");
    void poll();
  };

  // Flux SSE (Postgres LISTEN/NOTIFY via le serveur Next) ; repli sur le sondage en cas d'échec.
  if (process.env.NEXT_PUBLIC_REALTIME === "sse" && typeof EventSource !== "undefined") {
    onMode("connexion");
    let es: EventSource | null = null;
    let failures = 0;
    const open = () => {
      if (stopped) return;
      es = new EventSource("/api/realtime");
      es.addEventListener("ready", () => {
        failures = 0;
        onMode("temps_reel");
        if (pollTimer) {
          clearTimeout(pollTimer);
          pollTimer = null;
        }
        void catchUp(); // événements manqués pendant une coupure
      });
      es.addEventListener("activity", (m) => {
        try {
          emit(JSON.parse((m as MessageEvent).data) as ActivityEvent);
        } catch {
          /* message illisible */
        }
      });
      es.onerror = () => {
        if (++failures >= 3) {
          es?.close();
          es = null;
          startPolling();
          setTimeout(() => {
            if (!stopped && pollTimer) {
              clearTimeout(pollTimer);
              pollTimer = null;
              failures = 0;
              open();
            }
          }, 30_000);
        }
      };
    };
    const catchUp = async () => {
      const { data } = await supabase.from("activity_events").select("id, type, entity, entity_id, payload, at").gt("at", lastAt).order("at").limit(50);
      for (const e of data ?? []) emit(e as ActivityEvent);
    };
    open();
    return () => {
      stopped = true;
      es?.close();
      if (pollTimer) clearTimeout(pollTimer);
    };
  }

  // Stack locale sans serveur Realtime : sondage direct (évite des erreurs WebSocket en console).
  if (process.env.NEXT_PUBLIC_REALTIME === "off") {
    startPolling();
    return () => {
      stopped = true;
      if (pollTimer) clearTimeout(pollTimer);
    };
  }

  onMode("connexion");
  const channel = supabase
    .channel(`activity:${orgId}`)
    .on("postgres_changes", { event: "INSERT", schema: "public", table: "activity_events", filter: `org_id=eq.${orgId}` }, (payload) => emit(payload.new as ActivityEvent))
    .subscribe((status) => {
      if (status === "SUBSCRIBED") {
        subscribed = true;
        onMode("temps_reel");
        if (pollTimer) {
          clearTimeout(pollTimer);
          pollTimer = null;
        }
      } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT" || status === "CLOSED") {
        startPolling();
      }
    });
  // Si rien n'a répondu en 3 s (pas de serveur Realtime), on bascule.
  const fallback = setTimeout(() => !subscribed && startPolling(), 3000);
  const onVisible = () => {
    if (!document.hidden && pollTimer) {
      clearTimeout(pollTimer);
      pollTimer = null;
      void poll();
    }
  };
  document.addEventListener("visibilitychange", onVisible);

  return () => {
    stopped = true;
    clearTimeout(fallback);
    if (pollTimer) clearTimeout(pollTimer);
    document.removeEventListener("visibilitychange", onVisible);
    void supabase.removeChannel(channel);
  };
}
