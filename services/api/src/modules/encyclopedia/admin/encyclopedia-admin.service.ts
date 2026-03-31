import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";

type IntakeResult = {
  inserted: number;
  skipped: number;
};

@Injectable()
export class EncyclopediaAdminService {
  private readonly logger = new Logger("EncyclopediaAdminService");

  constructor(private prisma: PrismaService) {}

  async intakeGeneratedRecords(records: any[]): Promise<IntakeResult> {
    let inserted = 0;
    let skipped = 0;

    for (const record of records) {
      try {
        const normalized = this.normalizeRecord(record);

        if (!normalized) {
          skipped++;
          continue;
        }

        await this.upsertReviewRecord(normalized);

        inserted++;
      } catch (err: any) {
        this.logger.error(
          `RECORD FAILED: ${record?.slug}`,
          err?.stack || err,
        );
        skipped++;
      }
    }

    return { inserted, skipped };
  }

  /**
   * HARD MERGE NORMALIZATION LAYER
   */
  private normalizeRecord(record: any) {
    if (!record) return null;

    const {
      slug,
      title,
      surface,
      problem,
      intent,
      sections,
      internalLinks,
    } = record;

    if (!slug || !title || !sections) {
      return null;
    }

    // 🔴 CRITICAL: normalize section.content
    const normalizedSections = (sections || []).map((s: any) => ({
      key: s.key,
      content: (s.content || "").trim(),
    }));

    return {
      slug,
      title,
      surface:
        typeof surface === "string"
          ? surface.toLowerCase().trim().replace(/\s+/g, " ")
          : String(surface ?? "").toLowerCase().trim().replace(/\s+/g, " "),
      problem:
        typeof problem === "string"
          ? problem.toLowerCase().trim().replace(/\s+/g, " ")
          : String(problem ?? "").toLowerCase().trim().replace(/\s+/g, " "),
      intent,
      sections: normalizedSections,
      internalLinks: internalLinks || [],
    };
  }

  /**
   * SAFE UPSERT — NO HARD FAILS
   */
  private async upsertReviewRecord(data: any) {
    const existing = await this.prisma.encyclopediaReviewRecord.findUnique({
      where: { slug: data.slug },
    });

    const payload = {
      slug: data.slug,
      title: data.title,
      surface: data.surface,
      problem: data.problem,
      intent: data.intent,
      sections: data.sections,
      internalLinks: data.internalLinks,
      status: "pending",
    };

    if (existing) {
      return this.prisma.encyclopediaReviewRecord.update({
        where: { slug: data.slug },
        data: payload,
      });
    }

    return this.prisma.encyclopediaReviewRecord.create({
      data: payload,
    });
  }
}
