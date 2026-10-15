import "server-only";
/** Envois sortants depuis les écrans (e-mail, agenda, dossiers) via la file : fournisseur connecté ou simulé. */
import { getCtx } from "@/lib/backoffice/context";
import { enqueue } from "./store";

const LABEL: Record<string, string> = { microsoft: "Microsoft 365", google: "Google Workspace", mock: "mode simulé" };

export async function outbound(kind: "mail.send" | "mail.draft" | "calendar.push" | "files.folder", payload: Record<string, unknown>) {
  const ctx = await getCtx();
  try {
    const job = await enqueue(ctx.orgId, kind, payload, { userId: ctx.userId });
    const via = LABEL[job.provider] ?? job.provider;
    if (job.status === "done") return { ok: true as const, via, simulated: job.provider === "mock", result: job.result };
    return { ok: false as const, via, error: `${via} : ${job.last_error ?? "en attente"} — nouvel essai automatique` };
  } catch (e) {
    return { ok: false as const, via: "file", error: (e as Error).message };
  }
}

/** HTML minimal et sûr pour un corps de message en texte. */
export const textToHtml = (t: string) => `<div style="font-family:Arial,sans-serif;font-size:14px">${t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\n/g, "<br>")}</div>`;
