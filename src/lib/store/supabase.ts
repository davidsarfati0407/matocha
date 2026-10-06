import type { Filter, ListOptions, Row, Store, TableName } from "./types";

/**
 * Supabase adapter: PostgREST over fetch with the service-role key.
 * Server only — the key bypasses RLS, and every table has RLS enabled with no
 * public policy, so nothing is reachable with the anon key.
 */
export class SupabaseStore implements Store {
  readonly kind = "supabase" as const;

  constructor(
    private readonly url: string,
    private readonly key: string,
  ) {}

  private async request(path: string, init: RequestInit = {}) {
    const response = await fetch(`${this.url.replace(/\/$/, "")}/rest/v1/${path}`, {
      ...init,
      cache: "no-store",
      headers: {
        apikey: this.key,
        Authorization: `Bearer ${this.key}`,
        "Content-Type": "application/json",
        ...(init.headers ?? {}),
      },
    });
    if (!response.ok) {
      const text = await response.text().catch(() => "");
      throw new Error(`Supabase ${response.status} on ${path}: ${text.slice(0, 300)}`);
    }
    if (response.status === 204) return null;
    const text = await response.text();
    return text ? JSON.parse(text) : null;
  }

  private filterQuery(filter?: Filter) {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(filter ?? {})) {
      params.append(key, value === null ? "is.null" : `eq.${String(value)}`);
    }
    return params;
  }

  async list<T extends Row>(table: TableName, options: ListOptions = {}) {
    const params = this.filterQuery(options.filter);
    params.set("select", "*");
    if (options.orderBy) {
      params.set(
        "order",
        `${options.orderBy.column}.${options.orderBy.ascending === false ? "desc" : "asc"}`,
      );
    }
    if (options.limit) params.set("limit", String(options.limit));
    return ((await this.request(`${table}?${params}`)) ?? []) as T[];
  }

  async get<T extends Row>(table: TableName, id: string): Promise<T | null> {
    return this.findOne<T>(table, { id });
  }

  async findOne<T extends Row>(table: TableName, filter: Filter): Promise<T | null> {
    const [row] = await this.list<T>(table, { filter, limit: 1 });
    return row ?? null;
  }

  async insert<T extends Row>(table: TableName, row: Omit<T, "id"> & { id?: string }) {
    const [created] = await this.request(table, {
      method: "POST",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify(row),
    });
    return created as T;
  }

  async update<T extends Row>(table: TableName, id: string, patch: Partial<T>) {
    const params = this.filterQuery({ id });
    const rows = await this.request(`${table}?${params}`, {
      method: "PATCH",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify(patch),
    });
    return ((rows as T[])?.[0] ?? null) as T | null;
  }

  async upsert<T extends Row>(table: TableName, row: T) {
    const [saved] = await this.request(`${table}?on_conflict=id`, {
      method: "POST",
      headers: { Prefer: "return=representation,resolution=merge-duplicates" },
      body: JSON.stringify(row),
    });
    return saved as T;
  }

  async remove(table: TableName, id: string) {
    await this.request(`${table}?${this.filterQuery({ id })}`, { method: "DELETE" });
  }
}
