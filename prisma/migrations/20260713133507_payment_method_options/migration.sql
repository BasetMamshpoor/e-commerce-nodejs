-- AlterEnum
ALTER TYPE "PaymentMethod" ADD VALUE 'FREIGHT_COLLECT';

-- AlterTable
ALTER TABLE "ShippingCompany" ADD COLUMN     "acceptsFreightCollect" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "acceptsPrepay" BOOLEAN NOT NULL DEFAULT true;
