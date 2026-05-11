import {
  BadRequestException,
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  UnauthorizedException,
  UseGuards,
} from "@nestjs/common";
import { JwtAuthGuard } from "../../auth/jwt-auth.guard";
import { AdminGuard } from "../../guards/admin.guard";
import { AdminPermissions } from "../../common/admin/admin-permissions.decorator";
import { AdminPermissionsGuard } from "../../common/admin/admin-permissions.guard";
import { summarizeBreakdownForAdmin } from "../../estimating/confidence/estimate-confidence-explanations";
import type { EstimateConfidenceComparisonHints } from "../../estimating/confidence/estimate-confidence-breakdown.types";
import type { EstimateInput } from "./estimator.service";
import { EstimatorService } from "./estimator.service";

type AuthedRequest = {
  user?: { userId?: string; role?: string; email?: string };
};

function extractEstimatePayload(body: Record<string, unknown>): {
  input: EstimateInput;
  hints?: EstimateConfidenceComparisonHints;
} {
  const hintsRaw = body.comparisonHints;
  const hints =
    hintsRaw != null && typeof hintsRaw === "object"
      ? (hintsRaw as EstimateConfidenceComparisonHints)
      : undefined;

  const wrapped = body.estimateInput;
  if (wrapped != null && typeof wrapped === "object") {
    return { input: wrapped as EstimateInput, hints };
  }

  const { comparisonHints: _c, estimateInput: _e, ...rest } = body;
  return { input: rest as EstimateInput, hints };
}

@Controller("api/v1/admin/estimate-confidence")
@UseGuards(JwtAuthGuard, AdminGuard, AdminPermissionsGuard)
export class EstimateConfidenceAdminController {
  constructor(private readonly estimator: EstimatorService) {}

  /**
   * Internal diagnostics: domain-level confidence decomposition + uncertainty drivers.
   * Accepts either `{ estimateInput: {...} }` or a raw EstimateInput payload (parity with preview).
   */
  @Post("decompose")
  @AdminPermissions("exceptions.read")
  @HttpCode(HttpStatus.OK)
  async decompose(@Req() req: AuthedRequest, @Body() body: unknown) {
    if (!req.user?.userId) {
      throw new UnauthorizedException();
    }
    if (!body || typeof body !== "object") {
      throw new BadRequestException("Body must be a JSON object");
    }

    const raw = body as Record<string, unknown>;
    const includeMaintenanceStateEvolution =
      raw.includeMaintenanceStateEvolution === true;
    const { input, hints } = extractEstimatePayload(raw);

    try {
      const result = await this.estimator.estimate(input, {
        confidenceComparisonHints: hints,
      });

      const weakest = summarizeBreakdownForAdmin(result.confidenceBreakdown);

      const topUncertaintyDrivers = [
        ...new Set([
          ...result.confidenceBreakdown.conditionConfidence.uncertaintyDrivers,
          ...result.confidenceBreakdown.clutterConfidence.uncertaintyDrivers,
          ...result.confidenceBreakdown.kitchenConfidence.uncertaintyDrivers,
          ...result.confidenceBreakdown.bathroomConfidence.uncertaintyDrivers,
          ...result.confidenceBreakdown.petConfidence.uncertaintyDrivers,
          ...result.confidenceBreakdown.recencyConfidence.uncertaintyDrivers,
          ...result.confidenceBreakdown.recurringTransitionConfidence.uncertaintyDrivers,
          ...result.confidenceBreakdown.customerConsistencyConfidence.uncertaintyDrivers,
          ...result.confidenceBreakdown.scopeCompletenessConfidence.uncertaintyDrivers,
        ]),
      ].sort((a, b) => a.localeCompare(b));

      const reg = result.recurringEconomicsGovernance ?? null;
      const recurringEconomicSummary = reg
        ? {
            economicRiskLevel: reg.economicRiskLevel,
            maintenanceViability: reg.maintenanceViability,
            recurringDiscountRisk: reg.recurringDiscountRisk,
            resetReviewRecommendation: reg.resetReviewRecommendation,
            marginProtectionSignal: reg.marginProtectionSignal,
            riskScore: reg.riskScore,
            recommendedActionCount: reg.recommendedActions.length,
          }
        : null;
      const recurringEconomicActions = reg?.recommendedActions ?? [];
      const recurringEconomicReasons = reg
        ? [...new Set([...reg.economicReasons, ...reg.maintenanceReasons])].sort(
            (a, b) => a.localeCompare(b),
          )
        : [];

      return {
        kind: "estimate_confidence_admin_decomposition" as const,
        aggregateConfidence: result.confidence,
        confidenceBreakdown: result.confidenceBreakdown,
        escalationGovernance: result.escalationGovernance,
        recurringEconomicsGovernance: reg,
        recurringEconomicSummary,
        recurringEconomicActions,
        recurringEconomicReasons,
        recommendedAdminActions: result.escalationGovernance?.recommendedActions ?? [],
        blockingReasons: result.escalationGovernance?.blockingReasons ?? [],
        topUncertaintyDrivers,
        adminSummary: weakest,
        recurringInstabilityWarnings:
          result.confidenceBreakdown.recurringTransitionConfidence.reasoning,
        intakeIncompleteness: {
          scopeDrivers:
            result.confidenceBreakdown.scopeCompletenessConfidence.uncertaintyDrivers,
          sparseEvidence:
            result.confidenceBreakdown.scopeCompletenessConfidence.evidenceSignals,
        },
        estimatorFlags: result.flags,
        riskPercentUncapped: result.riskPercentUncapped,
        ...(includeMaintenanceStateEvolution
          ? {
              maintenanceStateEvolution: result.maintenanceStateEvolution ?? null,
              maintenanceShadowSummary:
                result.maintenanceStateEvolution?.adminShadowSummary ?? null,
            }
          : {}),
      };
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Confidence decomposition failed";
      throw new BadRequestException(message);
    }
  }
}
