import { sectorConfig } from "@/config/sector.config";

/** Monogramme : carré arrondi vert profond, « M » ivoire, point matcha. */
export function Logo({ size = 36 }: { size?: number }) {
  const c = sectorConfig.entreprise.couleurs;
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" role="img" aria-label={sectorConfig.entreprise.nomCourt}>
      <rect width="40" height="40" rx="11" fill={c.identite} />
      <path d="M10 28V13l10 9 10-9v15" fill="none" stroke={c.fond} strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="31" cy="9.5" r="3" fill={c.matcha} />
    </svg>
  );
}
