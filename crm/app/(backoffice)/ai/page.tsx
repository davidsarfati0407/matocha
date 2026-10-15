import type { Metadata } from "next";
import { AiChat } from "@/components/backoffice/AiChat";
import { Badge, Card, Denied, PageHeader } from "@/components/ui/kit";
import { AI_MODEL, aiConfigured } from "@/lib/ai/assistant";
import { requirePerm } from "@/lib/backoffice/context";

export const metadata: Metadata = { title: "Assistant" };

export default async function AiPage() {
  const { allowed } = await requirePerm("ia");
  if (!allowed) return <Denied what="l'assistant" />;
  const on = aiConfigured();
  return (
    <>
      <PageHeader title="Assistant" subtitle="Questions en langage naturel sur vos données · lecture seule, avec vos droits" actions={on ? <Badge tone="ok">Connecté · {AI_MODEL}</Badge> : <Badge tone="warn">Non configuré</Badge>} />
      <div className="grid gap-4 lg:grid-cols-3">
        <Card padded={false} className="flex flex-col lg:col-span-2"><AiChat /></Card>
        <Card title="Comment ça marche">
          <ul className="space-y-2 text-sm text-muted">
            <li>• Le modèle n'accède qu'à 7 outils de lecture (recherche, KPI, factures ouvertes, commandes, présence, congés, stock bas).</li>
            <li>• Chaque outil interroge la base avec votre session : la RLS s'applique, l'assistant ne voit pas les salaires si vous ne les voyez pas.</li>
            <li>• Il ne modifie rien : il propose le lien de la page où agir en un clic.</li>
            <li>• Dans la messagerie, il rédige des brouillons de réponse à relire avant envoi.</li>
          </ul>
        </Card>
      </div>
    </>
  );
}
