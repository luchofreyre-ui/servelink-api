import { Module } from "@nestjs/common";
import { CronRunLedgerService } from "../../common/reliability/cron-run-ledger.service";
import { FoModule } from "../fo/fo.module";
import { SlotAvailabilityService } from "./slot-availability.service";
import { SlotHoldCleanupWorker } from "./slot-hold-cleanup.worker";
import { SlotHoldsService } from "./slot-holds.service";
import { SlotHoldsMetricsController } from "./slot-holds.metrics.controller";

@Module({
  imports: [FoModule],
  controllers: [SlotHoldsMetricsController],
  providers: [
    CronRunLedgerService,
    SlotHoldsService,
    SlotAvailabilityService,
    SlotHoldCleanupWorker,
  ],
  exports: [SlotHoldsService, SlotAvailabilityService],
})
export class SlotHoldsModule {}
