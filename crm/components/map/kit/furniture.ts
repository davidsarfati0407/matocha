/**
 * Kit de mobilier, d'équipements et d'extérieur. Chaque modèle est une fonction
 * paramétrable qui renvoie un groupe (géométries et matériaux en cache, ombres
 * activées) et, au besoin, une fonction d'animation.
 */
import * as THREE from "three";
import type { KitType, ObjectDef } from "@/lib/map/layout";
import { P, basic, box, cone, cyl, mat, mesh, plane, rbox, sphere } from "./cache";
import { boxSideTexture, logoTexture, paintedText, radialTexture, screenTexture, type ScreenApp } from "./textures";

export interface Built {
  group: THREE.Group;
  /** Animation propre à l'objet (t en secondes, dt en secondes). */
  anim?: (t: number, dt: number) => void;
  /** Écran dont la texture reflète l'état (poste informatique, écran mural). */
  screen?: THREE.Mesh<THREE.BufferGeometry, THREE.MeshBasicMaterial>;
  /** Pièces pilotées par les données (ex. colis sur une table, voyant). */
  slots?: Record<string, THREE.Object3D>;
}

const steel = () => mat(P.steel, { metalness: 0.35, roughness: 0.45 });
const steelDark = () => mat(P.steelDark, { metalness: 0.3, roughness: 0.5 });
const wood = () => mat(P.wood, { roughness: 0.7 });
const woodPale = () => mat(P.woodPale, { roughness: 0.7 });
const ivory = () => mat(P.ivory);
const green = () => mat(P.green, { roughness: 0.6 });
const cardboard = () => mat(P.cardboard, { roughness: 0.9 });

function screenMesh(w: number, h: number, app: ScreenApp, variant = 0) {
  const m = new THREE.Mesh(plane(w, h), new THREE.MeshBasicMaterial({ map: screenTexture(app, variant), toneMapped: false }));
  m.userData.screen = true;
  return m as THREE.Mesh<THREE.BufferGeometry, THREE.MeshBasicMaterial>;
}

function steam(group: THREE.Group, at: THREE.Vector3, count = 4) {
  const puffs: THREE.Mesh[] = [];
  const m = new THREE.MeshBasicMaterial({ map: radialTexture("rgba(255,255,255,0.55)"), transparent: true, depthWrite: false });
  for (let i = 0; i < count; i++) {
    const s = new THREE.Mesh(plane(0.18, 0.18), m.clone());
    s.position.copy(at);
    s.userData.phase = i / count;
    group.add(s);
    puffs.push(s);
  }
  return (t: number, cam?: THREE.Camera) => {
    for (const s of puffs) {
      const k = (t * 0.35 + (s.userData.phase as number)) % 1;
      s.position.set(at.x + Math.sin(t + k * 6) * 0.03, at.y + k * 0.45, at.z);
      s.scale.setScalar(0.6 + k * 1.4);
      (s.material as THREE.MeshBasicMaterial).opacity = Math.sin(k * Math.PI) * 0.7;
      if (cam) s.quaternion.copy(cam.quaternion);
    }
  };
}

/** Caméra partagée pour orienter les sprites (renseignée par la scène). */
export const spriteCamera: { current?: THREE.Camera } = {};

type Builder = (o: ObjectDef) => Built;

