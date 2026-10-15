/**
 * Flux SSE des événements de l'organisation de l'utilisateur (< 1 s).
 * Authentifié par la session Supabase ; seuls les événements de SON
 * organisation sont relayés (même périmètre que la RLS d'activity_events).
 */
import { hub, type HubEvent } from "@/lib/realtime/hub";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new Response("non authentifié", { status: 401 });
  const { data: prof } = await supabase.from("profiles").select("org_id").eq("user_id", user.id).single();
  if (!prof) return new Response("profil introuvable", { status: 403 });
  hub.ensure();
  const enc = new TextEncoder();
  let cleanup = () => {};
  const stream = new ReadableStream<Uint8Array>({
    start(ctrl) {
      const send = (s: string) => {
        try {
          ctrl.enqueue(enc.encode(s));
        } catch {
          cleanup();
        }
      };
      const onEvent = async (e: HubEvent) => {
        if (e.org_id !== prof.org_id) return;
        let ev = e;
        if (e.truncated) {
          const { data } = await supabase.from("activity_events").select("id, org_id, type, entity, entity_id, payload, at").eq("id", e.id).maybeSingle();
          if (data) ev = data as HubEvent;
        }
        const pub = { id: ev.id, type: ev.type, entity: ev.entity, entity_id: ev.entity_id, payload: ev.payload, at: ev.at };
        send(`id: ${pub.id}\nevent: activity\ndata: ${JSON.stringify(pub)}\n\n`);
      };
      hub.on("event", onEvent);
      send(`retry: 1500\nevent: ready\ndata: {"listening":${hub.ready}}\n\n`);
      const ping = setInterval(() => send(`: ping\n\n`), 15_000);
      cleanup = () => {
        clearInterval(ping);
        hub.off("event", onEvent);
      };
      req.signal.addEventListener("abort", () => {
        cleanup();
        try {
          ctrl.close();
        } catch {
          /* déjà fermé */
        }
      });
    },
    cancel() {
      cleanup();
    },
  });
  return new Response(stream, { headers: { "content-type": "text/event-stream; charset=utf-8", "cache-control": "no-cache, no-transform", connection: "keep-alive", "x-accel-buffering": "no" } });
}
