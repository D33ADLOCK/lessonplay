/**
 * Versioned local save service.
 *
 * Wraps `localStorage` with a schema version so saved progress, settings,
 * personal bests and restored-world state can be migrated forward and recovered
 * when corrupt (PRD "Technical Direction", "Testing Decisions"). Slice 1 ships
 * the generic, well-typed container + migration hook; Slice 4 (#14) defines the
 * concrete save shape and migrations, and adds the corrupt-recovery tests.
 */
export interface SaveEnvelope<T> {
  readonly version: number;
  readonly data: T;
}

export type Migration = (data: unknown, fromVersion: number) => unknown;

export interface SaveServiceOptions<T> {
  readonly key: string;
  readonly version: number;
  readonly defaults: T;
  /** Migrations keyed by the version they upgrade *from*. */
  readonly migrations?: Record<number, Migration>;
  /** Storage backend; defaults to localStorage, injectable for tests. */
  readonly storage?: Pick<Storage, "getItem" | "setItem" | "removeItem">;
}

export class SaveService<T> {
  private readonly key: string;
  private readonly version: number;
  private readonly defaults: T;
  private readonly migrations: Record<number, Migration>;
  private readonly storage: Pick<Storage, "getItem" | "setItem" | "removeItem">;

  constructor(opts: SaveServiceOptions<T>) {
    this.key = opts.key;
    this.version = opts.version;
    this.defaults = opts.defaults;
    this.migrations = opts.migrations ?? {};
    this.storage = opts.storage ?? globalThis.localStorage;
  }

  /** Load saved data, migrating + recovering from corruption as needed. */
  load(): T {
    const raw = this.storage.getItem(this.key);
    if (raw == null) return structuredClone(this.defaults);
    try {
      const parsed = JSON.parse(raw) as SaveEnvelope<unknown>;
      if (typeof parsed !== "object" || parsed === null || !("version" in parsed)) {
        return this.recover();
      }
      let { version } = parsed;
      let data = parsed.data;
      if (!Number.isInteger(version) || version < 0 || version > this.version) {
        return this.recover();
      }
      while (version < this.version) {
        const migrate = this.migrations[version];
        if (!migrate) return this.recover();
        data = migrate(data, version);
        version += 1;
      }
      return { ...structuredClone(this.defaults), ...(data as object) } as T;
    } catch {
      return this.recover();
    }
  }

  save(data: T): void {
    const envelope: SaveEnvelope<T> = { version: this.version, data };
    this.storage.setItem(this.key, JSON.stringify(envelope));
  }

  reset(): T {
    this.storage.removeItem(this.key);
    return structuredClone(this.defaults);
  }

  /** Corrupt or unmigratable data falls back to defaults rather than crashing. */
  private recover(): T {
    return structuredClone(this.defaults);
  }
}
