-- CreateEnum
CREATE TYPE "ReliabilityLabel" AS ENUM ('ELITE', 'STRONG', 'STANDARD', 'RISK');

-- AlterTable
ALTER TABLE "FranchiseOwnerReputation" ADD COLUMN     "reliabilityLabel" "ReliabilityLabel" NOT NULL DEFAULT 'STANDARD',
ADD COLUMN     "reliabilityScore" DOUBLE PRECISION NOT NULL DEFAULT 0;
