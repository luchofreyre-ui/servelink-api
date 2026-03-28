import { Injectable, Logger } from "@nestjs/common";

import type { AutomationJobPayloadEnvelope } from "./system-tests-automation.types";

@Injectable()
export class SystemTestsDeliveryService {
  private readonly log = new Logger(SystemTestsDeliveryService.name);

  /**
   * Posts to SYSTEM_TEST_AUTOMATION_WEBHOOK_URL when set; otherwise internal_log only (still success).
   */
  async deliver(
    envelope: AutomationJobPayloadEnvelope,
  ): Promise<{ ok: boolean; channel: "webhook" | "internal_log"; error?: string }> {
    const url = process.env.SYSTEM_TEST_AUTOMATION_WEBHOOK_URL?.trim();

    if (!url) {
      this.log.log(
        `Delivery internal_log: ${envelope.delivery.title} (${envelope.delivery.dedupeKey})`,
      );
      return { ok: true, channel: "internal_log" };
    }

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(envelope.delivery),
      });
      if (!res.ok) {
        const err = `Webhook HTTP ${res.status}`;
        this.log.warn(err);
        return { ok: false, channel: "webhook", error: err };
      }
      return { ok: true, channel: "webhook" };
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      this.log.warn(`Webhook error: ${msg}`);
      return { ok: false, channel: "webhook", error: msg };
    }
  }
}
