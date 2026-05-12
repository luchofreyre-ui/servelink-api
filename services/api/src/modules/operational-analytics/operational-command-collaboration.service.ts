import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Prisma, Role } from "@prisma/client";
import { randomUUID } from "crypto";
import { PrismaService } from "../../prisma";

export const OPERATIONAL_COMMAND_WORKSPACE_ENGINE_VERSION =
  "collaborative_command_workspace_phase_d_v1" as const;

export const OPERATIONAL_REPLAY_REVIEW_ENGINE_VERSION =
  "collaborative_replay_review_phase_d_v1" as const;

const MARKER_KINDS = new Set([
  "incident",
  "replay_session",
  "replay_diff",
  "graph_node",
  "freeform",
]);

const REVIEW_STATES = new Set(["draft", "open", "reviewed"]);

function governanceEnvelope() {
  return {
    noAutonomousCoordination: true as const,
    noAiExecutionAuthority: true as const,
    humanAuthoredNotesOnly: true as const,
    serverBackedCollaboration: true as const,
  };
}

function normalizeBookmarks(raw: unknown): Prisma.InputJsonValue {
  if (!Array.isArray(raw)) return [] as unknown as Prisma.InputJsonValue;
  const out: Record<string, unknown>[] = [];
  for (const row of raw) {
    if (!row || typeof row !== "object") continue;
    const r = row as Record<string, unknown>;
    const id =
      typeof r.id === "string" && r.id.trim() ? r.id.trim() : randomUUID();
    const href = typeof r.href === "string" ? r.href : "";
    const label =
      typeof r.label === "string" && r.label.trim() ? r.label.trim() : href;
    const createdAtIso =
      typeof r.createdAtIso === "string" && r.createdAtIso.trim() ?
        r.createdAtIso.trim()
      : new Date().toISOString();
    out.push({ id, href, label, createdAtIso });
  }
  return out as unknown as Prisma.InputJsonValue;
}

@Injectable()
export class OperationalCommandCollaborationService {
  constructor(private readonly prisma: PrismaService) {}

  private async normalizeMarkers(
    raw: unknown,
  ): Promise<Prisma.InputJsonValue> {
    if (!Array.isArray(raw)) return [] as unknown as Prisma.InputJsonValue;
    const out: Record<string, unknown>[] = [];
    for (const row of raw) {
      if (!row || typeof row !== "object") continue;
      const r = row as Record<string, unknown>;
      const kind =
        typeof r.kind === "string" && MARKER_KINDS.has(r.kind) ?
          r.kind
        : "freeform";
      const id =
        typeof r.id === "string" && r.id.trim() ? r.id.trim() : randomUUID();
      const targetId =
        typeof r.targetId === "string" && r.targetId.trim() ?
          r.targetId.trim()
        : undefined;
      const assigneeDisplayName =
        typeof r.assigneeDisplayName === "string" &&
        r.assigneeDisplayName.trim() ?
          r.assigneeDisplayName.trim()
        : undefined;
      let assigneeUserId =
        typeof r.assigneeUserId === "string" && r.assigneeUserId.trim() ?
          r.assigneeUserId.trim()
        : undefined;
      if (assigneeUserId) {
        const u = await this.prisma.user.findUnique({
          where: { id: assigneeUserId },
          select: { role: true },
        });
        if (!u || u.role !== Role.admin) {
          throw new BadRequestException("INVALID_MARKER_ASSIGNEE_USER");
        }
      }
      const note =
        typeof r.note === "string" && r.note.trim() ? r.note.trim() : "";
      if (!note) continue;
      const createdAtIso =
        typeof r.createdAtIso === "string" && r.createdAtIso.trim() ?
          r.createdAtIso.trim()
        : new Date().toISOString();
      const rec: Record<string, unknown> = {
        id,
        kind,
        note,
        createdAtIso,
      };
      if (targetId) rec.targetId = targetId;
      if (assigneeDisplayName) rec.assigneeDisplayName = assigneeDisplayName;
      if (assigneeUserId) rec.assigneeUserId = assigneeUserId;
      out.push(rec);
    }
    return out as unknown as Prisma.InputJsonValue;
  }

  private workspaceInclude() {
    return {
      owner: { select: { id: true, email: true } },
      shares: {
        include: {
          sharedWith: { select: { id: true, email: true } },
          sharedBy: { select: { id: true, email: true } },
        },
      },
    } as const;
  }

