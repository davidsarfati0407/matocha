"use client";
/** Conversation avec l'assistant : questions sur les données, réponses avec liens vers les fiches. */
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState, useTransition } from "react";
import { ask, aiStatus } from "@/app/(backoffice)/_actions/ai";
import { Icon } from "@/components/map/hud/ui";

type Turn = { role: "user" | "assistant"; text: string; tools?: string[] };
const SUGGESTIONS = ["urgent", "overdue", "orders", "remote"] as const; // ai.chat.suggestions.<clé>

/** Rendu minimal : liens markdown [texte](/chemin) et gras **x**. */
function Rich({ text }: { text: string }) {
  const parts = text.split(/(\[[^\]]+\]\(\/[^)\s]*\)|\*\*[^*]+\*\*)/g);
  return (
    <>
      {parts.map((p, i) => {
        const m = p.match(/^\[([^\]]+)\]\((\/[^)\s]*)\)$/);
        if (m) return <Link key={i} href={m[2]} className="font-medium text-accent underline-offset-2 hover:underline">{m[1]}</Link>;
        if (/^\*\*[^*]+\*\*$/.test(p)) return <b key={i}>{p.slice(2, -2)}</b>;
        return <span key={i}>{p}</span>;
      })}
    </>
  );
}

export function AiChat({ compact = false }: { compact?: boolean }) {
  const t = useTranslations("ai.chat");
  const [turns, setTurns] = useState<Turn[]>([]);
  const [input, setInput] = useState("");
  const [configured, setConfigured] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const end = useRef<HTMLDivElement>(null);
  useEffect(() => void aiStatus().then((s) => setConfigured(s.configured)), []);
  useEffect(() => end.current?.scrollIntoView({ block: "end" }), [turns, pending]);
  const send = (q: string) => {
    if (!q.trim() || pending) return;
    const next = [...turns, { role: "user" as const, text: q }];
    setTurns(next);
    setInput("");
    setError(null);
    start(async () => {
      const r = await ask(next.map(({ role, text }) => ({ role, text })));
      if (r.ok && r.data) setTurns((prev) => [...prev, { role: "assistant", text: r.data!.text, tools: r.data!.tools }]);
      else if (!r.ok) setError(r.error);
    });
  };
  return (
    <div className={`flex min-h-0 flex-1 flex-col ${compact ? "" : "h-[calc(100dvh-14rem)]"}`}>
      <div className="flex-1 space-y-3 overflow-y-auto p-4 text-sm">
        {configured === false && (
          <div className="rounded-xl bg-[#c98a12]/10 p-3 text-[#7a5300]">
            <p className="font-semibold">{t("notConfigured")}</p>
            <p className="mt-1 text-xs">{t.rich("notConfiguredHint", { code: (c) => <code>{c}</code> })}</p>
          </div>
        )}
        {turns.length === 0 && (
          <div className="space-y-2">
            <p className="text-muted">{t.rich("intro", { b: (c) => <b>{c}</b> })}</p>
            {SUGGESTIONS.map((k) => (
              <button key={k} disabled={!configured} onClick={() => send(t(`suggestions.${k}`))} className="block w-full rounded-xl px-3 py-2 text-left ring-1 ring-black/10 hover:bg-accent/5 disabled:opacity-50">
                {t(`suggestions.${k}`)}
              </button>
            ))}
          </div>
        )}
        {turns.map((turn, i) => (
          <div key={i} className={turn.role === "user" ? "ml-8 rounded-2xl rounded-br-md bg-brand px-3 py-2 text-ground" : "mr-4"}>
            <p className="whitespace-pre-wrap leading-relaxed"><Rich text={turn.text} /></p>
            {turn.tools?.length ? <p className="mt-1 text-[11px] text-muted">{t("sources", { tools: [...new Set(turn.tools)].join(", ") })}</p> : null}
          </div>
        ))}
        {pending && <p className="flex items-center gap-2 text-muted"><Icon name="sparkles" size={14} className="animate-pulse text-accent" /> {t("searching")}</p>}
        {error && <p className="rounded-xl bg-[#b3402a]/10 p-2 text-[#b3402a]">{error}</p>}
        <div ref={end} />
      </div>
      <form className="flex gap-2 border-t border-black/5 p-3" onSubmit={(e) => (e.preventDefault(), send(input))}>
        <input aria-label={t("inputLabel")} value={input} onChange={(e) => setInput(e.target.value)} disabled={!configured} placeholder={configured ? t("placeholder") : t("notConfigured")} className="min-w-0 flex-1 rounded-xl bg-black/[0.04] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-accent/40" />
        <button aria-label={t("send")} disabled={!configured || pending || !input.trim()} className="grid size-9 place-items-center rounded-xl bg-accent text-white disabled:opacity-40">
          <Icon name="send" size={15} />
        </button>
      </form>
    </div>
  );
}
