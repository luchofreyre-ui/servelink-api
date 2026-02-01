import { Injectable, UnauthorizedException } from "@nestjs/common";
import * as bcrypt from "bcrypt";
import { Role } from "@prisma/client";
import { JwtService } from "@nestjs/jwt";
import { prisma } from "../prisma";

function requiredEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

@Injectable()
export class AuthService {
  constructor(private readonly jwt: JwtService) {}

  async register(email: string, password: string) {
    const passwordHash = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        role: Role.customer,
      },
    });

    const accessToken = this.jwt.sign(
      { email: user.email, role: user.role },
      {
        subject: user.id,
        expiresIn: requiredEnv("JWT_ACCESS_EXPIRES_IN") as any,
        secret: requiredEnv("JWT_ACCESS_SECRET"),
      }
    );

    return {
      user_id: user.id,
      access_token: accessToken,
    };
  }

  async login(email: string, password: string) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) throw new UnauthorizedException("Invalid credentials");

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) throw new UnauthorizedException("Invalid credentials");

    const accessToken = this.jwt.sign(
      { email: user.email, role: user.role },
      {
        subject: user.id,
        expiresIn: requiredEnv("JWT_ACCESS_EXPIRES_IN") as any,
        secret: requiredEnv("JWT_ACCESS_SECRET"),
      }
    );

    return {
      user_id: user.id,
      access_token: accessToken,
    };
  }
}
