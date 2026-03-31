import { Injectable, NotFoundException } from "@nestjs/common";
import { SystemTestFamilyOperatorState } from "@prisma/client";

import { PrismaService } from "../../prisma";
import {
  toSystemTestFamilyOperatorStateDto,
  type SystemTestFamilyOperatorStateDto,
  type SystemTestFamilyOperatorStateValue,
} from "../system-tests/system-test-family-operator-state";

@Injectable()
export class SystemTestsFamilyOperatorStateService {
  constructor(private readonly prisma: PrismaService) {}

  async updateFamilyOperatorState(
    familyId: string,
    actorUserId: string,
    input: {
      state: SystemTestFamilyOperatorStateValue;
      note?: string | null;
    },
  ): Promise<SystemTestFamilyOperatorStateDto> {
    const exists = await this.prisma.systemTestFailureFamily.findUnique({
      where: { id: familyId },
      select: { id: true },
    });
    if (!exists) {
      throw new NotFoundException(`SYSTEM_TEST_FAMILY_NOT_FOUND:${familyId}`);
    }

    const prismaState =
      input.state === "acknowledged" ? SystemTestFamilyOperatorState.acknowledged
      : input.state === "dismissed" ? SystemTestFamilyOperatorState.dismissed
      : SystemTestFamilyOperatorState.open;

    const updated = await this.prisma.systemTestFailureFamily.update({
      where: { id: familyId },
      data: {
        operatorState: prismaState,
        operatorStateUpdatedAt: new Date(),
        operatorStateUpdatedById: actorUserId,
        operatorStateNote: input.note ?? null,
      },
    });

    return toSystemTestFamilyOperatorStateDto(updated);
  }
}
