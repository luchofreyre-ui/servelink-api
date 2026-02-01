import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { prisma } from "../prisma";
import { SmsDecision } from "./sms.types";
import { MockSmsProvider } from "./sms.mock.provider";
import { randomBytes } from "crypto";
import Stripe from "stripe";

function makeCode(len = 4) {
  const alphabet = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < len; i++) out += alphabet[Math.random() * alphabet.length | 0];
  return out;
}

async function uniqueCode(): Promise<string> {
  for (let i = 0; i < 10; i++) {
    const code = makeCode(4);
    const exists = await prisma.smsConfirmation.findUnique({ where: { code } });
    if (!exists) return code;
  }
  return randomBytes(3).toString("hex").toUpperCase();
}

function normalizePhone(p: string) {
  return String(p || "").trim();
}

function safeJsonParse(input: string) {
  try { return JSON.parse(input); } catch { return {}; }
}

function requirePositiveInt(name: string, v: any) {
  const n = Number(v);
  if (!Number.isInteger(n) || n <= 0) throw new BadRequestException(`${name} must be a positive integer`);
  return n;
}

@Injectable()
export class SmsService {
  private provider = new MockSmsProvider();

  private stripeOrNull() {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) return null;
    return new Stripe(key, { apiVersion: "2024-06-20" as any });
  }

  private async applyAddonToBooking(bookingId: string, addon: any, smsCode: string) {
    if (!bookingId) throw new BadRequestException("payload.bookingId is required");

    const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
    if (!booking) throw new NotFoundException("Booking not found");

    // Hard pricing input (no estimates)
    const priceCents = requirePositiveInt("payload.priceCents", addon?.priceCents);
    const currency = String(addon?.currency || "usd").toLowerCase();
    const addonType = String(addon?.type || "unknown");

    // Idempotent: unique smsCode
    const existing = await prisma.bookingAddon.findUnique({ where: { smsCode } });
    if (existing) return { applied: false, billed: false, reason: "already_applied" };

    // Create addon record (source of truth)
    const addonRow = await prisma.bookingAddon.create({
      data: {
        bookingId,
        smsCode,
        type: addonType,
        priceCents,
        currency,
        stripePaymentIntentId: booking.stripePaymentIntentId ?? null,
        payloadJson: JSON.stringify(addon ?? {}),
        status: "approved",
      },
    });

    // Breadcrumb in booking notes (optional but helpful)
    const tag = `[ADDON:${smsCode}]`;
    const line = `${tag} approved addon=${JSON.stringify(addon)}`;
    const existingNotes = booking.notes || "";
    if (!existingNotes.includes(tag)) {
      const nextNotes = existingNotes ? `${existingNotes}\n${line}` : line;
      await prisma.booking.update({ where: { id: bookingId }, data: { notes: nextNotes } });
    }

    // Stripe update (only if configured + PI exists)
    let billed = false;
    const stripe = this.stripeOrNull();

    if (stripe && booking.stripePaymentIntentId) {
      const pi = await stripe.paymentIntents.retrieve(booking.stripePaymentIntentId);
      const currentAmount = Number((pi as any).amount || 0);
      const newAmount = currentAmount + priceCents;

      await stripe.paymentIntents.update(booking.stripePaymentIntentId, {
        amount: newAmount,
        currency: currency as any,
      });

      billed = true;
    }

    return { applied: true, billed, addonId: addonRow.id };
  }

  async createAddonConfirmation(phone: string, payload: any) {
    const normalizedPhone = normalizePhone(phone);
    if (!normalizedPhone) throw new BadRequestException("phone is required");

    const now = new Date();
    const expiresAt = new Date(now.getTime() + 10 * 60 * 1000);

    const payloadJson = JSON.stringify(payload ?? {});
    const existing = await prisma.smsConfirmation.findFirst({
      where: {
        phone: normalizedPhone,
        kind: "addon",
        status: "pending",
        payloadJson,
        expiresAt: { gt: now },
      },
      orderBy: { createdAt: "desc" },
    });

    if (existing) {
      return { code: existing.code, status: existing.status, expires_at: existing.expiresAt.toISOString() };
    }

    const code = await uniqueCode();

    const row = await prisma.smsConfirmation.create({
      data: {
        code,
        phone: normalizedPhone,
        kind: "addon",
        status: "pending",
        payloadJson,
        expiresAt,
      },
    });

    const body = `Servelink: Reply YES ${code} to approve, or NO ${code} to decline.`;
    await this.provider.sendSms(normalizedPhone, body);

    return { code: row.code, status: row.status, expires_at: row.expiresAt.toISOString() };
  }

  async resolveByCode(phone: string, code: string, decision: SmsDecision, rawReply: string) {
    const normalizedPhone = normalizePhone(phone);
    const normalizedCode = String(code || "").toUpperCase();

    const row = await prisma.smsConfirmation.findUnique({ where: { code: normalizedCode } });
    if (!row) throw new NotFoundException("Unknown code");

    if (row.phone !== normalizedPhone) throw new BadRequestException("Phone mismatch");

    const now = new Date();

    if (row.status === "pending" && now > row.expiresAt) {
      const updated = await prisma.smsConfirmation.update({
        where: { code: normalizedCode },
        data: { status: "expired", respondedAt: now, rawReply },
      });
      return { status: updated.status, payload: safeJsonParse(updated.payloadJson || "{}") };
    }

    if (row.status !== "pending") {
      return { status: row.status, payload: safeJsonParse(row.payloadJson || "{}") };
    }

    const status = decision === "approve" ? "approved" : "declined";

    const updated = await prisma.smsConfirmation.update({
      where: { code: normalizedCode },
      data: { status, respondedAt: now, rawReply },
    });

    const payload = safeJsonParse(updated.payloadJson || "{}");

    if (status === "approved" && updated.kind === "addon") {
      const bookingId = payload.bookingId || payload.booking_id;
      try {
        const apply = await this.applyAddonToBooking(String(bookingId || ""), payload, normalizedCode);
        return { status: updated.status, payload, applied: apply.applied, billed: apply.billed, reason: apply.reason, addonId: apply.addonId };
      } catch (e: any) {
        return { status: updated.status, payload, applied: false, billed: false, reason: e?.message || "apply_failed" };
      }
    }

    return { status: updated.status, payload };
  }

  async getByCode(code: string) {
    const normalizedCode = String(code || "").toUpperCase();
    const row = await prisma.smsConfirmation.findUnique({ where: { code: normalizedCode } });
    if (!row) throw new NotFoundException("Unknown code");

    return {
      code: row.code,
      phone: row.phone,
      status: row.status,
      expires_at: row.expiresAt.toISOString(),
      responded_at: row.respondedAt ? row.respondedAt.toISOString() : null,
      payload: safeJsonParse(row.payloadJson || "{}"),
    };
  }
}
