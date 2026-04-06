import { Module } from "@nestjs/common";

import { PrismaModule } from "../../../prisma.module";
import { PaymentReliabilityService } from "./payment-reliability.service";

@Module({
  imports: [PrismaModule],
  providers: [PaymentReliabilityService],
  exports: [PaymentReliabilityService],
})
export class PaymentReliabilityModule {}
