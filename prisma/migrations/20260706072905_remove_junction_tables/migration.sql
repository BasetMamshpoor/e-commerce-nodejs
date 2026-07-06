/*
  Warnings:

  - You are about to drop the `ProductAlsoBought` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ProductRelated` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ProductView` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "ProductAlsoBought" DROP CONSTRAINT "ProductAlsoBought_alsoBoughtId_fkey";

-- DropForeignKey
ALTER TABLE "ProductAlsoBought" DROP CONSTRAINT "ProductAlsoBought_productId_fkey";

-- DropForeignKey
ALTER TABLE "ProductRelated" DROP CONSTRAINT "ProductRelated_productId_fkey";

-- DropForeignKey
ALTER TABLE "ProductRelated" DROP CONSTRAINT "ProductRelated_relatedId_fkey";

-- DropForeignKey
ALTER TABLE "ProductView" DROP CONSTRAINT "ProductView_productId_fkey";

-- DropTable
DROP TABLE "ProductAlsoBought";

-- DropTable
DROP TABLE "ProductRelated";

-- DropTable
DROP TABLE "ProductView";
