import { Injectable } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { JwtAccessPayload } from "./jwt.types";

export type JwtValidatedUser = JwtAccessPayload & { userId: string };

function requiredEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: requiredEnv("JWT_ACCESS_SECRET"),
    });
  }

  async validate(payload: any) {
    // passport-jwt includes standard claims like `sub`
    return { userId: String(payload.sub), email: payload.email, role: payload.role };
  }
}
