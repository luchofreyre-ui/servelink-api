import { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import request from "supertest";
import * as bcrypt from "bcrypt";
import { AppModule } from "../src/app.module";
import { PrismaService } from "../src/prisma";
import { Role } from "@prisma/client";

jest.setTimeout(25000);

describe("Booking commercial fields (E2E)", () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let customerToken: string;

  beforeAll(async () => {
    const modRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = modRef.createNestApplication();
    await app.init();

    prisma = app.get(PrismaService);

    const passwordHash = await bcrypt.hash("test-password", 10);
    const customerEmail = `comm_${Date.now()}@servelink.local`;
    await prisma.user.create({
      data: { email: customerEmail, passwordHash, role: Role.customer },
    });

    const login = await request(app.getHttpServer())
      .post("/api/v1/auth/login")
      .send({ email: customerEmail, password: "test-password" })
      .expect(201);

    customerToken = login.body?.accessToken;
    expect(customerToken).toBeTruthy();
  });

  afterAll(async () => {
    await app.close();
  });

  const estimateInput = {
    property_type: "house",
    sqft_band: "1200_1599",
    bedrooms: "3",
    bathrooms: "2",
    floors: "1",
    service_type: "maintenance",
    first_time_with_servelink: "yes",
    last_professional_clean: "1_3_months",
    clutter_level: "light",
    kitchen_condition: "normal",
    bathroom_condition: "normal",
    pet_presence: "none",
    addons: [],
    siteLat: 36.154,
    siteLng: -95.992,
  };

  it("booking create persists quotedSubtotal, quotedMargin, quotedTotal and paymentStatus payment_pending", async () => {
    const res = await request(app.getHttpServer())
      .post("/api/v1/bookings")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({
        note: "commercial fields e2e",
        estimateInput,
      })
      .expect(201);

    const bookingId = res.body?.booking?.id as string;
    expect(bookingId).toBeTruthy();

    const row = await prisma.booking.findUnique({
      where: { id: bookingId },
    });

    expect(row?.quotedSubtotal).not.toBeNull();
    expect(row?.quotedMargin).not.toBeNull();
    expect(row?.quotedTotal).not.toBeNull();
    expect(row?.paymentStatus).toBe("payment_pending");

    expect(Number(row?.quotedSubtotal)).toBeCloseTo(
      Number(row?.priceSubtotal ?? 0),
      5,
    );
    expect(Number(row?.quotedTotal)).toBeCloseTo(
      Number(row?.priceTotal ?? 0),
      5,
    );
  });
});
