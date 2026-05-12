import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from "@nestjs/common";
import type { Request } from "express";
import { JwtAuthGuard } from "../../auth/jwt-auth.guard";
import { AdminGuard } from "../../guards/admin.guard";
import { OperationalCommandCollaborationService } from "./operational-command-collaboration.service";

function actorUserId(req: Request): string {
  return String((req as { user?: { userId?: string } }).user?.userId ?? "");
}

/** Mega Phase D — server-backed operational collaboration (no autonomous orchestration). */
@UseGuards(JwtAuthGuard, AdminGuard)
@Controller("/api/v1/admin/operational-command-collaboration")
export class AdminOperationalCommandCollaborationController {
  constructor(
    private readonly collaboration: OperationalCommandCollaborationService,
  ) {}

  @Get("workspaces")
  async listWorkspaces(@Req() req: Request) {
    const uid = actorUserId(req);
    const workspaces = await this.collaboration.listWorkspaces(uid);
    return { ok: true as const, workspaces };
  }

  @Post("workspaces")
  async createWorkspace(@Req() req: Request, @Body() body: Record<string, unknown>) {
    const uid = actorUserId(req);
    const ws = await this.collaboration.createWorkspace(uid, {
      title: typeof body.title === "string" ? body.title : undefined,
      notes: typeof body.notes === "string" ? body.notes : undefined,
      handoffSummary:
        typeof body.handoffSummary === "string" ? body.handoffSummary : undefined,
      bookmarks: body.bookmarks,
      markers: body.markers,
      linkedReplaySessionId:
        typeof body.linkedReplaySessionId === "string" ?
          body.linkedReplaySessionId
        : undefined,
      linkedOlderReplaySessionId:
        typeof body.linkedOlderReplaySessionId === "string" ?
          body.linkedOlderReplaySessionId
        : undefined,
      linkedNewerReplaySessionId:
        typeof body.linkedNewerReplaySessionId === "string" ?
          body.linkedNewerReplaySessionId
        : undefined,
    });
    return { ok: true as const, workspace: ws };
  }

  @Get("workspaces/:workspaceId")
  async getWorkspace(
    @Req() req: Request,
    @Param("workspaceId") workspaceId: string,
  ) {
    const uid = actorUserId(req);
    const workspace = await this.collaboration.getWorkspace(workspaceId, uid);
    return { ok: true as const, workspace };
  }

  @Patch("workspaces/:workspaceId")
  async patchWorkspace(
    @Req() req: Request,
    @Param("workspaceId") workspaceId: string,
    @Body() body: Record<string, unknown>,
  ) {
    const uid = actorUserId(req);
    const workspace = await this.collaboration.patchWorkspace(workspaceId, uid, {
      title: typeof body.title === "string" ? body.title : undefined,
      notes: typeof body.notes === "string" ? body.notes : undefined,
      handoffSummary:
        typeof body.handoffSummary === "string" ? body.handoffSummary : undefined,
      bookmarks: body.bookmarks,
      markers: body.markers,
      linkedReplaySessionId:
        body.linkedReplaySessionId === null ?
          null
        : typeof body.linkedReplaySessionId === "string" ?
          body.linkedReplaySessionId
        : undefined,
      linkedOlderReplaySessionId:
        body.linkedOlderReplaySessionId === null ?
          null
        : typeof body.linkedOlderReplaySessionId === "string" ?
          body.linkedOlderReplaySessionId
        : undefined,
      linkedNewerReplaySessionId:
        body.linkedNewerReplaySessionId === null ?
          null
        : typeof body.linkedNewerReplaySessionId === "string" ?
          body.linkedNewerReplaySessionId
        : undefined,
    });
    return { ok: true as const, workspace };
  }

  @Delete("workspaces/:workspaceId")
  async deleteWorkspace(
    @Req() req: Request,
    @Param("workspaceId") workspaceId: string,
  ) {
    const uid = actorUserId(req);
    const result = await this.collaboration.deleteWorkspace(workspaceId, uid);
    return { ok: true as const, ...result };
  }

  @Post("workspaces/:workspaceId/share")
  async shareWorkspace(
    @Req() req: Request,
    @Param("workspaceId") workspaceId: string,
    @Body() body: { email?: string },
  ) {
    const uid = actorUserId(req);
    const email = typeof body.email === "string" ? body.email : "";
    const workspace = await this.collaboration.shareWorkspace(
      workspaceId,
      uid,
      email,
    );
    return { ok: true as const, workspace };
  }

  @Delete("workspaces/:workspaceId/share/:sharedWithUserId")
  async unshareWorkspace(
    @Req() req: Request,
    @Param("workspaceId") workspaceId: string,
    @Param("sharedWithUserId") sharedWithUserId: string,
  ) {
    const uid = actorUserId(req);
    const workspace = await this.collaboration.unshareWorkspace(
      workspaceId,
      uid,
      sharedWithUserId,
    );
    return { ok: true as const, workspace };
  }

