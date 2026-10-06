/**
 * Storage contract.
 *
 * A deliberately small, table-shaped interface so the same code runs on the
 * Supabase adapter (PostgREST over fetch, service-role key, server only) and on
 * the in-memory adapter used by tests and local development.
 *
 * Table names and columns mirror `supabase/migrations/0001_init.sql`.
 */

export type Row = Record<string, unknown> & { id: string };

export type Filter = Record<string, string | number | boolean | null>;

export type ListOptions = {
  filter?: Filter;
  orderBy?: { column: string; ascending?: boolean };
  limit?: number;
};

export type TableName =
  | "settings"
  | "leads"
  | "api_tokens"
  | "audit_log"
  | "idempotency_keys"
  | "change_requests"
  | "catalog_overrides"
  | "content_blocks"
  | "media_items"
  | "orders"
  | "shipments"
  | "webhook_deliveries"
  | "rate_limits"
  | "admin_sessions";

export interface Store {
  readonly kind: "supabase" | "memory";
  list<T extends Row>(table: TableName, options?: ListOptions): Promise<T[]>;
  get<T extends Row>(table: TableName, id: string): Promise<T | null>;
  findOne<T extends Row>(table: TableName, filter: Filter): Promise<T | null>;
  insert<T extends Row>(table: TableName, row: Omit<T, "id"> & { id?: string }): Promise<T>;
  update<T extends Row>(table: TableName, id: string, patch: Partial<T>): Promise<T | null>;
  /** Insert or replace on `id`. */
  upsert<T extends Row>(table: TableName, row: T): Promise<T>;
  remove(table: TableName, id: string): Promise<void>;
}

/** `settings` rows are key/value: id = key. */
export type SettingRow = Row & { value: unknown; updated_at: string };

/** `catalog_overrides`: id = `${entity}:${key}` e.g. `recipe:poudre-original`. */
export type CatalogOverrideRow = Row & {
  entity: "recipe" | "pack" | "family" | "company" | "shipping" | "socials";
  key: string;
  patch: Record<string, unknown>;
  updated_at: string;
};
