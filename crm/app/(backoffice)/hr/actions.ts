"use server";
/** Actions RH : congés, entretiens, formations, recrutement, intégration, salaires (journalisés). */
import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import { z } from "zod";
import { getCtx } from "@/lib/backoffice/context";
import { fail, type ActionResult } from "@/lib/backoffice/result";
import { businessDays } from "@/lib/domain/leave";
import { createClient } from "@/lib/supabase/server";

export async function decideLeave(id: string, status: "approved" | "rejected" | "pending", comment?: string): Promise<ActionResult> {
  const t = await getTranslations("hr.actions");
  const supabase = await createClient();
  const { employeeId } = await getCtx();
  const { error, count } = await supabase.from("leave_requests").update({ status, approver_id: status === "pending" ? null : employeeId, decided_at: status === "pending" ? null : new Date().toISOString(), comment: comment || null }, { count: "exact" }).eq("id", id);
  if (error) return fail(error);
  if (!count) return { ok: false, error: t("forbidden") };
  revalidatePath("/hr", "layout");
  return { ok: true, message: status === "approved" ? t("leaveApproved") : status === "rejected" ? t("leaveRejected") : t("leaveReset") };
}

const leaveSchema = z.object({ type: z.enum(["conges", "rtt", "maladie", "formation", "sans_solde", "parental"]), starts_on: z.string(), ends_on: z.string(), comment: z.string().optional() });
export async function requestLeave(input: z.input<typeof leaveSchema>): Promise<ActionResult> {
  const t = await getTranslations("hr.actions");
  const p = leaveSchema.safeParse(input);
  if (!p.success || p.data.ends_on < p.data.starts_on) return { ok: false, error: t("invalidDates") };
  const { employeeId } = await getCtx();
  if (!employeeId) return { ok: false, error: t("noEmployee") };
  const days = businessDays(p.data.starts_on, p.data.ends_on);
  if (days <= 0) return { ok: false, error: t("noBusinessDay") };
  const supabase = await createClient();
  const { error } = await supabase.from("leave_requests").insert({ ...p.data, employee_id: employeeId, days, comment: p.data.comment || null });
  if (error) return fail(error);
  revalidatePath("/hr/leaves");
  return { ok: true, message: t("leaveRequested", { days }) };
}

export async function revealSalary(employeeId: string): Promise<ActionResult<{ gross_annual: number; months: number; bonus_target: number } | null>> {
  const t = await getTranslations("hr.actions");
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("reveal_salary", { emp: employeeId });
  if (error) return fail(error);
  return { ok: true, message: t("salaryRevealed"), data };
}

export async function toggleOnboarding(id: string, done: boolean): Promise<ActionResult> {
  const t = await getTranslations("hr.actions");
  const supabase = await createClient();
  const { error } = await supabase.from("onboarding_tasks").update({ done_at: done ? new Date().toISOString() : null }).eq("id", id);
  if (error) return fail(error);
  revalidatePath("/hr", "layout");
  return { ok: true, message: done ? t("taskDone") : t("taskReopened") };
}

export async function completeReview(id: string, summary: string): Promise<ActionResult> {
  const t = await getTranslations("hr.actions");
  const supabase = await createClient();
  const { error } = await supabase.from("reviews").update({ status: "done", summary }).eq("id", id);
  if (error) return fail(error);
  revalidatePath("/hr/reviews");
  return { ok: true, message: t("reviewClosed") };
}

export async function setTrainingStatus(id: string, status: "done" | "cancelled"): Promise<ActionResult> {
  const t = await getTranslations("hr.actions");
  const supabase = await createClient();
  const { error } = await supabase.from("trainings").update({ status }).eq("id", id);
  if (error) return fail(error);
  revalidatePath("/hr/reviews");
  return { ok: true, message: status === "done" ? t("trainingDone") : t("trainingCancelled") };
}

export async function moveCandidate(id: string, stage: string): Promise<ActionResult<{ previous: string }>> {
  const t = await getTranslations("hr.actions");
  const supabase = await createClient();
  const { data: prev } = await supabase.from("candidates").select("stage").eq("id", id).single();
  const { error } = await supabase.from("candidates").update({ stage }).eq("id", id);
  if (error) return fail(error);
  revalidatePath("/hr/recruitment");
  return { ok: true, message: t("candidateMoved"), data: { previous: prev?.stage ?? "nouveau" } };
}

export async function hireCandidate(id: string, jobKey: string, jobTitle: string, startOn: string, contract: string): Promise<ActionResult<{ id: string }>> {
  const t = await getTranslations("hr.actions");
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("hire_candidate", { cand: id, job_key: jobKey, job_title: jobTitle, start_on: startOn, contract });
  if (error) return fail(error);
  revalidatePath("/hr", "layout");
  return { ok: true, message: t("hired"), data: { id: data as string } };
}

const candSchema = z.object({ job_opening_id: z.string().uuid(), full_name: z.string().min(2), email: z.string().email().optional().or(z.literal("")), source: z.string().optional(), score: z.enum(["A", "B", "C"]), met: z.array(z.string()) });
export async function addCandidate(input: z.input<typeof candSchema>): Promise<ActionResult> {
  const t = await getTranslations("hr.actions");
  const p = candSchema.safeParse(input);
  if (!p.success) return { ok: false, error: t("candidateIncomplete") };
  const supabase = await createClient();
  const { met, ...rest } = p.data;
  const { error } = await supabase.from("candidates").insert({ ...rest, email: rest.email || null, ai_summary: { criteres_remplis: met, note: "Score calculé sur les critères du poste (règle simple, sans IA)" } });
  if (error) return fail(error);
  revalidatePath("/hr/recruitment");
  return { ok: true, message: t("candidateAdded", { score: p.data.score }) };
}
