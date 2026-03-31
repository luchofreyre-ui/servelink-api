import { Module } from "@nestjs/common";

import { PrismaModule } from "../../prisma.module";
import { SystemTestsDiagnosisService } from "./system-tests-diagnosis.service";
import { SystemTestsFamilyResolutionService } from "./system-tests-family-resolution.service";
import { SystemTestsFixService } from "./system-tests-fix.service";

@Module({
  imports: [PrismaModule],
  providers: [
    SystemTestsDiagnosisService,
    SystemTestsFixService,
    SystemTestsFamilyResolutionService,
  ],
  exports: [
    SystemTestsFamilyResolutionService,
    SystemTestsDiagnosisService,
    SystemTestsFixService,
  ],
})
export class SystemTestsFamilyResolutionModule {}
