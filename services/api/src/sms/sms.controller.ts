import { Body, Controller, Get, Param, Post } from "@nestjs/common";
import { SmsService } from "./sms.service";
import { parseDecision } from "./sms.parse";

@Controller("/api/v1/sms")
export class SmsController {
  constructor(private readonly sms: SmsService) {}

  @Post("create-addon")
  async createAddon(@Body() body: { phone: string; addon: any }) {
    const created = await this.sms.createAddonConfirmation(body.phone, body.addon);
    return {
      ok: true,
      ...created,
      suggested_text: `Reply YES ${created.code} to approve, or NO ${created.code} to decline.`,
    };
  }

  @Post("inbound")
  async inbound(@Body() body: { from: string; body: string }) {
    const parsed = parseDecision(body.body);

    if (!parsed) {
      return { ok: false, error: "Expect: YES CODE or NO CODE (e.g., YES A9F3)" };
    }

    const result = await this.sms.resolveByCode(
      body.from,
      parsed.code,
      parsed.decision,
      body.body,
    );

    return {
      ok: true,
      from: body.from,
      raw: body.body,
      parsed,
      result,
    };
  }

  @Get("status/:code")
  async status(@Param("code") code: string) {
    const row = await this.sms.getByCode(String(code || "").toUpperCase());
    return { ok: true, ...row };
  }
}
