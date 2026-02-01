import { Controller, Get, Req, UseGuards } from "@nestjs/common";
import { Request } from "express";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";

@Controller("/api/v1")
export class MeController {
  @UseGuards(JwtAuthGuard)
  @Get("/me")
  me(@Req() req: Request) {
    const user = (req as any).user;
    return {
      user_id: user.userId,
      role: user.role,
      // we’ll wire real permissions later (RBAC). For now, keep it stable:
      permissions: [],
    };
  }
}
