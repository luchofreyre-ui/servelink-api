import { Module } from "@nestjs/common";
import { PrismaModule } from "../prisma.module";
import { BookingsModule } from "../modules/bookings/bookings.module";
import { DispatchModule } from "../modules/dispatch/dispatch.module";
import { DevController } from "./dev.controller";
import { DevService } from "./dev.service";

@Module({
  imports: [PrismaModule, BookingsModule, DispatchModule],
  controllers: [DevController],
  providers: [DevService],
})
export class DevModule {}
