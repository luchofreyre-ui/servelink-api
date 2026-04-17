import { Module } from "@nestjs/common";
import { PrismaModule } from "../../prisma.module";
import { BookingsModule } from "../bookings/bookings.module";
import { FoModule } from "../fo/fo.module";
import { SlotHoldsModule } from "../slot-holds/slot-holds.module";
import { PublicBookingOrchestratorController } from "./public-booking-orchestrator.controller";
import { PublicBookingOrchestratorService } from "./public-booking-orchestrator.service";

@Module({
  imports: [PrismaModule, SlotHoldsModule, BookingsModule, FoModule],
  controllers: [PublicBookingOrchestratorController],
  providers: [PublicBookingOrchestratorService],
  exports: [PublicBookingOrchestratorService],
})
export class PublicBookingOrchestratorModule {}
