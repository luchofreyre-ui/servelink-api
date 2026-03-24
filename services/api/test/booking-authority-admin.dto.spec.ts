import { BookingAuthorityReviewStatus } from "@prisma/client";
import type { BookingAuthorityResult } from "@prisma/client";
import {
  toBookingAuthorityListItem,
  toBookingAuthorityResultAdminResponse,
} from "../src/modules/authority/dto/booking-authority-admin.dto";

describe("booking-authority-admin.dto", () => {
  const createdAt = new Date("2026-01-10T10:00:00.000Z");
  const updatedAt = new Date("2026-01-11T15:30:00.000Z");
  const reviewedAt = new Date("2026-01-11T12:00:00.000Z");

  function baseRow(
    overrides: Partial<BookingAuthorityResult> = {},
  ): BookingAuthorityResult {
    return {
      id: "auth_row_1",
      bookingId: "bk_1",
      surfacesJson: JSON.stringify(["tile"]),
      problemsJson: JSON.stringify(["grease-buildup"]),
      methodsJson: JSON.stringify(["degreasing"]),
      reasonsJson: JSON.stringify([]),
      overrideReasonsJson: null,
      resolutionVersion: 2,
      status: BookingAuthorityReviewStatus.reviewed,
      reviewedByUserId: "admin_u1",
      reviewedAt,
      createdAt,
      updatedAt,
      ...overrides,
    } as BookingAuthorityResult;
  }

  it("toBookingAuthorityResultAdminResponse exposes audit timestamps and review fields", () => {
    const dto = toBookingAuthorityResultAdminResponse(baseRow());
    expect(dto.id).toBe("auth_row_1");
    expect(dto.bookingId).toBe("bk_1");
    expect(dto.status).toBe(BookingAuthorityReviewStatus.reviewed);
    expect(dto.reviewedByUserId).toBe("admin_u1");
    expect(dto.reviewedAt).toBe(reviewedAt.toISOString());
    expect(dto.createdAt).toBe(createdAt.toISOString());
    expect(dto.updatedAt).toBe(updatedAt.toISOString());
  });

  it("toBookingAuthorityListItem exposes createdAt and updatedAt", () => {
    const item = toBookingAuthorityListItem(baseRow());
    expect(item.bookingId).toBe("bk_1");
    expect(item.status).toBe(BookingAuthorityReviewStatus.reviewed);
    expect(item.reviewedByUserId).toBe("admin_u1");
    expect(item.reviewedAt).toBe(reviewedAt.toISOString());
    expect(item.createdAt).toBe(createdAt.toISOString());
    expect(item.updatedAt).toBe(updatedAt.toISOString());
  });

  it("serializes null reviewedAt and reviewedByUserId", () => {
    const item = toBookingAuthorityListItem(
      baseRow({
        reviewedAt: null,
        reviewedByUserId: null,
        status: BookingAuthorityReviewStatus.auto,
      }),
    );
    expect(item.reviewedAt).toBeNull();
    expect(item.reviewedByUserId).toBeNull();
    expect(item.createdAt).toBeTruthy();
    expect(item.updatedAt).toBeTruthy();
  });
});
