import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma";

export enum FoStatus {
  onboarding = "onboarding",
  active = "active",
  paused = "paused",
  suspended = "suspended",
  safety_hold = "safety_hold",
  offboarded = "offboarded",
}

export type FoEligibility = {
  canAcceptBooking: boolean;
  reasons: string[]; // machine-readable codes
};

@Injectable()
export class FoService {
  constructor(private readonly db: PrismaService) {}

  async getFo(id: string) {
    const fo = await this.db.franchiseOwner.findUnique({ where: { id } });
    if (!fo) throw new NotFoundException("FO_NOT_FOUND");
    return fo;
  }

  async getEligibility(foId: string): Promise<FoEligibility> {
    const fo: any = await this.getFo(foId);

    const reasons: string[] = [];

    const status = String(fo.status ?? "").toLowerCase();
    if (status !== FoStatus.active) reasons.push("FO_NOT_ACTIVE");

    const safetyHold = Boolean(fo.safetyHold ?? false);
    if (safetyHold || status === FoStatus.safety_hold) reasons.push("FO_SAFETY_HOLD");

    // Optional future soft-delete / ban patterns (harmless if undefined)
    if (fo.isDeleted === true) reasons.push("FO_DELETED");
    if (fo.isBanned === true) reasons.push("FO_BANNED");

    return {
      canAcceptBooking: reasons.length === 0,
      reasons,
    };
  }

  async canAcceptBooking(foId: string) {
    const eligibility = await this.getEligibility(foId);
    return eligibility.canAcceptBooking;
  }
}
