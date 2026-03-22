import { Module } from "@nestjs/common";
import { PrismaModule } from "../../prisma.module";
import { AuthModule } from "../../auth/auth.module";
import { AdminGuard } from "../../guards/admin.guard";
import { AdminPermissionsGuard } from "../../common/admin/admin-permissions.guard";
import { DispatchOpsService } from "../bookings/dispatch-ops.service";
import { BookingDispatchControlService } from "../bookings/booking-dispatch-control.service";
import { BookingReviewControlService } from "../bookings/booking-review-control.service";
import { AdminDispatchDecisionsController } from "./admin-dispatch-decisions.controller";
import { AdminDispatchDecisionsService } from "./admin-dispatch-decisions.service";
import { AdminDispatchDecisionsExecutionService } from "./admin-dispatch-decisions.execution.service";
import { AdminDispatchDecisionsExecutionAdapter } from "./admin-dispatch-decisions.execution.adapter";

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [AdminDispatchDecisionsController],
  providers: [
    AdminDispatchDecisionsService,
    AdminDispatchDecisionsExecutionService,
    AdminDispatchDecisionsExecutionAdapter,
    DispatchOpsService,
    BookingDispatchControlService,
    BookingReviewControlService,
    AdminGuard,
    AdminPermissionsGuard,
  ],
  exports: [AdminDispatchDecisionsService, AdminDispatchDecisionsExecutionService],
})
export class AdminDispatchDecisionsModule {}
