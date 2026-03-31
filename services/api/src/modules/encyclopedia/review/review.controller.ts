import {
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Logger,
  Post,
  UseGuards,
} from "@nestjs/common";
import type { CanonicalPageSnapshot } from "../canonical/canonicalTypes";
import { JwtAuthGuard } from "../../../auth/jwt-auth.guard";
import { AdminGuard } from "../../../guards/admin.guard";
import { AdminPermissionsGuard } from "../../../common/admin/admin-permissions.guard";
import { EncyclopediaAdminService } from "../admin/encyclopedia-admin.service";
import {
  approveReview,
  createGeneratedReviewRecord,
  createGeneratedReviewRecords,
  getGenerationFeedbackAction,
  importReviewRecords,
  intakeReviewedCandidates,
  promoteApproved,
  rejectReview,
  retryFailed,
} from "./reviewActions.server";
import { getValidationInsights } from "./reviewInsights.server";
import { getReviewOpsSummary } from "./reviewOps.server";
import {
  getMigrationSummary,
  getOperationalReviewRecords,
} from "./reviewStore.server";

/** LOCAL DEV ONLY: re-enable on all routes before production. */
const AdminReviewGuards = [JwtAuthGuard, AdminGuard, AdminPermissionsGuard] as const;

@Controller("/api/v1/admin/encyclopedia/review")
export class ReviewController {
  private readonly intakeLogger = new Logger("EncyclopediaAdminController");

  constructor(private readonly encyclopediaAdmin: EncyclopediaAdminService) {}

  // TEMPORARY — allow public read for local dev search (re-lock before production).
  @Get("list")
  list() {
    return getOperationalReviewRecords();
  }

  // TEMPORARY — open read for local bring-up.
  @Get("migration-summary")
  migrationSummary() {
    return getMigrationSummary();
  }

  @Post("approve")
  @UseGuards(...AdminReviewGuards)
  async approve(@Body() body: { slug: string }) {
    return approveReview(body.slug);
  }

  @Post("reject")
  @UseGuards(...AdminReviewGuards)
  async reject(@Body() body: { slug: string }) {
    return rejectReview(body.slug);
  }

  @Post("promote")
  @UseGuards(...AdminReviewGuards)
  async promote() {
    return promoteApproved();
  }

  @Post("retry")
  @UseGuards(...AdminReviewGuards)
  async retry() {
    return retryFailed();
  }

  @Get("insights")
  @UseGuards(...AdminReviewGuards)
  insights() {
    return getValidationInsights();
  }

  @Post("import")
  @UseGuards(...AdminReviewGuards)
  async importRecords() {
    return importReviewRecords();
  }

  @Post("intake")
  @UseGuards(...AdminReviewGuards)
  async intakeOne(@Body() body: { snapshot: CanonicalPageSnapshot }) {
    return createGeneratedReviewRecord(body.snapshot);
  }

  /** TEMPORARY: no auth — local dev / wave validation only. Re-guard with controller-level UseGuards after wave 1. */
  @Post("intake-batch")
  async intakeBatch(@Body() body: { snapshots: CanonicalPageSnapshot[] }) {
    return createGeneratedReviewRecords(body.snapshots);
  }

  /**
   * Intake generated review records (Prisma). Registered here (not a sibling
   * controller under `.../encyclopedia`) so Nest/Express resolves the path.
   * HARD MERGE SAFE VERSION
   */
  @Post("intake-generated")
  async intakeGenerated(@Body() body: any) {
    try {
      if (!body || !Array.isArray(body.records)) {
        throw new HttpException(
          "Invalid payload: expected { records: [] }",
          HttpStatus.BAD_REQUEST,
        );
      }

      this.intakeLogger.log(`INTAKE START: ${body.records.length} records`);

      const result = await this.encyclopediaAdmin.intakeGeneratedRecords(
        body.records,
      );

      this.intakeLogger.log(
        `INTAKE SUCCESS: inserted=${result.inserted} skipped=${result.skipped}`,
      );

      return {
        ok: true,
        ...result,
      };
    } catch (err: any) {
      if (err instanceof HttpException) {
        throw err;
      }
      this.intakeLogger.error("INTAKE FAILURE", err?.stack || err);

      throw new HttpException(
        {
          message: "INTAKE_FAILED",
          error: err?.message || "Unknown error",
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /** TEMPORARY: no auth — local dev only. */
  @Post("reviewed-candidates")
  async reviewedCandidates(
    @Body()
    body: {
      candidates: Array<{
        slug: string;
        title: string;
        canonicalSnapshot: CanonicalPageSnapshot;
        sourceName?: string;
      }>;
    },
  ) {
    return intakeReviewedCandidates(body.candidates ?? []);
  }

  // TEMPORARY — open read for local bring-up.
  @Get("generation-feedback")
  async generationFeedback() {
    return getGenerationFeedbackAction();
  }

  // TEMPORARY — open read for local bring-up.
  @Get("ops")
  ops() {
    return getReviewOpsSummary();
  }
}
