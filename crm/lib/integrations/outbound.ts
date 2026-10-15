import "server-only";
/** Envois sortants depuis les écrans (e-mail, agenda, dossiers) via la file : fournisseur connecté ou simulé. */
import { getTranslations } from "next-intl/server";
import { getCtx } from "@/lib/backoffice/context";
import { enqueue } from "./store";

/** Noms de produits (non traduits) ; le mode simulé est traduit (settings.outbound.mock). */
const LABEL: Record<string, string> = { microsoft: "Microsoft 365", google: "Google Workspace" };

export async function outbound(kind: "mail.send" | "mail.draft" | "calendar.push" | "files.folder", payload: Record<string, unknown>) {
  const [ctx, t] = await Promise.all([getCtx(), getTranslations("settings.outbound")]);
  try {
    const job = await enqueue(ctx.orgId, kind, payload, { userId: ctx.userId });
    const via = job.provider === "mock" ? t("mock") : (LABEL[job.provider] ?? job.provider);
    if (job.status === "done") return { ok: true as const, via, simulated: job.provider === "mock", result: job.result };
    return { ok: false as const, via, error: t("error", { via, error: job.last_error ?? t("pending") }) };
  } catch (e) {
    return { ok: false as const, via: t("queue"), error: (e as Error).message };
  }
}

/** HTML minimal et sûr pour un corps de message en texte. */
export const textToHtml = (t: string) => `<div style="font-family:Arial,sans-serif;font-size:14px">${t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\n/g, "<br>")}</div>`;
