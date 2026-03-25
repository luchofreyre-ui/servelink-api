import {
  Controller,
  ForbiddenException,
  Get,
  Query,
  Req,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from "@nestjs/common";
import { JwtAuthGuard } from "../../auth/jwt-auth.guard";
import { KnowledgeQuickSolveQueryDto } from "./dto/knowledge.dto";
import { KnowledgeService } from "./knowledge.service";

type FoRequest = { user?: { userId?: string; role?: string } };

@Controller("api/v1/fo/knowledge")
@UseGuards(JwtAuthGuard)
export class KnowledgeFoController {
  constructor(private readonly knowledgeService: KnowledgeService) {}

  @Get("surfaces")
  listSurfaces(@Req() req: FoRequest) {
    const role = String(req.user?.role ?? "");
    if (role !== "fo") {
      throw new ForbiddenException("FO_ONLY");
    }
    return this.knowledgeService.listSurfaces();
  }

  @Get("problems")
  listProblems(@Req() req: FoRequest) {
    const role = String(req.user?.role ?? "");
    if (role !== "fo") {
      throw new ForbiddenException("FO_ONLY");
    }
    return this.knowledgeService.listProblems();
  }

  @Get("methods")
  listMethods(@Req() req: FoRequest) {
    const role = String(req.user?.role ?? "");
    if (role !== "fo") {
      throw new ForbiddenException("FO_ONLY");
    }
    return this.knowledgeService.listMethods();
  }

  @Get("quick-solve")
  @UsePipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  )
  resolveQuickSolve(@Query() query: KnowledgeQuickSolveQueryDto, @Req() req: FoRequest) {
    const role = String(req.user?.role ?? "");
    if (role !== "fo") {
      throw new ForbiddenException("FO_ONLY");
    }
    return this.knowledgeService.resolveQuickSolve({
      surfaceId: query.surfaceId as never,
      problemId: query.problemId as never,
      severity: query.severity,
    });
  }
}
