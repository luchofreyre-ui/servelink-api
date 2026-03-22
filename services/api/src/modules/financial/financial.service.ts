import { Injectable, NotFoundException } from "@nestjs/common";
import {
  JournalEntryType,
  LedgerAccount,
  LineDirection,
} from "@prisma/client";
import { PrismaService } from "../../prisma";
import { LedgerService } from "../ledger/ledger.service";
import { splitCharge, type PricingPolicyV1 } from "../billing/pricing.policy";

export type RecordPaymentResult = {
  paymentId: string;
  bookingId: string;
  amount: number;
  ledgerPosted: boolean;
};

@Injectable()
export class FinancialService {
  private readonly pricingPolicyV1: PricingPolicyV1 = {
    platformFeeBps: 2000,
    minPlatformFeeCents: 0,
  };

  constructor(
    private readonly prisma: PrismaService,
    private readonly ledger: LedgerService,
  ) {}

  /**
   * Records a completed card payment: Payment row + double-entry CHARGE (revenue split)
   * + SETTLEMENT (cash vs AR), idempotent per booking + Stripe payment intent.
   */
  async recordPayment(
    bookingId: string,
    amount: number,
    options: { stripePaymentIntentId: string },
    tx?: PrismaService,
  ): Promise<RecordPaymentResult> {
    const db = tx ?? this.prisma;

    const booking = await db.booking.findUnique({
      where: { id: bookingId },
      select: { id: true, foId: true, currency: true },
    });
    if (!booking) {
      throw new NotFoundException("Booking not found");
    }

    const amountCents = Math.round(amount * 100);
    if (!Number.isInteger(amountCents) || amountCents <= 0) {
      return {
        paymentId: "",
        bookingId,
        amount,
        ledgerPosted: false,
      };
    }

    const { platformFeeCents, foEarningsCents } = splitCharge(
      amountCents,
      this.pricingPolicyV1,
    );
    const currency = (booking.currency ?? "usd").toLowerCase();

    let payment = await db.payment.findFirst({
      where: {
        bookingId,
        externalRef: options.stripePaymentIntentId,
      },
    });
    if (!payment) {
      payment = await db.payment.create({
        data: {
          bookingId,
          amount,
          status: "completed",
          externalRef: options.stripePaymentIntentId,
        },
      });
    }

    const chargeKey = `ledger:charge:stripe_pi:${bookingId}:${options.stripePaymentIntentId}`;
    const settlementKey = `ledger:settlement:stripe_pi:${bookingId}:${options.stripePaymentIntentId}`;

    await this.ledger.postEntry(
      {
        type: JournalEntryType.CHARGE,
        bookingId,
        foId: booking.foId ?? undefined,
        currency,
        idempotencyKey: chargeKey,
        lines: [
          {
            account: LedgerAccount.AR_CUSTOMER,
            direction: LineDirection.DEBIT,
            amountCents,
          },
          {
            account: LedgerAccount.LIAB_DEFERRED_REVENUE,
            direction: LineDirection.CREDIT,
            amountCents: platformFeeCents,
          },
          {
            account: LedgerAccount.LIAB_FO_PAYABLE,
            direction: LineDirection.CREDIT,
            amountCents: foEarningsCents,
          },
        ],
        metadata: {
          source: "payment_orchestration",
          stripePaymentIntentId: options.stripePaymentIntentId,
          amountCents,
        },
      },
      db,
    );

    await this.ledger.postEntry(
      {
        type: JournalEntryType.SETTLEMENT,
        bookingId,
        currency,
        idempotencyKey: settlementKey,
        metadata: {
          source: "payment_orchestration",
          stripePaymentIntentId: options.stripePaymentIntentId,
          amountCents,
        },
        lines: [
          {
            account: LedgerAccount.CASH_STRIPE,
            direction: LineDirection.DEBIT,
            amountCents,
          },
          {
            account: LedgerAccount.AR_CUSTOMER,
            direction: LineDirection.CREDIT,
            amountCents,
          },
        ],
      },
      db,
    );

    return {
      paymentId: payment.id,
      bookingId,
      amount,
      ledgerPosted: true,
    };
  }

  async createPayout(foId: string, amount: number) {
    return this.prisma.payout.create({
      data: {
        franchiseOwnerId: foId,
        amount,
        status: "pending",
      },
    });
  }
}
