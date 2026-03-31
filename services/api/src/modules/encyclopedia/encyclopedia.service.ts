import { Injectable } from "@nestjs/common";
import type { CanonicalPageSnapshot } from "./canonical/canonicalTypes";
import { getAllReviewRecords } from "./review/reviewStore.server";
import type { ReviewRecord } from "./review/reviewPromotionTypes";

export type PublicEncyclopediaListItem = {
  slug: string;
  title: string;
  problem: string;
  surface: string;
  intent: string;
  riskLevel: "low" | "medium" | "high";
  promotedAt?: string;
};

export type PublicEncyclopediaDetail = {
  slug: string;
  title: string;
  canonicalSnapshot: CanonicalPageSnapshot;
  promotedAt?: string;
};

@Injectable()
export class EncyclopediaService {
  async getAllLivePages(): Promise<PublicEncyclopediaListItem[]> {
    const records = getAllReviewRecords().filter(
      (r) => r.publishStatus === "live",
    );
    return records
      .map((r) => this.toListItem(r))
      .sort((a, b) => a.slug.localeCompare(b.slug));
  }

  async getBySlug(slug: string): Promise<PublicEncyclopediaDetail | null> {
    const record = getAllReviewRecords().find(
      (r) => r.slug === slug && r.publishStatus === "live",
    );
    if (!record) {
      return null;
    }
    return this.toDetail(record);
  }

  private toListItem(r: ReviewRecord): PublicEncyclopediaListItem {
    const snap = r.canonicalSnapshot;
    return {
      slug: r.slug,
      title: r.title,
      problem: snap.problem,
      surface: snap.surface,
      intent: snap.intent,
      riskLevel: snap.riskLevel,
      promotedAt: r.promotedAt,
    };
  }

  private toDetail(r: ReviewRecord): PublicEncyclopediaDetail {
    return {
      slug: r.slug,
      title: r.title,
      canonicalSnapshot: r.canonicalSnapshot,
      promotedAt: r.promotedAt,
    };
  }
}
