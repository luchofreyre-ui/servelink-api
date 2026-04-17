import { Module } from "@nestjs/common";
import { TenantModule } from "../tenant/tenant.module";
import { LifecycleOrchestratorService } from "./lifecycle-orchestrator.service";

@Module({
  imports: [TenantModule],
  providers: [LifecycleOrchestratorService],
  exports: [LifecycleOrchestratorService],
})
export class LifecycleModule {}
