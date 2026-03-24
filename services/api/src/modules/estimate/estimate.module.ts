import { Module } from "@nestjs/common";
import { FoModule } from "../fo/fo.module";
import { DeepCleanEstimatorConfigModule } from "../bookings/deep-clean-estimator-config.module";
import { EstimatorService } from "./estimator.service";
import { EstimatePreviewController } from "./estimate-preview.controller";

@Module({
  imports: [FoModule, DeepCleanEstimatorConfigModule],
  controllers: [EstimatePreviewController],
  providers: [EstimatorService],
  exports: [EstimatorService],
})
export class EstimateModule {}