const B: Partial<Record<KitType, Builder>> = {
  desk: (o) => {
    const g = new THREE.Group();
    g.add(mesh(rbox(1.6, 0.04, 0.8, 0.015), woodPale(), 0, 0.74, 0));
    for (const x of [-0.74, 0.74]) g.add(mesh(rbox(0.05, 0.72, 0.7, 0.02), steelDark(), x, 0.36, 0));
    g.add(mesh(rbox(1.4, 0.3, 0.02, 0.01), mat(P.ivoryDeep), 0, 0.55, -0.36));
    let screen: Built["screen"];
    if (o.params?.screen !== false) {
      g.add(mesh(rbox(0.06, 0.28, 0.06, 0.02), steelDark(), 0, 0.9, -0.22));
      g.add(mesh(rbox(0.22, 0.015, 0.16, 0.01), steelDark(), 0, 0.765, -0.22));
      g.add(mesh(rbox(0.72, 0.44, 0.035, 0.02), mat("#1E201E"), 0, 1.12, -0.2));
      screen = screenMesh(0.68, 0.4, (o.params?.app as ScreenApp) ?? "crm", o.id.length);
      screen.position.set(0, 1.12, -0.18);
      g.add(screen);
      g.add(mesh(rbox(0.46, 0.02, 0.15, 0.01), mat("#E7E4DC"), 0, 0.77, 0.08));
      g.add(mesh(rbox(0.07, 0.025, 0.11, 0.02), mat("#E7E4DC"), 0.36, 0.77, 0.1));
    }
    if (o.id.length % 3 === 0) g.add(mesh(cyl(0.045, 0.04, 0.1, 10), mat(P.matcha), -0.55, 0.81, -0.1));
    return { group: g, screen };
  },
  chair: () => {
    const g = new THREE.Group();
    const fabric = mat("#3F4A44", { roughness: 0.9 });
    g.add(mesh(rbox(0.48, 0.08, 0.46, 0.035), fabric, 0, 0.47, 0));
    g.add(mesh(rbox(0.46, 0.5, 0.07, 0.035), fabric, 0, 0.78, -0.21));
    g.add(mesh(cyl(0.03, 0.03, 0.38, 8), steelDark(), 0, 0.25, 0));
    g.add(mesh(cyl(0.26, 0.26, 0.03, 5), steelDark(), 0, 0.05, 0));
    return { group: g };
  },
  stool: () => {
    const g = new THREE.Group();
    g.add(mesh(cyl(0.19, 0.19, 0.05, 16), wood(), 0, 0.75, 0));
    g.add(mesh(cyl(0.025, 0.025, 0.72, 8), steelDark(), 0, 0.38, 0));
    g.add(mesh(cyl(0.2, 0.2, 0.02, 16), steelDark(), 0, 0.01, 0));
    return { group: g };
  },
  cushion: () => {
    const g = new THREE.Group();
    g.add(mesh(rbox(0.5, 0.1, 0.5, 0.05), mat("#3E5A47", { roughness: 0.95 }), 0, 0.06, 0));
    return { group: g };
  },
  sofa: () => {
    const g = new THREE.Group();
    const f = mat("#B9AE98", { roughness: 0.95 });
    g.add(mesh(rbox(2, 0.4, 0.85, 0.12), f, 0, 0.25, 0));
    g.add(mesh(rbox(2, 0.5, 0.22, 0.1), f, 0, 0.6, -0.33));
    for (const x of [-0.95, 0.95]) g.add(mesh(rbox(0.18, 0.55, 0.85, 0.08), f, x, 0.35, 0));
    g.add(mesh(rbox(0.4, 0.3, 0.12, 0.06), mat(P.matcha), 0.5, 0.58, -0.15));
    return { group: g };
  },
  meeting_table: (o) => {
    const g = new THREE.Group();
    const len = (o.params?.length as number) ?? 2.4;
    g.add(mesh(rbox(len, 0.05, 1.1, 0.03), woodPale(), 0, 0.74, 0));
    for (const x of [-len / 2 + 0.3, len / 2 - 0.3]) g.add(mesh(rbox(0.08, 0.72, 0.8, 0.03), steelDark(), x, 0.36, 0));
    g.add(mesh(cyl(0.06, 0.06, 0.03, 12), mat("#2B2B2B"), 0, 0.78, 0));
    return { group: g };
  },
  low_table: (o) => {
    const g = new THREE.Group();
    const len = (o.params?.length as number) ?? 2.4;
    g.add(mesh(rbox(len, 0.06, 1, 0.03), wood(), 0, 0.34, 0));
    for (const x of [-len / 2 + 0.2, len / 2 - 0.2]) for (const z of [-0.35, 0.35]) g.add(mesh(rbox(0.07, 0.32, 0.07, 0.02), wood(), x, 0.16, z));
    for (let i = 0; i < 3; i++) g.add(mesh(cyl(0.04, 0.035, 0.07, 10), mat(i ? P.ivory : P.matcha), -0.4 + i * 0.4, 0.4, 0.1));
    return { group: g };
  },
  reception_desk: () => {
    const g = new THREE.Group();
    g.add(mesh(rbox(3, 1.05, 0.7, 0.08), ivory(), 0, 0.52, 0.15));
    g.add(mesh(rbox(3.05, 0.05, 0.8, 0.02), wood(), 0, 1.07, 0.15));
    g.add(mesh(rbox(3.02, 0.14, 0.05, 0.02), green(), 0, 0.8, 0.5));
    g.add(mesh(rbox(2.6, 0.04, 0.6, 0.02), woodPale(), 0, 0.74, -0.35));
    g.add(mesh(rbox(0.5, 0.32, 0.03, 0.01), mat("#1E201E"), -0.5, 0.98, -0.45));
    const screen = screenMesh(0.46, 0.28, "crm", 3);
    screen.position.set(-0.5, 0.98, -0.43);
    g.add(screen);
    g.add(mesh(sphere(0.12, 12), mat(P.leaf), 1.1, 1.2, 0.2));
    g.add(mesh(cyl(0.08, 0.06, 0.14, 10), mat(P.ivoryDeep), 1.1, 1.13, 0.2));
    return { group: g, screen };
  },
  bar_counter: (o) => {
    const g = new THREE.Group();
    const len = (o.params?.length as number) ?? 4;
    const low = Boolean(o.params?.low);
    const h = low ? 0.9 : 1.05;
    g.add(mesh(rbox(len, h - 0.05, 0.75, 0.06), low ? woodPale() : green(), 0, (h - 0.05) / 2, 0));
    g.add(mesh(rbox(len + 0.1, 0.05, 0.85, 0.02), wood(), 0, h, 0));
    if (!low) for (let i = 0; i < len / 0.5 - 1; i++) g.add(mesh(box(0.02, h - 0.2, 0.01), mat(P.greenDeep), -len / 2 + 0.5 + i * 0.5, (h - 0.05) / 2, 0.38));
    if (!low) {
      const cups: (() => void)[] = [];
      for (let i = 0; i < 3; i++) {
        g.add(mesh(cyl(0.05, 0.04, 0.11, 12), mat("#EFF5E6", { transparent: true, opacity: 0.8 }), 0.4 + i * 0.5, h + 0.07, 0.15));
        g.add(mesh(cyl(0.045, 0.045, 0.06, 12), mat(P.matcha), 0.4 + i * 0.5, h + 0.07, 0.15, false));
        const s = steam(g, new THREE.Vector3(0.4 + i * 0.5, h + 0.18, 0.15), 3);
        cups.push(() => s(performance.now() / 1000 + i, spriteCamera.current));
      }
      return { group: g, anim: () => cups.forEach((c) => c()) };
    }
    return { group: g };
  },
  cafe_table: (o) => {
    const g = new THREE.Group();
    const top = o.params?.outdoor ? mat("#D9D4C7") : woodPale();
    g.add(mesh(cyl(0.42, 0.42, 0.04, 20), top, 0, 0.74, 0));
    g.add(mesh(cyl(0.04, 0.04, 0.72, 8), steelDark(), 0, 0.37, 0));
    g.add(mesh(cyl(0.24, 0.24, 0.03, 16), steelDark(), 0, 0.015, 0));
    g.add(mesh(cyl(0.04, 0.035, 0.09, 10), mat(P.white), 0.12, 0.8, 0.05));
    return { group: g };
  },
  shelf_boxes: (o) => {
    const g = new THREE.Group();
    const len = (o.params?.length as number) ?? 3;
    const side = new THREE.MeshStandardMaterial({ map: boxSideTexture(), roughness: 0.6 });
    for (let lv = 0; lv < 3; lv++) {
      g.add(mesh(rbox(len, 0.04, 0.32, 0.01), wood(), 0, 1.1 + lv * 0.42, 0));
      const n = Math.floor(len / 0.26);
      const boxes = new THREE.InstancedMesh(box(0.18, 0.24, 0.12), [green(), green(), green(), green(), side, side] as unknown as THREE.Material, n);
      for (let i = 0; i < n; i++) boxes.setMatrixAt(i, new THREE.Matrix4().makeTranslation(-len / 2 + 0.16 + i * 0.26, 1.24 + lv * 0.42, 0.02));
      boxes.castShadow = true;
      g.add(boxes);
    }
    return { group: g };
  },
  rack: (o) => {
    const g = new THREE.Group();
    const len = (o.params?.length as number) ?? 10;
    const levels = (o.params?.levels as number) ?? 4;
    const bays = Math.max(2, Math.round(len / 2.7));
    const orange = mat("#2F5D45", { roughness: 0.5 });
    for (let i = 0; i <= bays; i++) for (const z of [-0.45, 0.45]) g.add(mesh(box(0.08, 2.6, 0.08), steelDark(), -len / 2 + (i * len) / bays, 1.3, z));
    const beam = box(len, 0.08, 0.06);
    const items: THREE.Matrix4[] = [];
    const cartons: THREE.Matrix4[] = [];
    let seed = (o.params?.letter as string)?.charCodeAt(0) ?? 7;
    const rnd = () => ((seed = (seed * 9301 + 49297) % 233280) / 233280);
    for (let lv = 0; lv < levels; lv++) {
      const y = 0.15 + lv * 0.68;
      for (const z of [-0.45, 0.45]) g.add(mesh(beam, orange, 0, y, z, false));
      g.add(mesh(box(len, 0.03, 0.9), mat("#B9B4A8"), 0, y + 0.03, 0, false));
      for (let i = 0; i < len / 0.42; i++) {
        if (rnd() < 0.18) continue;
        const x = -len / 2 + 0.25 + i * 0.42;
        const hh = 0.18 + rnd() * 0.28;
        (rnd() < 0.55 ? items : cartons).push(new THREE.Matrix4().compose(new THREE.Vector3(x, y + 0.05 + hh / 2, (rnd() - 0.5) * 0.3), new THREE.Quaternion(), new THREE.Vector3(1, hh / 0.3, 1)));
      }
    }
    const side = new THREE.MeshStandardMaterial({ map: boxSideTexture(), roughness: 0.6 });
    const im = new THREE.InstancedMesh(box(0.34, 0.3, 0.55), [green(), green(), green(), green(), side, side] as unknown as THREE.Material, items.length);
    items.forEach((m, i) => im.setMatrixAt(i, m));
    const ic = new THREE.InstancedMesh(box(0.36, 0.3, 0.6), cardboard(), cartons.length);
    cartons.forEach((m, i) => ic.setMatrixAt(i, m));
    im.castShadow = ic.castShadow = true;
    g.add(im, ic);
    // Panneau de rayonnage (lettre)
    const sign = new THREE.Mesh(plane(0.7, 0.7), new THREE.MeshBasicMaterial({ map: paintedText(String(o.params?.letter ?? ""), { color: "#F3EFE5", font: 110 }), transparent: true }));
    const signBg = mesh(rbox(0.75, 0.75, 0.04, 0.06), green(), -len / 2 - 0.2, 2.9, 0);
    sign.position.set(-len / 2 - 0.2, 2.9, 0.025);
    g.add(signBg, sign);
    return { group: g, slots: { items: im } };
  },
  pack_table: (o) => {
    const g = new THREE.Group();
    g.add(mesh(rbox(2, 0.05, 0.9, 0.02), woodPale(), 0, 0.9, 0));
    for (const x of [-0.9, 0.9]) for (const z of [-0.38, 0.38]) g.add(mesh(box(0.05, 0.88, 0.05), steel(), x, 0.44, z));
    g.add(mesh(box(1.9, 0.03, 0.8), mat("#B9B4A8"), 0, 0.3, 0));
    for (let i = 0; i < 3; i++) g.add(mesh(rbox(0.5, 0.06, 0.4, 0.01), cardboard(), -0.5, 0.36 + i * 0.07, 0));
    g.add(mesh(rbox(0.16, 0.12, 0.08, 0.02), mat(P.coral), 0.6, 0.98, -0.2));
    g.add(mesh(rbox(0.06, 0.4, 0.06, 0.02), steelDark(), 0.82, 1.1, -0.35));
    g.add(mesh(rbox(0.36, 0.24, 0.03, 0.01), mat("#1E201E"), 0.82, 1.35, -0.33));
    const screen = screenMesh(0.32, 0.2, "tableur", Number(o.params?.index ?? 0));
    screen.position.set(0.82, 1.35, -0.315);
    g.add(screen);
    // Colis en cours (piloté par les données : visible quand la table est occupée)
    const parcel = mesh(rbox(0.42, 0.28, 0.32, 0.02), cardboard(), 0.05, 1.07, 0.1);
    const lid = mesh(rbox(0.44, 0.02, 0.34, 0.01), cardboard(), 0.05, 1.22, 0.1);
    const goods = mesh(rbox(0.16, 0.18, 0.08, 0.01), green(), 0.05, 1.18, 0.1, false);
    g.add(parcel, lid, goods);
    let phase = Math.random() * 10;
    return {
      group: g,
      screen,
      slots: { parcel },
      anim: (_t, dt) => {
        phase += dt;
        const k = (phase % 9) / 9;
        lid.visible = parcel.visible && k > 0.55;
        goods.visible = parcel.visible && k > 0.2 && k < 0.7;
        goods.position.y = 1.35 - Math.min(1, (k - 0.2) * 4) * 0.2;
        parcel.scale.setScalar(k > 0.92 ? 1 - (k - 0.92) * 10 : 1);
      },
    };
  },
  sealer: () => {
    const g = new THREE.Group();
    g.add(mesh(rbox(1, 0.85, 0.7, 0.04), mat("#D9DCDD", { metalness: 0.2 }), 0, 0.42, 0));
    g.add(mesh(rbox(0.8, 0.1, 0.5, 0.03), steelDark(), 0, 0.92, 0));
    const lamp = mesh(sphere(0.04, 10), mat("#79A84B", { emissive: "#79A84B", emissiveIntensity: 1.5 }), 0.4, 0.9, 0.32, false);
    g.add(lamp);
    return { group: g, anim: (t) => ((lamp.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.8 + Math.sin(t * 4) * 0.7) };
  },
  label_printer: () => {
    const g = new THREE.Group();
    g.add(mesh(rbox(1.2, 0.85, 0.6, 0.03), woodPale(), 0, 0.42, 0));
    g.add(mesh(rbox(0.3, 0.22, 0.3, 0.04), mat("#E6E3DA"), 0, 0.96, 0));
    const label = mesh(box(0.1, 0.005, 0.12), mat(P.white), 0, 0.98, 0.18, false);
    g.add(label);
    return { group: g, anim: (t) => (label.position.z = 0.16 + ((t * 0.3) % 1) * 0.08) };
  },
  scale: () => {
    const g = new THREE.Group();
    g.add(mesh(rbox(0.32, 0.06, 0.28, 0.02), mat("#E6E3DA"), 0, 0.03, 0));
    g.add(mesh(cyl(0.12, 0.12, 0.01, 18), steel(), 0, 0.07, 0.02));
    g.add(mesh(box(0.14, 0.04, 0.005), mat("#1A2E22", { emissive: "#79A84B", emissiveIntensity: 0.4 }), 0, 0.04, -0.141, false));
    return { group: g };
  },
  pallet: (o) => {
    const g = new THREE.Group();
    const pw = mat("#C7A57A", { roughness: 0.9 });
    for (const z of [-0.35, 0, 0.35]) g.add(mesh(box(1.2, 0.1, 0.12), pw, 0, 0.05, z));
    for (let i = 0; i < 5; i++) g.add(mesh(box(0.14, 0.03, 0.8), pw, -0.5 + i * 0.25, 0.115, 0));
    if (o.params?.load === "boxes")
      for (let l = 0; l < 3; l++) for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) g.add(mesh(rbox(0.56, 0.3, 0.38, 0.01), cardboard(), -0.29 + i * 0.58, 0.28 + l * 0.31, -0.19 + j * 0.39));
    if (o.params?.load === "wrapped") {
      g.add(mesh(rbox(1.18, 1.0, 0.8, 0.04), cardboard(), 0, 0.64, 0));
      g.add(mesh(rbox(1.22, 1.04, 0.84, 0.05), mat("#E8F0F2", { transparent: true, opacity: 0.45, roughness: 0.15 }), 0, 0.64, 0, false));
    }
    if (o.params?.load === "lot") {
      g.add(mesh(rbox(1.18, 0.9, 0.8, 0.04), green(), 0, 0.6, 0));
      g.add(mesh(rbox(1.22, 0.94, 0.84, 0.05), mat("#E8F0F2", { transparent: true, opacity: 0.4, roughness: 0.15 }), 0, 0.6, 0, false));
    }
    return { group: g };
  },
  pallet_jack: () => {
    const g = new THREE.Group();
    for (const x of [-0.2, 0.2]) g.add(mesh(box(0.16, 0.08, 1.1), mat("#2F5D45"), x, 0.08, 0.2));
    g.add(mesh(rbox(0.6, 0.5, 0.3, 0.05), mat("#2F5D45"), 0, 0.35, -0.45));
    g.add(mesh(cyl(0.025, 0.025, 1, 8), steelDark(), 0, 0.85, -0.6));
    return { group: g };
  },
  printer: () => {
    const g = new THREE.Group();
    g.add(mesh(rbox(0.8, 0.95, 0.65, 0.05), mat("#E8E6E0"), 0, 0.48, 0));
    g.add(mesh(rbox(0.7, 0.08, 0.5, 0.03), mat("#C9C6BE"), 0, 1.0, 0));
    g.add(mesh(rbox(0.25, 0.02, 0.12, 0.01), mat("#24261F", { emissive: "#3A6", emissiveIntensity: 0.6 }), 0.22, 1.05, 0.2, false));
    const sheets: THREE.Mesh[] = [];
    for (let i = 0; i < 3; i++) {
      const s = mesh(box(0.3, 0.004, 0.42), mat(P.white), 0, 0.72, 0.1, false);
      g.add(s);
      sheets.push(s);
    }
    return {
      group: g,
      anim: (t) =>
        sheets.forEach((s, i) => {
          const k = ((t * 0.25 + i / 3) % 1);
          s.position.set(0, 0.72 - k * 0.04 + i * 0.006, 0.05 + Math.min(k * 2, 1) * 0.3);
          s.visible = k < 0.95;
        }),
    };
  },
  server_rack: () => {
    const g = new THREE.Group();
    g.add(mesh(rbox(0.65, 2, 0.9, 0.03), mat("#2A2D2F", { roughness: 0.5 }), 0, 1, 0));
    const leds: THREE.Mesh[] = [];
    for (let i = 0; i < 12; i++) {
      g.add(mesh(box(0.56, 0.1, 0.02), mat("#3A3F42"), 0, 0.3 + i * 0.13, 0.455, false));
      const led = mesh(box(0.03, 0.02, 0.01), mat("#79A84B", { emissive: "#8BD15A", emissiveIntensity: 2 }), 0.2, 0.3 + i * 0.13, 0.468, false);
      led.material = (led.material as THREE.MeshStandardMaterial).clone();
      leds.push(led);
      g.add(led);
    }
    return { group: g, anim: (t) => leds.forEach((l, i) => ((l.material as THREE.MeshStandardMaterial).emissiveIntensity = Math.sin(t * (6 + i) + i * 3) > 0.2 ? 2.4 : 0.2)) };
  },
  wall_screen: (o) => {
    const g = new THREE.Group();
    const w = (o.params?.w as number) ?? 2;
    const h = (o.params?.h as number) ?? 1.1;
    g.add(mesh(rbox(w + 0.08, h + 0.08, 0.05, 0.02), mat("#1C1E1C"), 0, 0, 0));
    const screen = screenMesh(w, h, (o.params?.content as ScreenApp) ?? "ventes");
    screen.position.z = 0.03;
    g.add(screen);
    const apps: ScreenApp[] = o.params?.content === "visio" ? ["visio", "presentation"] : ["ventes", "crm"];
    return { group: g, screen, anim: (t) => (screen.material.map = screenTexture(apps[Math.floor(t / 8) % apps.length], Math.floor(t / 4))) };
  },
  backdrop: (o) => {
    const g = new THREE.Group();
    const w = (o.params?.w as number) ?? 4;
    const m = mat("#F7F3EA", { side: THREE.DoubleSide, roughness: 0.95 });
    const wall = mesh(plane(w, 2.6), m, 0, 1.6, -0.5);
    const curve = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, w, 16, 1, true, Math.PI, Math.PI / 2), m);
    curve.rotation.z = Math.PI / 2;
    curve.position.set(0, 0.3, -0.2);
    curve.receiveShadow = true;
    const floor = mesh(plane(w, 1.1), m, 0, 0.005, 0.35);
    floor.rotation.x = -Math.PI / 2;
    for (const x of [-w / 2 - 0.05, w / 2 + 0.05]) g.add(mesh(cyl(0.025, 0.025, 2.9, 8), steelDark(), x, 1.45, -0.5));
    g.add(mesh(cyl(0.05, 0.05, w + 0.2, 10), mat("#E4DFD2"), 0, 2.95, -0.5).rotateZ(Math.PI / 2));
    g.add(wall, curve, floor);
    return { group: g };
  },
  softbox: () => {
    const g = new THREE.Group();
    g.add(mesh(cyl(0.02, 0.02, 1.7, 8), steelDark(), 0, 0.85, 0));
    for (let i = 0; i < 3; i++) g.add(mesh(cyl(0.012, 0.012, 0.6, 6), steelDark(), Math.cos(i * 2.1) * 0.2, 0.25, Math.sin(i * 2.1) * 0.2).rotateZ(Math.cos(i * 2.1) * 0.5).rotateX(-Math.sin(i * 2.1) * 0.5));
    const head = new THREE.Group();
    head.position.y = 1.75;
    head.rotation.x = 0.4;
    head.add(mesh(rbox(0.6, 0.6, 0.35, 0.05), mat("#1E1F1E"), 0, 0, -0.1));
    head.add(mesh(plane(0.55, 0.55), mat("#FFFFFF", { emissive: "#FFF6E5", emissiveIntensity: 1.6 }), 0, 0, 0.08, false));
    g.add(head);
    return { group: g };
  },
  camera_tripod: () => {
    const g = new THREE.Group();
    for (let i = 0; i < 3; i++) {
      const leg = mesh(cyl(0.015, 0.015, 1.4, 6), steelDark(), Math.cos(i * 2.1) * 0.22, 0.68, Math.sin(i * 2.1) * 0.22);
      leg.rotation.set(-Math.sin(i * 2.1) * 0.3, 0, Math.cos(i * 2.1) * 0.3);
      g.add(leg);
    }
    g.add(mesh(rbox(0.24, 0.16, 0.14, 0.03), mat("#1E2020"), 0, 1.45, 0));
    g.add(mesh(cyl(0.05, 0.05, 0.14, 12), mat("#2E3030"), 0, 1.45, 0.12).rotateX(Math.PI / 2));
    const rec = mesh(sphere(0.015, 6), mat("#E03A2E", { emissive: "#E03A2E", emissiveIntensity: 2 }), 0.08, 1.55, 0.05, false);
    g.add(rec);
    return { group: g, anim: (t) => (rec.visible = Math.sin(t * 3) > 0) };
  },
  ping_pong: () => {
    const g = new THREE.Group();
    g.add(mesh(rbox(1.5, 0.04, 2.74, 0.02), mat("#1F5A44"), 0, 0.76, 0));
    g.add(mesh(box(0.02, 0.005, 2.74), mat(P.white), 0, 0.785, 0, false));
    g.add(mesh(box(1.6, 0.15, 0.01), mat("#F2F2EE", { transparent: true, opacity: 0.8 }), 0, 0.86, 0));
    for (const x of [-0.6, 0.6]) for (const z of [-1.1, 1.1]) g.add(mesh(box(0.05, 0.74, 0.05), steelDark(), x, 0.37, z));
    const ball = mesh(sphere(0.025, 8), mat("#F5F0E6", { emissive: "#F5E6C8", emissiveIntensity: 0.2 }), 0, 1, 0, true);
    g.add(ball);
    return {
      group: g,
      slots: { ball },
      anim: (t) => {
        const k = (t * 0.62) % 2;
        const z = k < 1 ? -1.3 + k * 2.6 : 1.3 - (k - 1) * 2.6;
        const local = (k % 1) * 2;
        ball.position.set(Math.sin(t * 1.3) * 0.4, 0.8 + Math.abs(Math.sin(local * Math.PI)) * 0.35, z);
      },
    };
  },
  kitchen: () => {
    const g = new THREE.Group();
    g.add(mesh(rbox(3, 0.9, 0.65, 0.03), mat("#DCD6C8"), 0, 0.45, 0));
    g.add(mesh(rbox(3.05, 0.04, 0.7, 0.02), wood(), 0, 0.92, 0));
    for (let i = 0; i < 4; i++) g.add(mesh(box(0.02, 0.8, 0.01), mat("#BDB6A6"), -1.1 + i * 0.75, 0.45, 0.33));
    g.add(mesh(rbox(0.35, 0.42, 0.35, 0.04), mat("#2B2D2C"), 0.9, 1.15, -0.05));
    g.add(mesh(rbox(0.22, 0.3, 0.22, 0.05), mat(P.green), -0.6, 1.1, -0.05));
    const s = steam(g, new THREE.Vector3(0.9, 1.45, 0.05), 3);
    return { group: g, anim: (t) => s(t, spriteCamera.current) };
  },
  fridge: () => {
    const g = new THREE.Group();
    g.add(mesh(rbox(0.7, 1.85, 0.7, 0.05), mat("#E9E7E1", { roughness: 0.4 }), 0, 0.93, 0));
    g.add(mesh(box(0.03, 0.4, 0.03), steel(), 0.25, 1.2, 0.36));
    return { group: g };
  },
  lockers: (o) => {
    const g = new THREE.Group();
    const n = (o.params?.count as number) ?? 6;
    for (let i = 0; i < n; i++) {
      g.add(mesh(rbox(0.48, 1.9, 0.48, 0.02), mat(i % 2 ? "#3C6B50" : P.green), -((n - 1) * 0.5) / 2 + i * 0.5, 0.95, 0));
      g.add(mesh(box(0.02, 0.12, 0.02), steel(), -((n - 1) * 0.5) / 2 + i * 0.5 + 0.15, 1.1, 0.25, false));
    }
    return { group: g };
  },
  sample_cabinet: () => {
    const g = new THREE.Group();
    g.add(mesh(rbox(1.4, 1.9, 0.65, 0.04), mat("#E6E3DC"), 0, 0.95, 0));
    for (let l = 0; l < 4; l++) for (let i = 0; i < 5; i++) g.add(mesh(rbox(0.18, 0.24, 0.12, 0.01), green(), -0.48 + i * 0.24, 0.35 + l * 0.42, 0.1, false));
    g.add(mesh(box(1.3, 1.75, 0.02), mat("#CFE3E8", { transparent: true, opacity: 0.35, roughness: 0.1 }), 0, 0.98, 0.33, false));
    g.add(mesh(box(0.22, 0.09, 0.01), mat("#13201A", { emissive: "#79A84B", emissiveIntensity: 0.6 }), 0.45, 1.8, 0.335, false));
    return { group: g };
  },
  badge_reader: () => {
    const g = new THREE.Group();
    g.add(mesh(rbox(0.22, 1.2, 0.16, 0.05), mat("#2B2D2C"), 0, 0.6, 0));
    const light = mesh(box(0.14, 0.14, 0.01), mat("#79A84B", { emissive: "#8BD15A", emissiveIntensity: 1 }), 0, 1.05, 0.085, false);
    light.material = (light.material as THREE.MeshStandardMaterial).clone();
    g.add(light);
    return { group: g, slots: { light } };
  },
  plant: (o) => {
    const g = new THREE.Group();
    const s = (o.params?.size as number) ?? 1;
    g.add(mesh(cyl(0.2 * s, 0.16 * s, 0.38 * s, 14), mat("#D6CFC0"), 0, 0.19 * s, 0));
    const leaf = mat(P.leaf, { roughness: 0.8 });
    const leaf2 = mat(P.leafDark, { roughness: 0.8 });
    for (let i = 0; i < 5; i++) g.add(mesh(sphere((0.18 + (i % 2) * 0.06) * s, 10), i % 2 ? leaf : leaf2, Math.cos(i * 1.3) * 0.13 * s, (0.55 + i * 0.13) * s, Math.sin(i * 1.3) * 0.13 * s));
    return { group: g };
  },
  bamboo: (o) => {
    const g = new THREE.Group();
    const h = (o.params?.h as number) ?? 4;
    const stalk = mat("#7E9B4E", { roughness: 0.6 });
    const leaf = mat("#6E9B47", { roughness: 0.85, side: THREE.DoubleSide });
    for (let i = 0; i < 6; i++) {
      const x = Math.cos(i * 1.1) * 0.25;
      const z = Math.sin(i * 1.1) * 0.25;
      const hh = h * (0.75 + (i % 3) * 0.12);
      g.add(mesh(cyl(0.035, 0.045, hh, 6), stalk, x, hh / 2, z));
      for (let k = 0; k < 4; k++) {
        const l = mesh(sphere(0.32, 6), leaf, x + Math.cos(k * 2 + i) * 0.25, hh * (0.55 + k * 0.13), z + Math.sin(k * 2 + i) * 0.25);
        l.scale.set(1, 0.45, 1.6);
        l.rotation.y = k + i;
        g.add(l);
      }
    }
    g.add(mesh(cyl(0.5, 0.55, 0.3, 14), mat("#C9C1B2"), 0, 0.15, 0));
    return { group: g };
  },
  tree: (o) => {
    const g = new THREE.Group();
    const s = (o.params?.size as number) ?? 1;
    g.add(mesh(cyl(0.12 * s, 0.17 * s, 1.6 * s, 8), mat("#8A6E52"), 0, 0.8 * s, 0));
    const leaf = mat(["#8FC48A", "#7DB77C", "#9BCB8E"][Math.abs(Math.round(o.at[0])) % 3], { roughness: 0.75 });
    const crown = mesh(sphere(1.25 * s, 18), leaf, 0, 2.7 * s, 0);
    crown.scale.set(1, 1.15, 1);
    g.add(crown);
    const sh = new THREE.Mesh(plane(3.6 * s, 3.6 * s), new THREE.MeshBasicMaterial({ map: radialTexture("rgba(30,40,25,0.28)"), transparent: true, depthWrite: false }));
    sh.rotation.x = -Math.PI / 2;
    sh.position.set(0.6 * s, 0.02, 0.4 * s);
    g.add(sh);
    return { group: g };
  },
  bench: () => {
    const g = new THREE.Group();
    g.add(mesh(rbox(1.8, 0.06, 0.45, 0.02), wood(), 0, 0.45, 0));
    for (const x of [-0.75, 0.75]) g.add(mesh(rbox(0.08, 0.43, 0.4, 0.02), steelDark(), x, 0.22, 0));
    return { group: g };
  },
  lamp_post: () => {
    const g = new THREE.Group();
    g.add(mesh(cyl(0.06, 0.08, 4.5, 8), mat("#3A3D3E"), 0, 2.25, 0));
    g.add(mesh(rbox(0.5, 0.12, 0.25, 0.04), mat("#3A3D3E"), 0.2, 4.5, 0));
    g.add(mesh(box(0.4, 0.02, 0.18), mat("#FFF4D6", { emissive: "#FFF1C4", emissiveIntensity: 0.5 }), 0.2, 4.44, 0, false));
    return { group: g };
  },
  art_ceramic: () => {
    const g = new THREE.Group();
    g.add(mesh(rbox(0.5, 1, 0.5, 0.03), mat(P.white), 0, 0.5, 0));
    const bowl = new THREE.Group();
    bowl.position.y = 1.1;
    const b = new THREE.Mesh(new THREE.SphereGeometry(0.2, 20, 12, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), mat("#7C4A2D", { roughness: 0.35, side: THREE.DoubleSide }));
    b.position.y = 0.18;
    b.castShadow = true;
    bowl.add(b, mesh(cyl(0.19, 0.19, 0.02, 20), mat(P.matcha), 0, 0.15, 0, false));
    g.add(bowl);
    return { group: g, anim: (t) => (bowl.rotation.y = t * 0.3) };
  },
  totem: (o) => {
    const g = new THREE.Group();
    g.add(mesh(rbox(0.8, 2.6, 0.35, 0.06), green(), 0, 1.3, 0));
    const logo = new THREE.Mesh(plane(2.2, 0.55), new THREE.MeshBasicMaterial({ map: logoTexture(String(o.label ?? "")), toneMapped: false }));
    logo.rotation.z = Math.PI / 2;
    logo.position.set(0, 1.4, 0.18);
    logo.scale.set(1, 1, 1);
    g.add(logo);
    return { group: g };
  },
  logo_wall: () => {
    const g = new THREE.Group();
    g.add(mesh(rbox(3.2, 1.2, 0.06, 0.03), wood(), 0, 2.1, 0.03));
    const logo = new THREE.Mesh(plane(2.6, 0.65), new THREE.MeshBasicMaterial({ map: logoTexture("MATOCHA"), toneMapped: false }));
    logo.position.set(0, 2.1, 0.07);
    g.add(logo);
    return { group: g };
  },
  parcel_stack: (o) => {
    const g = new THREE.Group();
    const n = (o.params?.count as number) ?? 6;
    let k = 0;
    for (let l = 0; k < n; l++) for (let i = 0; i < 2 && k < n; i++) for (let j = 0; j < 2 && k < n; j++, k++) g.add(mesh(rbox(0.42, 0.28, 0.32, 0.015), cardboard(), -0.22 + i * 0.44, 0.14 + l * 0.29, -0.17 + j * 0.34));
    return { group: g };
  },
  cone: () => {
    const g = new THREE.Group();
    g.add(mesh(cone(0.16, 0.5, 14), mat("#E2783A"), 0, 0.27, 0));
    g.add(mesh(box(0.38, 0.03, 0.38), mat("#2B2B2B"), 0, 0.015, 0));
    return { group: g };
  },
  extinguisher: () => {
    const g = new THREE.Group();
    g.add(mesh(cyl(0.09, 0.09, 0.5, 12), mat("#C0392B", { roughness: 0.4 }), 0, 0.25, 0));
    return { group: g };
  },
  dock_door: (o) => {
    const g = new THREE.Group();
    const w = (o.params?.w as number) ?? 4;
    g.add(mesh(box(w + 0.3, 0.25, 0.2), green(), 0, 3.4, 0));
    for (const x of [-w / 2 - 0.1, w / 2 + 0.1]) g.add(mesh(box(0.2, 3.4, 0.2), green(), x, 1.7, 0));
    const door = mesh(box(w, 0.6, 0.06), mat("#C9CED0", { metalness: 0.2 }), 0, 3.0, 0);
    g.add(door);
    for (const x of [-w / 2 + 0.4, w / 2 - 0.4]) g.add(mesh(box(0.25, 0.4, 0.25), mat("#2B2B2B"), x, 0.6, 0.2));
    return { group: g, slots: { door } };
  },
  bike_rack: () => {
    const g = new THREE.Group();
    for (let i = 0; i < 4; i++) {
      const arc = mesh(new THREE.TorusGeometry(0.35, 0.025, 6, 12, Math.PI), steel(), -0.9 + i * 0.6, 0.02, 0);
      arc.rotation.y = Math.PI / 2;
      g.add(arc);
    }
    for (let i = 0; i < 2; i++) {
      const bike = new THREE.Group();
      for (const z of [-0.5, 0.5]) {
        const wheel = mesh(new THREE.TorusGeometry(0.3, 0.03, 6, 16), mat("#222"), 0, 0.32, z);
        wheel.rotation.y = Math.PI / 2;
        bike.add(wheel);
      }
      bike.add(mesh(box(0.04, 0.04, 0.9), mat(i ? "#B7472F" : "#3D5A80"), 0, 0.55, 0));
      bike.position.x = -0.6 + i * 1.2;
      g.add(bike);
    }
    return { group: g };
  },
  matcha_machine: () => {
    const g = new THREE.Group();
    g.add(mesh(rbox(0.5, 0.55, 0.45, 0.06), mat("#2C2E2C", { roughness: 0.35, metalness: 0.2 }), 0, 0.28, 0));
    g.add(mesh(rbox(0.4, 0.08, 0.1, 0.02), mat(P.green), 0, 0.5, 0.22));
    g.add(mesh(cyl(0.05, 0.04, 0.1, 12), mat(P.white), 0, 0.08, 0.15));
    const s = steam(g, new THREE.Vector3(0, 0.2, 0.18), 3);
    return { group: g, anim: (t) => s(t, spriteCamera.current) };
  },
  workbench: (o) => {
    const g = new THREE.Group();
    g.add(mesh(rbox(o.params?.props === "labo" ? 3 : 2.4, 0.06, 0.8, 0.02), mat(o.params?.props === "labo" ? "#EDEBE6" : P.woodPale), 0, 0.9, 0));
    for (const x of [-1.1, 1.1]) g.add(mesh(rbox(0.06, 0.88, 0.7, 0.02), steelDark(), x * (o.params?.props === "labo" ? 1.3 : 1), 0.44, 0));
    if (o.params?.props === "labo" || o.params?.props === "matcha")
      for (let i = 0; i < 5; i++) {
        g.add(mesh(cyl(0.06, 0.05, 0.06, 14), mat("#F7F5EE"), -1 + i * 0.3, 0.96, 0.1));
        g.add(mesh(cyl(0.055, 0.055, 0.02, 14), mat(i % 2 ? P.matcha : "#5E8F3E"), -1 + i * 0.3, 0.99, 0.1, false));
      }
    if (o.params?.props === "qc") {
      g.add(mesh(rbox(0.4, 0.28, 0.3, 0.02), cardboard(), -0.6, 1.07, 0));
      g.add(mesh(rbox(0.24, 0.02, 0.32, 0.01), mat(P.white), 0.1, 0.94, 0.1));
    }
    return { group: g };
  },
  bin: () => {
    const g = new THREE.Group();
    g.add(mesh(cyl(0.2, 0.18, 0.6, 12), mat("#3F4A44"), 0, 0.3, 0));
    return { group: g };
  },
  parking_spot: (o) => {
    const g = new THREE.Group();
    const w = (o.params?.w as number) ?? 2.6;
    const d = (o.params?.d as number) ?? 5;
    const line = basic("#F3EFE5");
    for (const x of [-w / 2, w / 2]) {
      const l = new THREE.Mesh(plane(0.12, d), line);
      l.rotation.x = -Math.PI / 2;
      l.position.set(x, 0.02, 0);
      g.add(l);
    }
    if (o.params?.truck) {
      const zz = new THREE.Mesh(plane(w, 0.12), basic("#E3B341"));
      zz.rotation.x = -Math.PI / 2;
      zz.position.set(0, 0.02, -d / 2);
      g.add(zz);
    }
    return { group: g };
  },
  charging_station: () => {
    const g = new THREE.Group();
    g.add(mesh(rbox(0.35, 1.3, 0.25, 0.06), mat(P.white), 0, 0.65, 0));
    g.add(mesh(box(0.2, 0.08, 0.01), mat(P.matcha, { emissive: P.matcha, emissiveIntensity: 1 }), 0, 1.05, 0.13, false));
    return { group: g };
  },
  rug: (o) => {
    const g = new THREE.Group();
    if (o.params?.invisible) return { group: g };
    const w = (o.params?.w as number) ?? 2;
    const d = (o.params?.d as number) ?? 1.5;
    if (o.params?.tape) {
      const tape = basic("#E3B341");
      for (const [x, z, ww, dd] of [[0, -d / 2, w, 0.1], [0, d / 2, w, 0.1], [-w / 2, 0, 0.1, d], [w / 2, 0, 0.1, d]] as const) {
        const m = new THREE.Mesh(plane(ww, dd), tape);
        m.rotation.x = -Math.PI / 2;
        m.position.set(x, 0.02, z);
        g.add(m);
      }
      const t = new THREE.Mesh(plane(2.4, 0.45), new THREE.MeshBasicMaterial({ map: paintedText("QUARANTAINE", { color: "rgba(180,120,20,0.8)", font: 64 }), transparent: true, depthWrite: false }));
      t.rotation.x = -Math.PI / 2;
      t.position.set(0, 0.021, d / 2 - 0.4);
      g.add(t);
      return { group: g };
    }
    g.add(mesh(rbox(w, 0.015, d, 0.007), mat("#C9BBA0", { roughness: 1 }), 0, 0.008, 0, false));
    return { group: g };
  },
  poster: () => {
    const g = new THREE.Group();
    g.add(mesh(box(0.7, 1, 0.02), mat(P.green), 0, 1.6, 0));
    return { group: g };
  },
};

/** Construit un objet du plan. Les kits inconnus deviennent un cube neutre (signalé en console de dev). */
export function buildObject(o: ObjectDef): Built {
  const b = B[o.kit];
  if (!b) {
    if (process.env.NODE_ENV !== "production") console.warn(`kit inconnu : ${o.kit}`);
    const g = new THREE.Group();
    g.add(mesh(rbox(0.5, 0.5, 0.5), mat(P.concrete), 0, 0.25, 0));
    return { group: g };
  }
  const built = b(o);
  built.group.position.set(o.at[0], o.y ?? 0, o.at[1]);
  built.group.rotation.y = o.rotation;
  built.group.name = o.id;
  return built;
}

export const KIT_PALETTE: KitType[] = Object.keys(B) as KitType[];
