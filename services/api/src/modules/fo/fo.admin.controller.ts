import { Controller, Get, Param, Query } from "@nestjs/common";
import { ProviderResolverService } from "./provider-resolver.service";

@Controller("/api/v1/admin/franchise-owners")
export class FoAdminController {
  constructor(
    private readonly providerResolver: ProviderResolverService,
  ) {}

  @Get("provider-links")
  async listProviderLinks(
    @Query("limit") limitRaw?: string,
    @Query("onlyIssues") onlyIssuesRaw?: string,
  ) {
    const limit =
      limitRaw != null && limitRaw.trim() !== ""
        ? Number(limitRaw)
        : undefined;

    const onlyIssues =
      onlyIssuesRaw === "1" ||
      onlyIssuesRaw === "true";

    return this.providerResolver.listFoProviderLinks({
      limit,
      onlyIssues,
    });
  }

  @Get(":foId/provider-link")
  async getProviderLink(@Param("foId") foId: string) {
    return this.providerResolver.resolveFoProviderLink(foId);
  }
}
