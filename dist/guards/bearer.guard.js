"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BearerAuthGuard = void 0;
const common_1 = require("@nestjs/common");
let BearerAuthGuard = class BearerAuthGuard {
    canActivate(context) {
        const req = context.switchToHttp().getRequest();
        const auth = req.headers["authorization"];
        if (!auth || typeof auth !== "string") {
            throw new common_1.UnauthorizedException("Missing Authorization header");
        }
        const [scheme, token] = auth.split(" ");
        if (scheme !== "Bearer" || !token) {
            throw new common_1.UnauthorizedException("Invalid Authorization header format");
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
};
exports.BearerAuthGuard = BearerAuthGuard;
exports.BearerAuthGuard = BearerAuthGuard = __decorate([
    (0, common_1.Injectable)()
], BearerAuthGuard);
