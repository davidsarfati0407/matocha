/** Score A/B/C d'un candidat : part des critères du poste remplis (pondération égale). */
export function scoreCandidate(criteria: string[], met: string[]): "A" | "B" | "C" {
  if (criteria.length === 0) return "B";
  const ok = criteria.filter((c) => met.includes(c)).length / criteria.length;
  return ok >= 0.75 ? "A" : ok >= 0.4 ? "B" : "C";
}
