import { Controller, Get } from "@nestjs/common";

import { buildApiRuntimeVersion } from "./runtime-version";

@Controller("/api/v1/system")
export class RuntimeVersionController {
  @Get("version")
  version() {
    return buildApiRuntimeVersion();
  }
}
