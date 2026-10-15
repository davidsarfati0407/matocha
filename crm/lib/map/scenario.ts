"use client";
/**
 * Scénario de démonstration (mode démo) : rejoue les événements de la fiche
 * dans les 75 premières secondes. Chaque événement combine une chorégraphie
 * (marche, camion…) et une écriture métier RÉELLE en base, faite au bon moment ;
 * la map se met ensuite à jour par le flux d'événements, comme pour n'importe
 * quelle modification faite dans le back-office.
 */
import type * as THREE from "three";
import { sectorConfig } from "@/config/sector.config";
import { formatTime } from "@/lib/format";
import type { MapEngine } from "@/components/map/engine/engine";
import { demoReset, demoStep } from "@/app/(map)/map/actions";
import type { Vec2 } from "./layout";
import { useMap } from "./store";

type Ev = (typeof sectorConfig.evenementsLiveDeDemo)[number];
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

export class Scenario {
  private timers: ReturnType<typeof setTimeout>[] = [];
  private ambientTimer: ReturnType<typeof setTimeout> | null = null;
  stopped = false;

  constructor(
    private engine: MapEngine,
    private refresh: () => Promise<void>,
  ) {}

  /** Paramètres de remise à zéro déduits des événements de la fiche. */
  static resetParams(): Record<string, string> {
    const p: Record<string, string> = {};
    for (const e of sectorConfig.evenementsLiveDeDemo) {
      if (e.params.lot) p.lot = e.params.lot;
      if (e.params.commande) p.work_order = e.params.commande;
      if (e.params.devis) p.quote = e.params.devis;
    }
    return p;
  }

  async start() {
    const r = await demoReset(Scenario.resetParams());
    if ("error" in r) return; // organisation hors mode démo : rien à rejouer
    await this.refresh();
    for (const ev of sectorConfig.evenementsLiveDeDemo) this.timers.push(setTimeout(() => !this.stopped && void this.run(ev), ev.t * 1000));
    this.scheduleAmbient(sectorConfig.evenementsLiveDeDemo.at(-1)!.t * 1000 + 15000);
  }

  stop() {
    this.stopped = true;
    this.timers.forEach(clearTimeout);
    if (this.ambientTimer) clearTimeout(this.ambientTimer);
  }

  private scheduleAmbient(delay: number) {
    this.ambientTimer = setTimeout(async () => {
      if (this.stopped) return;
      const list = sectorConfig.notificationsAmbiance;
      await demoStep("ambient", { text: list[Math.floor(Math.random() * list.length)] });
      this.scheduleAmbient(14000 + Math.random() * 6000);
    }, delay);
  }

  private emp(slot?: string) {
    return useMap.getState().snapshot?.employees.find((e) => e.slot === slot);
  }

  private anchor(key: string): Vec2 | undefined {
    return this.engine.layout.anchors[key]?.at;
  }

  private mute(...types: string[]) {
    useMap.getState().mute(types);
  }

  private toast(ev: Ev, detail?: string, pickId?: string) {
    useMap.getState().toast({ title: ev.titre, detail: detail ?? ev.detail, pickId, tone: "accent" });
  }

