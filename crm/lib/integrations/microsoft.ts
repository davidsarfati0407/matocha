/** Connecteur Microsoft Graph (v1.0) : Outlook, Agenda (+ réunion Teams), OneDrive, abonnements webhooks. */
import { call } from "./http";
import type { Connector, EventInput, MailInput, RemoteEvent, RemoteMessage } from "./types";

const G = "https://graph.microsoft.com/v1.0";
const recipients = (to: string[]) => to.map((address) => ({ emailAddress: { address } }));
const attachments = (m: MailInput) => m.attachments?.map((a) => ({ "@odata.type": "#microsoft.graph.fileAttachment", name: a.name, contentType: a.contentType, contentBytes: a.base64 }));
/** Durée max. d'un abonnement messages/événements : ~4 230 min ; on renouvelle bien avant. */
const SUB_MINUTES = 4000;

export function microsoftConnector(token: () => Promise<string>, f: typeof fetch = fetch): Connector {
  const c = async <T>(url: string, init?: Parameters<typeof call>[3]) => call<T>(f, await token(), url.startsWith("http") ? url : `${G}${url}`, init);
  const page = async <T>(first: string) => {
    const items: T[] = [];
    let url: string | undefined = first;
    let delta = "";
    while (url) {
      const r: { value: T[]; "@odata.nextLink"?: string; "@odata.deltaLink"?: string } = await c(url);
      items.push(...r.value);
      url = r["@odata.nextLink"];
      if (r["@odata.deltaLink"]) delta = r["@odata.deltaLink"];
    }
    return { items, delta };
  };
  return {
    provider: "microsoft",
    simulated: false,
    async testConnection() {
      const me = await c<{ mail?: string; userPrincipalName: string; displayName: string }>("/me?$select=mail,userPrincipalName,displayName");
      return { ok: true, account: me.mail ?? me.userPrincipalName, detail: me.displayName };
    },
    async sendMail(m: MailInput) {
      await c("/me/sendMail", { body: { message: { subject: m.subject, body: { contentType: "HTML", content: m.html }, toRecipients: recipients(m.to), attachments: attachments(m) }, saveToSentItems: true } });
      return {};
    },
    async createDraft(m: MailInput) {
      const d = await c<{ id: string }>("/me/messages", { body: { subject: m.subject, body: { contentType: "HTML", content: m.html }, toRecipients: recipients(m.to), attachments: attachments(m) } });
      return { externalId: d.id };
    },
    async pushEvent(e: EventInput) {
      const ev = await c<{ id: string; onlineMeeting?: { joinUrl?: string } }>("/me/events", {
        body: {
          subject: e.title,
          body: { contentType: "HTML", content: e.description ?? "" },
          start: { dateTime: e.startsAt.replace(/Z$/, ""), timeZone: "UTC" },
          end: { dateTime: e.endsAt.replace(/Z$/, ""), timeZone: "UTC" },
          location: e.location ? { displayName: e.location } : undefined,
          attendees: e.attendees.map((address) => ({ emailAddress: { address }, type: "required" })),
          isOnlineMeeting: Boolean(e.onlineMeeting),
          onlineMeetingProvider: e.onlineMeeting ? "teamsForBusiness" : undefined,
          transactionId: e.localId, // idempotence : un réessai ne crée pas de doublon
        },
      });
      return { externalId: ev.id, joinUrl: ev.onlineMeeting?.joinUrl };
    },
    async calendarDelta(cursor?: string) {
      const start = new Date(Date.now() - 7 * 86400_000).toISOString();
      const end = new Date(Date.now() + 60 * 86400_000).toISOString();
      const { items, delta } = await page<{ id: string; subject?: string; start?: { dateTime: string }; end?: { dateTime: string }; "@removed"?: unknown }>(cursor ?? `/me/calendarView/delta?startDateTime=${start}&endDateTime=${end}`);
      const events: RemoteEvent[] = items.map((x) => ({ externalId: x.id, title: x.subject ?? "", startsAt: x.start ? `${x.start.dateTime.slice(0, 19)}Z` : "", endsAt: x.end ? `${x.end.dateTime.slice(0, 19)}Z` : "", removed: Boolean(x["@removed"]) }));
      return { events, cursor: delta || cursor || "" };
    },
    async mailDelta(cursor?: string) {
      const { items, delta } = await page<{ id: string; subject?: string; bodyPreview?: string; receivedDateTime?: string; conversationId?: string; from?: { emailAddress: { address: string; name: string } } }>(cursor ?? "/me/mailFolders/inbox/messages/delta?$select=subject,from,bodyPreview,receivedDateTime,conversationId");
      const messages: RemoteMessage[] = items.filter((x) => x.from).map((x) => ({ externalId: x.id, from: x.from!.emailAddress.address, fromName: x.from!.emailAddress.name, subject: x.subject ?? "", preview: x.bodyPreview ?? "", receivedAt: x.receivedDateTime ?? new Date().toISOString(), conversationId: x.conversationId ?? x.id }));
      return { messages, cursor: delta || cursor || "" };
    },
    async ensureFolder(path: string[]) {
      let parent = "";
      let url = "";
      for (const name of path) {
        const at = parent ? `/me/drive/root:/${parent}:/children` : "/me/drive/root/children";
        try {
          const it = await c<{ webUrl: string }>(at, { body: { name, folder: {}, "@microsoft.graph.conflictBehavior": "fail" } });
          url = it.webUrl;
        } catch (e) {
          if ((e as { status?: number }).status !== 409) throw e;
          url = (await c<{ webUrl: string }>(`/me/drive/root:/${[parent, name].filter(Boolean).map(encodeURIComponent).join("/")}`)).webUrl;
        }
        parent = [parent, encodeURIComponent(name)].filter(Boolean).join("/");
      }
      return { url };
    },
    async subscribe(kind, notificationUrl, clientState) {
      const resource = kind === "mail" ? "me/mailFolders('Inbox')/messages" : "me/events";
      const s = await c<{ id: string; expirationDateTime: string }>("/subscriptions", {
        body: { changeType: "created,updated,deleted", notificationUrl, resource, clientState, expirationDateTime: new Date(Date.now() + SUB_MINUTES * 60_000).toISOString() },
      });
      return { externalId: s.id, expiresAt: s.expirationDateTime, resource };
    },
    async renew(externalId) {
      const s = await c<{ id: string; expirationDateTime: string }>(`/subscriptions/${externalId}`, { method: "PATCH", body: { expirationDateTime: new Date(Date.now() + SUB_MINUTES * 60_000).toISOString() } });
      return { externalId: s.id, expiresAt: s.expirationDateTime };
    },
  };
}
