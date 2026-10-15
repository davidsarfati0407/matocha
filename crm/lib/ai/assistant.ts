import "server-only";
/**
 * Assistant IA du back-office : Claude (SDK Anthropic) avec des outils en
 * lecture seule qui interrogent la base AVEC les droits de l'utilisateur
 * (client Supabase RLS) — l'assistant ne voit jamais plus que la personne.
 * Sans clé API, l'application l'indique honnêtement (« non configuré »).
 */
import Anthropic from "@anthropic-ai/sdk";
import { searchAll } from "@/app/(backoffice)/_actions/shell";
import { sectorConfig } from "@/config/sector.config";
import { getCtx } from "@/lib/backoffice/context";
import { createClient } from "@/lib/supabase/server";

export const AI_MODEL = "claude-opus-5-5";
export const aiConfigured = () => Boolean(process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN);

const obj = (properties: Record<string, unknown>, required: string[] = []) => ({ type: "object" as const, properties, required, additionalProperties: false });
const TOOLS: Anthropic.Beta.BetaTool[] = [
  { name: "rechercher", description: "Recherche plein texte dans les collaborateurs, comptes, commandes pro, devis, factures, stock et équipements. Renvoie libellés et liens.", input_schema: obj({ texte: { type: "string" } }, ["texte"]), strict: true },
  { name: "indicateurs_du_jour", description: "KPI du jour : commandes, expédition avant l'heure limite, chiffre d'affaires, et compteurs « à faire » (devis, relances, congés, stock bas, messages).", input_schema: obj({}), strict: true },
  { name: "factures_ouvertes", description: "Factures non soldées (envoyées, partielles, échues) avec montant restant dû et échéance.", input_schema: obj({}), strict: true },
  { name: "commandes_pro", description: "Commandes pro en cours avec étape, statut, échéance et client. Filtre optionnel par étape.", input_schema: obj({ etape: { type: "string", description: "confirmee, preparation, controle, expedition, livree, facturee ou vide" } }, ["etape"]), strict: true },
  { name: "presence_equipe", description: "Statut de présence actuel de chaque collaborateur (au poste, réunion, télétravail, absent…).", input_schema: obj({}), strict: true },
  { name: "conges_a_valider", description: "Demandes de congé en attente.", input_schema: obj({}), strict: true },
  { name: "stock_bas", description: "Articles sous le seuil minimum et état de commande.", input_schema: obj({}), strict: true },
];

async function runTool(name: string, input: Record<string, unknown>): Promise<string> {
  const supabase = await createClient();
  const json = (v: unknown) => JSON.stringify(v).slice(0, 12000);
  switch (name) {
    case "rechercher":
      return json(await searchAll(String(input.texte ?? "")));
    case "indicateurs_du_jour": {
      const [c, ...k] = await Promise.all([supabase.rpc("backoffice_counters"), ...sectorConfig.kpisEnTete.map((x) => supabase.rpc(x.source.replace(/\(\)$/, "")))]);
      return json({ a_faire: c.data, kpi: sectorConfig.kpisEnTete.map((x, i) => ({ libelle: x.libelle, unite: x.unite, ...(k[i].data as object) })) });
    }
    case "factures_ouvertes": {
      const { data, error } = await supabase.from("invoices").select("id, number, status, due_on, total_ttc, paid_amount, clients(name)").in("status", ["sent", "partial", "overdue"]);
      return error ? "Accès refusé pour ce rôle." : json((data ?? []).map((i) => ({ numero: i.number, statut: i.status, echeance: i.due_on, reste_du: Number(i.total_ttc) - Number(i.paid_amount), client: (i.clients as unknown as { name: string })?.name, lien: `/finance/invoices/${i.id}` })));
    }
    case "commandes_pro": {
      let q = supabase.from("work_orders").select("id, number, title, stage, status, due_at, clients(name)").neq("stage", "facturee");
      if (input.etape) q = q.eq("stage", String(input.etape));
      const { data, error } = await q;
      return error ? "Accès refusé pour ce rôle." : json((data ?? []).map((w) => ({ numero: w.number, titre: w.title, etape: w.stage, statut: w.status, echeance: w.due_at, client: (w.clients as unknown as { name: string })?.name, lien: `/ops/work-orders/${w.id}` })));
    }
    case "presence_equipe": {
      const [p, e] = await Promise.all([supabase.from("presence_status").select("employee_id, status, current_event"), supabase.from("employees").select("id, first_name, last_name, job_title")]);
      const n = new Map((e.data ?? []).map((x) => [x.id, `${x.first_name} ${x.last_name} (${x.job_title})`]));
      return json((p.data ?? []).map((x) => ({ personne: n.get(x.employee_id), statut: x.status, evenement: x.current_event })));
    }
    case "conges_a_valider": {
      const { data } = await supabase.from("leave_requests").select("type, starts_on, ends_on, days, employees(first_name, last_name)").eq("status", "pending");
      return json(data ?? []);
    }
    case "stock_bas": {
      const { data } = await supabase.from("stock_items").select("id, reference, name, quantity, min_quantity, on_order");
      return json((data ?? []).filter((s) => Number(s.quantity) < Number(s.min_quantity)).map((s) => ({ ...s, lien: `/resources/stock/${s.id}` })));
    }
    default:
      return `Outil inconnu : ${name}`;
  }
}

