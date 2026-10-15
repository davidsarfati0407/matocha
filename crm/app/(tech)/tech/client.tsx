"use client";
import { useState, useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { formatMoney } from "@/lib/format";
import { revealSalary, setLocale } from "./actions";

export function LocaleSwitch({ locales }: { locales: string[] }) {
  const current = useLocale();
  const [pending, start] = useTransition();
  return (
    <div role="group" aria-label="Langue" className="flex rounded-full bg-black/5 p-0.5 text-xs font-medium">
      {locales.map((l) => (
        <button
          key={l}
          disabled={pending}
          aria-pressed={l === current}
          onClick={() => start(() => setLocale(l))}
          className={`rounded-full px-2.5 py-1 uppercase ${l === current ? "bg-white shadow-sm" : "text-muted"}`}
        >
          {l}
        </button>
      ))}
    </div>
  );
}

export function RevealSalary({ employeeId }: { employeeId: string }) {
  const t = useTranslations("tech");
  const locale = useLocale();
  const [value, setValue] = useState<string | null>(null);
  const [pending, start] = useTransition();
  if (value) return <span className="font-mono text-sm" title={t("revealed")}>{value}</span>;
  return (
    <button
      disabled={pending}
      onClick={() =>
        start(async () => {
          const r = await revealSalary(employeeId);
          setValue("salary" in r && r.salary ? `${formatMoney(r.salary.gross_annual, locale, 0)} × ${r.salary.months}` : "—");
        })
      }
      className="group flex items-center gap-2"
    >
      <span className="select-none font-mono text-sm blur-[5px]" aria-hidden>
        00 000 €
      </span>
      <span className="rounded-full bg-accent/12 px-2 py-0.5 text-xs font-medium text-accent group-hover:bg-accent group-hover:text-white">{t("reveal")}</span>
    </button>
  );
}
