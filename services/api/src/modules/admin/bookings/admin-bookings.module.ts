import { Module } from "@nestjs/common";
import { PrismaModule } from "../../../prisma.module";
import { AdminPermissionsGuard } from "../../../common/admin/admin-permissions.guard";
import { AuthorityModule } from "../../authority/authority.module";
import { PaymentReliabilityModule } from "../../bookings/payment-reliability/payment-reliability.module";
import { AdminPaymentsController } from "../payments/admin-payments.controller";
import { AdminBookingsController } from "./admin-bookings.controller";
import { AdminBookingsService } from "./admin-bookings.service";
import { AdminBookingFunnelMilestonesService } from "./admin-booking-funnel-milestones.service";

@Module({
  imports: [PrismaModule, AuthorityModule, PaymentReliabilityModule],
  controllers: [AdminBookingsController, AdminPaymentsController],
  providers: [
    AdminBookingsService,
    AdminBookingFunnelMilestonesService,
    AdminPermissionsGuard,
  ],
  exports: [AdminBookingsService],
})
export class AdminBookingsModule {}
