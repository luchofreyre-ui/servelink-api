import { Module } from "@nestjs/common";
import { PrismaModule } from "../../prisma.module";
import { DeepCleanEstimatorConfigService } from "./deep-clean-estimator-config.service";

@Module({
  imports: [PrismaModule],
  providers: [DeepCleanEstimatorConfigService],
  exports: [DeepCleanEstimatorConfigService],
})
export class DeepCleanEstimatorConfigModule {}
