import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma";

export type FoProviderLinkRecord = {
  foId: string;
  foUserId: string;
  foStatus: string;
  foDisplayName: string | null;
  providerId: string | null;
  providerUserId: string | null;
  providerType: string | null;
  providerStatus: string | null;
  isLinked: boolean;
  isConsistent: boolean;
  issueCode:
    | null
    | "FO_NOT_FOUND"
    | "PROVIDER_ID_MISSING"
    | "PROVIDER_NOT_FOUND"
    | "USER_ID_MISMATCH";
};

export type FoProviderLinkSummary = {
  total: number;
  linked: number;
  missingProviderId: number;
  providerMissing: number;
  userMismatch: number;
  healthy: boolean;
};

@Injectable()
export class ProviderResolverService {
  constructor(private readonly db: PrismaService) {}

  async resolveFoProviderLink(foId: string): Promise<FoProviderLinkRecord> {
    const fo = await this.db.franchiseOwner.findUnique({
      where: { id: foId },
      include: { provider: true },
    });

    if (!fo) {
      throw new NotFoundException("FO_NOT_FOUND");
    }

    if (!fo.providerId) {
      return {
        foId: fo.id,
        foUserId: fo.userId,
        foStatus: String(fo.status),
        foDisplayName: fo.displayName ?? null,
        providerId: null,
        providerUserId: null,
        providerType: null,
        providerStatus: null,
        isLinked: false,
        isConsistent: false,
        issueCode: "PROVIDER_ID_MISSING",
      };
    }

    if (!fo.provider) {
      return {
        foId: fo.id,
        foUserId: fo.userId,
        foStatus: String(fo.status),
        foDisplayName: fo.displayName ?? null,
        providerId: fo.providerId,
        providerUserId: null,
        providerType: null,
        providerStatus: null,
        isLinked: false,
        isConsistent: false,
        issueCode: "PROVIDER_NOT_FOUND",
      };
    }

    const sameUser = fo.userId === fo.provider.userId;

    return {
      foId: fo.id,
      foUserId: fo.userId,
      foStatus: String(fo.status),
      foDisplayName: fo.displayName ?? null,
      providerId: fo.provider.id,
      providerUserId: fo.provider.userId,
      providerType: String(fo.provider.type),
      providerStatus: String(fo.provider.status),
      isLinked: true,
      isConsistent: sameUser,
      issueCode: sameUser ? null : "USER_ID_MISMATCH",
    };
  }

  async listFoProviderLinks(params?: {
    limit?: number;
    onlyIssues?: boolean;
  }): Promise<{
    rows: FoProviderLinkRecord[];
    summary: FoProviderLinkSummary;
  }> {
    const limit =
      typeof params?.limit === "number" &&
      Number.isFinite(params.limit) &&
      params.limit > 0
        ? Math.floor(params.limit)
        : 100;

    const fos = await this.db.franchiseOwner.findMany({
      orderBy: { createdAt: "asc" },
      take: limit,
      include: { provider: true },
    });

    const rows: FoProviderLinkRecord[] = fos.map((fo) => {
      if (!fo.providerId) {
        return {
          foId: fo.id,
          foUserId: fo.userId,
          foStatus: String(fo.status),
          foDisplayName: fo.displayName ?? null,
          providerId: null,
          providerUserId: null,
          providerType: null,
          providerStatus: null,
          isLinked: false,
          isConsistent: false,
          issueCode: "PROVIDER_ID_MISSING",
        };
      }

      if (!fo.provider) {
        return {
          foId: fo.id,
          foUserId: fo.userId,
          foStatus: String(fo.status),
          foDisplayName: fo.displayName ?? null,
          providerId: fo.providerId,
          providerUserId: null,
          providerType: null,
          providerStatus: null,
          isLinked: false,
          isConsistent: false,
          issueCode: "PROVIDER_NOT_FOUND",
        };
      }

      const sameUser = fo.userId === fo.provider.userId;

      return {
        foId: fo.id,
        foUserId: fo.userId,
        foStatus: String(fo.status),
        foDisplayName: fo.displayName ?? null,
        providerId: fo.provider.id,
        providerUserId: fo.provider.userId,
        providerType: String(fo.provider.type),
        providerStatus: String(fo.provider.status),
        isLinked: true,
        isConsistent: sameUser,
        issueCode: sameUser ? null : "USER_ID_MISMATCH",
      };
    });

    const filtered = params?.onlyIssues ? rows.filter((r) => r.issueCode !== null) : rows;

    const summary: FoProviderLinkSummary = {
      total: rows.length,
      linked: rows.filter((r) => r.isLinked).length,
      missingProviderId: rows.filter((r) => r.issueCode === "PROVIDER_ID_MISSING").length,
      providerMissing: rows.filter((r) => r.issueCode === "PROVIDER_NOT_FOUND").length,
      userMismatch: rows.filter((r) => r.issueCode === "USER_ID_MISMATCH").length,
      healthy:
        rows.every((r) => r.issueCode === null),
    };

    return {
      rows: filtered,
      summary,
    };
  }

  async getFoProviderIntegritySummary(): Promise<FoProviderLinkSummary> {
    const total = await this.db.franchiseOwner.count({
      where: {},
    });

    const missingProviderId = await this.db.franchiseOwner.count({
      where: { providerId: null },
    });

    const linkedRows = await this.db.franchiseOwner.findMany({
      where: { providerId: { not: null } },
      select: {
        userId: true,
        providerId: true,
        provider: {
          select: {
            userId: true,
          },
        },
      },
    });

    let providerMissing = 0;
    let userMismatch = 0;

    for (const row of linkedRows) {
      if (!row.provider) {
        providerMissing += 1;
        continue;
      }
      if (row.provider.userId !== row.userId) {
        userMismatch += 1;
      }
    }

    const linked = total - missingProviderId - providerMissing;

    return {
      total,
      linked,
      missingProviderId,
      providerMissing,
      userMismatch,
      healthy:
        missingProviderId === 0 &&
        providerMissing === 0 &&
        userMismatch === 0,
    };
  }
}
