"use client";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Drawer } from "@/components/ui/Drawer";
import { Field, Input, Select } from "@/components/ui/Form";
import { Button } from "@/components/ui/kit";
import { report } from "@/lib/ui/toast";
import { bookAsset } from "../actions";

export function BookButton({ assets, day }: { assets: { id: string; name: string }[]; day: string }) {
  const t = useTranslations("ops.planning");
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const router = useRouter();
  const iso = (t: string) => new Date(`${day}T${t}:00`).toISOString();
  return (
    <>
      <Button variant="accent" icon="plus" onClick={() => setOpen(true)}>
        {t("book")}
      </Button>
      <Drawer open={open} onClose={() => setOpen(false)} title={t("newBooking")}>
        <form
          className="flex flex-col gap-4"
          action={(fd) =>
            start(async () => {
              const r = await bookAsset({ asset_id: String(fd.get("asset")), title: String(fd.get("title")), starts_at: iso(String(fd.get("from"))), ends_at: iso(String(fd.get("to"))) });
              if (report(r)) {
                setOpen(false);
                router.refresh();
              }
            })
          }
        >
          <Field label={t("resource")}>
            <Select name="asset">
              {assets.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label={t("fieldTitle")}>
            <Input name="title" required placeholder={t("titlePlaceholder")} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label={t("from")}>
              <Input name="from" type="time" required defaultValue="10:00" />
            </Field>
            <Field label={t("to")}>
              <Input name="to" type="time" required defaultValue="11:00" />
            </Field>
          </div>
          <p className="text-xs text-muted">{t("conflictHint")}</p>
          <Button variant="accent" disabled={pending}>
            {t("book")}
          </Button>
        </form>
      </Drawer>
    </>
  );
}
