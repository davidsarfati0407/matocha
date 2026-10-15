"use client";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { Drawer } from "@/components/ui/Drawer";
import { Field, Input, Select } from "@/components/ui/Form";
import { Button } from "@/components/ui/kit";
import { report } from "@/lib/ui/toast";
import { createEvent } from "../actions";

export function PersonPicker({ people, who }: { people: { id: string; name: string }[]; who: string }) {
  const t = useTranslations("crm.calendar");
  const router = useRouter();
  return (
    <select aria-label={t("agendaOf")} value={who} onChange={(e) => router.push(`?who=${e.target.value}`)} className="rounded-xl bg-white px-3 py-2 text-sm ring-1 ring-black/10">
      {people.map((p) => (
        <option key={p.id} value={p.id}>
          {p.name}
        </option>
      ))}
    </select>
  );
}

export function NewEvent({ clients, rooms, day }: { clients: { id: string; name: string }[]; rooms: { id: string; name: string }[]; day: string }) {
  const t = useTranslations("crm.calendar");
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const router = useRouter();
  const iso = (d: string, t: string) => new Date(`${d}T${t}:00`).toISOString();
  return (
    <>
      <Button variant="accent" icon="plus" onClick={() => setOpen(true)}>
        {t("newShort")}
      </Button>
      <Drawer open={open} onClose={() => setOpen(false)} title={t("new")}>
        <form
          className="flex flex-col gap-4"
          action={(fd) =>
            start(async () => {
              const d = String(fd.get("day"));
              const r = await createEvent({ title: String(fd.get("title")), type: fd.get("type") as "client", starts_at: iso(d, String(fd.get("from"))), ends_at: iso(d, String(fd.get("to"))), client_id: String(fd.get("client")) || null, resource_id: String(fd.get("room")) || null, online_meeting: fd.get("online") === "on" });
              if (report(r)) {
                setOpen(false);
                router.refresh();
              }
            })
          }
        >
          <Field label={t("subject")}>
            <Input name="title" required placeholder={t("subjectPlaceholder")} />
          </Field>
          <Field label={t("type")}>
            <Select name="type" defaultValue="client">
              <option value="client">{t("types.client")}</option>
              <option value="reunion">{t("types.reunion")}</option>
              <option value="focus">{t("types.focus")}</option>
              <option value="deplacement">{t("types.deplacement")}</option>
              <option value="tournage">{t("types.tournage")}</option>
            </Select>
          </Field>
          <Field label={t("account")}>
            <Select name="client" defaultValue="">
              <option value="">—</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label={t("room")}>
            <Select name="room" defaultValue="">
              <option value="">—</option>
              {rooms.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </Field>
          <div className="grid grid-cols-3 gap-3">
            <Field label={t("day")}>
              <Input name="day" type="date" defaultValue={day} required />
            </Field>
            <Field label={t("from")}>
              <Input name="from" type="time" defaultValue="10:00" required />
            </Field>
            <Field label={t("to")}>
              <Input name="to" type="time" defaultValue="11:00" required />
            </Field>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="online" className="accent-[var(--accent)]" /> {t("online")}
          </label>
          <Button variant="accent" disabled={pending}>
            {t("add")}
          </Button>
        </form>
      </Drawer>
    </>
  );
}
