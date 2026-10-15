/** Connecteur simulé : aucun appel externe, résultats plausibles et marqués « simulé ». */
import { randomUUID } from "node:crypto";
import type { Connector } from "./types";

export function mockConnector(): Connector {
  const id = () => `simule-${randomUUID().slice(0, 8)}`;
  return {
    provider: "mock",
    simulated: true,
    async testConnection() {
      return { ok: true, account: "mode simulé", detail: "Aucun compte connecté : rien ne sort de l'application." };
    },
    async sendMail() {
      return { externalId: id() };
    },
    async createDraft() {
      return { externalId: id() };
    },
    async pushEvent(e) {
      return { externalId: id(), joinUrl: e.onlineMeeting ? "https://example.invalid/reunion-simulee" : undefined };
    },
    async calendarDelta(cursor) {
      return { events: [], cursor: cursor ?? "simule" };
    },
    async mailDelta(cursor) {
      return { messages: [], cursor: cursor ?? "simule" };
    },
    async ensureFolder(path) {
      return { url: `https://example.invalid/documents/${path.map(encodeURIComponent).join("/")}` };
    },
    async subscribe() {
      return null;
    },
    async renew(externalId) {
      return { externalId, expiresAt: new Date(Date.now() + 86400_000).toISOString() };
    },
  };
}
