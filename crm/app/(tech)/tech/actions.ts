"use server";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { LOCALE_COOKIE, LOCALES } from "@/i18n/request";
import { createClient } from "@/lib/supabase/server";

export async function setLocale(locale: string) {
  if (!LOCALES.includes(locale as (typeof LOCALES)[number])) return;
  (await cookies()).set(LOCALE_COOKIE, locale, { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" });
  revalidatePath("/", "layout");
}

/** Révélation volontaire d'un salaire : contrôlée et journalisée par Postgres (reveal_salary). */
export async function revealSalary(employeeId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("reveal_salary", { emp: employeeId });
  if (error) return { error: error.code === "42501" ? "forbidden" : "error" } as const;
  return { salary: data as { gross_annual: number; months: number; bonus_target: number } | null } as const;
}
