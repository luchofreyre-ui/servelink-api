import { Controller, Get, Param } from "@nestjs/common";
import { EncyclopediaService } from "./encyclopedia.service";

@Controller("/api/v1/encyclopedia")
export class EncyclopediaController {
  constructor(private readonly encyclopediaService: EncyclopediaService) {}

  @Get("list")
  async list() {
    const items = await this.encyclopediaService.getAllLivePages();

    return {
      ok: true,
      items,
    };
  }

  @Get(":slug")
  async getBySlug(@Param("slug") slug: string) {
    const item = await this.encyclopediaService.getBySlug(slug);

    return {
      ok: true,
      item,
    };
  }
}
