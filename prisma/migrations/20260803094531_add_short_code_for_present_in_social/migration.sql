/*
  Warnings:

  - A unique constraint covering the columns `[shortCode]` on the table `Product` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "shortCode" TEXT;

-- CreateIndex
CREATE INDEX "Currency_code_idx" ON "Currency"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Product_shortCode_key" ON "Product"("shortCode");
