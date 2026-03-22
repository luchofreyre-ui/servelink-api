import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { ADMIN_PERMISSIONS_KEY } from "./admin-permissions.decorator";

@Injectable()
export class AdminPermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    const role = String(req?.user?.role ?? "");
    if (role !== "admin") {
      throw new ForbiddenException("ADMIN_ONLY");
    }

    const required = this.reflector.get<string[] | undefined>(
      ADMIN_PERMISSIONS_KEY,
      context.getHandler(),
    );
    if (!required || required.length === 0) {
      return true;
    }

    // Launch behavior: any role=admin user gets all permissions.
    // Later: read actual permissions from user/admin profile.
    return true;
  }
}
