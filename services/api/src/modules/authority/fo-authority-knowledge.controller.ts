import {
  Body,
  Controller,
  ForbiddenException,
  Param,
  Post,
  Req,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from "@nestjs/common";
import { JwtAuthGuard } from "../../auth/jwt-auth.guard";
import { FoAuthorityKnowledgeLinksRequestDto } from "./dto/fo-authority-knowledge-links.dto";
import { FoAuthorityKnowledgeFeedbackDto } from "./dto/fo-authority-knowledge-feedback.dto";
import { FoAuthorityKnowledgeLinkService } from "./fo-authority-knowledge-link.service";
import { FoAuthorityKnowledgeFeedbackService } from "./fo-authority-knowledge-feedback.service";

type FoRequest = { user?: { userId?: string; role?: string } };

@UseGuards(JwtAuthGuard)
@Controller("api/v1/fo/authority")
export class FoAuthorityKnowledgeController {
  constructor(
    private readonly links: FoAuthorityKnowledgeLinkService,
    private readonly feedback: FoAuthorityKnowledgeFeedbackService,
  ) {}

  @Post("knowledge-links")
  @UsePipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  )
  resolveKnowledgeLinks(
    @Body() body: FoAuthorityKnowledgeLinksRequestDto,
    @Req() req: FoRequest,
  ) {
    const role = String(req.user?.role ?? "");
    if (role !== "fo") {
      throw new ForbiddenException("FO_ONLY");
    }
    return this.links.resolveLinks({
      surfaces: body.surfaces,
      problems: body.problems,
      methods: body.methods,
    });
  }

  @Post("bookings/:bookingId/knowledge-feedback")
  @UsePipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  )
  async submitKnowledgeFeedback(
    @Param("bookingId") bookingId: string,
    @Body() body: FoAuthorityKnowledgeFeedbackDto,
    @Req() req: FoRequest,
  ) {
    const role = String(req.user?.role ?? "");
    if (role !== "fo") {
      throw new ForbiddenException("FO_ONLY");
    }
    const foUserId = String(req.user?.userId ?? "").trim();
    const row = await this.feedback.submitFeedback({
      foUserId,
      bookingId,
      helpful: body.helpful,
      selectedKnowledgePath: body.selectedKnowledgePath,
      notes: body.notes,
    });
    return {
      kind: "fo_authority_knowledge_feedback" as const,
      id: row.id,
      bookingId: row.bookingId,
      helpful: row.helpful,
      createdAt: row.createdAt.toISOString(),
    };
  }
}
