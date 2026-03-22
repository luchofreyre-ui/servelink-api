/*
  Warnings:

  - A unique constraint covering the columns `[providerId]` on the table `FranchiseOwner` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "ServiceProviderType" AS ENUM ('franchise_owner', 'independent', 'company');

-- CreateEnum
CREATE TYPE "ServiceProviderStatus" AS ENUM ('onboarding', 'active', 'suspended', 'deactivated');

-- AlterTable
ALTER TABLE "FranchiseOwner" ADD COLUMN     "providerId" TEXT;

-- CreateTable
CREATE TABLE "ServiceProvider" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "ServiceProviderType" NOT NULL,
    "status" "ServiceProviderStatus" NOT NULL DEFAULT 'onboarding',
    "displayName" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "reliabilityScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ServiceProvider_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ServiceProvider_userId_key" ON "ServiceProvider"("userId");

-- CreateIndex
CREATE INDEX "ServiceProvider_status_idx" ON "ServiceProvider"("status");

-- CreateIndex
CREATE INDEX "ServiceProvider_type_idx" ON "ServiceProvider"("type");

-- CreateIndex
CREATE UNIQUE INDEX "FranchiseOwner_providerId_key" ON "FranchiseOwner"("providerId");

-- CreateIndex
CREATE INDEX "FranchiseOwner_providerId_idx" ON "FranchiseOwner"("providerId");

-- AddForeignKey
ALTER TABLE "ServiceProvider" ADD CONSTRAINT "ServiceProvider_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FranchiseOwner" ADD CONSTRAINT "FranchiseOwner_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "ServiceProvider"("id") ON DELETE SET NULL ON UPDATE CASCADE;
