"use client";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { Textarea } from "@/components/ui/Form";
import { Button } from "@/components/ui/kit";
import { report } from "@/lib/ui/toast";
import { completeReview, setTrainingStatus } from "../actions";

export function ReviewDone({ id }: { id: string }) {
  const t = useTranslations("hr.reviews");
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [pending, start] = useTransition();
  if (!open) return <button className="mt-2 text-xs font-medium text-accent" onClick={() => setOpen(true)}>{t("writeReport")}</button>;
  return (
    <div className="mt-2 space-y-2">
      <Textarea value={text} onChange={(e) => setText(e.target.value)} placeholder={t("reportPlaceholder")} className="min-h-16" />
      <Button size="sm" variant="primary" disabled={pending || !text.trim()} onClick={() => start(async () => { if (report(await completeReview(id, text))) router.refresh(); })}>{t("closeReview")}</Button>
    </div>
  );
}

export function TrainingActions({ id }: { id: string }) {
  const t = useTranslations("hr.reviews");
  const router = useRouter();
  const [pending, start] = useTransition();
  const run = (s: "done" | "cancelled") => start(async () => { if (report(await setTrainingStatus(id, s))) router.refresh(); });
  return (
    <span className="flex gap-1">
      <Button size="sm" variant="accent" disabled={pending} onClick={() => run("done")}>{t("trainingDone")}</Button>
      <Button size="sm" disabled={pending} onClick={() => run("cancelled")}>{t("cancel")}</Button>
    </span>
  );
}
