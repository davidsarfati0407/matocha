"use client";

import { useId, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { fr } from "@/content/i18n/fr";
import { cn } from "@/lib/utils";

type Status = "idle" | "loading" | "done" | "error" | "closed";

const noop = () => () => {};

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/**
 * Waitlist (pre-launch). Double opt-in: success means "check your inbox", never
 * "you're in". If the server has no e-mail service it says so, and the form
 * is not shown at all — there is never a fake confirmation.
 */
export function WaitlistForm({
  open,
  consentText,
  consentVersion,
  source,
  tone = "light",
  className,
}: {
  open: boolean;
  consentText: string;
  consentVersion: string;
  source: string;
  tone?: "light" | "dark";
  className?: string;
}) {
  const id = useId();
  const [status, setStatus] = useState<Status>(open ? "idle" : "closed");
  const [message, setMessage] = useState("");
  const [field, setField] = useState<"email" | "consent" | null>(null);
  const inflight = useRef(false);
  /* Until hydrated, a native submit would put the address in the URL: keep it disabled. */
  const ready = useSyncExternalStore(noop, () => true, () => false);
  const dark = tone === "dark";


  if (status === "closed") {
    return (
      <div className={cn("rounded-3xl border p-6", dark ? "border-lait/25" : "border-encre/15", className)} role="status">
        <p className="text-lg font-semibold">{fr.waitlist.closed}</p>
        <p className="mt-2 text-sm">{fr.waitlist.closedDetail}</p>
      </div>
    );
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (inflight.current) return;
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "").trim();
    const consent = form.get("consent") === "on";
    const website = String(form.get("website") ?? "");

    if (!EMAIL.test(email)) {
      setStatus("error");
      setField("email");
      setMessage(fr.waitlist.invalid);
      return;
    }
    if (!consent) {
      setStatus("error");
      setField("consent");
      setMessage(fr.waitlist.consentRequired);
      return;
    }

    inflight.current = true;
    setStatus("loading");
    setField(null);
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, interests: ["original"], consent, consentVersion, source, website }),
      });
      const data = (await res.json().catch(() => ({}))) as { code?: string; message?: string };
      if (res.ok) {
        setStatus("done");
        setMessage(data.message ?? fr.waitlist.success);
      } else if (res.status === 503 || data.code === "not_configured") {
        setStatus("closed");
      } else {
        setStatus("error");
        setField(data.code === "invalid_email" ? "email" : data.code === "consent_required" ? "consent" : null);
        setMessage(data.message ?? fr.waitlist.generic);
      }
    } catch {
      setStatus("error");
      setMessage(fr.waitlist.network);
    } finally {
      inflight.current = false;
    }
  }

  if (status === "done") {
    return (
      <div className={cn("flex items-start gap-4 rounded-3xl border p-6", dark ? "border-lait/25" : "border-encre/15", className)} role="status">
        <span
          aria-hidden="true"
          className={cn("cascade flex h-9 w-9 shrink-0 items-center justify-center rounded-full font-bold", dark ? "bg-mousse text-encre" : "bg-foret text-lait")}
        >
          ✓
        </span>
        <p className="pt-1 text-lg font-medium">{message}</p>
      </div>
    );
  }

  const errorId = `${id}-error`;

  return (
    <form onSubmit={onSubmit} method="post" noValidate className={cn("relative", className)} aria-describedby={status === "error" ? errorId : undefined}>
      <label htmlFor={`${id}-email`} className={cn("eyebrow block", dark && "text-mousse")}>
        {fr.waitlist.label}
      </label>
      <input
        id={`${id}-email`}
        name="email"
        type="email"
        autoComplete="email"
        inputMode="email"
        required
        placeholder={fr.waitlist.placeholder}
        aria-invalid={field === "email" || undefined}
        aria-describedby={field === "email" ? errorId : undefined}
        className={cn(
          "mt-3 h-14 w-full rounded-full border bg-transparent px-6 text-lg outline-none transition-colors placeholder:opacity-55 focus:border-matcha",
          dark ? "border-lait/40 focus:bg-lait/5" : "border-encre/30 focus:bg-white/40",
          field === "email" && "border-rhubarbe",
        )}
      />

      {/* Honeypot: off-screen and out of the tab order; people leave it empty. */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label>
          Site web
          <input type="text" name="website" tabIndex={-1} className="sr-only" autoComplete="off" defaultValue="" />
        </label>
      </div>

      <label className="mt-5 flex items-start gap-2 text-sm">
        {/* 44 px hit area around a 24 px box. */}
        <span className="relative -mt-2.5 -ml-2.5 flex h-11 w-11 shrink-0 items-center justify-center">
          <input
            name="consent"
            type="checkbox"
            defaultChecked={false}
            aria-invalid={field === "consent" || undefined}
            className="peer absolute inset-0 h-11 w-11 cursor-pointer opacity-0"
          />
          <span
            aria-hidden="true"
            className={cn(
              "flex h-6 w-6 items-center justify-center border-2 text-sm font-bold text-transparent peer-checked:text-current peer-focus-visible:outline-3 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-matcha-profond",
              dark ? "border-lait" : "border-encre",
            )}
          >
            ✓
          </span>
        </span>
        <span>
          {consentText}{" "}
          <Link href="/legal/confidentialite" className="underline underline-offset-2">
            {fr.waitlist.consentLink}
          </Link>
          .
        </span>
      </label>

      <button
        type="submit"
        disabled={!ready || status === "loading"}
        className={cn(
          "mt-6 flex min-h-14 w-full items-center justify-center gap-2 rounded-full px-8 text-[0.8rem] font-semibold tracking-[0.12em] uppercase transition-colors",
          dark ? "bg-lait text-encre hover:bg-mousse" : "bg-foret text-lait hover:bg-matcha hover:text-encre",
          "disabled:opacity-60",
        )}
      >
        {status === "loading" && <span className="spinner" aria-hidden="true" />}
        {status === "loading" ? fr.waitlist.sending : fr.waitlist.submit}
      </button>

      <p id={errorId} role="alert" className={cn("mt-3 min-h-6 text-sm font-semibold", status !== "error" && "sr-only")}>
        {status === "error" ? message : ""}
      </p>
    </form>
  );
}