  async run(ev: Ev) {
    const sim = this.engine.sim;
    switch (ev.type) {
      case "badge.entree": {
        const e = this.emp(ev.params.employe);
        const street = this.anchor("street_west");
        const badgeAt = this.anchor("badge");
        if (!e || !street || !badgeAt) return;
        await sim.walkTo(e.id, this.anchor("gate_cour") ?? badgeAt, { from: [street[0] + 52, street[1]] });
        await sim.walkTo(e.id, badgeAt, { finalRotation: Math.PI });
        this.mute("badge.in");
        await demoStep("badge", { employee_id: e.id, kind: "in" });
        this.flashBadge();
        this.toast(ev, `${e.firstName} ${e.lastName} a badgé à ${formatTime(new Date())}.`, `person:${e.id}`);
        await this.refresh();
        sim.release(e.id);
        break;
      }
      case "lot.recu": {
        const carrier = this.emp(ev.params.porteur);
        const truckId = `truck:${ev.params.vehicule}`;
        const truck = sim.truckToDock(truckId, ev.params.vehicule, "Porteur — arrivage Japon", "CHAEN MIDORI");
        await truck;
        const dock = this.anchor("dock_reception");
        const drop = this.anchor("quarantine_drop");
        if (carrier && dock && drop) {
          await sim.walkTo(carrier.id, dock);
          await wait(1200);
          await sim.walkTo(carrier.id, drop, { carrying: true });
        }
        this.mute("lot.quarantaine");
        await demoStep("lot_received", { lot: ev.params.lot });
        this.toast(ev, `Lot ${ev.params.lot} reçu — placé en quarantaine jusqu'au contrôle.`);
        await this.refresh();
        if (carrier) sim.release(carrier.id);
        await wait(2500);
        void sim.truckLeave(truckId, ev.params.vehicule);
        break;
      }
      case "commande_pro.etape": {
        const wo = useMap.getState().snapshot?.workOrders.find((w) => w.number === ev.params.commande);
        const carrier = this.emp(ev.params.porteur);
        const parcel = wo ? sim.parcels.get(wo.id) : undefined;
        const bench = this.anchor("control_bench");
        this.mute("work_order.stage");
        if (wo && carrier && parcel && bench) {
          await sim.walkTo(carrier.id, [parcel.position.x, parcel.position.z + 0.8]);
          parcel.visible = false;
          await sim.walkTo(carrier.id, [bench[0] + 1.2, bench[1] + 0.8], { carrying: true });
          await demoStep("work_order_stage", { number: wo.number, stage: ev.params.vers, zone: "quarantaine", progress: "0.7" });
          await this.refresh();
          // Pas de vol en arc : le colis a été porté jusqu'au contrôle
          const gl = parcel.userData.glide as { to: THREE.Vector3 } | undefined;
          if (gl) {
            parcel.position.copy(gl.to);
            delete parcel.userData.glide;
          }
          parcel.visible = true;
          sim.release(carrier.id);
        } else if (wo) {
          await demoStep("work_order_stage", { number: wo.number, stage: ev.params.vers, zone: "quarantaine", progress: "0.7" });
          await this.refresh();
        }
        const stage = sectorConfig.objetMetierCentral.etapes.find((s) => s.id === ev.params.vers);
        this.toast(ev, `${ev.params.commande} → ${stage?.libelle ?? ev.params.vers}`, wo ? `wo:${wo.id}` : undefined);
        break;
      }
      case "badge.pause": {
        const e = this.emp(ev.params.employe);
        const queue = this.anchor("bar_queue");
        if (!e) return;
        const agent = sim.agentByEmployee(e.id);
        this.mute("badge.pause_start");
        await demoStep("badge", { employee_id: e.id, kind: "pause_start", reader: "detente" });
        this.toast(ev, `${e.firstName} ${e.lastName} part en pause.`, `person:${e.id}`);
        if (agent && queue) {
          await sim.walkTo(e.id, queue, { finalPose: "coffee", finalRotation: Math.PI });
          await wait(4000);
        }
        await this.refresh();
        sim.release(e.id);
        break;
      }
      case "devis.signe": {
        this.mute("quote.accepted", "work_order.created");
        const r = await demoStep("quote_accepted", { number: ev.params.devis });
        const number = (r as { data?: { number?: string } }).data?.number;
        this.toast(ev, number ? `${ev.detail.split(":")[0]} — commande ${number} créée.` : ev.detail);
        await this.refresh();
        break;
      }
      case "expedition.enlevement": {
        const truckId = `truck:${ev.params.vehicule}`;
        await sim.truckToDock(truckId, ev.params.vehicule, "Transporteur — enlèvement 15 h", "TRANSVAL");
        await wait(3500);
        this.mute("expedition.pickup");
        const r = await demoStep("pickup", {});
        const n = (r as { data?: { orders?: number; work_orders?: number } }).data;
        this.toast(ev, `${n?.orders ?? 0} colis en ligne et ${n?.work_orders ?? 0} commande(s) pro chargés.`);
        await this.refresh();
        await wait(1500);
        void sim.truckLeave(truckId, ev.params.vehicule);
        break;
      }
    }
  }

  private flashBadge() {
    for (const o of this.engine.world.objects.values())
      if (o.def.entity?.key === "badgeuse" && o.built.slots?.light) {
        const m = (o.built.slots.light as THREE.Mesh).material as THREE.MeshStandardMaterial;
        m.emissiveIntensity = 4;
        setTimeout(() => (m.emissiveIntensity = 1), 900);
      }
  }
}
