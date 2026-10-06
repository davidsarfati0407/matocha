import { randomUUID } from "node:crypto";
import type { Filter, ListOptions, Row, Store, TableName } from "./types";

function matches(row: Row, filter?: Filter) {
  if (!filter) return true;
  return Object.entries(filter).every(([k, v]) => (row[k] ?? null) === v);
}

/**
 * In-memory store for tests and local development. Never used in production
 * (see `getStore`). Rows are deep-cloned in and out so callers cannot mutate
 * stored state by reference.
 */
export class MemoryStore implements Store {
  readonly kind = "memory" as const;
  private tables = new Map<TableName, Map<string, Row>>();

  private table(name: TableName) {
    let t = this.tables.get(name);
    if (!t) {
      t = new Map();
      this.tables.set(name, t);
    }
    return t;
  }

  reset() {
    this.tables.clear();
  }

  async list<T extends Row>(table: TableName, options: ListOptions = {}) {
    let rows = [...this.table(table).values()].filter((r) => matches(r, options.filter));
    if (options.orderBy) {
      const { column, ascending = true } = options.orderBy;
      rows.sort((a, b) => {
        const av = String(a[column] ?? "");
        const bv = String(b[column] ?? "");
        return ascending ? av.localeCompare(bv) : bv.localeCompare(av);
      });
    }
    if (options.limit) rows = rows.slice(0, options.limit);
    return structuredClone(rows) as T[];
  }

  async get<T extends Row>(table: TableName, id: string): Promise<T | null> {
    const row = this.table(table).get(id);
    return row ? (structuredClone(row) as T) : null;
  }

  async findOne<T extends Row>(table: TableName, filter: Filter): Promise<T | null> {
    const [row] = await this.list<T>(table, { filter, limit: 1 });
    return row ?? null;
  }

  async insert<T extends Row>(table: TableName, row: Omit<T, "id"> & { id?: string }) {
    const id = row.id ?? randomUUID();
    const t = this.table(table);
    if (t.has(id)) throw new Error(`duplicate id ${id} in ${table}`);
    const stored = { ...structuredClone(row), id } as Row;
    t.set(id, stored);
    return structuredClone(stored) as T;
  }

  async update<T extends Row>(table: TableName, id: string, patch: Partial<T>) {
    const t = this.table(table);
    const current = t.get(id);
    if (!current) return null;
    const next = { ...current, ...structuredClone(patch), id } as Row;
    t.set(id, next);
    return structuredClone(next) as T;
  }

  async upsert<T extends Row>(table: TableName, row: T) {
    this.table(table).set(row.id, structuredClone(row));
    return structuredClone(row);
  }

  async remove(table: TableName, id: string) {
    this.table(table).delete(id);
  }
}