  @Get("workspaces/:workspaceId/timeline")
  async workspaceTimeline(
    @Req() req: Request,
    @Param("workspaceId") workspaceId: string,
    @Query("take") takeRaw?: string,
  ) {
    const uid = actorUserId(req);
    const take =
      takeRaw && /^\d+$/.test(takeRaw.trim()) ? Number(takeRaw.trim()) : 80;
    const timeline = await this.collaboration.listTimeline(
      workspaceId,
      uid,
      take,
    );
    return { ok: true as const, timeline };
  }

  @Post("workspaces/:workspaceId/phase-f-continuity-markers")
  async postPhaseFContinuityMarker(
    @Req() req: Request,
    @Param("workspaceId") workspaceId: string,
    @Body() body: Record<string, unknown>,
  ) {
    const uid = actorUserId(req);
    const markerKind =
      typeof body.markerKind === "string" ? body.markerKind : "";
    const summary = typeof body.summary === "string" ? body.summary : "";
    const payload =
      body.payload && typeof body.payload === "object" && !Array.isArray(body.payload) ?
        (body.payload as Record<string, unknown>)
      : undefined;
    const workspace = await this.collaboration.appendPhaseFTeamContinuityMarker(
      workspaceId,
      uid,
      { markerKind, summary, payload },
    );
    return { ok: true as const, workspace };
  }

  @Get("replay-review/sessions")
  async listReplaySessions(
    @Req() req: Request,
    @Query("workspaceId") workspaceId?: string,
  ) {
    const uid = actorUserId(req);
    const sessions = await this.collaboration.listReplayReviewSessions(
      uid,
      workspaceId ?? null,
    );
    return { ok: true as const, sessions };
  }

  @Post("replay-review/sessions")
  async createReplaySession(
    @Req() req: Request,
    @Body() body: Record<string, unknown>,
  ) {
    const uid = actorUserId(req);
    const session = await this.collaboration.createReplayReviewSession(uid, {
      title: typeof body.title === "string" ? body.title : undefined,
      workspaceId:
        typeof body.workspaceId === "string" ? body.workspaceId : undefined,
      investigationReviewState:
        typeof body.investigationReviewState === "string" ?
          body.investigationReviewState
        : undefined,
      replaySessionIdPrimary:
        typeof body.replaySessionIdPrimary === "string" ?
          body.replaySessionIdPrimary
        : undefined,
      replaySessionIdCompare:
        typeof body.replaySessionIdCompare === "string" ?
          body.replaySessionIdCompare
        : undefined,
      aggregateWindow:
        typeof body.aggregateWindow === "string" ?
          body.aggregateWindow
        : undefined,
    });
    return { ok: true as const, session };
  }

  @Patch("replay-review/sessions/:sessionId")
  async patchReplaySession(
    @Req() req: Request,
    @Param("sessionId") sessionId: string,
    @Body() body: Record<string, unknown>,
  ) {
    const uid = actorUserId(req);
    const session = await this.collaboration.patchReplayReviewSession(
      sessionId,
      uid,
      {
        title: typeof body.title === "string" ? body.title : undefined,
        investigationReviewState:
          typeof body.investigationReviewState === "string" ?
            body.investigationReviewState
          : undefined,
        replaySessionIdPrimary:
          body.replaySessionIdPrimary === null ?
            null
          : typeof body.replaySessionIdPrimary === "string" ?
            body.replaySessionIdPrimary
          : undefined,
        replaySessionIdCompare:
          body.replaySessionIdCompare === null ?
            null
          : typeof body.replaySessionIdCompare === "string" ?
            body.replaySessionIdCompare
          : undefined,
        aggregateWindow:
          typeof body.aggregateWindow === "string" ?
            body.aggregateWindow
          : undefined,
        workspaceId:
          body.workspaceId === null ?
            null
          : typeof body.workspaceId === "string" ?
            body.workspaceId
          : undefined,
      },
    );
    return { ok: true as const, session };
  }

  @Get("replay-review/sessions/:sessionId/comments")
  async listReplayComments(
    @Req() req: Request,
    @Param("sessionId") sessionId: string,
  ) {
    const uid = actorUserId(req);
    const comments =
      await this.collaboration.listReplayReviewComments(sessionId, uid);
    return { ok: true as const, comments };
  }

  @Post("replay-review/sessions/:sessionId/comments")
  async postReplayComment(
    @Req() req: Request,
    @Param("sessionId") sessionId: string,
    @Body() body: Record<string, unknown>,
  ) {
    const uid = actorUserId(req);
    const comment = await this.collaboration.addReplayReviewComment(
      sessionId,
      uid,
      {
        body: typeof body.body === "string" ? body.body : "",
        anchorKind:
          typeof body.anchorKind === "string" ? body.anchorKind : undefined,
        anchorPayloadJson: body.anchorPayloadJson,
      },
    );
    return { ok: true as const, comment };
  }
}