  private mapWorkspace(
    ws: Prisma.OperationalCommandWorkspaceGetPayload<{
      include: ReturnType<OperationalCommandCollaborationService["workspaceInclude"]>;
    }>,
    viewerUserId: string,
  ) {
    const bookmarks = ws.bookmarks as unknown;
    const markers = ws.markers as unknown;
    const myRole =
      ws.ownerUserId === viewerUserId ? ("owner" as const)
      : ws.shares.some((s) => s.sharedWithUserId === viewerUserId) ?
        ("collaborator" as const)
      : ("none" as const);

    return {
      id: ws.id,
      workspaceEngineVersion: ws.workspaceEngineVersion,
      governance: governanceEnvelope(),
      title: ws.title,
      notes: ws.notes,
      handoffSummary: ws.handoffSummary,
      bookmarks,
      markers,
      ownerUserId: ws.ownerUserId,
      ownerEmail: ws.owner.email,
      linkedReplaySessionId: ws.linkedReplaySessionId,
      linkedOlderReplaySessionId: ws.linkedOlderReplaySessionId,
      linkedNewerReplaySessionId: ws.linkedNewerReplaySessionId,
      shares: ws.shares.map((s) => ({
        id: s.id,
        sharedWithUserId: s.sharedWithUserId,
        sharedWithEmail: s.sharedWith.email,
        sharedByUserId: s.sharedByUserId,
        sharedByEmail: s.sharedBy.email,
        createdAtIso: s.createdAt.toISOString(),
      })),
      createdAtIso: ws.createdAt.toISOString(),
      updatedAtIso: ws.updatedAt.toISOString(),
      myRole,
    };
  }

  async appendTimeline(
    workspaceId: string,
    actorUserId: string,
    eventKind: string,
    payload: Record<string, unknown>,
  ) {
    await this.prisma.operationalCommandWorkspaceTimelineEvent.create({
      data: {
        workspaceId,
        actorUserId,
        eventKind,
        payloadJson: payload as Prisma.InputJsonValue,
      },
    });
  }

  async assertWorkspaceEditor(
    workspaceId: string,
    userId: string,
  ): Promise<
    Prisma.OperationalCommandWorkspaceGetPayload<{
      include: ReturnType<OperationalCommandCollaborationService["workspaceInclude"]>;
    }>
  > {
    const ws = await this.prisma.operationalCommandWorkspace.findUnique({
      where: { id: workspaceId },
      include: this.workspaceInclude(),
    });
    if (!ws) throw new NotFoundException("WORKSPACE_NOT_FOUND");
    const isOwner = ws.ownerUserId === userId;
    const shared = ws.shares.some((s) => s.sharedWithUserId === userId);
    if (!isOwner && !shared) throw new ForbiddenException("WORKSPACE_ACCESS_DENIED");
    return ws;
  }

  async assertWorkspaceOwner(
    workspaceId: string,
    userId: string,
  ): Promise<
    Prisma.OperationalCommandWorkspaceGetPayload<{
      include: ReturnType<OperationalCommandCollaborationService["workspaceInclude"]>;
    }>
  > {
    const ws = await this.assertWorkspaceEditor(workspaceId, userId);
    if (ws.ownerUserId !== userId) {
      throw new ForbiddenException("OWNER_ONLY");
    }
    return ws;
  }

  async listWorkspaces(userId: string) {
    const rows = await this.prisma.operationalCommandWorkspace.findMany({
      where: {
        OR: [
          { ownerUserId: userId },
          { shares: { some: { sharedWithUserId: userId } } },
        ],
      },
      orderBy: { updatedAt: "desc" },
      include: this.workspaceInclude(),
    });
    return rows.map((w) => this.mapWorkspace(w, userId));
  }

  async getWorkspace(workspaceId: string, userId: string) {
    const ws = await this.assertWorkspaceEditor(workspaceId, userId);
    return this.mapWorkspace(ws, userId);
  }

