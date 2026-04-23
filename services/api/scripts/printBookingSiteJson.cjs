/* eslint-disable @typescript-eslint/no-require-imports */
const { PrismaClient } = require("@prisma/client");

const id = process.argv[2];
if (!id) {
  console.error("usage: node scripts/printBookingSiteJson.cjs <bookingId>");
  process.exit(2);
}

const p = new PrismaClient();
p.booking
  .findUnique({
    where: { id },
    select: { siteLat: true, siteLng: true },
  })
  .then((r) => {
    process.stdout.write(`${JSON.stringify(r)}\n`);
  })
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => p.$disconnect());
