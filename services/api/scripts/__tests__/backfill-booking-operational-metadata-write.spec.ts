import type { PrismaClient } from "@prisma/client";
import { Prisma } from "@prisma/client";

import {
  buildPersistableOperationalMetadataPayloadFromBookingNotes,
  buildSafeOperationalMetadataBackfillReport,
  classifyBookingForOperationalMetadataBackfill,
  runOperationalMetadataBackfillJob,
  WRITE_BACKFILL_FAILURE_CODES,
  type OperationalMetadataBackfillCliOptions,
} from "../backfill-booking-operational-metadata-dry-run.lib";

const bridgeBase =
  "Booking direction intake in_x | serviceId=s | frequency=w | preferredTime=m";

function baseCliOptions(over: Partial<OperationalMetadataBackfillCliOptions> = {}): OperationalMetadataBackfillCliOptions {
  return {
    limit: null,
    batchSize: 100,
    cursor: null,
    includeSamples: false,
    sampleLimit: 10,
    write: false,
    executedBy: "unspecified",
    ...over,
  };
}

function prismaStub(args: {
  bookingPages: Array<Array<{ id: string; notes: string | null; createdAt: Date }>>;
  metaByBookingId: Set<string>;
  txCreateImpl?: jest.Mock;
}) {
  let page = 0;
  const bookingFindMany = jest.fn(async () => {
    const chunk = args.bookingPages[page] ?? [];
    page++;
    return chunk;
  });
  const metaFindMany = jest.fn(async ({ where }: { where: { bookingId: { in: string[] } } }) => {
    const ids = where.bookingId.in;
    return ids.filter((id) => args.metaByBookingId.has(id)).map((bookingId) => ({ bookingId }));
  });
  const txCreate =
    args.txCreateImpl ?? jest.fn(async () => ({}));
  const transaction = jest.fn(async (fn: (tx: unknown) => Promise<unknown>) =>
    fn({
      bookingOperationalMetadata: {
        create: txCreate,
      },
    }),
  );
  return {
    prisma: {
      booking: { findMany: bookingFindMany },
      bookingOperationalMetadata: { findMany: metaFindMany },
      $transaction: transaction,
    } as unknown as PrismaClient,
    bookingFindMany,
    metaFindMany,
    transaction,
    txCreate,
  };
}

