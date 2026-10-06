"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { MatochaGlass } from "@/components/brand/MatochaGlass";
import { EASE } from "@/lib/motion";
import { cn } from "@/lib/utils";

type Status = "idle" | "loading" | "done" | "error";

/**
 * Email capture, used by the waitlist section and the footer.
 *
 * Posts to /api/waitlist — the single place to connect an email provider at
 * launch. On success the matcha in the glass waves once, then settles.
 */
export function WaitlistForm({
  tone = "dark",
  className,
  buttonLabel = "Join the list",
  source = "waitlist",
  size = "md",
}: {
  tone?: "dark" | "light";
  className?: string;
  buttonLabel?: string;
  source?: string;
  size?: "md" | "lg";
}) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");

  const light = tone === "light";
  const height = size === "lg" ? "h-14 sm:h-16" : "h-13 sm:h-14";

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status === "loading") return;

    setStatus("loading");
    try {
      const response = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, source }),
      });
      const data = (await response.json()) as { message?: string };

      if (!response.ok) {
        setStatus("error");
        setMessage(data.message ?? "Something went wrong. Please try again.");
        return;
      }

      setStatus("done");
      setMessage(data.message ?? "You're on the list.");
      setEmail("");
    } catch {
      setStatus("error");
      setMessage("Network error. Please try again.");
    }
  }

  return (
    <div className={className}>
      <form onSubmit={onSubmit} className="flex flex-col gap-3 sm:flex-row">
        <label className="sr-only" htmlFor={`email-${source}`}>
          Email address
        </label>
        <input
          id={`email-${source}`}
          type="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="your@email.com"
          autoComplete="email"
          disabled={status === "loading"}
          className={cn(
            "min-w-0 flex-1 border-b bg-transparent px-1 text-base outline-none transition-colors duration-300 placeholder:opacity-45 focus:border-coral",
            height,
            light ? "border-ivory/35" : "border-black/25",
          )}
        />
        <button
          type="submit"
          disabled={status === "loading"}
          className={cn(
            "group relative shrink-0 overflow-hidden px-8",
            "u-label font-semibold transition-colors duration-500 ease-[var(--ease-matocha)] disabled:opacity-50",
            height,
            light ? "bg-ivory text-black" : "bg-coral text-black",
          )}
        >
          <span
            aria-hidden="true"
            className="absolute inset-0 origin-bottom scale-y-0 bg-[#F7DE9A] transition-transform duration-500 ease-[var(--ease-matocha)] group-hover:scale-y-100"
          />
          <span className="relative z-10">
            {status === "loading" ? "Sending" : buttonLabel}
          </span>
        </button>
      </form>

      <AnimatePresence mode="wait">
        {status !== "idle" && status !== "loading" && (
          <motion.p
            key={message}
            role="status"
            data-matocha-motion
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: EASE }}
            className={cn(
              "mt-4 flex items-center gap-3 text-sm",
              status === "error" ? "opacity-90" : "opacity-75",
            )}
          >
            {status === "done" && (
              <span className="block h-5 w-5 shrink-0">
                <MatochaGlass
                  variant="classic"
                  pulse
                  ink={light ? "#F3EFE5" : "#161713"}
                />
              </span>
            )}
            {message}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}
