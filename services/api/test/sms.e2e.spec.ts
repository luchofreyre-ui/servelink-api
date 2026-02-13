import { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import request from "supertest";
import { AppModule } from "../src/app.module";
import { PrismaService } from "../src/prisma";

describe("SMS confirmation flow (E2E)", () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const modRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = modRef.createNestApplication();
    await app.init();

    prisma = app.get(PrismaService);
  });

  afterAll(async () => {
    await app.close();
  });

  it("approves addon and stores priceCents; stripe billing is conditional", async () => {
    const phone = "+19185551234";

    // Create (or reuse) user
    let user = await prisma.user.findUnique({ where: { phone } });
    if (!user) {
      user = await prisma.user.create({
        data: {
          email: `jest_${Date.now()}@servelink.local`,
          phone,
          passwordHash: "x",
          role: "customer",
        },
      });
    }

    // Create booking
    const booking = await prisma.booking.create({
      data: {
        customerId: user.id,
        hourlyRateCents: 5000,
        estimatedHours: 2,
        currency: "usd",
        status: "pending_payment",
        notes: "",
      },
    });

    // Create addon confirmation
    const createRes = await request(app.getHttpServer())
      .post("/api/v1/sms/create-addon")
      .send({
        phone,
        addon: {
          type: "deep_clean",
          bookingId: booking.id,
          priceCents: 2500,
          currency: "usd",
        },
      })
      .expect(201);

    expect(createRes.body.ok).toBe(true);
    expect(typeof createRes.body.code).toBe("string");

    const code = createRes.body.code as string;

    // Approve inbound
    const inboundRes = await request(app.getHttpServer())
      .post("/api/v1/sms/inbound")
      .send({ from: phone, body: `YES ${code}` })
      .expect(201);

    expect(inboundRes.body.ok).toBe(true);
    expect(inboundRes.body.result?.applied).toBe(true);

    // Verify BookingAddon row
    const addon = await prisma.bookingAddon.findUnique({ where: { smsCode: code } });
    expect(addon).toBeTruthy();
    expect(addon?.bookingId).toBe(booking.id);
    expect(addon?.type).toBe("deep_clean");
    expect(addon?.priceCents).toBe(2500);
    expect(addon?.currency).toBe("usd");
  });
});
