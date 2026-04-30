import { Module } from "@nestjs/common";
import { FoModule } from "../fo/fo.module";
import { DeepCleanEstimatorConfigModule } from "../bookings/deep-clean-estimator-config.module";
import { EstimatorService } from "./estimator.service";
import { EstimateEngineV2Service } from "./estimate-engine-v2.service";
import { EstimatePreviewController } from "./estimate-preview.controller";

@Module({
  imports: [FoModule, DeepCleanEstimatorConfigModule],
  controllers: [EstimatePreviewController],
  providers: [EstimatorService, EstimateEngineV2Service],
  exports: [EstimatorService, EstimateEngineV2Service],
})
export class EstimateModule {}
