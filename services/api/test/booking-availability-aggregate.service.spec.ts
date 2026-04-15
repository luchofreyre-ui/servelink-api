import { BookingAvailabilityAggregateService } from "../src/modules/bookings/booking-availability-aggregate.service";
import type { DispatchCandidateService } from "../src/modules/dispatch/dispatch-candidate.service";
import type { RosterAvailabilityService } from "../src/modules/dispatch/roster-availability.service";
import { PrismaService } from "../src/prisma";
import type { SlotAvailabilityService } from "../src/modules/slot-holds/slot-availability.service";

function makePrismaMock(eligiblePreferredIds: Set<string>) {
  return {
    franchiseOwner: {
      findFirst: jest.fn(async ({ where }: { where: { id: string } }) => {
        const id = where?.id;
        if (typeof id !== "string" || !id.trim()) return null;
        return eligiblePreferredIds.has(id) ? { id } : null;
      }),
    },
  } as unknown as PrismaService;
}

function makeService(args: {
  roster: Awaited<ReturnType<RosterAvailabilityService["getAvailableCleanersForBookingIntent"]>>;
  dispatchCandidates?: Awaited<ReturnType<DispatchCandidateService["getCandidates"]>>;
  windowsByFo: Record<
    string,
    Array<{ startAt: Date; endAt: Date } | { startAt: string; endAt: string }>
  >;
  /** FO ids `resolveEligiblePreferredFoId` should treat as real DB-backed preferred rows. */
  eligiblePreferredFoIds?: Set<string>;
}) {
  const slot = {
    listAvailableWindows: jest.fn(async (q: { foId: string }) => {
      return args.windowsByFo[q.foId] ?? [];
    }),
  } as unknown as SlotAvailabilityService;

  const roster = {
    getAvailableCleanersForBookingIntent: jest.fn(async () => args.roster),
  } as unknown as RosterAvailabilityService;

  const dispatchCandidates = {
    getCandidates: jest.fn(async () => args.dispatchCandidates ?? []),
  } as unknown as DispatchCandidateService;

  const prisma = makePrismaMock(args.eligiblePreferredFoIds ?? new Set());

  return new BookingAvailabilityAggregateService(slot, roster, dispatchCandidates, prisma);
}

