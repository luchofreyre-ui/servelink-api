import { Module } from "@nestjs/common";
import { EstimatorService } from "./estimator.service";

@Module({
  providers: [EstimatorService],
  exports: [EstimatorService],
})
export class EstimateModule {}
