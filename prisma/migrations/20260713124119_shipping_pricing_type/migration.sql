-- CreateEnum
CREATE TYPE "ShippingPricingType" AS ENUM ('FIXED', 'WEIGHT_DISTANCE');

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "shippingDistance" INTEGER,
ADD COLUMN     "shippingWeight" INTEGER;

-- AlterTable
ALTER TABLE "ShippingCompany" ADD COLUMN     "pricePerKg" INTEGER,
ADD COLUMN     "pricePerKm" INTEGER,
ADD COLUMN     "pricingType" "ShippingPricingType" NOT NULL DEFAULT 'FIXED';
