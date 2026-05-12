import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../../prisma";

export const OPERATIONAL_PRESENCE_SURFACES = [
  "war_room",
  "command_center",
  "workspace",
  "replay_review",
  "graph_topology",
  "graph_explorer",
  "replay_timeline",
] as const;

export type OperationalPresenceSurface =
  (typeof OPERATIONAL_PRESENCE_SURFACES)[number];

const SURFACE_SET = new Set<string>(OPERATIONAL_PRESENCE_SURFACES);

/** Operators without a heartbeat within this window are omitted from snapshots. */
export const OPERATIONAL_PRESENCE_STALE_MS = 120_000;

const MAX_NODE_ID_LEN = 512;
const MAX_FRAME_ID_LEN = 512;
const MAX_ANNOTATION_BODY = 4000;

function trimOrNull(v: unknown): string | null {
  if (v === null || v === undefined) return null;
  if (typeof v !== "string") return null;
  const t = v.trim();
  return t ? t : null;
}

function coercePayloadJson(raw: unknown): Prisma.InputJsonValue {
  if (raw === null || raw === undefined) return {};
  if (typeof raw === "object" && !Array.isArray(raw)) {
    return raw as Prisma.InputJsonValue;
  }
  return {};
}

export type OperationalPresenceHeartbeatInput = {
  surface: string;
  workspaceId?: string | null;
  replayReviewSessionId?: string | null;
  graphSelectedNodeId?: string | null;
  replayChronologyFrameId?: string | null;
  warRoomActive?: boolean | null;
  payloadJson?: unknown;
};

@Injectable()
export class OperationalCommandPresenceService {
  constructor(private readonly prisma: PrismaService) {}

  async heartbeat(userId: string, input: OperationalPresenceHeartbeatInput) {
    if (!userId.trim()) throw new UnauthorizedException();
    const surface = trimOrNull(input.surface);
    if (!surface || !SURFACE_SET.has(surface)) {
      throw new BadRequestException("INVALID_PRESENCE_SURFACE");
    }

    const workspaceId = trimOrNull(input.workspaceId);
    const replayReviewSessionId = trimOrNull(input.replayReviewSessionId);
    let graphSelectedNodeId = trimOrNull(input.graphSelectedNodeId);
    if (graphSelectedNodeId && graphSelectedNodeId.length > MAX_NODE_ID_LEN) {
      throw new BadRequestException("GRAPH_NODE_ID_TOO_LONG");
    }
    let replayChronologyFrameId = trimOrNull(input.replayChronologyFrameId);
    if (
      replayChronologyFrameId &&
      replayChronologyFrameId.length > MAX_FRAME_ID_LEN
    ) {
      throw new BadRequestException("CHRONOLOGY_FRAME_ID_TOO_LONG");
    }

    const warRoomActive = Boolean(input.warRoomActive);
    const payloadJson = coercePayloadJson(input.payloadJson);

    const row = await this.prisma.operationalOperatorPresence.upsert({
      where: { userId },
      create: {
        userId,
        surface,
        workspaceId,
        replayReviewSessionId,
        graphSelectedNodeId,
        replayChronologyFrameId,
        warRoomActive,
        payloadJson,
      },
      update: {
        surface,
        workspaceId,
        replayReviewSessionId,
        graphSelectedNodeId,
        replayChronologyFrameId,
        warRoomActive,
        payloadJson,
      },
      include: {
        user: { select: { email: true } },
      },
    });

    return this.mapPresenceRow(row);
  }

  async snapshot(args: { workspaceId?: string | null }) {
    const since = new Date(Date.now() - OPERATIONAL_PRESENCE_STALE_MS);
    const ws = trimOrNull(args.workspaceId);

    const where: Prisma.OperationalOperatorPresenceWhereInput =
      ws ?
        {
          updatedAt: { gte: since },
          OR: [{ workspaceId: ws }, { warRoomActive: true }],
        }
      : { updatedAt: { gte: since } };

    const rows = await this.prisma.operationalOperatorPresence.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      take: 120,
      include: {
        user: { select: { email: true } },
      },
    });

    return {
      staleAfterMs: OPERATIONAL_PRESENCE_STALE_MS,
      operators: rows.map((r) => this.mapPresenceRow(r)),
    };
  }

  private mapPresenceRow(
    row: Prisma.OperationalOperatorPresenceGetPayload<{
      include: { user: { select: { email: true } } };
    }>,
  ) {
    return {
      userId: row.userId,
      email: row.user.email,
      surface: row.surface,
      workspaceId: row.workspaceId,
      replayReviewSessionId: row.replayReviewSessionId,
      graphSelectedNodeId: row.graphSelectedNodeId,
      replayChronologyFrameId: row.replayChronologyFrameId,
      warRoomActive: row.warRoomActive,
      payloadJson: row.payloadJson,
      updatedAtIso: row.updatedAt.toISOString(),
    };
  }

  async listGraphAnnotations(graphNodeId: string, take: number) {
    const id = trimOrNull(graphNodeId);
    if (!id || id.length > MAX_NODE_ID_LEN) {
      throw new BadRequestException("INVALID_GRAPH_NODE_ID");
    }
    const n = Number.isFinite(take) && take > 0 ? Math.min(take, 200) : 80;

    const rows =
      await this.prisma.operationalGraphCollaborationAnnotation.findMany({
        where: { graphNodeId: id },
        orderBy: { createdAt: "desc" },
        take: n,
        include: {
          author: { select: { email: true } },
        },
      });

    return rows.map((r) => ({
      id: r.id,
      graphEngineVersion: r.graphEngineVersion,
      aggregateWindow: r.aggregateWindow,
      graphNodeId: r.graphNodeId,
      authorUserId: r.authorUserId,
      authorEmail: r.author.email,
      body: r.body,
      createdAtIso: r.createdAt.toISOString(),
    }));
  }

  async createGraphAnnotation(userId: string, graphNodeId: string, bodyRaw: string) {
    if (!userId.trim()) throw new UnauthorizedException();
    const graphNode = trimOrNull(graphNodeId);
    if (!graphNode || graphNode.length > MAX_NODE_ID_LEN) {
      throw new BadRequestException("INVALID_GRAPH_NODE_ID");
    }
    const body =
      typeof bodyRaw === "string" ? bodyRaw.trim() : "";
    if (!body) throw new BadRequestException("ANNOTATION_BODY_REQUIRED");
    if (body.length > MAX_ANNOTATION_BODY) {
      throw new BadRequestException("ANNOTATION_BODY_TOO_LONG");
    }

    const row =
      await this.prisma.operationalGraphCollaborationAnnotation.create({
        data: {
          graphNodeId: graphNode,
          authorUserId: userId,
          body,
        },
        include: {
          author: { select: { email: true } },
        },
      });

    return {
      id: row.id,
      graphEngineVersion: row.graphEngineVersion,
      aggregateWindow: row.aggregateWindow,
      graphNodeId: row.graphNodeId,
      authorUserId: row.authorUserId,
      authorEmail: row.author.email,
      body: row.body,
      createdAtIso: row.createdAt.toISOString(),
    };
  }
}
