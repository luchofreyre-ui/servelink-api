import { Module } from "@nestjs/common";
import { FoModule } from "../fo/fo.module";
import { DeepCleanEstimatorConfigModule } from "../bookings/deep-clean-estimator-config.module";
import { EstimatorService } from "./estimator.service";
import { EstimateEngineV2Service } from "./estimate-engine-v2.service";
import { EstimateLearningService } from "./estimate-learning.service";
import { EstimatePreviewController } from "./estimate-preview.controller";
import { EstimateConfidenceAdminController } from "./estimate-confidence.admin.controller";

@Module({
  imports: [FoModule, DeepCleanEstimatorConfigModule],
  controllers: [EstimatePreviewController, EstimateConfidenceAdminController],
  providers: [EstimatorService, EstimateEngineV2Service, EstimateLearningService],
  exports: [EstimatorService, EstimateEngineV2Service, EstimateLearningService],
})
export class EstimateModule {}
