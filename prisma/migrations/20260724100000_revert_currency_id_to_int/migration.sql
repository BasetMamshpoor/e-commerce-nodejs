-- Revert Currency and ExchangeRateHistory id from TEXT (cuid) back to INTEGER (autoincrement)

-- Drop foreign key constraints
ALTER TABLE "ExchangeRateHistory" DROP CONSTRAINT IF EXISTS "ExchangeRateHistory_currencyId_fkey";
ALTER TABLE "Product" DROP CONSTRAINT IF EXISTS "Product_currencyId_fkey";

-- Drop old tables and nullify references
DROP TABLE IF EXISTS "ExchangeRateHistory" CASCADE;
DROP TABLE IF EXISTS "Currency" CASCADE;
UPDATE "Product" SET "currencyId" = NULL;

-- Alter Product currencyId from TEXT to INTEGER
ALTER TABLE "Product" ALTER COLUMN "currencyId" SET DATA TYPE INTEGER USING (NULL::INTEGER);

-- Recreate Currency with INTEGER id
CREATE TABLE "Currency" (
    "id" SERIAL NOT NULL,
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

-- Recreate ExchangeRateHistory with INTEGER ids
CREATE TABLE "ExchangeRateHistory" (
    "id" SERIAL NOT NULL,
    "currencyId" INTEGER NOT NULL,
    "rate" DOUBLE PRECISION NOT NULL,
    "source" TEXT NOT NULL,
    "wasApplied" BOOLEAN NOT NULL DEFAULT false,
    "changePercent" DOUBLE PRECISION,
    "fetchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ExchangeRateHistory_pkey" PRIMARY KEY ("id")
);

-- Recreate indexes
CREATE UNIQUE INDEX "Currency_code_key" ON "Currency"("code");
CREATE INDEX "ExchangeRateHistory_currencyId_fetchedAt_idx" ON "ExchangeRateHistory"("currencyId", "fetchedAt");

-- Re-add foreign key constraints
ALTER TABLE "ExchangeRateHistory" ADD CONSTRAINT "ExchangeRateHistory_currencyId_fkey" FOREIGN KEY ("currencyId") REFERENCES "Currency"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Product" ADD CONSTRAINT "Product_currencyId_fkey" FOREIGN KEY ("currencyId") REFERENCES "Currency"("id") ON DELETE SET NULL ON UPDATE CASCADE;
