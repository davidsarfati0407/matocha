/**
 * Personnage « jouet » articulé : hanches, cuisses + tibias (genoux), torse,
 * épaules, tête, cheveux, accessoires. Une fonction pose() anime le squelette.
 * Le personnage regarde vers +z (local).
 */
import * as THREE from "three";
import type { Pose } from "@/lib/map/layout";
import { P, capsule, cyl, mat, mesh, rbox, sphere, box } from "./cache";
import { radialTexture } from "./textures";

export interface Appearance {
  skin: string;
  hair: string;
  hairStyle: "court" | "long" | "chignon";
  outfit: "tablier_vert" | "tshirt_ivoire" | "chemise" | "pull" | "gilet_securite" | "veste_cuisine" | "visiteur" | "chauffeur";
  accessory?: "aucun" | "tablette" | "carton" | "scanner" | "camera" | "fouet" | "casque" | "classeur";
}

const OUTFIT: Record<Appearance["outfit"], { top: string; legs: string; shoes: string; apron?: string; vest?: string }> = {
  tablier_vert: { top: "#EDE7DA", legs: "#2E3135", shoes: "#26231F", apron: P.green },
  tshirt_ivoire: { top: "#F1ECDF", legs: "#3C4A5C", shoes: "#E9E5DC" },
  chemise: { top: "#C9D6E2", legs: "#2F3338", shoes: "#3A2B22" },
  pull: { top: "#8E9C7E", legs: "#383A3F", shoes: "#2A2A2A" },
  gilet_securite: { top: "#5D6670", legs: "#30343A", shoes: "#2B2620", vest: "#D9E14C" },
  veste_cuisine: { top: "#FAF8F3", legs: "#41464C", shoes: "#2B2B2B" },
  visiteur: { top: "#B9744E", legs: "#2E3D52", shoes: "#3A2E26" },
  chauffeur: { top: "#41525F", legs: "#2F3338", shoes: "#26231F", vest: "#E3B341" },
};

export interface Rig {
  root: THREE.Group;
  body: THREE.Group;
  torso: THREE.Group;
  head: THREE.Group;
  armL: THREE.Group;
  armR: THREE.Group;
  forearmR: THREE.Group;
  forearmL: THREE.Group;
  thighL: THREE.Group;
  thighR: THREE.Group;
  shinL: THREE.Group;
  shinR: THREE.Group;
  handR: THREE.Group;
  props: Record<string, THREE.Object3D>;
  /** Phase personnelle pour désynchroniser les animations. */
  seed: number;
}

const HIP_Y = 0.78;

