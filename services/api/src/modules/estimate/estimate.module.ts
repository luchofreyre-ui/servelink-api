import { Module } from "@nestjs/common";
import { FoModule } from "../fo/fo.module";
import { EstimatorService } from "./estimator.service";

@Module({
  imports: [FoModule],
  providers: [EstimatorService],
  exports: [EstimatorService],
})
export class EstimateModule {}
