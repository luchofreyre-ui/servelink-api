import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma";
import { AUTHORITY_SNAPSHOT } from "./authority.snapshot";
import { parseAuthorityStringArrayJson } from "./booking-authority-json.util";

const surfaceSet = new Set(AUTHORITY_SNAPSHOT.surfaces);
const problemSet = new Set(AUTHORITY_SNAPSHOT.problems);
const methodSet = new Set(AUTHORITY_SNAPSHOT.methods);

export type AuthorityUnmappedTagRow = {
  axis: "surface" | "problem" | "method";
  tag: string;
  /** Distinct bookings in the scanned sample carrying this tag off-snapshot. */
  bookingCount: number;
};

export type BookingAuthorityUnmappedTagsPayload = {
  kind: "booking_authority_unmapped_tags";
  generatedAt: string;
  windowUsed: { fromIso: string; toIso: string } | null;
  /** Authority rows examined (newest first), capped by `maxRowsScan`. */
  rowsScanned: number;
  /** Requested scan cap (same as query `maxRowsScan` default). */
  maxRowsScan: number;
  items: AuthorityUnmappedTagRow[];
};

@Injectable()
export class BookingAuthorityUnmappedTagsService {
  constructor(private readonly db: PrismaService) {}

  async buildUnmappedTagsSummary(options: {
    updatedAtGte?: Date;
    toIso: Date;
    maxRowsScan: number;
  }): Promise<BookingAuthorityUnmappedTagsPayload> {
    const resultWhere =
      options.updatedAtGte != null
        ? { updatedAt: { gte: options.updatedAtGte } }
        : {};

    const rows = await this.db.bookingAuthorityResult.findMany({
      where: resultWhere,
      orderBy: { updatedAt: "desc" },
      take: options.maxRowsScan,
      select: {
        bookingId: true,
        surfacesJson: true,
        problemsJson: true,
        methodsJson: true,
      },
    });

    const perKeyBookings = new Map<string, Set<string>>();

    const bump = (axis: AuthorityUnmappedTagRow["axis"], tag: string, bookingId: string) => {
      if (!tag.trim()) return;
      const key = `${axis}:${tag}`;
      let set = perKeyBookings.get(key);
      if (!set) {
        set = new Set<string>();
        perKeyBookings.set(key, set);
      }
      set.add(bookingId);
    };

    for (const row of rows) {
      for (const tag of parseAuthorityStringArrayJson(row.surfacesJson)) {
        if (!surfaceSet.has(tag)) bump("surface", tag, row.bookingId);
      }
      for (const tag of parseAuthorityStringArrayJson(row.problemsJson)) {
        if (!problemSet.has(tag)) bump("problem", tag, row.bookingId);
      }
      for (const tag of parseAuthorityStringArrayJson(row.methodsJson)) {
        if (!methodSet.has(tag)) bump("method", tag, row.bookingId);
      }
    }

    const items: AuthorityUnmappedTagRow[] = [...perKeyBookings.entries()]
      .map(([key, set]) => {
        const sep = key.indexOf(":");
        const axis = (sep === -1 ? key : key.slice(0, sep)) as AuthorityUnmappedTagRow["axis"];
        const tag = sep === -1 ? "" : key.slice(sep + 1);
        return {
          axis,
          tag,
          bookingCount: set.size,
        };
      })
      .sort((a, b) => {
        if (b.bookingCount !== a.bookingCount) return b.bookingCount - a.bookingCount;
        if (a.axis !== b.axis) return a.axis.localeCompare(b.axis);
        return a.tag.localeCompare(b.tag);
      });

    const windowUsed =
      options.updatedAtGte != null
        ? {
            fromIso: options.updatedAtGte.toISOString(),
            toIso: options.toIso.toISOString(),
          }
        : null;

    return {
      kind: "booking_authority_unmapped_tags",
      generatedAt: new Date().toISOString(),
      windowUsed,
      rowsScanned: rows.length,
      maxRowsScan: options.maxRowsScan,
      items,
    };
  }
}
