import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma";

type Decision = "YES" | "NO" | "approve" | "decline";

type AddonPayload = {
  bookingId: string;
  type: string;
  priceCents: number;
  currency: string;
};

@Injectable()
export class SmsService {
  constructor(private readonly prisma: PrismaService) {}

  private normalizeCode(code: string) {
    return String(code || "").trim().toUpperCase();
  }

  private normalizePhone(phone: string) {
    return String(phone || "").trim();
  }

  private isApprove(decision: Decision) {
    return decision === "YES" || decision === "approve";
  }

  private isDecline(decision: Decision) {
    return decision === "NO" || decision === "decline";
  }

  private generateCode(len: number) {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let out = "";
    for (let i = 0; i < len; i++) out += chars[Math.floor(Math.random() * chars.length)];
    return out;
  }

  /**
   * Creates an SMS confirmation row for an addon approval flow.
   * Returns an object that includes `code` (controller depends on it).
   */
  async createAddonConfirmation(phone: string, addon: AddonPayload) {
    const bookingId = addon?.bookingId;
    if (!bookingId) throw new Error("addon.bookingId is required");

    const booking = await this.prisma.booking.findUnique({ where: { id: bookingId } });
    if (!booking) throw new Error("Booking not found");

    const normalizedPhone = this.normalizePhone(phone);

    // 15 minute TTL
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    // Try code, retry once on collision
    const code1 = this.generateCode(4);
    const exists1 = await this.prisma.smsConfirmation.findUnique({ where: { code: code1 } });
    const code = exists1 ? this.generateCode(4) : code1;

    const row = await this.prisma.smsConfirmation.create({
      data: {
        code,
        phone: normalizedPhone,
        kind: "ADDON",
        payloadJson: JSON.stringify(addon),
        status: "pending",
        expiresAt,
      },
    });

    return row;
  }

  /**
   * Looks up confirmation status by code (for /status/:code).
   */
  async getByCode(code: string) {
    const normalizedCode = this.normalizeCode(code);

    const row = await this.prisma.smsConfirmation.findUnique({
      where: { code: normalizedCode },
    });

    if (!row) return { found: false, code: normalizedCode };

    return { found: true, ...row };
  }

  /**
   * Handles inbound replies:
   * - Finds SmsConfirmation by code
   * - Validates phone + expiry + status
   * - Updates status/respondedAt/rawReply
   * - If approved: creates BookingAddon
   *
   * IMPORTANT: smoke test expects `applied === true` when addon is created/applied.
   */
  async resolveByCode(from: string, code: string, decision: Decision, raw: string) {
    const normalizedFrom = this.normalizePhone(from);
    const normalizedCode = this.normalizeCode(code);

    const conf = await this.prisma.smsConfirmation.findUnique({
      where: { code: normalizedCode },
    });

    if (!conf) return { ok: false, error: "Code not found", code: normalizedCode, applied: false };

    if (String(conf.phone).trim() !== normalizedFrom) {
      return { ok: false, error: "Phone mismatch for code", code: normalizedCode, applied: false };
    }

    if (conf.expiresAt && conf.expiresAt.getTime() < Date.now()) {
      return { ok: false, error: "Code expired", code: normalizedCode, applied: false };
    }

    if (conf.status !== "pending") {
      return { ok: false, error: `Code already ${conf.status}`, code: normalizedCode, applied: false };
    }

    const nextStatus = this.isApprove(decision)
      ? "approved"
      : this.isDecline(decision)
        ? "declined"
        : "unknown";

    const updated = await this.prisma.smsConfirmation.update({
      where: { code: normalizedCode },
      data: {
        status: nextStatus,
        respondedAt: new Date(),
        rawReply: raw,
      },
    });

    // Only ADDON flow creates addon rows
    if (updated.kind !== "ADDON") {
      return { ok: true, status: nextStatus, confirmation: updated, applied: false };
    }

    const payload = safeJsonParse(updated.payloadJson) as AddonPayload | undefined;
    if (!payload?.bookingId || !payload?.type) {
      return {
        ok: true,
        status: nextStatus,
        warning: "Missing addon payload fields",
        confirmation: updated,
        applied: false,
      };
    }

    // Default: not applied
    let applied = false;

    if (nextStatus === "approved") {
      // idempotent by smsCode unique
      const existing = await this.prisma.bookingAddon.findUnique({
        where: { smsCode: normalizedCode },
      });

      if (!existing) {
        await this.prisma.bookingAddon.create({
          data: {
            bookingId: payload.bookingId,
            smsCode: normalizedCode,
            type: payload.type,
            priceCents: Number(payload.priceCents ?? 0),
            currency: String(payload.currency ?? "usd"),
            payloadJson: updated.payloadJson,
            status: "approved",
          },
        });
      }

      applied = true;
    }

    return { ok: true, status: nextStatus, confirmation: updated, applied };
  }
}

function safeJsonParse(s: string) {
  try {
    return JSON.parse(s);
  } catch {
    return undefined;
  }
}
