/** Export CSV compatible Excel (séparateur « ; », BOM UTF-8, décimales françaises). */
export function toCsv<T>(rows: T[], columns: { header: string; value: (r: T) => unknown }[]) {
  const cell = (v: unknown) => {
    if (v == null) return "";
    const s = typeof v === "number" ? String(v).replace(".", ",") : v instanceof Date ? v.toISOString() : String(v);
    return /[;"\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = [columns.map((c) => cell(c.header)).join(";"), ...rows.map((r) => columns.map((c) => cell(c.value(r))).join(";"))];
  return "﻿" + lines.join("\r\n");
}
