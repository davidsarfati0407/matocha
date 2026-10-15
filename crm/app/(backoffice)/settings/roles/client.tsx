"use client";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useOptimistic, useTransition } from "react";
import { report } from "@/lib/ui/toast";
import { togglePermission } from "../actions";

/** Lettre cliquable de la matrice : accorde / retire un droit, mise à jour optimiste. */
export function PermCell({ roleId, role, module, action, letter, on }: { roleId: string; role: string; module: string; action: string; letter: string; on: boolean }) {
  const t = useTranslations("settings.roles");
  const router = useRouter();
  const [pending, start] = useTransition();
  const [value, set] = useOptimistic(on);
  return (
    <button
      type="button"
      aria-pressed={value}
      aria-label={`${role} · ${module} · ${action}`}
      title={t(value ? "revoke" : "grant", { action, module, role })}
      disabled={pending}
      onClick={() =>
        start(async () => {
          set(!value);
          const r = await togglePermission(roleId, module, action, !value);
          report(r, { undo: r.ok ? async () => (await togglePermission(roleId, module, action, value), router.refresh()) : undefined });
          router.refresh();
        })
      }
      className={`rounded px-px hover:bg-accent/15 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent ${value ? "text-brand" : "text-black/20"}`}
    >
      {letter}
    </button>
  );
}
