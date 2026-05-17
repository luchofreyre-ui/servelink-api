import { OperationalNotificationEligibilityService } from "../src/modules/delivery/operational-notification-eligibility.service";
import { OperationalNotificationTemplateRegistry } from "../src/modules/delivery/operational-notification-template.registry";
import { OPERATIONAL_NOTIFICATION_CATEGORY } from "../src/modules/delivery/delivery.contract";

describe("OperationalNotificationEligibilityService", () => {
  const svc = new OperationalNotificationEligibilityService();

  it("selects payment_attention when payment lane + attention status", () => {
    const plan = svc.resolvePlan(
      {
        eventType: "PAYMENT_STATUS_UPDATE",
        lifecycleCategory: "payment",
        operationalEventCategory: "payment",
        metadataJson: {},
      },
      { bookingId: "b1", occurredAt: "t", paymentStatus: "unpaid" },
    );
    expect(plan?.templateKey).toBe("ops_payment_attention_v1");
    expect(plan?.category).toBe(
      OPERATIONAL_NOTIFICATION_CATEGORY.PAYMENT_ATTENTION,
    );
  });

  it("returns null for generic patch without signals", () => {
    const plan = svc.resolvePlan(
      {
        eventType: "BOOKING_PATCH",
        lifecycleCategory: "patch",
        operationalEventCategory: "lifecycle",
        metadataJson: {},
      },
      { bookingId: "b1", occurredAt: "t" },
    );
    expect(plan).toBeNull();
  });

  it("maps lifecycle_segment rows to lifecycle clarification template", () => {
    const plan = svc.resolvePlan(
      {
        eventType: "SEGMENT_SCHEDULE",
        lifecycleCategory: "lifecycle_segment",
        operationalEventCategory: "lifecycle",
        metadataJson: {},
      },
      { bookingId: "b1", occurredAt: "t", paymentStatus: "paid" },
    );
    expect(plan?.templateKey).toBe("ops_booking_lifecycle_signal_v1");
  });
});

describe("OperationalNotificationTemplateRegistry", () => {
  const reg = new OperationalNotificationTemplateRegistry();

  it("renders deterministic payment_attention subject including booking id", () => {
    const rendered = reg.render(
      {
        category: OPERATIONAL_NOTIFICATION_CATEGORY.PAYMENT_ATTENTION,
        templateKey: "ops_payment_attention_v1",
        templateVersion: 1,
      },
      {
        bookingId: "bk_test",
        correlationId: "corr",
        eventType: "PAYMENT_STATUS_UPDATE",
        bookingStatus: "held",
        paymentStatus: "unpaid",
        occurredAt: "2026-05-09T12:00:00.000Z",
        lifecycleCategory: "payment",
      },
    );
    expect(rendered.subject).toContain("bk_test");
    expect(rendered.textBody).toContain("corr");
    expect(rendered.textBody).not.toMatch(/promo|sale|discount/i);
  });
});
