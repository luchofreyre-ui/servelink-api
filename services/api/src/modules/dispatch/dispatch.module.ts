import { Module } from "@nestjs/common";
import { FoModule } from "../fo/fo.module";
import { DispatchFoController } from "./dispatch.fo.controller";
import { DispatchService } from "./dispatch.service";
import { DispatchWorker } from "./dispatch.worker";

@Module({
  imports: [FoModule],
  controllers: [DispatchFoController],
  providers: [DispatchService, DispatchWorker],
  exports: [DispatchService],
})
export class DispatchModule {}
