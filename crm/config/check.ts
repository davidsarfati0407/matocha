import { sectorConfig } from "./sector.config";

const zones = new Set(sectorConfig.lieux.flatMap((l) => l.zones.map((z) => z.id)));
const roles = new Set(sectorConfig.roles.map((r) => r.id));
const departements = new Set(sectorConfig.departements.map((d) => d.id));

const errors: string[] = [];
for (const p of sectorConfig.postes) {
  if (!zones.has(p.zone)) errors.push(`poste ${p.id} : zone inconnue ${p.zone}`);
  if (!roles.has(p.roleApp)) errors.push(`poste ${p.id} : rôle inconnu ${p.roleApp}`);
  if (!departements.has(p.departement)) errors.push(`poste ${p.id} : département inconnu ${p.departement}`);
}
for (const e of sectorConfig.objetMetierCentral.etapes) if (e.zone && !zones.has(e.zone)) errors.push(`étape ${e.id} : zone inconnue`);
for (const e of sectorConfig.evenementsLiveDeDemo) if (!zones.has(e.zone)) errors.push(`événement ${e.id} : zone inconnue`);

if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}
const effectif = sectorConfig.postes.reduce((n, p) => n + p.effectif, 0);
console.log(`OK — ${zones.size} espaces, ${sectorConfig.postes.length} postes, ${effectif} personnes, ${sectorConfig.objetMetierCentral.etapes.length} étapes.`);