  async createWorkspace(
    userId: string,
    body: {
      title?: string;
      notes?: string;
      handoffSummary?: string;
      bookmarks?: unknown;
      markers?: unknown;
      linkedReplaySessionId?: string | null;
      linkedOlderReplaySessionId?: string | null;
      linkedNewerReplaySessionId?: string | null;
    },
  ) {
    const bookmarks = normalizeBookmarks(body.bookmarks ?? []);
    const markers = await this.normalizeMarkers(body.markers ?? []);

    const ws = await this.prisma.operationalCommandWorkspace.create({
      data: {
        workspaceEngineVersion: OPERATIONAL_COMMAND_WORKSPACE_ENGINE_VERSION,
        ownerUserId: userId,
        title: body.title?.trim() || "Untitled investigation",
        notes: body.notes?.trim() ?? "",
        handoffSummary: body.handoffSummary?.trim() ?? "",
        bookmarks,
        markers,
        linkedReplaySessionId: body.linkedReplaySessionId?.trim() || null,
        linkedOlderReplaySessionId:
          body.linkedOlderReplaySessionId?.trim() || null,
        linkedNewerReplaySessionId:
          body.linkedNewerReplaySessionId?.trim() || null,
      },
      include: this.workspaceInclude(),
    });

    await this.appendTimeline(ws.id, userId, "workspace_created", {});

    return this.mapWorkspace(ws, userId);
  }

  async patchWorkspace(
    workspaceId: string,
    userId: string,
    body: {
      title?: string;
      notes?: string;
      handoffSummary?: string;
      bookmarks?: unknown;
      markers?: unknown;
      linkedReplaySessionId?: string | null;
      linkedOlderReplaySessionId?: string | null;
      linkedNewerReplaySessionId?: string | null;
    },
  ) {
    await this.assertWorkspaceEditor(workspaceId, userId);

    const patchKeys: string[] = [];
    const data: Prisma.OperationalCommandWorkspaceUpdateInput = {};

    if (body.title !== undefined) {
      patchKeys.push("title");
      data.title = body.title.trim() || "Untitled investigation";
    }
    if (body.notes !== undefined) {
      patchKeys.push("notes");
      data.notes = body.notes.trim() ?? "";
    }
    if (body.handoffSummary !== undefined) {
      patchKeys.push("handoffSummary");
      data.handoffSummary = body.handoffSummary.trim() ?? "";
    }
    if (body.bookmarks !== undefined) {
      patchKeys.push("bookmarks");
      data.bookmarks = normalizeBookmarks(body.bookmarks);
    }
    if (body.markers !== undefined) {
      patchKeys.push("markers");
      data.markers = await this.normalizeMarkers(body.markers);
    }
    if (body.linkedReplaySessionId !== undefined) {
      patchKeys.push("linkedReplaySessionId");
      data.linkedReplaySessionId =
        body.linkedReplaySessionId?.trim() || null;
    }
    if (body.linkedOlderReplaySessionId !== undefined) {
      patchKeys.push("linkedOlderReplaySessionId");
      data.linkedOlderReplaySessionId =
        body.linkedOlderReplaySessionId?.trim() || null;
    }
    if (body.linkedNewerReplaySessionId !== undefined) {
      patchKeys.push("linkedNewerReplaySessionId");
      data.linkedNewerReplaySessionId =
        body.linkedNewerReplaySessionId?.trim() || null;
    }

    const ws = await this.prisma.operationalCommandWorkspace.update({
      where: { id: workspaceId },
      data,
      include: this.workspaceInclude(),
    });

    await this.appendTimeline(workspaceId, userId, "workspace_saved", {
      patchedKeys: patchKeys,
    });

    return this.mapWorkspace(ws, userId);
  }

  async deleteWorkspace(workspaceId: string, userId: string) {
    await this.assertWorkspaceOwner(workspaceId, userId);
    await this.prisma.operationalCommandWorkspace.delete({
      where: { id: workspaceId },
    });
    return { deleted: true as const };
  }

