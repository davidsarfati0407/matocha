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
