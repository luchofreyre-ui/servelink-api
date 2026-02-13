-- CreateEnum
CREATE TYPE "FoStatus" AS ENUM ('onboarding', 'active', 'paused', 'suspended', 'safety_hold', 'offboarded');

-- CreateTable
CREATE TABLE "FranchiseOwner" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "FoStatus" NOT NULL DEFAULT 'onboarding',
    "safetyHold" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FranchiseOwner_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "FranchiseOwner_userId_key" ON "FranchiseOwner"("userId");

-- CreateIndex
CREATE INDEX "FranchiseOwner_status_idx" ON "FranchiseOwner"("status");

-- AddForeignKey
ALTER TABLE "FranchiseOwner" ADD CONSTRAINT "FranchiseOwner_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
