import { Module } from "@nestjs/common";
import { FoModule } from "../fo/fo.module";
import { DispatchService } from "./dispatch.service";
import { DispatchWorker } from "./dispatch.worker";

@Module({
  imports: [FoModule],
  providers: [DispatchService, DispatchWorker],
  exports: [DispatchService],
})
export class DispatchModule {}
