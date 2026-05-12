import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Req,
  UseGuards,
} from "@nestjs/common";
import type { Request } from "express";
import { JwtAuthGuard } from "../../auth/jwt-auth.guard";
import { AdminGuard } from "../../guards/admin.guard";
import { OperationalCommandPresenceService } from "./operational-command-presence.service";

function actorUserId(req: Request): string {
  return String((req as { user?: { userId?: string } }).user?.userId ?? "");
}

/** Mega Phase F — real-time operational coordination visibility (no autonomous routing). */
@UseGuards(JwtAuthGuard, AdminGuard)
@Controller("/api/v1/admin/operational-command-presence")
export class AdminOperationalCommandPresenceController {
  constructor(
    private readonly presence: OperationalCommandPresenceService,
  ) {}

  @Post("heartbeat")
  async heartbeat(
    @Req() req: Request,
    @Body() body: Record<string, unknown>,
  ) {
    const uid = actorUserId(req);
    const row = await this.presence.heartbeat(uid, {
      surface: typeof body.surface === "string" ? body.surface : "",
      workspaceId:
        body.workspaceId === null ? null
        : typeof body.workspaceId === "string" ?
          body.workspaceId
        : undefined,
      replayReviewSessionId:
        body.replayReviewSessionId === null ? null
        : typeof body.replayReviewSessionId === "string" ?
          body.replayReviewSessionId
        : undefined,
      graphSelectedNodeId:
        body.graphSelectedNodeId === null ? null
        : typeof body.graphSelectedNodeId === "string" ?
          body.graphSelectedNodeId
        : undefined,
      replayChronologyFrameId:
        body.replayChronologyFrameId === null ? null
        : typeof body.replayChronologyFrameId === "string" ?
          body.replayChronologyFrameId
        : undefined,
      warRoomActive:
        typeof body.warRoomActive === "boolean" ? body.warRoomActive : undefined,
      payloadJson: body.payloadJson,
    });
    return { ok: true as const, presence: row };
  }

  @Get("snapshot")
  async snapshot(@Query("workspaceId") workspaceId?: string) {
    const snap = await this.presence.snapshot({
      workspaceId: workspaceId?.trim() ? workspaceId.trim() : null,
    });
    return { ok: true as const, ...snap };
  }

  @Get("graph-annotations")
  async graphAnnotations(
    @Query("graphNodeId") graphNodeId?: string,
    @Query("take") takeRaw?: string,
  ) {
    const take =
      takeRaw && /^\d+$/.test(takeRaw.trim()) ? Number(takeRaw.trim()) : 80;
    const items = await this.presence.listGraphAnnotations(
      graphNodeId ?? "",
      take,
    );
    return { ok: true as const, annotations: items };
  }

  @Post("graph-annotations")
  async createGraphAnnotation(
    @Req() req: Request,
    @Body() body: Record<string, unknown>,
  ) {
    const uid = actorUserId(req);
    const graphNodeId =
      typeof body.graphNodeId === "string" ? body.graphNodeId : "";
    const noteBody = typeof body.body === "string" ? body.body : "";
    const row = await this.presence.createGraphAnnotation(
      uid,
      graphNodeId,
      noteBody,
    );
    return { ok: true as const, annotation: row };
  }
}
