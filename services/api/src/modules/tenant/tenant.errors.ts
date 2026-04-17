import { BadRequestException } from "@nestjs/common";

export class InvalidTenantException extends BadRequestException {
  constructor(tenantId: string) {
    super(`Unknown tenantId: ${tenantId}`);
  }
}

export class MissingTenantContextException extends BadRequestException {
  constructor(context: string) {
    super(`Missing tenant context: ${context}`);
  }
}
