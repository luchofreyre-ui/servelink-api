import { Injectable, NotFoundException, ConflictException } from "@nestjs/common";
import { PrismaService } from "../../prisma";

@Injectable()
export class ProviderDispatchResolverService {
  constructor(private readonly db: PrismaService) {}

  async resolveFoIdForProvider(providerId: string): Promise<string> {
    const fo = await this.db.franchiseOwner.findFirst({
      where: {
        providerId,
        status: "active",
        safetyHold: false,
      },
      select: { id: true, providerId: true },
    });

    if (!fo) {
      throw new NotFoundException("DISPATCH_PROVIDER_FO_NOT_FOUND");
    }

    if (!fo.providerId) {
      throw new ConflictException("DISPATCH_PROVIDER_LINK_INVALID");
    }

    return fo.id;
  }
}
