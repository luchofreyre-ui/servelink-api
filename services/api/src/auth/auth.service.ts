import { Injectable, UnauthorizedException } from "@nestjs/common";
import * as bcrypt from "bcrypt";
import { Role, Prisma } from "@prisma/client";
import { PrismaService } from "../prisma";
import { JwtService } from "@nestjs/jwt";
import { JwtAccessPayload } from "./jwt.types";

@Injectable()
export class AuthService {
  constructor(
    private readonly db: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  async register(email: string, password: string, phone?: string) {
    const passwordHash = await bcrypt.hash(password, 10);

    try {
      const user = await this.db.user.create({
        data: {
          email,
          phone: phone || null,
          passwordHash,
          role: Role.customer,
        },
      });

      return { id: user.id, email: user.email, role: user.role, phone: user.phone };
    } catch (err: any) {
      // Diligent dev/smoke behavior: idempotent register by email.
      // If email already exists, return the existing user instead of 500.
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
        const target = (err.meta as any)?.target as string[] | undefined;
        const isEmailConflict = Array.isArray(target) && target.includes("email");

        if (isEmailConflict) {
          const existing = await this.db.user.findUnique({ where: { email } });
          if (existing) {
            return {
              id: existing.id,
              email: existing.email,
              role: existing.role,
              phone: existing.phone,
            };
          }
        }
      }
      throw err;
    }
  }

  async validateUser(email: string, password: string) {
    const user = await this.db.user.findUnique({ where: { email } });

    if (!user) return null;

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return null;

    return user;
  }

  async login(email: string, password: string) {
    const user = await this.validateUser(email, password);
    if (!user) {
      throw new UnauthorizedException("Invalid credentials");
    }

    const payload: JwtAccessPayload = {
      email: user.email,
      role: user.role as any,
    };

    const accessToken = await this.jwt.signAsync(payload, {
      subject: String(user.id),
    });

    return {
      id: user.id,
      email: user.email,
      role: user.role,
      phone: user.phone,
      accessToken,
    };
  }
}
