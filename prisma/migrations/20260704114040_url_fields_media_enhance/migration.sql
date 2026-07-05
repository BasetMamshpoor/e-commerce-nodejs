-- DropForeignKey
ALTER TABLE "Banner" DROP CONSTRAINT "Banner_mediaId_fkey";

-- DropForeignKey
ALTER TABLE "Story" DROP CONSTRAINT "Story_coverImageMediaId_fkey";

-- AlterTable
ALTER TABLE "Banner" ADD COLUMN     "imageUrl" TEXT,
ALTER COLUMN "mediaId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "BlogPost" ADD COLUMN     "coverImageUrl" TEXT;

-- AlterTable
ALTER TABLE "Brand" ADD COLUMN     "logoUrl" TEXT;

-- AlterTable
ALTER TABLE "Category" ADD COLUMN     "imageUrl" TEXT;

-- AlterTable
ALTER TABLE "Media" ADD COLUMN     "extension" TEXT,
ADD COLUMN     "metadata" JSONB,
ADD COLUMN     "storageProvider" TEXT NOT NULL DEFAULT 'local';

-- AlterTable
ALTER TABLE "Popup" ADD COLUMN     "mediaUrl" TEXT;

-- AlterTable
ALTER TABLE "ShippingCompany" ADD COLUMN     "logoUrl" TEXT;

-- AlterTable
ALTER TABLE "Story" ADD COLUMN     "coverImageUrl" TEXT,
ADD COLUMN     "videoUrl" TEXT,
ALTER COLUMN "coverImageMediaId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Story" ADD CONSTRAINT "Story_coverImageMediaId_fkey" FOREIGN KEY ("coverImageMediaId") REFERENCES "Media"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Banner" ADD CONSTRAINT "Banner_mediaId_fkey" FOREIGN KEY ("mediaId") REFERENCES "Media"("id") ON DELETE SET NULL ON UPDATE CASCADE;
