/** Contrat commun des connecteurs (Microsoft Graph, Google, simulé) : les écrans ne voient que ça. */
export interface MailAttachment {
  name: string;
  contentType: string;
  base64: string;
}
export interface MailInput {
  to: string[];
  subject: string;
  html: string;
  attachments?: MailAttachment[];
}
export interface EventInput {
  title: string;
  description?: string;
  startsAt: string; // ISO UTC
  endsAt: string;
  attendees: string[];
  location?: string;
  onlineMeeting?: boolean;
  /** Identifiant local, pour l'idempotence côté fournisseur. */
  localId: string;
}
export interface RemoteEvent {
  externalId: string;
  title: string;
  startsAt: string;
  endsAt: string;
  removed?: boolean;
}
export interface RemoteMessage {
  externalId: string;
  from: string;
  fromName: string;
  subject: string;
  preview: string;
  receivedAt: string;
  conversationId: string;
}

export interface Connector {
  provider: "microsoft" | "google" | "mock";
  simulated: boolean;
  testConnection(): Promise<{ ok: boolean; account?: string; detail?: string }>;
  sendMail(m: MailInput): Promise<{ externalId?: string }>;
  createDraft(m: MailInput): Promise<{ externalId?: string }>;
  pushEvent(e: EventInput): Promise<{ externalId: string; joinUrl?: string }>;
  calendarDelta(cursor?: string): Promise<{ events: RemoteEvent[]; cursor: string }>;
  mailDelta(cursor?: string): Promise<{ messages: RemoteMessage[]; cursor: string }>;
  ensureFolder(path: string[]): Promise<{ url: string }>;
  /** Abonnement aux notifications (webhook) ; null si le fournisseur n'en propose pas pour cette ressource. */
  subscribe(kind: "calendar" | "mail", notificationUrl: string, clientState: string): Promise<{ externalId: string; expiresAt: string; resource: string } | null>;
  renew(externalId: string, resource: string, notificationUrl: string, clientState: string): Promise<{ externalId: string; expiresAt: string }>;
}
