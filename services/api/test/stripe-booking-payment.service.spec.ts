import { Test } from "@nestjs/testing";
import { BookingPaymentStatus } from "@prisma/client";

import { PrismaService } from "../src/prisma";
import { PaymentReliabilityService } from "../src/modules/bookings/payment-reliability/payment-reliability.service";
import { StripePaymentService } from "../src/modules/bookings/stripe/stripe-payment.service";

const mockPaymentReliability = {
  recordAnomaly: jest.fn().mockResolvedValue({}),
  recordWebhookFailure: jest.fn().mockResolvedValue({}),
  resolveAnomaliesForBooking: jest.fn().mockResolvedValue({ count: 0 }),
  getOpenAnomalies: jest.fn().mockResolvedValue([]),
  getPaymentOpsSummary: jest.fn().mockResolvedValue({}),
  recordDuplicateStripeEvent: jest.fn().mockResolvedValue({}),
};

jest.mock("stripe", () => {
  return jest.fn().mockImplementation(() => ({
    checkout: {
      sessions: {
        create: jest.fn().mockResolvedValue({
          id: "cs_test_unit",
          url: "https://checkout.stripe.com/c/pay/cs_test_unit",
          payment_intent: "pi_test_unit",
          customer: null,
        }),
      },
    },
    webhooks: {
      constructEvent: jest.fn((payload: Buffer) => {
        const e = JSON.parse(payload.toString()) as {
          id?: string;
          type?: string;
          data?: { object?: unknown };
        };
        return {
          id: e.id ?? "evt_unit",
          type: e.type ?? "checkout.session.completed",
          livemode: false,
          data: e.data ?? { object: {} },
        };
      }),
    },
  }));
});

describe("StripePaymentService", () => {
  let service: StripePaymentService;
  let prisma: PrismaService;

  beforeAll(async () => {
    process.env.STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || "sk_test_unit";
    process.env.STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || "whsec_unit";

    const mod = await Test.createTestingModule({
      providers: [
        StripePaymentService,
        PrismaService,
        { provide: PaymentReliabilityService, useValue: mockPaymentReliability },
      ],
    }).compile();

    service = mod.get(StripePaymentService);
    prisma = mod.get(PrismaService);
  });

  it("processBookingStripeWebhookIngress returns duplicate when receipt already exists", async () => {
    const payload = Buffer.from(
      JSON.stringify({
        id: "evt_dup_test",
        type: "checkout.session.completed",
        data: {
          object: {
            id: "cs_x",
            payment_status: "paid",
            metadata: { bookingId: "b1" },
          },
        },
      }),
    );

    await prisma.stripeWebhookReceipt.deleteMany({
      where: { stripeEventId: "evt_dup_test" },
    });

    const first = await service.processBookingStripeWebhookIngress(payload, "sig");
    expect(first.ok).toBe(true);
    if (first.ok) {
      expect(first.duplicate).toBe(false);
    }

    const second = await service.processBookingStripeWebhookIngress(payload, "sig");
    expect(second.ok).toBe(true);
    if (second.ok) {
      expect(second.duplicate).toBe(true);
    }

    await prisma.stripeWebhookReceipt.deleteMany({
      where: { stripeEventId: "evt_dup_test" },
    });
  });

  it("applyBookingStripeEvent maps checkout.session.completed paid to paid", async () => {
    const customer = await prisma.user.create({
      data: {
        email: `stripe_unit_${Date.now()}@servelink.local`,
        passwordHash: "x",
        role: "customer",
      },
    });

    const booking = await prisma.booking.create({
      data: {
        customerId: customer.id,
        hourlyRateCents: 1000,
        estimatedHours: 1,
        currency: "usd",
        status: "pending_payment",
        paymentStatus: BookingPaymentStatus.checkout_created,
        stripeCheckoutSessionId: "cs_map_test",
      },
    });

    await service.applyBookingStripeEvent({
      id: "evt_map_1",
      type: "checkout.session.completed",
      livemode: false,
      data: {
        object: {
          id: "cs_map_test",
          payment_status: "paid",
          metadata: { bookingId: booking.id },
          amount_total: 5000,
          currency: "usd",
        },
      },
    } as any);

    const row = await prisma.booking.findUnique({ where: { id: booking.id } });
    expect(row?.paymentStatus).toBe(BookingPaymentStatus.paid);

    await prisma.booking.delete({ where: { id: booking.id } });
    await prisma.user.delete({ where: { id: customer.id } });
  });
});
