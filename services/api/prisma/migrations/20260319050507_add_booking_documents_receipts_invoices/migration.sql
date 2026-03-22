-- CreateEnum
CREATE TYPE "BookingDocumentType" AS ENUM ('receipt', 'invoice');

-- CreateEnum
CREATE TYPE "BookingDocumentStatus" AS ENUM ('draft', 'finalized');

-- CreateTable
CREATE TABLE "BookingDocument" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "type" "BookingDocumentType" NOT NULL,
    "status" "BookingDocumentStatus" NOT NULL,
    "subtotalCents" INTEGER NOT NULL,
    "taxCents" INTEGER NOT NULL,
    "totalCents" INTEGER NOT NULL,
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finalizedAt" TIMESTAMP(3),
    "dataJson" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BookingDocument_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BookingDocument_bookingId_type_idx" ON "BookingDocument"("bookingId", "type");

-- CreateIndex
CREATE UNIQUE INDEX "BookingDocument_bookingId_type_key" ON "BookingDocument"("bookingId", "type");

-- AddForeignKey
ALTER TABLE "BookingDocument" ADD CONSTRAINT "BookingDocument_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;
