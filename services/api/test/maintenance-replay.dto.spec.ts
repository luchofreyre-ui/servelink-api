import { BadRequestException } from "@nestjs/common";
import {
  parseMaintenanceReplayDto,
} from "../src/modules/maintenance-timeline/dto/maintenance-replay.dto";

describe("parseMaintenanceReplayDto", () => {
  it("rejects ambiguous inputs", () => {
    expect(() =>
      parseMaintenanceReplayDto({
        bookingId: "a",
        snapshotOutputJson: "{}",
      }),
    ).toThrow(BadRequestException);
  });

  it("defaults persistCheckpoint false", () => {
    const dto = parseMaintenanceReplayDto({ bookingId: "bk_1" });
    expect(dto.persistCheckpoint).toBe(false);
  });
});
