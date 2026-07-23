-- DropForeignKey
ALTER TABLE "ExchangeRateHistory" DROP CONSTRAINT IF EXISTS "ExchangeRateHistory_currencyId_fkey";
ALTER TABLE "Product" DROP CONSTRAINT IF EXISTS "Product_currencyId_fkey";

-- AlterTable: Currency id TEXT
ALTER TABLE "Currency" DROP CONSTRAINT IF EXISTS "Currency_pkey";
ALTER TABLE "Currency" ALTER COLUMN "id" DROP DEFAULT;
ALTER TABLE "Currency" ALTER COLUMN "id" SET DATA TYPE TEXT;
ALTER TABLE "Currency" ADD CONSTRAINT "Currency_pkey" PRIMARY KEY ("id");
DROP SEQUENCE IF EXISTS "Currency_id_seq" CASCADE;

-- AlterTable: ExchangeRateHistory id TEXT, currencyId TEXT
ALTER TABLE "ExchangeRateHistory" DROP CONSTRAINT IF EXISTS "ExchangeRateHistory_pkey";
ALTER TABLE "ExchangeRateHistory" ALTER COLUMN "id" DROP DEFAULT;
ALTER TABLE "ExchangeRateHistory" ALTER COLUMN "id" SET DATA TYPE TEXT;
ALTER TABLE "ExchangeRateHistory" ALTER COLUMN "currencyId" SET DATA TYPE TEXT;
ALTER TABLE "ExchangeRateHistory" ADD CONSTRAINT "ExchangeRateHistory_pkey" PRIMARY KEY ("id");
DROP SEQUENCE IF EXISTS "ExchangeRateHistory_id_seq" CASCADE;

-- AlterTable: Product currencyId TEXT
ALTER TABLE "Product" ALTER COLUMN "currencyId" SET DATA TYPE TEXT;

-- AddForeignKey
ALTER TABLE "ExchangeRateHistory" ADD CONSTRAINT "ExchangeRateHistory_currencyId_fkey" FOREIGN KEY ("currencyId") REFERENCES "Currency"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Product" ADD CONSTRAINT "Product_currencyId_fkey" FOREIGN KEY ("currencyId") REFERENCES "Currency"("id") ON DELETE SET NULL ON UPDATE CASCADE;