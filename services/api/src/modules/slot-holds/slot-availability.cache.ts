type CacheEntry = {
  value: any;
  expiresAt: number;
};

export class SlotAvailabilityCache {
  private static store = new Map<string, CacheEntry>();
  private static TTL = 30_000;

  static get(key: string) {
    const entry = this.store.get(key);
    if (!entry) return undefined;

    if (entry.expiresAt < Date.now()) {
      this.store.delete(key);
      return undefined;
    }

    return entry.value;
  }

  static set(key: string, value: any) {
    this.store.set(key, {
      value,
      expiresAt: Date.now() + this.TTL,
    });
  }

  static invalidateByFo(foId: string) {
    for (const key of this.store.keys()) {
      if (key.startsWith(`${foId}:`)) {
        this.store.delete(key);
      }
    }
  }
}
