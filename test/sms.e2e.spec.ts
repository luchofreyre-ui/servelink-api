import request from 'supertest';
import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from '../src/app.module';
import { prisma } from '../src/prisma';

describe('SMS confirmation flow (E2E)', () => {
  let app: INestApplication;

  const runId = Date.now();
  const phone = `+1918${String(runId).slice(-7)}`;

  let testUserId: string;
  let testBookingId: string;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();

    const user = await prisma.user.create({
      data: {
        email: `test_sms_${runId}@servelink.local`,
        phone,
        passwordHash: 'test_hash',
        role: 'customer',
      },
    });

    testUserId = user.id;

    const booking = await prisma.booking.create({
      data: {
        customerId: testUserId,
        hourlyRateCents: 5000,
        estimatedHours: 2,
        currency: 'usd',
        status: 'pending_payment',
        notes: '',
      },
    });

    testBookingId = booking.id;
  });

  afterAll(async () => {
    await prisma.bookingAddon.deleteMany({ where: { bookingId: testBookingId } }).catch(() => undefined);
    await prisma.smsConfirmation.deleteMany({ where: { phone } }).catch(() => undefined);
    await prisma.booking.deleteMany({ where: { customerId: testUserId } }).catch(() => undefined);
    await prisma.user.deleteMany({ where: { id: testUserId } }).catch(() => undefined);

    if (app) await app.close();
  });

  it('approves addon and stores priceCents; stripe billing is conditional', async () => {
    const createRes = await request(app.getHttpServer())
      .post('/api/v1/sms/create-addon')
      .send({
        phone,
        addon: { type: 'deep_clean', bookingId: testBookingId, priceCents: 2500, currency: 'usd' },
      })
      .expect(201);

    const code = createRes.body.code;
    expect(code).toBeDefined();

    const inboundRes = await request(app.getHttpServer())
      .post('/api/v1/sms/inbound')
      .send({ from: phone, body: `YES ${code}` })
      .expect(201);

    expect(inboundRes.body.result?.status).toBe('approved');
    expect(inboundRes.body.result?.applied).toBe(true);

    const addonRow = await prisma.bookingAddon.findUnique({ where: { smsCode: code } });
    expect(addonRow).toBeTruthy();
    expect(addonRow?.bookingId).toBe(testBookingId);
    expect(addonRow?.type).toBe('deep_clean');
    expect(addonRow?.priceCents).toBe(2500);
    expect(addonRow?.currency).toBe('usd');
  });
});
