import type { Metadata } from "next";
import { Badge, Card, PageHeader } from "@/components/ui/kit";
import { sectorConfig } from "@/config/sector.config";
import { AI_MODEL, aiConfigured } from "@/lib/ai/assistant";

export const metadata: Metadata = { title: "Intégrations" };

/** État réel de chaque intégration : rien n'est présenté comme connecté s'il ne l'est pas. */
export default function IntegrationsPage() {
  const realtime = process.env.NEXT_PUBLIC_REALTIME !== "off";
  const rows = [
    { nom: "Assistant IA (Claude)", usage: `Questions sur les données, brouillons de réponse · modèle ${AI_MODEL}`, state: aiConfigured() ? "connecte" : "non_configure" },
    { nom: "Temps réel (Supabase Realtime)", usage: "Map et fil d'activité mis à jour instantanément", state: realtime ? "connecte" : "repli" },
    ...sectorConfig.integrations.map((i) => ({ nom: i.nom, usage: i.usage, state: i.mode === "simule" ? "simule" : "connecte" })),
    { nom: "Banque (relevés camt.054)", usage: "Import manuel de fichier ; connexion bancaire directe non branchée", state: "simule" },
    { nom: "Stockage de fichiers", usage: "Justificatifs et pièces jointes", state: "simule" },
  ];
  const B: Record<string, ["ok" | "warn" | "muted" | "info", string]> = { connecte: ["ok", "Connecté"], non_configure: ["warn", "Non configuré"], simule: ["muted", "Mode simulé"], repli: ["info", "Sondage 1 s (repli)"] };
  return (
    <>
      <PageHeader title="Intégrations" subtitle="Chaque connecteur passe par un adaptateur : le brancher ne change pas les écrans." />
      <div className="grid gap-3 md:grid-cols-2">
        {rows.map((r) => (
          <Card key={r.nom}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold">{r.nom}</p>
                <p className="text-sm text-muted">{r.usage}</p>
              </div>
              <Badge tone={B[r.state][0]}>{B[r.state][1]}</Badge>
            </div>
          </Card>
        ))}
      </div>
    </>
  );
}
