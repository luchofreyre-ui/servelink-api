import { BookingPaymentStatus, PrismaClient } from "@prisma/client";

/**
 * Sets payment so lifecycle transitions that require revenue-backed confirmation
 * (e.g. schedule pending_payment → pending_dispatch) can succeed. Used by E2E
 * helpers and dev Playwright scenario seeding — not a production payment bypass.
 */
export async function seedBookingPaymentAuthorized(
  prisma: PrismaClient,
  bookingId: string,
): Promise<void> {
  await prisma.booking.update({
    where: { id: bookingId },
    data: {
      paymentStatus: BookingPaymentStatus.authorized,
      paymentAuthorizedAt: new Date(),
    },
  });
}
