export const SCOPES = [
  "catalog:read",
  "catalog:write",
  "content:read",
  "content:write",
  "leads:read",
  "leads:write",
  "orders:read",
  "orders:write",
  "media:write",
  "analytics:read",
  "settings:propose",
] as const;

export type Scope = (typeof SCOPES)[number];

export const isScope = (value: unknown): value is Scope =>
  typeof value === "string" && (SCOPES as readonly string[]).includes(value);
