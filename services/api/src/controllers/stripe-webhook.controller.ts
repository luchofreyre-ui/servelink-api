import { Controller, Headers, Post, Req } from "@nestjs/common";

@Controller("/api/v1/webhooks")
export class StripeWebhookController {
  @Post("stripe")
  async handleStripeWebhook(
    @Req() req: any,
    @Headers("stripe-signature") stripeSignature?: string,
  ) {
    // With express.raw(), req.body is a Buffer.
    // For now we just parse it (no signature verification yet).
    let parsed: any = null;

    try {
      const body = req?.body;
      if (Buffer.isBuffer(body)) {
        const text = body.toString("utf8");
        parsed = text ? JSON.parse(text) : null;
      } else if (typeof body === "string") {
        parsed = body ? JSON.parse(body) : null;
      } else {
        parsed = body ?? null;
      }
    } catch {
      parsed = null;
    }

    return {
      ok: true,
      verified: false,
      received: {
        signature_header_present: Boolean(stripeSignature),
        event_id: parsed?.id ?? null,
        event_type: parsed?.type ?? null,
      },
    };
  }
}
