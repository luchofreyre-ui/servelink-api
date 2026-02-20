import { Module } from "@nestjs/common";

import { LedgerService } from "./ledger.service";
import { LedgerAdminController } from "./ledger.admin.controller";

@Module({
  controllers: [LedgerAdminController],
  providers: [LedgerService],
  exports: [LedgerService],
})
export class LedgerModule {}
