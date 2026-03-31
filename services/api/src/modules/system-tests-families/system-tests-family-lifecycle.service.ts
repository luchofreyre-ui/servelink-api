import { Injectable } from "@nestjs/common";
import type { Prisma } from "@prisma/client";

import { PrismaService } from "../../prisma";
import {
  buildSystemTestFamilyLifecycle,
  type LifecycleRunPoint,
  type SystemTestFamilyLifecycleDto,
} from "../system-tests/system-test-family-lifecycle";

@Injectable()
export class SystemTestsFamilyLifecycleService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Loads the latest N runs once, membership rows for those runs (optionally scoped to familyIds),
   * and returns lifecycle DTOs per family. No per-family queries.
   */
  async buildFamilyLifecycleMap(
    familyIds: string[],
    params?: { runLimit?: number },
  ): Promise<Map<string, SystemTestFamilyLifecycleDto>> {
    const runLimit = params?.runLimit ?? 10;
    const runs = await this.prisma.systemTestRun.findMany({
      orderBy: { createdAt: "desc" },
      take: runLimit,
      select: { id: true, createdAt: true },
    });

    const result = new Map<string, SystemTestFamilyLifecycleDto>();
    if (runs.length === 0) {
      const emptyDto = buildSystemTestFamilyLifecycle([]);
      for (const id of familyIds) {
        result.set(id, emptyDto);
      }
      return result;
    }

    const runIds = runs.map((r) => r.id);
    const whereMembership: Prisma.SystemTestFailureFamilyMembershipWhereInput = {
      runId: { in: runIds },
      ...(familyIds.length > 0 ? { familyId: { in: familyIds } } : {}),
    };

    const memberships = await this.prisma.systemTestFailureFamilyMembership.findMany({
      where: whereMembership,
      select: { familyId: true, runId: true },
    });

    const presenceByFamily = new Map<string, Set<string>>();
    for (const m of memberships) {
      if (!presenceByFamily.has(m.familyId)) {
        presenceByFamily.set(m.familyId, new Set());
      }
      presenceByFamily.get(m.familyId)!.add(m.runId);
    }

    for (const fid of familyIds) {
      const present = presenceByFamily.get(fid);
      const points: LifecycleRunPoint[] = runs.map((run) => ({
        runId: run.id,
        startedAt: run.createdAt,
        hasFamily: present?.has(run.id) ?? false,
      }));
      result.set(fid, buildSystemTestFamilyLifecycle(points));
    }

    return result;
  }
}
