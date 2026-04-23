import { Module } from "@nestjs/common";
import { PrismaModule } from "../../prisma.module";
import { EstimateAccuracyAdminController } from "./estimate-accuracy.admin.controller";
import { EstimateAccuracyService } from "./estimate-accuracy.service";

@Module({
  imports: [PrismaModule],
  controllers: [EstimateAccuracyAdminController],
  providers: [EstimateAccuracyService],
  exports: [EstimateAccuracyService],
})
export class EstimateAccuracyModule {}
