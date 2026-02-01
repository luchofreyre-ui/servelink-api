import { Injectable, UnauthorizedException } from "@nestjs/common";
import * as bcrypt from "bcrypt";
import { Role } from "@prisma/client";
import { PrismaService } from "../prisma";

@Injectable()
export class AuthService {
  constructor(private readonly db: PrismaService) {}

  async register(email: string, password: string, phone?: string) {
    const passwordHash = await bcrypt.hash(password, 10);

    const user = await this.db.user.create({
      data: {
        email,
        phone: phone || null,
        passwordHash,
        role: Role.customer,
      },
    });

    return { id: user.id, email: user.email, role: user.role, phone: user.phone };
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

    return { id: user.id, email: user.email, role: user.role, phone: user.phone };
  }
}

