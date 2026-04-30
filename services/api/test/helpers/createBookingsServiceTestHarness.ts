import type { PrismaService } from "../../src/prisma";
import type { BookingEventsService } from "../../src/modules/bookings/booking-events.service";
import type { FoService } from "../../src/modules/fo/fo.service";
import type { EstimatorService } from "../../src/modules/estimate/estimator.service";
import { EstimateEngineV2Service } from "../../src/modules/estimate/estimate-engine-v2.service";
import type { LedgerService } from "../../src/modules/ledger/ledger.service";
import type { DispatchService } from "../../src/modules/dispatch/dispatch.service";
import type { ReputationService } from "../../src/modules/dispatch/reputation.service";
import type { BookingPaymentService } from "../../src/modules/bookings/payment/payment.service";
import type { RemainingBalanceCaptureService } from "../../src/modules/bookings/payment-lifecycle/remaining-balance-capture.service";
import type { BookingCancellationPaymentInvariantService } from "../../src/modules/bookings/payment-lifecycle/booking-cancellation-payment-invariant.service";
import { BookingsService } from "../../src/modules/bookings/bookings.service";

export type BookingsServiceTestHarnessMocks = {
  db: PrismaService;
  events: BookingEventsService;
  fo: FoService;
  estimator: EstimatorService;
  estimateEngineV2: EstimateEngineV2Service;
  ledger: LedgerService;
  dispatch: DispatchService;
  reputationService: ReputationService;
  bookingPaymentService: BookingPaymentService;
  remainingBalanceCapture: RemainingBalanceCaptureService;
  cancellationPaymentInvariant: BookingCancellationPaymentInvariantService;
};

/**
 * Construct {@link BookingsService} with the current constructor arity and explicit mocks.
 * Prefer this over duplicating dependency lists across booking unit tests.
 */
export function createBookingsServiceTestHarness(
  overrides: Partial<BookingsServiceTestHarnessMocks> = {},
): { service: BookingsService; mocks: BookingsServiceTestHarnessMocks } {
  const mocks: BookingsServiceTestHarnessMocks = {
    db: {} as PrismaService,
    events: {} as BookingEventsService,
    fo: {} as FoService,
    estimator: {} as EstimatorService,
    estimateEngineV2: new EstimateEngineV2Service(),
    ledger: {} as LedgerService,
    dispatch: {} as DispatchService,
    reputationService: {} as ReputationService,
    bookingPaymentService: {} as BookingPaymentService,
    remainingBalanceCapture: {} as RemainingBalanceCaptureService,
    cancellationPaymentInvariant:
      {} as BookingCancellationPaymentInvariantService,
    ...overrides,
  };

  const service = new BookingsService(
    mocks.db,
    mocks.events,
    mocks.fo,
    mocks.estimator,
    mocks.estimateEngineV2,
    mocks.ledger,
    mocks.dispatch,
    mocks.reputationService,
    mocks.bookingPaymentService,
    mocks.remainingBalanceCapture,
    mocks.cancellationPaymentInvariant,
  );

  return { service, mocks };
}
