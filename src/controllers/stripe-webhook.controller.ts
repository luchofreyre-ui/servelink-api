import { Controller, Headers, Post, Req } from "@nestjs/common";

type AnyRecord = Record<string, any>;

@Controller("/api/v1/webhooks")
export class StripeWebhookController {
  @Post("stripe")
  async handleStripeWebhook(
    @Req() req: any,
    @Headers("stripe-signature") stripeSignature?: string,
  ) {
    // NOTE: We are not verifying Stripe signatures yet.
    // Prefer rawBody if middleware captured it; otherwise fall back to parsing req.body.

    const rawBody = req?.rawBody;
    const hasRawBody = Buffer.isBuffer(rawBody);

    let event: AnyRecord = {};

    try {
      const body = hasRawBody ? rawBody : req?.body;

      if (Buffer.isBuffer(body)) {
        const text = body.toString("utf8");
        event = (text ? JSON.parse(text) : {}) as AnyRecord;
      } else if (typeof body === "string") {
        event = (body ? JSON.parse(body) : {}) as AnyRecord;
      } else if (body && typeof body === "object") {
        event = body as AnyRecord;
      } else {
        event = {};
      }
    } catch {
      event = {};
    }

    return {
      ok: true,
      verified: false,
      received: {
        has_raw_body: hasRawBody,
        signature_header_present: Boolean(stripeSignature),
        event_id: event?.id ?? null,
        event_type: event?.type ?? null,
      },
    };
  }
}
