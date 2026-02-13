import { Module } from "@nestjs/common";
import { FoService } from "./fo.service";

@Module({
  providers: [FoService],
  exports: [FoService],
})
export class FoModule {}