  async shareWorkspace(workspaceId: string, ownerUserId: string, emailRaw: string) {
    const ws = await this.assertWorkspaceOwner(workspaceId, ownerUserId);
    const email = emailRaw.trim().toLowerCase();
    if (!email) throw new BadRequestException("SHARE_EMAIL_REQUIRED");

    const target = await this.prisma.user.findUnique({
      where: { email },
      select: { id: true, role: true },
    });
    if (!target || target.role !== Role.admin) {
      throw new BadRequestException("ADMIN_SHARE_TARGET_REQUIRED");
    }
    if (target.id === ownerUserId) {
      throw new BadRequestException("CANNOT_SHARE_WITH_SELF");
    }

    await this.prisma.operationalCommandWorkspaceShare.upsert({
      where: {
        workspaceId_sharedWithUserId: {
          workspaceId,
          sharedWithUserId: target.id,
        },
      },
      create: {
        workspaceId,
        sharedWithUserId: target.id,
        sharedByUserId: ownerUserId,
      },
      update: {
        sharedByUserId: ownerUserId,
      },
    });

    await this.appendTimeline(workspaceId, ownerUserId, "workspace_share_upserted", {
      sharedWithUserId: target.id,
      sharedWithEmail: email,
    });

    const next = await this.prisma.operationalCommandWorkspace.findUniqueOrThrow({
      where: { id: ws.id },
      include: this.workspaceInclude(),
    });
    return this.mapWorkspace(next, ownerUserId);
  }

  async unshareWorkspace(
    workspaceId: string,
    ownerUserId: string,
    sharedWithUserId: string,
  ) {
    await this.assertWorkspaceOwner(workspaceId, ownerUserId);

    await this.prisma.operationalCommandWorkspaceShare.deleteMany({
      where: { workspaceId, sharedWithUserId },
    });

    await this.appendTimeline(workspaceId, ownerUserId, "workspace_share_removed", {
      sharedWithUserId,
    });

    const next = await this.prisma.operationalCommandWorkspace.findUniqueOrThrow({
      where: { id: workspaceId },
      include: this.workspaceInclude(),
    });
    return this.mapWorkspace(next, ownerUserId);
  }

  async listTimeline(workspaceId: string, userId: string, take = 80) {
    await this.assertWorkspaceEditor(workspaceId, userId);
    const rows =
      await this.prisma.operationalCommandWorkspaceTimelineEvent.findMany({
        where: { workspaceId },
        orderBy: { createdAt: "desc" },
        take: Math.min(Math.max(take, 1), 200),
        include: {
          actor: { select: { id: true, email: true } },
        },
      });
    return rows.map((r) => ({
      id: r.id,
      eventKind: r.eventKind,
      payloadJson: r.payloadJson,
      createdAtIso: r.createdAt.toISOString(),
      actorUserId: r.actorUserId,
      actorEmail: r.actor.email,
    }));
  }

  async assertReplayReviewAccess(sessionId: string, userId: string) {
    const session = await this.prisma.operationalReplayReviewSession.findUnique({
      where: { id: sessionId },
      include: {
        workspace: {
          include: {
            shares: true,
            owner: { select: { id: true } },
          },
        },
      },
    });
    if (!session) throw new NotFoundException("REPLAY_REVIEW_NOT_FOUND");
    if (session.createdByUserId === userId) return session;
    if (session.workspace) {
      const w = session.workspace;
      if (w.ownerUserId === userId) return session;
      if (w.shares.some((s) => s.sharedWithUserId === userId)) return session;
    }
    throw new ForbiddenException("REPLAY_REVIEW_ACCESS_DENIED");
  }

  async assertReplayReviewEditor(sessionId: string, userId: string) {
    return this.assertReplayReviewAccess(sessionId, userId);
  }

  async listReplayReviewSessions(userId: string, workspaceId?: string | null) {
    const filterWs =
      workspaceId?.trim() ?
        { workspaceId: workspaceId.trim() }
      : {};

    const rows =
      await this.prisma.operationalReplayReviewSession.findMany({
        where: {
          AND: [
            filterWs,
            {
              OR: [
                { createdByUserId: userId },
                {
                  workspace: {
                    OR: [
                      { ownerUserId: userId },
                      { shares: { some: { sharedWithUserId: userId } } },
                    ],
                  },
                },
              ],
            },
          ],
        },
        orderBy: { updatedAt: "desc" },
        include: {
          creator: { select: { id: true, email: true } },
          workspace: {
            select: { id: true, title: true },
          },
        },
      });

    return rows.map((s) => ({
      id: s.id,
      reviewEngineVersion: s.reviewEngineVersion,
      title: s.title,
      investigationReviewState: s.investigationReviewState,
      replaySessionIdPrimary: s.replaySessionIdPrimary,
      replaySessionIdCompare: s.replaySessionIdCompare,
      aggregateWindow: s.aggregateWindow,
      workspaceId: s.workspaceId,
      workspaceTitle: s.workspace?.title ?? null,
      createdByUserId: s.createdByUserId,
      creatorEmail: s.creator.email,
      createdAtIso: s.createdAt.toISOString(),
      updatedAtIso: s.updatedAt.toISOString(),
    }));
  }

