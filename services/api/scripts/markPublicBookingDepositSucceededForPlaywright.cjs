/* eslint-disable @typescript-eslint/no-require-imports */
const { PrismaClient } = require("@prisma/client");

const id = process.argv[2];
if (!id) {
  console.error("usage: node scripts/markPublicBookingDepositSucceededForPlaywright.cjs <bookingId>");
  process.exit(2);
}

if (process.env.NODE_ENV === "production") {
  console.error("Refusing to mutate public booking deposit state in production.");
  process.exit(3);
}

const p = new PrismaClient();
p.booking
  .update({
    where: { id },
    data: {
      publicDepositStatus: "deposit_succeeded",
      publicDepositPaidAt: new Date(),
      publicDepositAmountCents: 10_000,
      publicDepositPaymentIntentId: null,
    },
    select: {
      id: true,
      publicDepositStatus: true,
      publicDepositPaymentIntentId: true,
    },
  })
  .then((r) => {
    process.stdout.write(`${JSON.stringify(r)}\n`);
  })
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => p.$disconnect());
