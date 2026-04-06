import { Injectable } from "@nestjs/common";

type Entry = {
  value: unknown;
  expiresAt: number;
};

@Injectable()
export class DispatchIdempotencyService {
  private readonly store = new Map<string, Entry>();
  private readonly TTL = 1000 * 60 * 15;

  get(key: string): unknown | null {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (entry.expiresAt <= Date.now()) {
      this.store.delete(key);
      return null;
    }
    return entry.value;
  }

  set(key: string, value: unknown) {
    this.store.set(key, {
      value,
      expiresAt: Date.now() + this.TTL,
    });
  }
}