describe("runOperationalMetadataBackfillJob (write mode)", () => {
  const createdAt = new Date("2024-01-01T00:00:00.000Z");

  it("dry-run performs no writes", async () => {
    const notes = `${bridgeBase} | customerPrep=Side gate`;
    const { prisma, transaction } = prismaStub({
      bookingPages: [[{ id: "b-only", notes, createdAt }]],
      metaByBookingId: new Set(),
    });
    await runOperationalMetadataBackfillJob(prisma, baseCliOptions({ write: false }));
    expect(transaction).not.toHaveBeenCalled();
  });

  it("inserts only B_would_create_from_notes rows", async () => {
    const bNotes = `${bridgeBase} | customerPrep=Side gate`;
    const dNotes = `${bridgeBase} | customerPrep=A | customerPrep=B`;
    const { prisma, txCreate } = prismaStub({
      bookingPages: [
        [
          { id: "bid-b", notes: bNotes, createdAt },
          { id: "bid-d", notes: dNotes, createdAt },
        ],
      ],
      metaByBookingId: new Set(),
    });
    const r = await runOperationalMetadataBackfillJob(
      prisma,
      baseCliOptions({
        write: true,
        limit: 10,
      }),
    );
    expect(r.mode).toBe("write");
    if (r.mode !== "write") throw new Error("expected write report");
    expect(txCreate).toHaveBeenCalledTimes(1);
    const createArg = txCreate.mock.calls[0][0] as { data: { bookingId: string } };
    expect(createArg.data.bookingId).toBe("bid-b");
    expect(r.created).toBe(1);
    expect(r.skippedByBucket.D_ambiguous_notes).toBe(1);
    expect(r.failed).toBe(0);
  });

  it("skips A_structured_present as alreadyExists without insert", async () => {
    const { prisma, txCreate } = prismaStub({
      bookingPages: [[{ id: "has-meta", notes: null, createdAt }]],
      metaByBookingId: new Set(["has-meta"]),
    });
    const r = await runOperationalMetadataBackfillJob(prisma, baseCliOptions({ write: true }));
    expect(r.mode).toBe("write");
    if (r.mode !== "write") throw new Error("expected write report");
    expect(txCreate).not.toHaveBeenCalled();
    expect(r.alreadyExists).toBe(1);
    expect(r.buckets.A_structured_present).toBe(1);
  });

  it("never inserts D_ambiguous_notes or G_invalid_or_empty_prep", async () => {
    const gNotes = `${bridgeBase} | customerPrep=`;
    const { prisma, txCreate } = prismaStub({
      bookingPages: [
        [
          { id: "g1", notes: gNotes, createdAt },
          { id: "d1", notes: `${bridgeBase} | customerPrep=x | customerPrep=y`, createdAt },
        ],
      ],
      metaByBookingId: new Set(),
    });
    const r = await runOperationalMetadataBackfillJob(prisma, baseCliOptions({ write: true }));
    expect(r.mode).toBe("write");
    if (r.mode !== "write") throw new Error("expected write report");
    expect(txCreate).not.toHaveBeenCalled();
    expect(r.skippedByBucket.D_ambiguous_notes).toBe(1);
    expect(r.skippedByBucket.G_invalid_or_empty_prep).toBe(1);
    expect(r.created).toBe(0);
  });

  it("maps unique violations to alreadyExists", async () => {
    const notes = `${bridgeBase} | customerPrep=Side gate`;
    const err = new Prisma.PrismaClientKnownRequestError("dup", {
      code: "P2002",
      clientVersion: "test",
    });
    const { prisma, txCreate } = prismaStub({
      bookingPages: [[{ id: "race", notes, createdAt }]],
      metaByBookingId: new Set(),
      txCreateImpl: jest.fn(async () => {
        throw err;
      }),
    });
    const r = await runOperationalMetadataBackfillJob(prisma, baseCliOptions({ write: true }));
    expect(r.mode).toBe("write");
    if (r.mode !== "write") throw new Error("expected write report");
    expect(txCreate).toHaveBeenCalled();
    expect(r.alreadyExists).toBe(1);
    expect(r.failed).toBe(0);
    expect(r.failures).toEqual([]);
  });

  it("reports failures as bookingId + safe code only", async () => {
    const notes = `${bridgeBase} | customerPrep=Side gate`;
    const err = new Prisma.PrismaClientKnownRequestError("boom", {
      code: "P2034",
      clientVersion: "test",
    });
    const { prisma, txCreate } = prismaStub({
      bookingPages: [[{ id: "bad", notes, createdAt }]],
      metaByBookingId: new Set(),
      txCreateImpl: jest.fn(async () => {
        throw err;
      }),
    });
    const r = await runOperationalMetadataBackfillJob(prisma, baseCliOptions({ write: true }));
    expect(r.mode).toBe("write");
    if (r.mode !== "write") throw new Error("expected write report");
    expect(r.failed).toBe(1);
    expect(r.failures).toEqual([{ bookingId: "bad", code: "P2034" }]);
    expect(txCreate).toHaveBeenCalled();
  });

  it("maps non-Prisma insert errors to INSERT_FAILED without leaking message", async () => {
    const notes = `${bridgeBase} | customerPrep=Side gate`;
    const stub = prismaStub({
      bookingPages: [[{ id: "x", notes, createdAt }]],
      metaByBookingId: new Set(),
      txCreateImpl: jest.fn(async () => {
        throw new Error("secret internal explosion details");
      }),
    });
    const report = await runOperationalMetadataBackfillJob(stub.prisma, baseCliOptions({ write: true }));
    expect(report.mode).toBe("write");
    if (report.mode !== "write") throw new Error("expected write report");
    expect(report.failures[0]?.code).toBe(WRITE_BACKFILL_FAILURE_CODES.INSERT_FAILED);
    const serialized = JSON.stringify(report);
    expect(serialized).not.toContain("secret internal explosion");
  });
});

describe("dry-run report backward compatibility", () => {
  const bridgeBaseLocal =
    "Booking direction intake in_x | serviceId=s | frequency=w | preferredTime=m";

  it("retains expected top-level keys with additive mode", () => {
    const rows = [
      classifyBookingForOperationalMetadataBackfill({
        id: "z",
        notes: `${bridgeBaseLocal} | customerPrep=k`,
        createdAt: "2024-01-01T00:00:00.000Z",
        hasOperationalMetadataRow: false,
      }),
    ];
    const report = buildSafeOperationalMetadataBackfillReport({
      classifications: rows,
      batchSize: 10,
      limit: null,
      cursorStart: null,
      includeSamples: false,
      sampleLimit: 3,
    });
    expect(report.mode).toBe("dry_run");
    expect(report).toEqual(
      expect.objectContaining({
        summary: expect.any(Object),
        buckets: expect.any(Object),
        nextCursor: expect.anything(),
      }),
    );
  });
});

describe("buildPersistableOperationalMetadataPayloadFromBookingNotes", () => {
  const bridge =
    "Booking direction intake in_x | serviceId=s | frequency=w | preferredTime=m";

  it("does not embed bridge transport literals in JSON shape beyond prep text", () => {
    const secret = "ULTRA_SECRET_PREP_MARKER";
    const payload = buildPersistableOperationalMetadataPayloadFromBookingNotes({
      notes: `${bridge} | customerPrep=${secret}`,
      bookingCreatedAt: new Date("2024-06-01T00:00:00.000Z"),
    });
    expect(payload?.customerTeamPrep?.freeText).toBe(secret);
    const asJson = JSON.stringify(payload);
    expect(asJson).not.toContain("customerPrep=");
    expect(asJson).not.toContain("Booking direction intake");
  });
});
