import type { Metadata } from "next";
import Link from "next/link";
import { Badge, Card, Denied, Empty, PageHeader } from "@/components/ui/kit";
import { requirePerm } from "@/lib/backoffice/context";
import { formatDate, formatTime } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import { Composer } from "./client";

export const metadata: Metadata = { title: "Messagerie" };

const ST: Record<string, ["warn" | "ok" | "info" | "muted", string]> = { awaiting_reply: ["warn", "À répondre"], open: ["info", "Ouvert"], answered: ["ok", "Répondu"], closed: ["muted", "Clôturé"] };

export default async function InboxPage({ searchParams }: { searchParams: Promise<{ t?: string }> }) {
  const { ctx, allowed } = await requirePerm("communication");
  if (!allowed) return <Denied what="la messagerie" />;
  const sel = (await searchParams).t;
  const supabase = await createClient();
  const { data: threads } = await supabase.from("threads").select("id, channel, subject, status, last_message_at, client_id, work_order_id, clients(name)").order("last_message_at", { ascending: false, nullsFirst: false });
  const list = threads ?? [];
  const current = list.find((t) => t.id === sel) ?? list.find((t) => t.status === "awaiting_reply") ?? list[0];
  const { data: msgs } = current ? await supabase.from("messages").select("id, direction, from_name, body, sent_at, is_ai_draft, language").eq("thread_id", current.id).order("sent_at") : { data: [] };
  return (
    <>
      <PageHeader title="Messagerie" subtitle="E-mails clients et messages internes · connecteurs Gmail / Outlook en mode simulé" />
      <div className="grid gap-4 lg:grid-cols-[340px_1fr]">
        <Card padded={false}>
          <ul className="divide-y divide-black/5">
            {list.map((t) => (
              <li key={t.id}>
                <Link href={`?t=${t.id}`} className={`block px-4 py-3 text-sm ${t.id === current?.id ? "bg-accent/[0.06]" : "hover:bg-black/[0.02]"}`}>
                  <span className="flex items-center justify-between gap-2">
                    <span className="truncate font-medium">{(t.clients as unknown as { name: string } | null)?.name ?? (t.channel === "interne" ? "Interne" : "—")}</span>
                    <Badge tone={ST[t.status][0]}>{ST[t.status][1]}</Badge>
                  </span>
                  <span className="block truncate text-muted">{t.subject}</span>
                  {t.last_message_at && <span className="text-[11px] text-muted">{formatDate(t.last_message_at)} {formatTime(t.last_message_at)}</span>}
                </Link>
              </li>
            ))}
          </ul>
        </Card>
        {current ? (
          <Card title={current.subject} action={current.client_id ? <Link className="text-xs font-medium text-accent" href={`/crm/clients/${current.client_id}?tab=historique`}>Fiche compte →</Link> : undefined}>
            <ol className="space-y-3">
              {(msgs ?? []).map((m) => (
                <li key={m.id} className={`rounded-2xl p-3 text-sm ${m.direction === "out" ? "ml-10 bg-brand/[0.06]" : "mr-10 bg-black/[0.03]"}`}>
                  <p className="mb-1 text-xs text-muted">{m.from_name} · {m.sent_at ? `${formatDate(m.sent_at)} ${formatTime(m.sent_at)}` : ""}{m.is_ai_draft ? " · brouillon IA relu" : ""}{m.language && m.language !== "fr" ? ` · ${m.language.toUpperCase()}` : ""}</p>
                  <p className="whitespace-pre-wrap">{m.body}</p>
                </li>
              ))}
            </ol>
            {ctx.can("communication", "create") && current.status !== "closed" && <Composer key={current.id} threadId={current.id} />}
          </Card>
        ) : (
          <Empty icon="mail" title="Aucun message" />
        )}
      </div>
    </>
  );
}
