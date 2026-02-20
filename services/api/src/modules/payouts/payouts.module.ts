import { Module } from "@nestjs/common";

import { LedgerModule } from "../ledger/ledger.module";
import { PayoutsService } from "./payouts.service";
import { PayoutsAdminController } from "./payouts.admin.controller";

@Module({
  imports: [LedgerModule],
  controllers: [PayoutsAdminController],
  providers: [PayoutsService],
  exports: [PayoutsService],
})
export class PayoutsModule {}
