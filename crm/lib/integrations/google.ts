/**
 * Connecteur Google : Gmail, Agenda (+ Meet), Drive, notifications push de l'agenda.
 * Gmail n'a de push que via Google Cloud Pub/Sub : ici le courrier est synchronisé par la file
 * (historique Gmail depuis le dernier historyId), sans Pub/Sub.
 */
import { randomUUID } from "node:crypto";
import { call } from "./http";
import type { Connector, EventInput, MailInput, RemoteEvent, RemoteMessage } from "./types";

const GMAIL = "https://gmail.googleapis.com/gmail/v1/users/me";
const CAL = "https://www.googleapis.com/calendar/v3/calendars/primary";
const DRIVE = "https://www.googleapis.com/drive/v3/files";
const FOLDER = "application/vnd.google-apps.folder";

/** Message RFC 822 encodé base64url (format attendu par Gmail), pièces jointes en multipart/mixed. */
export function rfc822(m: MailInput) {
  const enc = (s: string) => `=?UTF-8?B?${Buffer.from(s, "utf8").toString("base64")}?=`;
  const wrap = (b64: string) => b64.replace(/.{1,76}/g, "$&\r\n").trimEnd();
  const head = [`To: ${m.to.join(", ")}`, `Subject: ${enc(m.subject)}`, "MIME-Version: 1.0"];
  const html = ['Content-Type: text/html; charset="UTF-8"', "Content-Transfer-Encoding: base64", "", wrap(Buffer.from(m.html, "utf8").toString("base64"))];
  let raw: string[];
  if (!m.attachments?.length) raw = [...head, ...html];
  else {
    const b = `matocha-${Math.random().toString(36).slice(2)}`;
    raw = [...head, `Content-Type: multipart/mixed; boundary="${b}"`, "", `--${b}`, ...html];
    for (const a of m.attachments) raw.push(`--${b}`, `Content-Type: ${a.contentType}; name="${a.name}"`, `Content-Disposition: attachment; filename="${a.name}"`, "Content-Transfer-Encoding: base64", "", wrap(a.base64));
    raw.push(`--${b}--`);
  }
  return Buffer.from(raw.join("\r\n"), "utf8").toString("base64url");
}

