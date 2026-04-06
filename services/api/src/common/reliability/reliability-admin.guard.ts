import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from "@nestjs/common";

@Injectable()
export class ReliabilityAdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    const role = String(req?.user?.role ?? "");

    if (role !== "admin" && role !== "system") {
      throw new ForbiddenException("ADMIN_ONLY");
    }

    return true;
  }
}
