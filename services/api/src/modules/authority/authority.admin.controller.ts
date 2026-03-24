import {
  Body,
  Controller,
  DefaultValuePipe,
  Get,
  NotFoundException,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from "@nestjs/common";
import { JwtAuthGuard } from "../../auth/jwt-auth.guard";
import { AdminGuard } from "../../guards/admin.guard";
import { AdminPermissions } from "../../common/admin/admin-permissions.decorator";
import { AdminPermissionsGuard } from "../../common/admin/admin-permissions.guard";
import { BookingAuthorityReportingService } from "./booking-authority-reporting.service";
import { BookingAuthorityPersistenceService } from "./booking-authority-persistence.service";
import { BookingAuthorityMismatchService } from "./booking-authority-mismatch.service";
import { BookingAuthorityQualityService } from "./booking-authority-quality.service";
import { BookingAuthorityDriftService } from "./booking-authority-drift.service";
import { BookingAuthorityAlertService } from "./booking-authority-alert.service";
import { BookingAuthorityRecomputeService } from "./booking-authority-recompute.service";
import { BookingAuthorityLearningExportService } from "./booking-authority-learning-export.service";
import { BookingAuthorityUnmappedTagsService } from "./booking-authority-unmapped-tags.service";
import { FoAuthorityKnowledgeFeedbackService } from "./fo-authority-knowledge-feedback.service";
import {
  toBookingAuthorityListItem,
  toBookingAuthorityResultAdminResponse,
} from "./dto/booking-authority-admin.dto";
import { BookingAuthorityReportQueryDto } from "./dto/booking-authority-report-query.dto";
import { BookingAuthorityScopedQueryDto } from "./dto/booking-authority-scoped-query.dto";
import { ListBookingAuthorityResultsQueryDto } from "./dto/booking-authority-list-query.dto";
import { OverrideBookingAuthorityTagsDto } from "./dto/booking-authority-override.dto";
import { MarkAuthorityReviewBodyDto } from "./dto/mark-authority-review-body.dto";
import { BookingAuthorityAlertsQueryDto } from "./dto/booking-authority-alerts-query.dto";
import { BookingAuthorityLearningExportQueryDto } from "./dto/booking-authority-learning-export-query.dto";
import { BookingAuthorityUnmappedTagsQueryDto } from "./dto/booking-authority-unmapped-tags-query.dto";
import { AUTHORITY_SNAPSHOT_METADATA } from "./authority.snapshot";
import { BookingIntelligenceService } from "./booking-intelligence.service";
import { BookingAuthorityInput } from "./booking-intelligence.types";

type AuthedRequest = {
  user?: { userId?: string; role?: string };
};

@Controller("api/v1/admin/authority")
@UseGuards(JwtAuthGuard, AdminGuard, AdminPermissionsGuard)
export class AuthorityAdminController {
  /** Default rolling window when `windowHours` / `updatedSince` are omitted (aligned with alerts). */
  private static readonly AUTHORITY_DEFAULT_WINDOW_HOURS = 168;

  constructor(
    private readonly bookingIntelligenceService: BookingIntelligenceService,
    private readonly bookingAuthorityPersistence: BookingAuthorityPersistenceService,
    private readonly bookingAuthorityReporting: BookingAuthorityReportingService,
    private readonly bookingAuthorityMismatch: BookingAuthorityMismatchService,
    private readonly bookingAuthorityQuality: BookingAuthorityQualityService,
    private readonly bookingAuthorityDrift: BookingAuthorityDriftService,
    private readonly bookingAuthorityAlerts: BookingAuthorityAlertService,
    private readonly bookingAuthorityRecompute: BookingAuthorityRecomputeService,
    private readonly bookingAuthorityLearningExport: BookingAuthorityLearningExportService,
    private readonly bookingAuthorityUnmappedTags: BookingAuthorityUnmappedTagsService,
    private readonly foAuthorityKnowledgeFeedback: FoAuthorityKnowledgeFeedbackService,
  ) {}

  private scopeFromScopedQuery(query: BookingAuthorityScopedQueryDto): Date | undefined {
    if (query.updatedSince?.trim()) {
      return new Date(query.updatedSince.trim());
    }
    if (query.windowHours != null) {
      return new Date(Date.now() - query.windowHours * 60 * 60 * 1000);
    }
    return undefined;
  }

  private defaultAuthorityWindowStart(): Date {
    return new Date(
      Date.now() -
        AuthorityAdminController.AUTHORITY_DEFAULT_WINDOW_HOURS * 60 * 60 * 1000,
    );
  }

  private resolveScopedUpdatedAtGte(query: BookingAuthorityScopedQueryDto): Date {
    return this.scopeFromScopedQuery(query) ?? this.defaultAuthorityWindowStart();
  }

  private resolveReportUpdatedAtGte(query: BookingAuthorityReportQueryDto): Date {
    if (query.updatedSince?.trim()) {
      return new Date(query.updatedSince.trim());
    }
    if (query.windowHours != null) {
      return new Date(Date.now() - query.windowHours * 60 * 60 * 1000);
    }
    return this.defaultAuthorityWindowStart();
  }

  @Post("resolve-booking-tags")
  @AdminPermissions("exceptions.read")
  resolveBookingTags(@Body() body: BookingAuthorityInput) {
    return this.bookingIntelligenceService.resolveTags(body);
  }

  /**
   * Lightweight metadata for the bundled authority graph (code-shipped snapshot).
   * Full graph unification is out of scope for this endpoint.
   */
  @Get("snapshot-metadata")
  @AdminPermissions("exceptions.read")
  getAuthoritySnapshotMetadata() {
    return {
      kind: "authority_snapshot_metadata" as const,
      snapshotVersion: AUTHORITY_SNAPSHOT_METADATA.version,
      snapshotSource: AUTHORITY_SNAPSHOT_METADATA.source,
      /** `null` while the snapshot ships with the API bundle (no separate store `updatedAt`). */
      updatedAt: null,
    };
  }

  @Get("report")
  @AdminPermissions("exceptions.read")
  @UsePipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  )
  async getAuthorityReport(@Query() query: BookingAuthorityReportQueryDto) {
    const topLimit = query.topLimit ?? 20;
    const recentLimit = query.recentLimit ?? 10;
    const updatedAtGte = this.resolveReportUpdatedAtGte(query);
    return this.bookingAuthorityReporting.buildPersistedReport({
      topLimit,
      recentLimit,
      updatedAtGte,
    });
  }

  @Get("quality")
  @AdminPermissions("exceptions.read")
  @UsePipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  )
  async getAuthorityQuality(@Query() query: BookingAuthorityScopedQueryDto) {
    const topLimit = query.topLimit ?? 20;
    const updatedAtGte = this.resolveScopedUpdatedAtGte(query);
    return this.bookingAuthorityQuality.buildQualityReport({
      updatedAtGte,
      topLimit,
    });
  }

  @Get("drift")
  @AdminPermissions("exceptions.read")
  @UsePipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  )
  async getAuthorityDrift(@Query() query: BookingAuthorityScopedQueryDto) {
    const topLimit = query.topLimit ?? 20;
    const updatedAtGte = this.resolveScopedUpdatedAtGte(query);
    return this.bookingAuthorityDrift.buildDriftSummary({
      updatedAtGte,
      topLimit,
    });
  }

  @Get("alerts")
  @AdminPermissions("exceptions.read")
  @UsePipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  )
  async getAuthorityAlerts(@Query() query: BookingAuthorityAlertsQueryDto) {
    const toIso = new Date();
    let updatedAtGte: Date;
    if (query.updatedSince?.trim()) {
      updatedAtGte = new Date(query.updatedSince.trim());
    } else {
      const hours =
        query.windowHours ?? AuthorityAdminController.AUTHORITY_DEFAULT_WINDOW_HOURS;
      updatedAtGte = new Date(toIso.getTime() - hours * 60 * 60 * 1000);
    }
    return this.bookingAuthorityAlerts.evaluateAlerts({
      updatedAtGte,
      toIso,
      minSampleSize: query.minSampleSize ?? 10,
      overrideRateHighThreshold: query.overrideRateHighThreshold ?? 0.3,
      reviewRateLowThreshold: query.reviewRateLowThreshold ?? 0.02,
      mismatchTypeMinCount: query.mismatchTypeMinCount ?? 8,
      unstableTagScoreMin: query.unstableTagScoreMin ?? 10,
      topLimit: query.topLimit ?? 20,
    });
  }

  @Get("fo-feedback-summary")
  @AdminPermissions("exceptions.read")
  @UsePipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  )
  async getFoAuthorityFeedbackSummary(@Query() query: BookingAuthorityScopedQueryDto) {
    const toIso = new Date();
    const createdAtGte = this.resolveScopedUpdatedAtGte(query);
    return this.foAuthorityKnowledgeFeedback.buildAdminFeedbackSummary({
      createdAtGte,
      toIso,
      recentLimit: query.topLimit ?? 20,
      topPathsLimit: 8,
    });
  }

  @Get("knowledge-unmapped-tags")
  @AdminPermissions("exceptions.read")
  @UsePipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  )
  async getKnowledgeUnmappedTags(@Query() query: BookingAuthorityUnmappedTagsQueryDto) {
    const toIso = new Date();
    let updatedAtGte: Date;
    if (query.updatedSince?.trim()) {
      updatedAtGte = new Date(query.updatedSince.trim());
    } else if (query.windowHours != null) {
      updatedAtGte = new Date(
        toIso.getTime() - query.windowHours * 60 * 60 * 1000,
      );
    } else {
      updatedAtGte = this.defaultAuthorityWindowStart();
    }
    return this.bookingAuthorityUnmappedTags.buildUnmappedTagsSummary({
      updatedAtGte,
      toIso,
      maxRowsScan: query.maxRowsScan ?? 400,
    });
  }

  @Post("bookings/:bookingId/recompute")
  @AdminPermissions("exceptions.write")
  async recomputeAuthorityForBooking(@Param("bookingId") bookingId: string) {
    return this.bookingAuthorityRecompute.recomputeForBooking(bookingId);
  }

  @Get("learning-activity")
  @AdminPermissions("exceptions.read")
  @UsePipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  )
  async getAuthorityLearningActivity(@Query() query: BookingAuthorityLearningExportQueryDto) {
    const offset = query.offset ?? 0;
    const limit = query.limit ?? 50;
    const toIso = new Date();
    let updatedAtGte: Date | undefined;
    if (query.updatedSince?.trim()) {
      updatedAtGte = new Date(query.updatedSince.trim());
    } else if (query.windowHours != null) {
      updatedAtGte = new Date(
        toIso.getTime() - query.windowHours * 60 * 60 * 1000,
      );
    }
    return this.bookingAuthorityLearningExport.buildLearningActivityDataset({
      updatedAtGte,
      toIso,
      skip: offset,
      take: limit,
    });
  }

  @Get("results")
  @AdminPermissions("exceptions.read")
  @UsePipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  )
  async listPersistedAuthorityResults(
    @Query() query: ListBookingAuthorityResultsQueryDto,
  ) {
    const offset = query.offset ?? 0;
    const limit = query.limit ?? 50;
    const { items, total } =
      await this.bookingAuthorityPersistence.listPersisted({
        status: query.status,
        skip: offset,
        take: limit,
      });
    return {
      kind: "booking_authority_results" as const,
      total,
      offset,
      limit,
      items: items.map(toBookingAuthorityListItem),
    };
  }

  @Get("bookings/:bookingId/result")
  @AdminPermissions("exceptions.read")
  async getPersistedAuthorityResult(@Param("bookingId") bookingId: string) {
    const row = await this.bookingAuthorityPersistence.findLatestByBookingId(
      bookingId,
    );
    if (!row) {
      throw new NotFoundException("BOOKING_AUTHORITY_RESULT_NOT_FOUND");
    }
    return toBookingAuthorityResultAdminResponse(row);
  }

  @Post("bookings/:bookingId/review")
  @AdminPermissions("exceptions.write")
  @UsePipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  )
  async markAuthorityResultReviewed(
    @Param("bookingId") bookingId: string,
    @Body(new DefaultValuePipe({})) body: MarkAuthorityReviewBodyDto,
    @Req() req: AuthedRequest,
  ) {
    const reviewerUserId = String(req.user?.userId ?? "").trim();
    const updated = await this.bookingAuthorityPersistence.markAuthorityResultReviewed(
      bookingId,
      reviewerUserId,
    );
    if (body.mismatchType != null) {
      await this.bookingAuthorityMismatch.createMismatchRecord({
        bookingId,
        authorityResultId: updated.id,
        mismatchType: body.mismatchType,
        notes: body.mismatchNotes ?? null,
        actorUserId: reviewerUserId,
      });
    }
    return toBookingAuthorityResultAdminResponse(updated);
  }

  @Post("bookings/:bookingId/override")
  @AdminPermissions("exceptions.write")
  @UsePipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  )
  async overrideAuthorityTags(
    @Param("bookingId") bookingId: string,
    @Body() body: OverrideBookingAuthorityTagsDto,
    @Req() req: AuthedRequest,
  ) {
    const reviewerUserId = String(req.user?.userId ?? "").trim();
    const updated = await this.bookingAuthorityPersistence.applyAuthorityTagOverride(
      bookingId,
      {
        surfaces: body.surfaces,
        problems: body.problems,
        methods: body.methods,
        overrideReasons: body.overrideReasons,
      },
      reviewerUserId,
    );
    if (body.mismatchType != null) {
      await this.bookingAuthorityMismatch.createMismatchRecord({
        bookingId,
        authorityResultId: updated.id,
        mismatchType: body.mismatchType,
        notes: body.mismatchNotes ?? null,
        actorUserId: reviewerUserId,
      });
    }
    return toBookingAuthorityResultAdminResponse(updated);
  }
}
