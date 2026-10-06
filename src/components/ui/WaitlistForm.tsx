"use client";

import { useId, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { Whisk } from "@/components/scenes/Whisk";
import { fr } from "@/content/i18n/fr";
import { cn } from "@/lib/utils";

const INTERESTS = [
  { id: "poudre", label: "La poudre" },
  { id: "concentre", label: "Le concentré" },
  { id: "original", label: "Original" },
  { id: "vanille", label: "Vanille (piste)" },
  { id: "fraise", label: "Fraise (piste)" },
] as const;

type Status = "idle" | "loading" | "done" | "error" | "closed";

const noop = () => () => {};

function readWanted() {
  const wanted = new URLSearchParams(window.location.search).get("interet");
  return wanted && INTERESTS.some((i) => i.id === wanted) ? wanted : null;
}

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
  const [interests, setInterests] = useState<string[]>(["poudre"]);
  const inflight = useRef(false);
  /* Until hydrated, a native submit would put the address in the URL: keep it disabled. */
  const ready = useSyncExternalStore(noop, () => true, () => false);
  const dark = tone === "dark";

  /* ?interet=fraise preselects a flavour coming from "Je veux goûter celui-ci",
     until the visitor changes the selection themselves. */
  const wanted = useSyncExternalStore(noop, readWanted, () => null);
  const [touched, setTouched] = useState(false);
  const selected = !touched && wanted && !interests.includes(wanted) ? [...interests, wanted] : interests;

  if (status === "closed") {
    return (
      <div className={cn("border p-5", dark ? "border-lait/30" : "border-encre/20", className)} role="status">
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
        body: JSON.stringify({ email, interests: selected, consent, consentVersion, source }),
      });
      const data = (await res.json().catch(() => ({}))) as { code?: string; message?: string };
      if (res.ok) {
        setStatus("done");
        setMessage(fr.waitlist.success);
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
      <div className={cn("relative overflow-hidden border p-5", dark ? "border-lait/30" : "border-encre/20", className)} role="status">
        <div className="powder-rain pointer-events-none absolute inset-x-0 top-0 h-14" aria-hidden="true">
          {Array.from({ length: 18 }).map((_, i) => (
            <i key={i} style={{ left: `${6 + i * 5.2}%`, animationDelay: `${(i % 6) * 80}ms` }} />
          ))}
        </div>
        <p className="pt-8 text-lg font-semibold">{message}</p>
      </div>
    );
  }

  const errorId = `${id}-error`;

  return (
    <form onSubmit={onSubmit} method="post" noValidate className={className} aria-describedby={status === "error" ? errorId : undefined}>
      <label htmlFor={`${id}-email`} className="block font-semibold">
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
          "mt-2 h-13 w-full border-b-2 bg-transparent px-1 text-lg outline-none placeholder:opacity-60 focus:border-matcha",
          dark ? "border-lait/60" : "border-encre/50",
          field === "email" && "border-rhubarbe",
        )}
      />

      <fieldset className="mt-5">
        <legend className="text-sm font-semibold">{fr.waitlist.interests}</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {INTERESTS.map((item) => {
            const checked = selected.includes(item.id);
            return (
              <label
                key={item.id}
                className={cn(
                  "flex min-h-11 cursor-pointer items-center gap-2 rounded-full border px-3 text-sm",
                  checked ? (dark ? "border-lait bg-lait text-encre" : "border-foret bg-foret text-lait") : dark ? "border-lait/40" : "border-encre/30",
                )}
              >
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={checked}
                  onChange={() => {
                    setTouched(true);
                    setInterests(checked ? selected.filter((x) => x !== item.id) : [...selected, item.id]);
                  }}
                />
                {item.label}
              </label>
            );
          })}
        </div>
      </fieldset>

      <label className="mt-5 flex items-start gap-3 text-sm">
        <input
          name="consent"
          type="checkbox"
          defaultChecked={false}
          aria-invalid={field === "consent" || undefined}
          className="mt-1 h-5 w-5 shrink-0 accent-[var(--foret)]"
        />
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
          "mt-6 flex min-h-14 w-full items-center justify-center gap-2 px-8 text-sm font-semibold tracking-wide uppercase sm:w-auto",
          dark ? "bg-lait text-encre hover:bg-mousse" : "bg-foret text-lait hover:bg-matcha hover:text-encre",
          "disabled:opacity-60",
        )}
      >
        {status === "loading" && <Whisk className="h-5 w-5" />}
        {status === "loading" ? fr.waitlist.sending : fr.waitlist.submit}
      </button>

      <p id={errorId} role="alert" className={cn("mt-3 min-h-6 text-sm font-semibold", status !== "error" && "sr-only")}>
        {status === "error" ? message : ""}
      </p>
    </form>
  );
}
