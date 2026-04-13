import { Module } from "@nestjs/common";
import { PrismaModule } from "../../prisma.module";
import { AuthModule } from "../../auth/auth.module";
import { AdminPermissionsGuard } from "../../common/admin/admin-permissions.guard";
import { BookingsModule } from "../bookings/bookings.module";
import { EstimateModule } from "../estimate/estimate.module";
import { BookingDirectionIntakeService } from "./booking-direction-intake.service";
import { BookingDirectionIntakePublicController } from "./booking-direction-intake.public.controller";
import { BookingDirectionIntakeSubmitController } from "./booking-direction-intake-submit.controller";
import { AdminBookingDirectionIntakeController } from "./admin-booking-direction-intake.controller";
import { IntakeBookingBridgeService } from "./intake-booking-bridge.service";

@Module({
  imports: [PrismaModule, AuthModule, BookingsModule, EstimateModule],
  controllers: [
    BookingDirectionIntakePublicController,
    BookingDirectionIntakeSubmitController,
    AdminBookingDirectionIntakeController,
  ],
  providers: [
    BookingDirectionIntakeService,
    IntakeBookingBridgeService,
    AdminPermissionsGuard,
  ],
  exports: [BookingDirectionIntakeService, IntakeBookingBridgeService],
})
export class BookingDirectionIntakeModule {}