export interface ChatTurn {
  role: "user" | "assistant";
  text: string;
}

/** Une question → réponse, avec boucle d'outils (au plus 6 tours). */
export async function askAssistant(history: ChatTurn[]): Promise<{ text: string; tools: string[] }> {
  const ctx = await getCtx();
  const client = new Anthropic();
  const system = `Tu es l'assistant interne de ${sectorConfig.entreprise.nomCourt} (${sectorConfig.entreprise.activite}).
Tu parles à ${ctx.fullName}, rôle « ${ctx.role.label} ». Réponds en français, brièvement, avec des chiffres exacts tirés des outils.
Utilise les outils pour toute question sur les données : n'invente jamais un chiffre, un nom ou un statut.
Quand tu cites un élément, ajoute son lien relatif en markdown, ex. [F-2026-0409](/finance/invoices/…).
Si un outil répond « Accès refusé », dis que le rôle de l'utilisateur ne permet pas de voir cette information.
Tu ne peux rien modifier : propose l'action et le lien de la page où la faire en un clic.
Les données sont fictives (démonstration). Date du jour : ${new Date().toLocaleDateString("fr-FR", { timeZone: sectorConfig.entreprise.fuseau })}.`;
  const messages: Anthropic.Beta.BetaMessageParam[] = history.map((h) => ({ role: h.role, content: h.text }));
  const used: string[] = [];
  for (let i = 0; i < 6; i++) {
    const res = await client.beta.messages.create({
      model: AI_MODEL,
      max_tokens: 16000,
      system,
      tools: TOOLS,
      output_config: { effort: "low" },
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      messages,
    });
    if (res.stop_reason === "refusal") return { text: "La demande n'a pas pu être traitée (refus de sécurité du modèle).", tools: used };
    if (res.stop_reason === "pause_turn") {
      messages.push({ role: "assistant", content: res.content });
      continue;
    }
    const calls = res.content.filter((b): b is Anthropic.Beta.BetaToolUseBlock => b.type === "tool_use");
    if (res.stop_reason !== "tool_use" || calls.length === 0) {
      return { text: res.content.flatMap((b) => (b.type === "text" ? [b.text] : [])).join("\n").trim() || "(réponse vide)", tools: used };
    }
    messages.push({ role: "assistant", content: res.content });
    const results: Anthropic.Beta.BetaToolResultBlockParam[] = await Promise.all(
      calls.map(async (c) => {
        used.push(c.name);
        try {
          return { type: "tool_result" as const, tool_use_id: c.id, content: await runTool(c.name, (c.input ?? {}) as Record<string, unknown>) };
        } catch (e) {
          return { type: "tool_result" as const, tool_use_id: c.id, content: `Erreur : ${(e as Error).message}`, is_error: true };
        }
      }),
    );
    messages.push({ role: "user", content: results });
  }
  return { text: "Je n'ai pas pu conclure en un nombre raisonnable d'étapes : reformulez la question.", tools: used };
}

/** Brouillon de réponse à un fil de messages (à relire avant envoi). */
export async function draftReply(o: { subject: string; language: string; messages: { direction: string; from: string; body: string }[]; client?: string | null }): Promise<string> {
  const client = new Anthropic();
  const res = await client.beta.messages.create({
    model: AI_MODEL,
    max_tokens: 4000,
    output_config: { effort: "low" },
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    system: `Tu rédiges des brouillons de réponse e-mail pour l'équipe de ${sectorConfig.entreprise.nomCourt}. Ton chaleureux et professionnel, concis. Réponds dans la langue du dernier message reçu (code : ${o.language}). N'invente ni prix, ni date, ni engagement : laisse [à compléter] si une information manque. Renvoie uniquement le corps du message.`,
    messages: [{ role: "user", content: `Objet : ${o.subject}\nClient : ${o.client ?? "—"}\n\nFil :\n${o.messages.map((m) => `${m.direction === "in" ? "Reçu de" : "Envoyé par"} ${m.from} :\n${m.body}`).join("\n\n")}` }],
  });
  if (res.stop_reason === "refusal") throw new Error("refus du modèle");
  return res.content.flatMap((b) => (b.type === "text" ? [b.text] : [])).join("\n").trim();
}