export function googleConnector(token: () => Promise<string>, f: typeof fetch = fetch): Connector {
  const c = async <T>(url: string, init?: Parameters<typeof call>[3]) => call<T>(f, await token(), url, init);
  return {
    provider: "google",
    simulated: false,
    async testConnection() {
      const u = await c<{ email: string; name?: string }>("https://openidconnect.googleapis.com/v1/userinfo");
      return { ok: true, account: u.email, detail: u.name };
    },
    async sendMail(m: MailInput) {
      const r = await c<{ id: string }>(`${GMAIL}/messages/send`, { body: { raw: rfc822(m) } });
      return { externalId: r.id };
    },
    async createDraft(m: MailInput) {
      const r = await c<{ id: string }>(`${GMAIL}/drafts`, { body: { message: { raw: rfc822(m) } } });
      return { externalId: r.id };
    },
    async pushEvent(e: EventInput) {
      const ev = await c<{ id: string; hangoutLink?: string }>(`${CAL}/events?conferenceDataVersion=1&sendUpdates=all`, {
        body: {
          summary: e.title,
          description: e.description,
          location: e.location,
          start: { dateTime: e.startsAt },
          end: { dateTime: e.endsAt },
          attendees: e.attendees.map((email) => ({ email })),
          conferenceData: e.onlineMeeting ? { createRequest: { requestId: e.localId, conferenceSolutionKey: { type: "hangoutsMeet" } } } : undefined,
        },
      });
      return { externalId: ev.id, joinUrl: ev.hangoutLink };
    },
    async calendarDelta(cursor?: string) {
      const events: RemoteEvent[] = [];
      let pageToken: string | undefined;
      let next = cursor ?? "";
      do {
        const q = new URLSearchParams({ singleEvents: "true", maxResults: "250", ...(cursor ? { syncToken: cursor } : { timeMin: new Date(Date.now() - 7 * 86400_000).toISOString() }), ...(pageToken ? { pageToken } : {}) });
        const r: { items: { id: string; status?: string; summary?: string; start?: { dateTime?: string; date?: string }; end?: { dateTime?: string; date?: string } }[]; nextPageToken?: string; nextSyncToken?: string } = await c(`${CAL}/events?${q}`);
        for (const x of r.items) events.push({ externalId: x.id, title: x.summary ?? "", startsAt: x.start?.dateTime ?? `${x.start?.date}T00:00:00Z`, endsAt: x.end?.dateTime ?? `${x.end?.date}T00:00:00Z`, removed: x.status === "cancelled" });
        pageToken = r.nextPageToken;
        if (r.nextSyncToken) next = r.nextSyncToken;
      } while (pageToken);
      return { events, cursor: next };
    },
    async mailDelta(cursor?: string) {
      if (!cursor) {
        const p = await c<{ historyId: string }>(`${GMAIL}/profile`);
        return { messages: [], cursor: p.historyId }; // point de départ : les nouveaux messages à partir de maintenant
      }
      const h = await c<{ history?: { messagesAdded?: { message: { id: string; labelIds?: string[] } }[] }[]; historyId: string }>(`${GMAIL}/history?startHistoryId=${cursor}&historyTypes=messageAdded&labelId=INBOX`);
      const ids = (h.history ?? []).flatMap((x) => x.messagesAdded ?? []).map((x) => x.message.id);
      const messages: RemoteMessage[] = [];
      for (const id of ids.slice(0, 50)) {
        const m = await c<{ id: string; threadId: string; snippet: string; internalDate: string; payload: { headers: { name: string; value: string }[] } }>(`${GMAIL}/messages/${id}?format=metadata&metadataHeaders=From&metadataHeaders=Subject`);
        const hdr = (n: string) => m.payload.headers.find((x) => x.name.toLowerCase() === n)?.value ?? "";
        const from = hdr("from");
        const addr = from.match(/<([^>]+)>/)?.[1] ?? from;
        messages.push({ externalId: m.id, from: addr, fromName: from.replace(/\s*<[^>]+>/, "").replace(/"/g, "") || addr, subject: hdr("subject"), preview: m.snippet, receivedAt: new Date(Number(m.internalDate)).toISOString(), conversationId: m.threadId });
      }
      return { messages, cursor: h.historyId };
    },
    async ensureFolder(path: string[]) {
      let parent = "root";
      let url = "";
      for (const name of path) {
        const q = `name = '${name.replace(/'/g, "\\'")}' and mimeType = '${FOLDER}' and '${parent}' in parents and trashed = false`;
        const found = await c<{ files: { id: string; webViewLink: string }[] }>(`${DRIVE}?q=${encodeURIComponent(q)}&fields=files(id,webViewLink)`);
        const it = found.files[0] ?? (await c<{ id: string; webViewLink: string }>(`${DRIVE}?fields=id,webViewLink`, { body: { name, mimeType: FOLDER, parents: [parent] } }));
        parent = it.id;
        url = it.webViewLink;
      }
      return { url };
    },
    async subscribe(kind, notificationUrl, clientState) {
      if (kind === "mail") return null; // Gmail : Pub/Sub requis → synchronisation par la file
      const ch = await c<{ id: string; resourceId: string; expiration: string }>(`${CAL}/events/watch`, { body: { id: randomUUID(), type: "web_hook", address: notificationUrl, token: clientState, params: { ttl: String(7 * 86400) } } });
      return { externalId: `${ch.id}|${ch.resourceId}`, expiresAt: new Date(Number(ch.expiration)).toISOString(), resource: "calendar" };
    },
    async renew(externalId, _resource, notificationUrl, clientState) {
      // Google ne prolonge pas un canal : on en ouvre un nouveau puis on ferme l'ancien.
      const fresh = await this.subscribe("calendar", notificationUrl, clientState);
      const [id, resourceId] = externalId.split("|");
      await c("https://www.googleapis.com/calendar/v3/channels/stop", { body: { id, resourceId } }).catch(() => null);
      return { externalId: fresh!.externalId, expiresAt: fresh!.expiresAt };
    },
  };
}