describe("BookingAvailabilityAggregateService", () => {
  const rangeStart = new Date("2026-05-01T00:00:00.000Z");
  const rangeEnd = new Date("2026-05-15T00:00:00.000Z");
  const sameSlot = { startAt: new Date("2026-05-05T14:00:00.000Z"), endAt: new Date("2026-05-05T17:00:00.000Z") };

  it("sorts preferred_provider windows before candidate_provider at same instant", async () => {
    const preferred = "aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa";
    const other = "bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb";
    const svc = makeService({
      roster: [
        { cleanerId: preferred, cleanerLabel: "P", providerId: null, isActive: true, supportsRecurring: true },
        { cleanerId: other, cleanerLabel: "O", providerId: null, isActive: true, supportsRecurring: true },
      ],
      windowsByFo: {
        [preferred]: [sameSlot],
        [other]: [sameSlot],
      },
      eligiblePreferredFoIds: new Set([preferred]),
    });

    const res = await svc.aggregateWindows({
      rangeStart: rangeStart.toISOString(),
      rangeEnd: rangeEnd.toISOString(),
      durationMinutes: 180,
      preferredFoId: preferred,
    } as never);

    expect(res.windows).toHaveLength(2);
    expect(res.windows[0].source).toBe("preferred_provider");
    expect(res.windows[0].foId).toBe(preferred);
    expect(res.windows[1].source).toBe("candidate_provider");
    expect(res.windows[1].foId).toBe(other);
  });

  it("accepts cuid-shaped preferredFoId when it resolves as an eligible franchise owner", async () => {
    const preferred = "clxy123preferredfo0001abcdefghij";
    const other = "clxy123otherfo0001abcdefghijklmn";
    const svc = makeService({
      roster: [
        { cleanerId: preferred, cleanerLabel: "P", providerId: null, isActive: true, supportsRecurring: true },
        { cleanerId: other, cleanerLabel: "O", providerId: null, isActive: true, supportsRecurring: true },
      ],
      windowsByFo: {
        [preferred]: [sameSlot],
        [other]: [sameSlot],
      },
      eligiblePreferredFoIds: new Set([preferred]),
    });

    const res = await svc.aggregateWindows({
      rangeStart: rangeStart.toISOString(),
      rangeEnd: rangeEnd.toISOString(),
      durationMinutes: 180,
      preferredFoId: preferred,
    } as never);

    expect(res.windows).toHaveLength(2);
    expect(res.windows[0].source).toBe("preferred_provider");
    expect(res.windows[0].foId).toBe(preferred);
  });

  it("ignores unknown preferredFoId and returns only candidate_provider windows", async () => {
    const a = "11111111-1111-4111-8111-111111111111";
    const b = "22222222-2222-4222-8222-222222222222";
    const svc = makeService({
      roster: [
        { cleanerId: a, cleanerLabel: "A", providerId: null, isActive: true, supportsRecurring: true },
        { cleanerId: b, cleanerLabel: "B", providerId: null, isActive: true, supportsRecurring: true },
      ],
      windowsByFo: {
        [a]: [sameSlot],
        [b]: [sameSlot],
      },
      eligiblePreferredFoIds: new Set(),
    });

    const res = await svc.aggregateWindows({
      rangeStart: rangeStart.toISOString(),
      rangeEnd: rangeEnd.toISOString(),
      durationMinutes: 180,
      preferredFoId: "cmkdoesnotexistpreferredfo0001ab",
    } as never);

    expect(res.windows).toHaveLength(2);
    expect(res.windows.every((w) => w.source === "candidate_provider")).toBe(true);
  });

  it("keeps duplicate start/end across FOs as separate rows (distinct foId)", async () => {
    const a = "11111111-1111-4111-8111-111111111111";
    const b = "22222222-2222-4222-8222-222222222222";
    const svc = makeService({
      roster: [
        { cleanerId: a, cleanerLabel: "A", providerId: null, isActive: true, supportsRecurring: true },
        { cleanerId: b, cleanerLabel: "B", providerId: null, isActive: true, supportsRecurring: true },
      ],
      windowsByFo: {
        [a]: [sameSlot],
        [b]: [sameSlot],
      },
    });

    const res = await svc.aggregateWindows({
      rangeStart: rangeStart.toISOString(),
      rangeEnd: rangeEnd.toISOString(),
      durationMinutes: 180,
    } as never);

    expect(res.windows).toHaveLength(2);
    expect(new Set(res.windows.map((w) => w.foId)).size).toBe(2);
  });

  it("computeResponseMode is preferred_provider_only when only preferred FO is a candidate", () => {
    const svc = makeService({ roster: [], windowsByFo: {} });
    const preferred = "aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa";
    expect(
      svc.computeResponseMode(preferred, [
        {
          foId: preferred,
          cleanerId: preferred,
          cleanerLabel: "X",
        },
      ]),
    ).toBe("preferred_provider_only");
  });

  it("resolveAvailabilityProviderCandidates orders preferred FO first on roster path", async () => {
    const svc = makeService({
      roster: [
        {
          cleanerId: "z-fo-uuid-aaaa-4aaa-aaaa-aaaaaaaaaaa0",
          cleanerLabel: "Z",
          providerId: null,
          isActive: true,
          supportsRecurring: true,
        },
        {
          cleanerId: "a-fo-uuid-aaaa-4aaa-aaaa-aaaaaaaaaaa1",
          cleanerLabel: "A",
          providerId: null,
          isActive: true,
          supportsRecurring: true,
        },
      ],
      windowsByFo: {},
    });
    const preferred = "z-fo-uuid-aaaa-4aaa-aaaa-aaaaaaaaaaa0";
    const c = await svc.resolveAvailabilityProviderCandidates({
      preferredFoId: preferred,
      maxProviders: 10,
    });
    expect(c[0].foId).toBe(preferred);
    expect(c.map((x) => x.foId)).toEqual([preferred, "a-fo-uuid-aaaa-4aaa-aaaa-aaaaaaaaaaa1"]);
  });
});