  async createReplayReviewSession(
    userId: string,
    body: {
      title?: string;
      workspaceId?: string | null;
      investigationReviewState?: string;
      replaySessionIdPrimary?: string | null;
      replaySessionIdCompare?: string | null;
      aggregateWindow?: string;
    },
  ) {
    if (body.workspaceId?.trim()) {
      await this.assertWorkspaceEditor(body.workspaceId.trim(), userId);
    }

    const investigationReviewState =
      body.investigationReviewState &&
      REVIEW_STATES.has(body.investigationReviewState) ?
        body.investigationReviewState
      : "open";

    const session = await this.prisma.operationalReplayReviewSession.create({
      data: {
        reviewEngineVersion: OPERATIONAL_REPLAY_REVIEW_ENGINE_VERSION,
        createdByUserId: userId,
        workspaceId: body.workspaceId?.trim() || null,
        title: body.title?.trim() || "Replay review",
        investigationReviewState,
        replaySessionIdPrimary: body.replaySessionIdPrimary?.trim() || null,
        replaySessionIdCompare: body.replaySessionIdCompare?.trim() || null,
        aggregateWindow: body.aggregateWindow?.trim() || "as_of_now",
      },
      include: {
        creator: { select: { id: true, email: true } },
        workspace: { select: { id: true, title: true } },
      },
    });

    if (session.workspaceId) {
      await this.appendTimeline(session.workspaceId, userId, "replay_review_session_created", {
        replayReviewSessionId: session.id,
      });
    }

    return {
      id: session.id,
      reviewEngineVersion: session.reviewEngineVersion,
      title: session.title,
      investigationReviewState: session.investigationReviewState,
      replaySessionIdPrimary: session.replaySessionIdPrimary,
      replaySessionIdCompare: session.replaySessionIdCompare,
      aggregateWindow: session.aggregateWindow,
      workspaceId: session.workspaceId,
      workspaceTitle: session.workspace?.title ?? null,
      createdByUserId: session.createdByUserId,
      creatorEmail: session.creator.email,
      createdAtIso: session.createdAt.toISOString(),
      updatedAtIso: session.updatedAt.toISOString(),
    };
  }

  async patchReplayReviewSession(
    sessionId: string,
    userId: string,
    body: {
      title?: string;
      investigationReviewState?: string;
      replaySessionIdPrimary?: string | null;
      replaySessionIdCompare?: string | null;
      aggregateWindow?: string;
      workspaceId?: string | null;
    },
  ) {
    await this.assertReplayReviewEditor(sessionId, userId);

    const data: Prisma.OperationalReplayReviewSessionUpdateInput = {};

    if (body.title !== undefined) {
      data.title = body.title.trim() || "Replay review";
    }
    if (
      body.investigationReviewState !== undefined &&
      REVIEW_STATES.has(body.investigationReviewState)
    ) {
      data.investigationReviewState = body.investigationReviewState;
    }
    if (body.replaySessionIdPrimary !== undefined) {
      data.replaySessionIdPrimary =
        body.replaySessionIdPrimary?.trim() || null;
    }
    if (body.replaySessionIdCompare !== undefined) {
      data.replaySessionIdCompare =
        body.replaySessionIdCompare?.trim() || null;
    }
    if (body.aggregateWindow !== undefined) {
      data.aggregateWindow = body.aggregateWindow?.trim() || "as_of_now";
    }
    if (body.workspaceId !== undefined) {
      const wsId = body.workspaceId?.trim();
      if (wsId) {
        await this.assertWorkspaceEditor(wsId, userId);
        data.workspace = { connect: { id: wsId } };
      } else {
        data.workspace = { disconnect: true };
      }
    }

    const session =
      await this.prisma.operationalReplayReviewSession.update({
        where: { id: sessionId },
        data,
        include: {
          creator: { select: { id: true, email: true } },
          workspace: { select: { id: true, title: true } },
        },
      });

    return {
      id: session.id,
      reviewEngineVersion: session.reviewEngineVersion,
      title: session.title,
      investigationReviewState: session.investigationReviewState,
      replaySessionIdPrimary: session.replaySessionIdPrimary,
      replaySessionIdCompare: session.replaySessionIdCompare,
      aggregateWindow: session.aggregateWindow,
      workspaceId: session.workspaceId,
      workspaceTitle: session.workspace?.title ?? null,
      createdByUserId: session.createdByUserId,
      creatorEmail: session.creator.email,
      createdAtIso: session.createdAt.toISOString(),
      updatedAtIso: session.updatedAt.toISOString(),
    };
  }

