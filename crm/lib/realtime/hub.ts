import "server-only";
/**
 * Concentrateur temps réel côté serveur : UNE connexion Postgres en LISTEN
 * « activity », partagée par tous les flux SSE du processus. Reconnexion
 * automatique avec délai croissant.
 */
import { EventEmitter } from "node:events";
import pg from "pg";

export interface HubEvent {
  id: string;
  org_id: string;
  type: string;
  entity: string;
  entity_id: string | null;
  payload: Record<string, unknown>;
  at: string;
  truncated?: boolean;
}

class Hub extends EventEmitter {
  private client: pg.Client | null = null;
  private connecting = false;
  private retry = 500;
  ready = false;

  constructor() {
    super();
    this.setMaxListeners(1000);
  }

  ensure() {
    if (this.client || this.connecting || !process.env.DATABASE_URL) return;
    this.connecting = true;
    const c = new pg.Client({ connectionString: process.env.DATABASE_URL, application_name: "matocha-realtime-hub" });
    const fail = () => {
      this.ready = false;
      this.client = null;
      this.connecting = false;
      void c.end().catch(() => {});
      setTimeout(() => this.listenerCount("event") > 0 && this.ensure(), this.retry);
      this.retry = Math.min(this.retry * 2, 15_000);
    };
    c.on("error", fail);
    c.on("end", () => this.client === c && fail());
    c.on("notification", (n) => {
      if (n.channel !== "activity" || !n.payload) return;
      try {
        this.emit("event", JSON.parse(n.payload) as HubEvent);
      } catch {
        /* message illisible : ignoré */
      }
    });
    c.connect()
      .then(() => c.query("listen activity"))
      .then(() => {
        this.client = c;
        this.connecting = false;
        this.ready = true;
        this.retry = 500;
      })
      .catch(fail);
  }
}

const g = globalThis as unknown as { __matochaHub?: Hub };
export const hub = (g.__matochaHub ??= new Hub());
