import { Injectable } from "@nestjs/common";
import { randomUUID } from "crypto";

@Injectable()
export class RequestContextService {
  createRequestId(existing?: string | string[]): string {
    if (Array.isArray(existing)) {
      return existing[0] ?? randomUUID();
    }
    if (typeof existing === "string" && existing.trim().length > 0) {
      return existing;
    }
    return randomUUID();
  }
}