  async listReplayReviewComments(sessionId: string, userId: string) {
    await this.assertReplayReviewAccess(sessionId, userId);
    const rows =
      await this.prisma.operationalReplayReviewComment.findMany({
        where: { sessionId },
        orderBy: { createdAt: "asc" },
        include: {
          author: { select: { id: true, email: true } },
        },
      });
    return rows.map((c) => ({
      id: c.id,
      body: c.body,
      anchorKind: c.anchorKind,
      anchorPayloadJson: c.anchorPayloadJson,
      authorUserId: c.authorUserId,
      authorEmail: c.author.email,
      createdAtIso: c.createdAt.toISOString(),
    }));
  }

  async addReplayReviewComment(
    sessionId: string,
    userId: string,
    body: {
      body: string;
      anchorKind?: string | null;
      anchorPayloadJson?: unknown;
    },
  ) {
    await this.assertReplayReviewEditor(sessionId, userId);
    const text = body.body?.trim() ?? "";
    if (!text) throw new BadRequestException("COMMENT_BODY_REQUIRED");
    if (text.length > 12_000) throw new BadRequestException("COMMENT_TOO_LONG");

    const anchorKind =
      typeof body.anchorKind === "string" && body.anchorKind.trim() ?
        body.anchorKind.trim().slice(0, 64)
      : null;

    const row = await this.prisma.operationalReplayReviewComment.create({
      data: {
        sessionId,
        authorUserId: userId,
        body: text,
        anchorKind,
        ...(body.anchorPayloadJson !== undefined &&
        body.anchorPayloadJson !== null ?
          {
            anchorPayloadJson: body.anchorPayloadJson as Prisma.InputJsonValue,
          }
        : {}),
      },
      include: {
        author: { select: { id: true, email: true } },
      },
    });

    return {
      id: row.id,
      body: row.body,
      anchorKind: row.anchorKind,
      anchorPayloadJson: row.anchorPayloadJson,
      authorUserId: row.authorUserId,
      authorEmail: row.author.email,
      createdAtIso: row.createdAt.toISOString(),
    };
  }

  private static readonly PHASE_F_CONTINUITY_KINDS = new Set([
    "handoff_snapshot",
    "escalation_continuity",
    "shift_transition",
    "shared_bookmark_anchor",
  ]);

  /** Mega Phase F — append-only team continuity markers (audit-oriented; no routing). */
  async appendPhaseFTeamContinuityMarker(
    workspaceId: string,
    userId: string,
    body: {
      markerKind: string;
      summary: string;
      payload?: Record<string, unknown>;
    },
  ) {
    const kind = body.markerKind?.trim() ?? "";
    if (!OperationalCommandCollaborationService.PHASE_F_CONTINUITY_KINDS.has(kind)) {
      throw new BadRequestException("INVALID_CONTINUITY_MARKER_KIND");
    }
    const summary = body.summary?.trim() ?? "";
    if (!summary) throw new BadRequestException("CONTINUITY_SUMMARY_REQUIRED");
    if (summary.length > 16_000) {
      throw new BadRequestException("CONTINUITY_SUMMARY_TOO_LONG");
    }

    await this.assertWorkspaceEditor(workspaceId, userId);

    await this.appendTimeline(workspaceId, userId, "phase_f_team_continuity_marker", {
      markerKind: kind,
      summary,
      ...(body.payload ?? {}),
    });

    const ws = await this.prisma.operationalCommandWorkspace.findUnique({
      where: { id: workspaceId },
      include: this.workspaceInclude(),
    });
    if (!ws) throw new NotFoundException("WORKSPACE_NOT_FOUND");
    return this.mapWorkspace(ws, userId);
  }
}
