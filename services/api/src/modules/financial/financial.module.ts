import { Module } from "@nestjs/common";
import { PrismaModule } from "../../prisma.module";
import { LedgerModule } from "../ledger/ledger.module";
import { FinancialService } from "./financial.service";

@Module({
  imports: [PrismaModule, LedgerModule],
  providers: [FinancialService],
  exports: [FinancialService],
})
export class FinancialModule {}
