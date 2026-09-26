/**
 * A small in-process cache with a size bound (least recently used entries are evicted first)
 * and a time-to-live. Map iteration order is insertion order, so re-inserting on read keeps
 * the most recently used entries at the end.
 */
export class TtlLruCache<V> {
  private readonly entries = new Map<string, { value: V; expiresAt: number }>();

  constructor(
    private readonly maxEntries: number,
    private readonly ttlMs: number,
    private readonly now: () => number = Date.now,
  ) {}

  /**
   * @param key - cache key.
   * @returns the cached value, or undefined when missing or expired.
   */
  get(key: string): V | undefined {
    const entry = this.entries.get(key);
    if (!entry) return undefined;
    this.entries.delete(key);
    if (entry.expiresAt <= this.now()) return undefined;
    this.entries.set(key, entry);
    return entry.value;
  }

  /**
   * Stores a value, evicting the least recently used entry when the cache is full.
   * @param key - cache key.
   * @param value - value to keep until the TTL expires.
   */
  set(key: string, value: V): void {
    this.entries.delete(key);
    this.entries.set(key, { value, expiresAt: this.now() + this.ttlMs });
    if (this.entries.size > this.maxEntries) {
      const oldest = this.entries.keys().next().value;
      if (oldest !== undefined) this.entries.delete(oldest);
    }
  }

  /** Number of entries currently held, including any not yet found to be expired. */
  get size(): number {
    return this.entries.size;
  }

  /** Removes every entry. */
  clear(): void {
    this.entries.clear();
  }
}
