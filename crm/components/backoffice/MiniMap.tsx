/** Mini-map cliquable : plan vu de dessus, présence par espace ; un clic ouvre la map sur l'espace. */
import Link from "next/link";
import type { FloorPlanLayout } from "@/lib/map/layout";
import { mapHref } from "@/lib/map/links";

const FLOOR: Record<string, string> = { parquet_clair: "#ead9b8", beton_cire: "#dcd9d2", tatami: "#dfd79f", carrelage: "#eceae5", moquette: "#c4ccd0", resine: "#d4ddd6", paves: "#d9d4c9", gazon: "#c3d9a8", enrobe: "#b9bab8" };

export function MiniMap({ layout, site, counts }: { layout: FloorPlanLayout; site: string; counts: Record<string, number> }) {
  const zones = layout.zones.filter((z) => z.key !== "rue");
  const pts = zones.flatMap((z) => z.polygon);
  const x0 = Math.min(...pts.map((p) => p[0])) - 1;
  const z0 = Math.min(...pts.map((p) => p[1])) - 1;
  const w = Math.max(...pts.map((p) => p[0])) - x0 + 1;
  const h = Math.max(...pts.map((p) => p[1])) - z0 + 1;
  return (
    <svg viewBox={`${x0} ${z0} ${w} ${h}`} className="w-full" role="img" aria-label="Plan des locaux avec présence par espace">
      {zones.map((z) => {
        const c = z.polygon.reduce((a, p) => [a[0] + p[0] / z.polygon.length, a[1] + p[1] / z.polygon.length], [0, 0]);
        const n = counts[z.key] ?? 0;
        return (
          <Link key={z.key} href={mapHref(site, "zones", z.key)}>
            <g className="cursor-pointer [&:hover>polygon]:stroke-[var(--accent)]">
              <title>{`${z.name} : ${n} personne(s)`}</title>
              <polygon points={z.polygon.map((p) => p.join(",")).join(" ")} fill={FLOOR[z.floor] ?? "#ddd"} stroke="#fff" strokeWidth={0.4} />
              {n > 0 && (
                <>
                  <circle cx={c[0]} cy={c[1]} r={1.6} fill="var(--accent)" stroke="#fff" strokeWidth={0.4} />
                  <text x={c[0]} y={c[1] + 0.6} textAnchor="middle" fontSize={1.8} fill="#fff" fontWeight={700}>
                    {n}
                  </text>
                </>
              )}
            </g>
          </Link>
        );
      })}
    </svg>
  );
}
