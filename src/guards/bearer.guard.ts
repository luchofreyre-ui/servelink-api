import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";

@Injectable()
export class BearerAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    const auth = req.headers["authorization"];

    if (!auth || typeof auth !== "string") {
      throw new UnauthorizedException("Missing Authorization header");
    }
    const [scheme, token] = auth.split(" ");
    if (scheme !== "Bearer" || !token) {
      throw new UnauthorizedException("Invalid Authorization header format");
    }

    // v1 stub: accept any Bearer token and attach a mock user.
    // Next step: replace with real JWT verification + user lookup.
    req.user = {
      user_id: "usr_demo",
      role: "customer",
      permissions: ["bookings:read", "bookings:write"],
      token_preview: token.slice(0, 6) + "...",
    };

    return true;
  }
}
