-- CreateEnum
CREATE TYPE "PricingMode" AS ENUM ('FIXED_IRT', 'CURRENCY_BASED');

-- CreateEnum
CREATE TYPE "ModifierType" AS ENUM ('PERCENTAGE', 'FIXED_SOURCE_CURRENCY', 'FIXED_IRT');

-- CreateTable
CREATE TABLE "Currency" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "symbol" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "currentRate" DOUBLE PRECISION,
    "lastFetchedAt" TIMESTAMP(3),
    "lastAppliedRate" DOUBLE PRECISION,
    "lastAppliedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Currency_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExchangeRateHistory" (
    "id" TEXT NOT NULL,
    "currencyId" TEXT NOT NULL,
    "rate" DOUBLE PRECISION NOT NULL,
    "source" TEXT NOT NULL,
    "wasApplied" BOOLEAN NOT NULL DEFAULT false,
    "changePercent" DOUBLE PRECISION,
    "fetchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExchangeRateHistory_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "AttributeValue" ADD COLUMN "modifierType" "ModifierType" NOT NULL DEFAULT 'FIXED_IRT',
ADD COLUMN "modifierValue" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Product" ADD COLUMN "pricingMode" "PricingMode" NOT NULL DEFAULT 'FIXED_IRT',
ADD COLUMN "currencyId" TEXT,
ADD COLUMN "sourcePrice" DOUBLE PRECISION,
ADD COLUMN "priceBufferPercent" DOUBLE PRECISION DEFAULT 0,
ADD COLUMN "currentPriceIRT" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "priceUpdatedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "OrderItem" ADD COLUMN "finalPriceIRT" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "pricingModeSnapshot" "PricingMode" NOT NULL DEFAULT 'FIXED_IRT',
ADD COLUMN "sourceCurrencyCode" TEXT,
ADD COLUMN "appliedRate" DOUBLE PRECISION;

-- CreateIndex
CREATE UNIQUE INDEX "Currency_code_key" ON "Currency"("code");

-- CreateIndex
CREATE INDEX "ExchangeRateHistory_currencyId_fetchedAt_idx" ON "ExchangeRateHistory"("currencyId", "fetchedAt");

-- CreateIndex
CREATE INDEX "Product_currencyId_idx" ON "Product"("currencyId");

-- CreateIndex
CREATE INDEX "Product_currentPriceIRT_idx" ON "Product"("currentPriceIRT");

-- AddForeignKey
ALTER TABLE "ExchangeRateHistory" ADD CONSTRAINT "ExchangeRateHistory_currencyId_fkey" FOREIGN KEY ("currencyId") REFERENCES "Currency"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_currencyId_fkey" FOREIGN KEY ("currencyId") REFERENCES "Currency"("id") ON DELETE SET NULL ON UPDATE CASCADE;
