"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { logout, requestMagicLink, requireAdmin } from "@/lib/admin-auth";
import { audit } from "@/lib/ops/audit";
import { createChangeRequest, decideChangeRequest } from "@/lib/ops/changes";
import { getSetting, setSetting } from "@/lib/ops/settings";
import { createApiToken, revokeApiToken } from "@/lib/ops/tokens";
import { getSiteMode } from "@/lib/mode";

export async function requestLinkAction(_prev: unknown, form: FormData) {
  await requestMagicLink(String(form.get("email") ?? ""));
  return { sent: true };
}

export async function logoutAction() {
  await logout();
  redirect("/admin/connexion");
}

export async function decideAction(form: FormData) {
  const admin = await requireAdmin();
  const decision = form.get("decision") === "approve" ? "approve" : "reject";
  await decideChangeRequest(String(form.get("id")), decision, admin.email, String(form.get("note") ?? "") || undefined);
  revalidatePath("/admin", "layout");
}

export type TokenState = { token?: string; error?: string };

export async function createTokenAction(_prev: TokenState, form: FormData): Promise<TokenState> {
  const admin = await requireAdmin();
  try {
    const days = Number(form.get("expires"));
    const { token, row } = await createApiToken({
      name: String(form.get("name") ?? ""),
      scopes: form.getAll("scopes").map(String),
      expiresInDays: Number.isFinite(days) && days > 0 ? days : null,
      createdBy: admin.email,
    });
    await audit({
      actor: `admin:${admin.email}`,
      token_id: row.id,
      action: "api_token.create",
      method: null,
      route: null,
      status: null,
      before: null,
      after: { name: row.name, scopes: row.scopes, expires_at: row.expires_at },
    });
    revalidatePath("/admin/jetons");
    return { token };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Création impossible." };
  }
}

export async function revokeTokenAction(form: FormData) {
  const admin = await requireAdmin();
  const id = String(form.get("id"));
  await revokeApiToken(id);
  await audit({
    actor: `admin:${admin.email}`,
    token_id: id,
    action: "api_token.revoke",
    method: null,
    route: null,
    status: null,
    before: null,
    after: { revoked: true },
  });
  revalidatePath("/admin/jetons");
}

const FLAGS = ["legal_pages_complete", "shipping_configured"] as const;

export async function setFlagAction(form: FormData) {
  const admin = await requireAdmin();
  const key = String(form.get("key"));
  if (!(FLAGS as readonly string[]).includes(key)) return;
  const before = await getSetting(key);
  const value = form.get("value") === "true";
  await setSetting(key, value);
  await audit({
    actor: `admin:${admin.email}`,
    token_id: null,
    action: `settings.${key}`,
    method: null,
    route: null,
    status: null,
    before,
    after: value,
  });
  revalidatePath("/admin/mode");
}

export async function proposeModeAction(form: FormData) {
  const admin = await requireAdmin();
  const mode = form.get("mode") === "sale" ? "sale" : "prelaunch";
  await createChangeRequest({
    kind: "settings.mode",
    target: "site_mode",
    summary: `Passer le site en mode ${mode === "sale" ? "vente" : "pré-lancement"}`,
    payload: { mode, reason: "Proposé depuis /admin" },
    before: await getSiteMode(),
    requestedBy: `admin:${admin.email}`,
    tokenId: null,
  });
  redirect("/admin");
}
