import { Module } from "@nestjs/common";
import { PrismaModule } from "../../prisma.module";
import { AuthModule } from "../../auth/auth.module";
import { BookingsModule } from "../bookings/bookings.module";
import { RolesGuard } from "../../auth/roles.guard";
import { RecurringController } from "./recurring.controller";
import { RecurringOpsController } from "./recurring.ops.controller";
import { RecurringService } from "./recurring.service";
import { RecurringWorker } from "./recurring.worker";

@Module({
  imports: [PrismaModule, AuthModule, BookingsModule],
  controllers: [RecurringController, RecurringOpsController],
  providers: [RecurringService, RecurringWorker, RolesGuard],
  exports: [RecurringService],
})
export class RecurringModule {}
