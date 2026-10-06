import "server-only";

export type EmailMessage = {
  to: string;
  subject: string;
  html: string;
  text: string;
  headers?: Record<string, string>;
};

export interface EmailSender {
  readonly kind: "resend" | "console";
  send(message: EmailMessage): Promise<void>;
}

const globalOutbox = globalThis as unknown as { __matochaOutbox?: EmailMessage[] };

/** Messages "sent" by the console adapter. Tests read this. */
export function consoleOutbox() {
  globalOutbox.__matochaOutbox ??= [];
  return globalOutbox.__matochaOutbox;
}

class ResendSender implements EmailSender {
  readonly kind = "resend" as const;
  constructor(
    private readonly apiKey: string,
    private readonly from: string,
  ) {}

  async send(message: EmailMessage) {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: this.from,
        to: [message.to],
        subject: message.subject,
        html: message.html,
        text: message.text,
        headers: message.headers,
      }),
    });
    if (!response.ok) {
      const body = await response.text().catch(() => "");
      throw new Error(`Resend ${response.status}: ${body.slice(0, 200)}`);
    }
  }
}

class ConsoleSender implements EmailSender {
  readonly kind = "console" as const;
  async send(message: EmailMessage) {
    consoleOutbox().push(message);
    if (process.env.NODE_ENV !== "test") {
      console.info(`[email:console] → ${message.to} · ${message.subject}\n${message.text}`);
    }
  }
}

/**
 * The configured sender, or null. Brevo can be added behind the same
 * interface; Resend is wired because its API is a single fetch.
 */
export function getEmailSender(): EmailSender | null {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (key && from) return new ResendSender(key, from);
  if (process.env.MATOCHA_EMAIL === "console" && process.env.NODE_ENV !== "production") {
    return new ConsoleSender();
  }
  return null;
}

export function siteUrl() {
  return (process.env.SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
}

export function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Plain, sober HTML wrapper used by every message. */
export function layout(title: string, paragraphs: string[], action?: { href: string; label: string }, footer?: string) {
  const body = paragraphs.map((p) => `<p style="margin:0 0 16px">${p}</p>`).join("");
  const button = action
    ? `<p style="margin:24px 0"><a href="${action.href}" style="background:#1E3A2A;color:#EEEDE0;padding:14px 22px;text-decoration:none;font-weight:600;display:inline-block">${escapeHtml(action.label)}</a></p>`
    : "";
  return `<!doctype html><html lang="fr"><body style="margin:0;background:#EEEDE0;color:#16241B;font-family:Arial,Helvetica,sans-serif;font-size:16px;line-height:1.5"><div style="max-width:520px;margin:0 auto;padding:32px 20px"><p style="font-weight:700;letter-spacing:-0.5px;font-size:20px;margin:0 0 24px">MATOCHA</p><h1 style="font-size:22px;margin:0 0 16px">${escapeHtml(title)}</h1>${body}${button}${footer ? `<p style="margin-top:32px;font-size:13px;opacity:.7">${footer}</p>` : ""}</div></body></html>`;
}
