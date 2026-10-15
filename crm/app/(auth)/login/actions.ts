"use server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

export type LoginState = { error?: "invalid"; magicSent?: boolean };

const credentials = z.object({ email: z.string().email(), password: z.string().min(1), next: z.string().optional() });

const safeNext = (next?: string) => (next && next.startsWith("/") && !next.startsWith("//") ? next : "/");

export async function signIn(_: LoginState, form: FormData): Promise<LoginState> {
  const parsed = credentials.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: "invalid" };
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email: parsed.data.email, password: parsed.data.password });
  if (error) return { error: "invalid" };
  // Double authentification activée : le code est demandé avant toute page
  const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (aal?.nextLevel === "aal2" && aal.currentLevel !== "aal2") redirect(`/login/mfa?next=${encodeURIComponent(safeNext(parsed.data.next))}`);
  redirect(safeNext(parsed.data.next));
}

export async function sendMagicLink(_: LoginState, form: FormData): Promise<LoginState> {
  const email = z.string().email().safeParse(form.get("email"));
  if (!email.success) return { error: "invalid" };
  const origin = (await headers()).get("origin") ?? "http://localhost:3000";
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email: email.data,
    options: { shouldCreateUser: false, emailRedirectTo: `${origin}/auth/callback` },
  });
  return error ? { error: "invalid" } : { magicSent: true };
}

/** Authentification unique (SSO) Microsoft Entra ID / Google, via les fournisseurs OAuth de Supabase Auth. */
export async function ssoStart(provider: "azure" | "google", next?: string) {
  const enabled = (process.env.NEXT_PUBLIC_SSO_PROVIDERS ?? "").split(",").map((x) => x.trim());
  if (!enabled.includes(provider)) return { error: "sso_disabled" as const };
  const origin = (await headers()).get("origin") ?? process.env.APP_URL ?? "http://localhost:3000";
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: { redirectTo: `${origin}/auth/callback?next=${encodeURIComponent(safeNext(next))}`, scopes: provider === "azure" ? "email" : undefined },
  });
  if (error || !data.url) return { error: "sso_failed" as const };
  redirect(data.url);
}
