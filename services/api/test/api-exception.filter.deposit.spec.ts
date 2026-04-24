import { HttpException, HttpStatus, ServiceUnavailableException } from "@nestjs/common";
import { ApiExceptionFilter } from "../src/filters/api-exception.filter";

describe("ApiExceptionFilter — public booking deposit payloads", () => {
  it("serializes 402 deposit-required as PAYMENT_REQUIRED with error.details", () => {
    const filter = new ApiExceptionFilter();
    const json = jest.fn();
    const status = jest.fn().mockReturnValue({ json });
    const res = { status };
    const req = {
      requestId: "r1",
      method: "POST",
      originalUrl: "/api/v1/public-booking/confirm",
    };
    const host = {
      switchToHttp: () => ({
        getResponse: () => res,
        getRequest: () => req,
      }),
    };

    filter.catch(
      new HttpException(
        {
          kind: "public_booking_deposit_required",
          code: "PUBLIC_BOOKING_DEPOSIT_REQUIRED",
          message: "A $100 deposit is required.",
          amountCents: 10_000,
          currency: "usd",
          clientSecret: "cs_test",
          paymentIntentId: "pi_test",
        },
        HttpStatus.PAYMENT_REQUIRED,
      ),
      host as any,
    );

    expect(status).toHaveBeenCalledWith(402);
    expect(json).toHaveBeenCalled();
    const body = json.mock.calls[0][0];
    expect(body.ok).toBe(false);
    expect(body.error.code).toBe("PAYMENT_REQUIRED");
    expect(body.error.message).toBe("A $100 deposit is required.");
    expect(body.error.details.kind).toBe("public_booking_deposit_required");
    expect(body.error.details.paymentIntentId).toBe("pi_test");
    expect(body.error.details.clientSecret).toBe("cs_test");
  });

  it("serializes 503 PUBLIC_BOOKING_STRIPE_NOT_CONFIGURED as STRIPE_NOT_CONFIGURED", () => {
    const filter = new ApiExceptionFilter();
    const json = jest.fn();
    const status = jest.fn().mockReturnValue({ json });
    const res = { status };
    const req = {
      requestId: "r2",
      method: "POST",
      originalUrl: "/api/v1/public-booking/confirm",
    };
    const host = {
      switchToHttp: () => ({
        getResponse: () => res,
        getRequest: () => req,
      }),
    };

    filter.catch(
      new ServiceUnavailableException({
        code: "PUBLIC_BOOKING_STRIPE_NOT_CONFIGURED",
        message: "Stripe is not configured on the server; public booking confirmation with deposit cannot proceed.",
      }),
      host as any,
    );

    expect(status).toHaveBeenCalledWith(503);
    const body = json.mock.calls[0][0];
    expect(body.ok).toBe(false);
    expect(body.error.code).toBe("STRIPE_NOT_CONFIGURED");
    expect(String(body.error.message)).toContain("Stripe");
  });
});
