import "server-only";
import { randomUUID } from "node:crypto";
import { getStore } from "@/lib/store";
import type { Row } from "@/lib/store/types";
import { nowIso } from "./crypto";

export type AuditRow = Row & {
  actor: string;
  token_id: string | null;
  action: string;
  method: string | null;
  route: string | null;
  status: number | null;
  before: unknown;
  after: unknown;
  created_at: string;
};

/** Never throws: an audit failure is logged, not surfaced. */
export async function audit(entry: Omit<AuditRow, "id" | "created_at">) {
  const store = getStore();
  if (!store) return;
  try {
    await store.insert<AuditRow>("audit_log", { id: randomUUID(), created_at: nowIso(), ...entry });
  } catch (error) {
    console.error("[audit] write failed", error);
  }
}
