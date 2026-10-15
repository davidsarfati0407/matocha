"use client";
/** Panneau latéral de l'assistant IA (voir /ai pour la page complète). */
import { useTranslations } from "next-intl";
import { AiChat } from "./AiChat";
import { Icon } from "@/components/map/hud/ui";

export function AiPanel({ onClose }: { onClose: () => void }) {
  const t = useTranslations("ai.panel");
  return (
    <aside aria-label={t("label")} className="sticky top-16 hidden h-[calc(100dvh-5rem)] w-[380px] shrink-0 p-3 pt-0 xl:block">
      <div className="card flex h-full flex-col overflow-hidden">
        <header className="flex items-center justify-between border-b border-black/5 px-4 py-3">
          <p className="flex items-center gap-2 text-sm font-semibold">
            <Icon name="sparkles" size={15} className="text-accent" /> {t("title")}
          </p>
          <button aria-label={t("close")} onClick={onClose} className="grid size-7 place-items-center rounded-full hover:bg-black/5">
            <Icon name="x" size={14} />
          </button>
        </header>
        <AiChat compact />
      </div>
    </aside>
  );
}
