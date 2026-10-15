"use client";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Drawer } from "@/components/ui/Drawer";
import { Field, Input, Select } from "@/components/ui/Form";
import { Button } from "@/components/ui/kit";
import { report } from "@/lib/ui/toast";
import { createEvent } from "../actions";

export function PersonPicker({ people, who }: { people: { id: string; name: string }[]; who: string }) {
  const router = useRouter();
  return (
    <select aria-label="Agenda de" value={who} onChange={(e) => router.push(`?who=${e.target.value}`)} className="rounded-xl bg-white px-3 py-2 text-sm ring-1 ring-black/10">
      {people.map((p) => (
        <option key={p.id} value={p.id}>
          {p.name}
        </option>
      ))}
    </select>
  );
}

export function NewEvent({ clients, rooms, day }: { clients: { id: string; name: string }[]; rooms: { id: string; name: string }[]; day: string }) {
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const router = useRouter();
  const iso = (d: string, t: string) => new Date(`${d}T${t}:00`).toISOString();
  return (
    <>
      <Button variant="accent" icon="plus" onClick={() => setOpen(true)}>
        Rendez-vous
      </Button>
      <Drawer open={open} onClose={() => setOpen(false)} title="Nouveau rendez-vous">
        <form
          className="flex flex-col gap-4"
          action={(fd) =>
            start(async () => {
              const d = String(fd.get("day"));
              const r = await createEvent({ title: String(fd.get("title")), type: fd.get("type") as "client", starts_at: iso(d, String(fd.get("from"))), ends_at: iso(d, String(fd.get("to"))), client_id: String(fd.get("client")) || null, resource_id: String(fd.get("room")) || null });
              if (report(r)) {
                setOpen(false);
                router.refresh();
              }
            })
          }
        >
          <Field label="Objet">
            <Input name="title" required placeholder="Dégustation chez le client" />
          </Field>
          <Field label="Type">
            <Select name="type" defaultValue="client">
              <option value="client">Rendez-vous client</option>
              <option value="reunion">Réunion</option>
              <option value="focus">Travail concentré</option>
              <option value="deplacement">Déplacement</option>
              <option value="tournage">Tournage</option>
            </Select>
          </Field>
          <Field label="Compte (optionnel)">
            <Select name="client" defaultValue="">
              <option value="">—</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Salle (optionnel)">
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
            <Field label="Jour">
              <Input name="day" type="date" defaultValue={day} required />
            </Field>
            <Field label="De">
              <Input name="from" type="time" defaultValue="10:00" required />
            </Field>
            <Field label="À">
              <Input name="to" type="time" defaultValue="11:00" required />
            </Field>
          </div>
          <Button variant="accent" disabled={pending}>
            Ajouter
          </Button>
        </form>
      </Drawer>
    </>
  );
}