export function buildCharacter(a: Appearance, seed = Math.random() * 100): Rig {
  const o = OUTFIT[a.outfit];
  const skin = mat(a.skin, { roughness: 0.7 });
  const top = mat(o.top);
  const legs = mat(o.legs);
  const shoes = mat(o.shoes, { roughness: 0.6 });
  const hair = mat(a.hair, { roughness: 0.75 });

  const root = new THREE.Group();
  root.name = "character";
  root.scale.setScalar(1.25); // échelle « maquette » : lisible depuis la vue d'ensemble
  const body = new THREE.Group();
  body.position.y = HIP_Y;
  root.add(body);

  // Jambes : cuisse (pivot hanche) → tibia (pivot genou) → chaussure
  const leg = (side: number) => {
    const thigh = new THREE.Group();
    thigh.position.set(side * 0.085, 0, 0);
    thigh.add(mesh(capsule(0.065, 0.26), legs, 0, -0.19, 0));
    const shin = new THREE.Group();
    shin.position.y = -0.38;
    shin.add(mesh(capsule(0.058, 0.24), legs, 0, -0.17, 0));
    shin.add(mesh(rbox(0.11, 0.07, 0.2, 0.03), shoes, 0, -0.36, 0.04));
    thigh.add(shin);
    body.add(thigh);
    return [thigh, shin] as const;
  };
  const [thighL, shinL] = leg(-1);
  const [thighR, shinR] = leg(1);

  const torso = new THREE.Group();
  body.add(torso);
  torso.add(mesh(rbox(0.36, 0.5, 0.22, 0.09), top, 0, 0.27, 0));
  torso.add(mesh(rbox(0.34, 0.1, 0.21, 0.04), legs, 0, 0.03, 0)); // ceinture
  if (o.apron) torso.add(mesh(rbox(0.3, 0.52, 0.02, 0.01), mat(o.apron), 0, 0.16, 0.115));
  if (o.vest) {
    torso.add(mesh(rbox(0.38, 0.38, 0.235, 0.08), mat(o.vest, { roughness: 0.5 }), 0, 0.3, 0));
    torso.add(mesh(box(0.385, 0.03, 0.24), mat("#E8E8E0", { emissive: "#666655", emissiveIntensity: 0.3 }), 0, 0.22, 0));
  }
  if (a.outfit === "veste_cuisine") for (let i = 0; i < 3; i++) torso.add(mesh(sphere(0.012, 6), mat("#9AA1A6"), 0.05, 0.42 - i * 0.1, 0.112, false));

  // Tête
  const head = new THREE.Group();
  head.position.y = 0.56;
  torso.add(head);
  head.add(mesh(cyl(0.05, 0.055, 0.06, 10), skin, 0, 0.0, 0));
  head.add(mesh(sphere(0.135, 20), skin, 0, 0.14, 0));
  const eye = mat("#1E1C19", { roughness: 0.4 });
  head.add(mesh(sphere(0.016, 8), eye, -0.045, 0.16, 0.122, false));
  head.add(mesh(sphere(0.016, 8), eye, 0.045, 0.16, 0.122, false));
  // Cheveux
  const cap = new THREE.Mesh(new THREE.SphereGeometry(0.142, 20, 12, 0, Math.PI * 2, 0, Math.PI * 0.55), hair);
  cap.position.set(0, 0.155, -0.008);
  cap.rotation.x = -0.25;
  cap.castShadow = true;
  head.add(cap);
  if (a.hairStyle === "long") head.add(mesh(rbox(0.26, 0.26, 0.08, 0.04), hair, 0, 0.06, -0.09));
  if (a.hairStyle === "chignon") head.add(mesh(sphere(0.07, 12), hair, 0, 0.27, -0.09));

  // Bras : épaule → avant-bras (coude) → main
  const arm = (side: number) => {
    const shoulder = new THREE.Group();
    shoulder.position.set(side * 0.225, 0.47, 0);
    shoulder.add(mesh(capsule(0.052, 0.18), top, 0, -0.12, 0));
    const fore = new THREE.Group();
    fore.position.y = -0.25;
    fore.add(mesh(capsule(0.046, 0.16), a.outfit === "tshirt_ivoire" ? skin : top, 0, -0.1, 0));
    const hand = new THREE.Group();
    hand.position.y = -0.22;
    hand.add(mesh(sphere(0.05, 10), skin));
    fore.add(hand);
    shoulder.add(fore);
    torso.add(shoulder);
    return [shoulder, fore, hand] as const;
  };
  const [armL, forearmL] = arm(-1);
  const [armR, forearmR, handR] = arm(1);

  // Accessoires (visibles selon la pose)
  const props: Record<string, THREE.Object3D> = {};
  const add = (name: string, obj: THREE.Object3D, parent: THREE.Object3D) => {
    obj.visible = false;
    parent.add(obj);
    props[name] = obj;
  };
  add("tablette", mesh(rbox(0.2, 0.015, 0.27, 0.01), mat("#2A2D2B"), 0, -0.02, 0.06), handR);
  add("carton", mesh(rbox(0.38, 0.26, 0.3, 0.01), mat(P.cardboard), 0, 0.02, 0.18), handR);
  add("scanner", mesh(rbox(0.06, 0.06, 0.16, 0.015), mat("#E0B341"), 0, 0, 0.05), handR);
  add("camera", mesh(rbox(0.18, 0.12, 0.12, 0.02), mat("#1E2020"), 0, 0.04, 0.08), handR);
  add("tasse", mesh(cyl(0.04, 0.035, 0.09, 12), mat(P.white), 0, 0.02, 0.05), handR);
  add("fouet", mesh(cyl(0.02, 0.006, 0.18, 8), mat(P.woodPale), 0, -0.06, 0), handR);
  add("raquette", mesh(cyl(0.08, 0.08, 0.015, 14), mat("#B33A2C"), 0, -0.1, 0.02), handR);
  add("telephone", mesh(rbox(0.04, 0.14, 0.012, 0.006), mat("#222")), handR);
  add("classeur", mesh(rbox(0.24, 0.3, 0.04, 0.01), mat(P.green), 0, 0, 0.08), handR);
  if (a.accessory === "casque") {
    const h = mesh(new THREE.TorusGeometry(0.14, 0.015, 6, 16, Math.PI), mat("#2B2B2B"), 0, 0.15, 0);
    head.add(h);
  }
  (props.raquette as THREE.Mesh).rotation.x = Math.PI / 2;

  // Ombre de contact (disque radial)
  const shadow = new THREE.Mesh(new THREE.PlaneGeometry(0.75, 0.75), new THREE.MeshBasicMaterial({ map: radialTexture("rgba(20,22,18,0.35)"), transparent: true, depthWrite: false }));
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.012;
  shadow.renderOrder = 1;
  root.add(shadow);
  props.shadow = shadow;

  root.traverse((c) => {
    c.userData.characterPart = true;
  });
  return { root, body, torso, head, armL, armR, forearmL, forearmR, thighL, thighR, shinL, shinR, handR, props, seed };
}

