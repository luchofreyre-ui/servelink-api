import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Query,
  Req,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from "@nestjs/common";

import { JwtAuthGuard } from "../../auth/jwt-auth.guard";
import { AdminGuard } from "../../guards/admin.guard";
import { UpdateSystemTestFamilyOperatorStateDto } from "../system-tests/dto/update-system-test-family-operator-state.dto";
import {
  parseConfidenceTierParam,
  parseFamilyListSortBy,
  parseIncludeDormantParam,
  parseIncludeResolvedParam,
  parseLifecycleStateParam,
  parseShowDismissedParam,
  parseSortDirectionParam,
} from "../system-tests/system-test-resolution-preview-filters";
import { SystemTestsFamilyOperatorStateService } from "./system-tests-family-operator-state.service";
import { SystemTestsFamiliesReadService } from "./system-tests-families-read.service";

type AuthedRequest = { user: { userId: string } };

@Controller("/api/v1/admin/system-tests/families")
@UseGuards(JwtAuthGuard, AdminGuard)
export class SystemTestsFamiliesAdminController {
  constructor(
    private readonly familiesRead: SystemTestsFamiliesReadService,
    private readonly familyOperatorState: SystemTestsFamilyOperatorStateService,
  ) {}

  @Get()
  async list(
    @Query("limit") limitRaw?: string,
    @Query("status") status?: string,
    @Query("diagnosisCategory") diagnosisCategory?: string,
    @Query("confidenceTier") confidenceTierRaw?: string,
    @Query("sortBy") sortByRaw?: string,
    @Query("sortDirection") sortDirectionRaw?: string,
    @Query("showDismissed") showDismissedRaw?: string,
    @Query("lifecycleState") lifecycleStateRaw?: string,
    @Query("includeDormant") includeDormantRaw?: string,
    @Query("includeResolved") includeResolvedRaw?: string,
  ) {
    const limitParsed = limitRaw != null ? parseInt(String(limitRaw), 10) : 60;
    const limit =
      Number.isFinite(limitParsed) && limitParsed > 0 ? limitParsed : 60;
    const confidenceTier = parseConfidenceTierParam(confidenceTierRaw);
    return this.familiesRead.listFamilies({
      limit,
      status,
      diagnosisCategory: diagnosisCategory?.trim() || undefined,
      confidenceTier,
      sortBy: parseFamilyListSortBy(sortByRaw),
      sortDirection: parseSortDirectionParam(sortDirectionRaw),
      showDismissed: parseShowDismissedParam(showDismissedRaw),
      lifecycleState: parseLifecycleStateParam(lifecycleStateRaw),
      includeDormant: parseIncludeDormantParam(includeDormantRaw),
      includeResolved: parseIncludeResolvedParam(includeResolvedRaw),
    });
  }

  @Patch(":familyId/operator-state")
  @UsePipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  )
  async patchOperatorState(
    @Param("familyId") familyId: string,
    @Body() body: UpdateSystemTestFamilyOperatorStateDto,
    @Req() req: AuthedRequest,
  ) {
    return this.familyOperatorState.updateFamilyOperatorState(familyId, req.user.userId, {
      state: body.state,
      note: body.note ?? null,
    });
  }

  @Get(":id")
  async detail(@Param("id") id: string) {
    return this.familiesRead.getFamilyDetail(id);
  }
}