/** Accessoire principal tenu selon la pose et le métier. */
function propFor(pose: Pose | "walk", accessory?: Appearance["accessory"]) {
  switch (pose) {
    case "coffee":
      return "tasse";
    case "whisk":
      return "fouet";
    case "film":
      return "camera";
    case "pingpong":
      return "raquette";
    case "phone":
      return "telephone";
    case "carry":
      return "carton";
    case "pack":
      return accessory === "scanner" ? "scanner" : null;
    case "inspect":
      return accessory === "tablette" || accessory === "classeur" ? accessory : null;
    case "walk":
      return accessory === "tablette" ? "tablette" : null;
    default:
      return null;
  }
}

/**
 * Applique une pose. t = temps (s), speed = vitesse de marche (m/s) pour la marche.
 * seatY = hauteur d'assise quand la pose est assise.
 */
export function pose(rig: Rig, p: Pose | "walk", t: number, opts: { speed?: number; seatY?: number; accessory?: Appearance["accessory"]; carrying?: boolean } = {}) {
  const s = rig.seed;
  const tt = t + s;
  // Remise à zéro
  rig.body.position.set(0, HIP_Y, 0);
  rig.body.rotation.set(0, 0, 0);
  rig.torso.rotation.set(0, 0, 0);
  rig.torso.scale.set(1, 1, 1);
  rig.head.rotation.set(0, 0, 0);
  for (const g of [rig.armL, rig.armR, rig.forearmL, rig.forearmR, rig.thighL, rig.thighR, rig.shinL, rig.shinR]) g.rotation.set(0, 0, 0);
  rig.armL.rotation.z = -0.08;
  rig.armR.rotation.z = 0.08;

  const prop = opts.carrying ? "carton" : propFor(p, opts.accessory);
  for (const k of ["tablette", "carton", "scanner", "camera", "tasse", "fouet", "raquette", "telephone", "classeur"]) rig.props[k].visible = k === prop;

  const sit = (y = 0.45) => {
    rig.body.position.y = y + 0.06;
    rig.thighL.rotation.x = rig.thighR.rotation.x = -Math.PI / 2;
    rig.shinL.rotation.x = rig.shinR.rotation.x = Math.PI / 2;
    rig.body.position.z = -0.08;
  };

  switch (p) {
    case "walk": {
      const f = (opts.speed ?? 1.3) * 4.2;
      const k = Math.sin(t * f + s);
      rig.thighL.rotation.x = k * 0.55;
      rig.thighR.rotation.x = -k * 0.55;
      rig.shinL.rotation.x = Math.max(0, -Math.cos(t * f + s)) * 0.7;
      rig.shinR.rotation.x = Math.max(0, Math.cos(t * f + s)) * 0.7;
      rig.body.position.y = HIP_Y + Math.abs(Math.cos(t * f + s)) * 0.035;
      rig.torso.rotation.y = k * 0.06;
      if (opts.carrying) {
        rig.armL.rotation.x = rig.armR.rotation.x = -1.1;
        rig.forearmL.rotation.x = rig.forearmR.rotation.x = -0.5;
      } else if (prop === "tablette") {
        rig.armL.rotation.x = k * 0.45;
        rig.armR.rotation.x = -0.5;
        rig.forearmR.rotation.x = -1.0;
      } else {
        rig.armL.rotation.x = -k * 0.5;
        rig.armR.rotation.x = k * 0.5;
        rig.forearmL.rotation.x = rig.forearmR.rotation.x = -0.25;
      }
      break;
    }
    case "stand": {
      rig.torso.scale.y = 1 + Math.sin(tt * 1.6) * 0.008;
      rig.head.rotation.y = Math.sin(tt * 0.3) * 0.25;
      rig.armL.rotation.x = Math.sin(tt * 0.9) * 0.04;
      break;
    }
    case "sit_type": {
      sit(opts.seatY ?? 0.45);
      rig.armL.rotation.x = rig.armR.rotation.x = -0.95;
      rig.forearmL.rotation.x = -0.75 + Math.sin(tt * 14) * 0.05;
      rig.forearmR.rotation.x = -0.75 + Math.sin(tt * 13 + 1) * 0.05;
      rig.armL.rotation.z = 0.15;
      rig.armR.rotation.z = -0.15;
      rig.head.rotation.x = 0.12 + Math.sin(tt * 0.4) * 0.04;
      rig.head.rotation.y = Math.sin(tt * 0.23) * 0.15;
      break;
    }
    case "sit_meeting": {
      sit(opts.seatY ?? 0.45);
      rig.armL.rotation.x = -0.7;
      rig.forearmL.rotation.x = -0.6;
      const talking = Math.sin(tt * 0.35) > 0.4;
      rig.armR.rotation.x = talking ? -0.9 + Math.sin(tt * 4) * 0.3 : -0.7;
      rig.forearmR.rotation.x = talking ? -0.9 + Math.sin(tt * 5) * 0.25 : -0.6;
      rig.head.rotation.y = Math.sin(tt * 0.5) * 0.4;
      rig.head.rotation.x = talking ? Math.sin(tt * 6) * 0.05 : 0;
      break;
    }
    case "sit_relax": {
      sit(opts.seatY ?? 0.42);
      rig.torso.rotation.x = -0.22;
      rig.armL.rotation.x = rig.armR.rotation.x = -0.35;
      rig.forearmL.rotation.x = rig.forearmR.rotation.x = -0.6;
      rig.head.rotation.y = Math.sin(tt * 0.2) * 0.3;
      break;
    }
    case "phone": {
      rig.armR.rotation.x = -0.4;
      rig.armR.rotation.z = 0.5;
      rig.forearmR.rotation.x = -2.2;
      rig.head.rotation.z = -0.1;
      rig.armL.rotation.x = Math.sin(tt * 1.3) * 0.2;
      rig.body.rotation.y = Math.sin(tt * 0.25) * 0.5;
      break;
    }
    case "coffee": {
      const sip = Math.max(0, Math.sin(tt * 0.6)) ** 6;
      rig.armR.rotation.x = -0.5 - sip * 0.6;
      rig.forearmR.rotation.x = -1.2 - sip * 0.8;
      rig.armL.rotation.x = Math.sin(tt * 0.7) * 0.1;
      rig.head.rotation.x = -sip * 0.2;
      break;
    }
    case "talk": {
      rig.armR.rotation.x = -0.4 + Math.sin(tt * 3) * 0.3;
      rig.forearmR.rotation.x = -0.8 + Math.sin(tt * 4) * 0.3;
      rig.armL.rotation.x = -0.2 + Math.sin(tt * 2.3) * 0.2;
      rig.head.rotation.x = Math.sin(tt * 5) * 0.04;
      break;
    }
    case "crouch": {
      rig.body.position.y = 0.42;
      rig.thighL.rotation.x = rig.thighR.rotation.x = -1.7;
      rig.shinL.rotation.x = rig.shinR.rotation.x = 2.2;
      rig.torso.rotation.x = 0.4;
      rig.armL.rotation.x = rig.armR.rotation.x = -0.9;
      break;
    }
    case "pack": {
      rig.torso.rotation.x = 0.18;
      rig.armL.rotation.x = -0.9 + Math.sin(tt * 3) * 0.25;
      rig.armR.rotation.x = -0.9 + Math.sin(tt * 3 + Math.PI) * 0.25;
      rig.forearmL.rotation.x = rig.forearmR.rotation.x = -0.6;
      rig.armL.rotation.z = 0.25 + Math.sin(tt * 1.5) * 0.1;
      rig.armR.rotation.z = -0.25;
      rig.head.rotation.x = 0.35;
      break;
    }
    case "whisk": {
      rig.torso.rotation.x = 0.1;
      rig.armL.rotation.x = -0.8;
      rig.forearmL.rotation.x = -0.7;
      rig.armR.rotation.x = -0.9 + Math.sin(tt * 18) * 0.08;
      rig.armR.rotation.z = Math.cos(tt * 18) * 0.12;
      rig.forearmR.rotation.x = -0.9;
      rig.head.rotation.x = 0.3;
      break;
    }
    case "film": {
      rig.armL.rotation.x = rig.armR.rotation.x = -1.1;
      rig.forearmL.rotation.x = rig.forearmR.rotation.x = -0.8;
      rig.armL.rotation.z = 0.35;
      rig.armR.rotation.z = -0.35;
      rig.body.rotation.y = Math.sin(tt * 0.4) * 0.25;
      break;
    }
    case "pingpong": {
      const k = Math.sin(tt * 3.2);
      rig.body.position.x = k * 0.2;
      rig.armR.rotation.x = -0.6 + Math.cos(tt * 3.2) * 0.6;
      rig.armR.rotation.z = 0.3 + Math.sin(tt * 3.2) * 0.4;
      rig.forearmR.rotation.x = -0.6;
      rig.thighL.rotation.x = -0.3;
      rig.thighR.rotation.x = -0.3;
      rig.shinL.rotation.x = rig.shinR.rotation.x = 0.5;
      rig.body.position.y = HIP_Y - 0.06 + Math.abs(k) * 0.02;
      rig.torso.rotation.x = 0.2;
      break;
    }
    case "carry": {
      rig.armL.rotation.x = rig.armR.rotation.x = -1.1;
      rig.forearmL.rotation.x = rig.forearmR.rotation.x = -0.5;
      rig.body.rotation.y = Math.sin(tt * 0.3) * 0.4;
      break;
    }
    case "inspect": {
      rig.torso.rotation.x = 0.28;
      rig.armR.rotation.x = -1.0 + Math.sin(tt * 0.8) * 0.15;
      rig.forearmR.rotation.x = -0.5;
      rig.armL.rotation.x = prop ? -0.6 : -0.3;
      rig.forearmL.rotation.x = prop ? -1.2 : -0.3;
      rig.head.rotation.x = 0.35;
      rig.head.rotation.y = Math.sin(tt * 0.5) * 0.2;
      break;
    }
  }
}
