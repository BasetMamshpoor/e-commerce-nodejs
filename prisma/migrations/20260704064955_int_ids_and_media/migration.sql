/*
  Warnings:

  - The primary key for the `Address` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `Address` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `Attribute` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `Attribute` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `AttributeValue` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `AttributeValue` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `AuditLog` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `AuditLog` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `userId` column on the `AuditLog` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `Banner` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `Banner` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `BlockedIp` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `BlockedIp` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `BlogCategory` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `BlogCategory` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `BlogPost` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `coverImageId` on the `BlogPost` table. All the data in the column will be lost.
  - The `id` column on the `BlogPost` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `authorId` column on the `BlogPost` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `categoryId` column on the `BlogPost` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `Brand` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `logoId` on the `Brand` table. All the data in the column will be lost.
  - The `id` column on the `Brand` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `Cart` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `Cart` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `userId` column on the `Cart` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `CartItem` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `CartItem` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `Category` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `imageId` on the `Category` table. All the data in the column will be lost.
  - The `id` column on the `Category` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `parentId` column on the `Category` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `CategoryAttribute` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `CategoryAttribute` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `Comment` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `Comment` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `parentId` column on the `Comment` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `CommentAttachment` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `CommentAttachment` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `CommentLike` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `CommentLike` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `DiscountCode` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `DiscountCode` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `DiscountCodeCategory` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `DiscountCodeCategory` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `DiscountCodeProduct` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `DiscountCodeProduct` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `DiscountCodeUsage` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `DiscountCodeUsage` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `DiscountCodeUser` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `DiscountCodeUser` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `LoginAttempt` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `LoginAttempt` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `userId` column on the `LoginAttempt` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `Media` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `alt` on the `Media` table. All the data in the column will be lost.
  - The `id` column on the `Media` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `uploadedById` column on the `Media` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `Notification` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `Notification` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `Order` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `Order` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `addressId` column on the `Order` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `shippingCompanyId` column on the `Order` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `discountCodeId` column on the `Order` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `OrderCancellation` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `OrderCancellation` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `OrderItem` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `OrderItem` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `OrderReturn` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `OrderReturn` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `orderItemId` column on the `OrderReturn` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `OrderReturnImage` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `OrderReturnImage` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `OrderStatusHistory` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `OrderStatusHistory` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `OtpCode` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `OtpCode` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `userId` column on the `OtpCode` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `PaymentGateway` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `PaymentGateway` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `Popup` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `Popup` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `mediaId` column on the `Popup` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `Product` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `Product` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `brandId` column on the `Product` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `createdById` column on the `Product` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `ProductCategory` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `ProductCategory` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `ProductImage` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `ProductImage` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `ProductVariant` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `compareAtPrice` on the `ProductVariant` table. All the data in the column will be lost.
  - You are about to drop the column `discountEndAt` on the `ProductVariant` table. All the data in the column will be lost.
  - You are about to drop the column `discountStartAt` on the `ProductVariant` table. All the data in the column will be lost.
  - You are about to drop the column `discountType` on the `ProductVariant` table. All the data in the column will be lost.
  - You are about to drop the column `discountValue` on the `ProductVariant` table. All the data in the column will be lost.
  - You are about to drop the column `price` on the `ProductVariant` table. All the data in the column will be lost.
  - The `id` column on the `ProductVariant` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `ProductVariantAttributeValue` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `ProductVariantAttributeValue` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `ProductView` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `ProductView` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `userId` column on the `ProductView` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `Setting` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `Setting` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `ShippingCompany` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `logoId` on the `ShippingCompany` table. All the data in the column will be lost.
  - The `id` column on the `ShippingCompany` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `Ticket` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `Ticket` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `departmentId` column on the `Ticket` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `orderId` column on the `Ticket` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `TicketAttachment` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `TicketAttachment` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `TicketDepartment` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `TicketDepartment` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `TicketMessage` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `TicketMessage` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `Transaction` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `Transaction` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `orderId` column on the `Transaction` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `gatewayId` column on the `Transaction` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `User` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `avatarId` on the `User` table. All the data in the column will be lost.
  - The `id` column on the `User` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `UserSession` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `UserSession` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `Wallet` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `Wallet` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `WalletTransaction` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `WalletTransaction` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `orderId` column on the `WalletTransaction` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `Wishlist` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `Wishlist` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the `ProductComparison` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ProductComparisonItem` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ProductVariantImage` table. If the table is not empty, all the data it contains will be lost.
  - Changed the type of `userId` on the `Address` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `attributeId` on the `AttributeValue` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `mediaId` on the `Banner` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `cartId` on the `CartItem` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `variantId` on the `CartItem` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `categoryId` on the `CategoryAttribute` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `attributeId` on the `CategoryAttribute` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `commentableId` on the `Comment` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `userId` on the `Comment` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `commentId` on the `CommentAttachment` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `mediaId` on the `CommentAttachment` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `commentId` on the `CommentLike` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `userId` on the `CommentLike` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `discountCodeId` on the `DiscountCodeCategory` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `categoryId` on the `DiscountCodeCategory` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `discountCodeId` on the `DiscountCodeProduct` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `productId` on the `DiscountCodeProduct` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `discountCodeId` on the `DiscountCodeUsage` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `userId` on the `DiscountCodeUsage` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `orderId` on the `DiscountCodeUsage` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `discountCodeId` on the `DiscountCodeUser` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `userId` on the `DiscountCodeUser` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Added the required column `fileName` to the `Media` table without a default value. This is not possible if the table is not empty.
  - Added the required column `filePath` to the `Media` table without a default value. This is not possible if the table is not empty.
  - Added the required column `originalName` to the `Media` table without a default value. This is not possible if the table is not empty.
  - Made the column `mimeType` on table `Media` required. This step will fail if there are existing NULL values in that column.
  - Made the column `size` on table `Media` required. This step will fail if there are existing NULL values in that column.
  - Changed the type of `userId` on the `Notification` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `userId` on the `Order` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `orderId` on the `OrderCancellation` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `orderId` on the `OrderItem` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `variantId` on the `OrderItem` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `orderId` on the `OrderReturn` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `returnId` on the `OrderReturnImage` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `mediaId` on the `OrderReturnImage` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `orderId` on the `OrderStatusHistory` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `productId` on the `ProductCategory` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `categoryId` on the `ProductCategory` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `productId` on the `ProductImage` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `mediaId` on the `ProductImage` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `productId` on the `ProductVariant` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `variantId` on the `ProductVariantAttributeValue` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `attributeValueId` on the `ProductVariantAttributeValue` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `productId` on the `ProductView` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `userId` on the `Ticket` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `messageId` on the `TicketAttachment` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `mediaId` on the `TicketAttachment` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `ticketId` on the `TicketMessage` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `senderId` on the `TicketMessage` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `userId` on the `Transaction` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `userId` on the `UserSession` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `userId` on the `Wallet` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `walletId` on the `WalletTransaction` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `userId` on the `Wishlist` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `productId` on the `Wishlist` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "WalletWithdrawalStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- AlterEnum
ALTER TYPE "WalletTransactionType" ADD VALUE 'WITHDRAWAL_REQUEST';

-- DropForeignKey
ALTER TABLE "Address" DROP CONSTRAINT "Address_userId_fkey";

-- DropForeignKey
ALTER TABLE "AttributeValue" DROP CONSTRAINT "AttributeValue_attributeId_fkey";

-- DropForeignKey
ALTER TABLE "AuditLog" DROP CONSTRAINT "AuditLog_userId_fkey";

-- DropForeignKey
ALTER TABLE "Banner" DROP CONSTRAINT "Banner_mediaId_fkey";

-- DropForeignKey
ALTER TABLE "BlogPost" DROP CONSTRAINT "BlogPost_authorId_fkey";

-- DropForeignKey
ALTER TABLE "BlogPost" DROP CONSTRAINT "BlogPost_categoryId_fkey";

-- DropForeignKey
ALTER TABLE "BlogPost" DROP CONSTRAINT "BlogPost_coverImageId_fkey";

-- DropForeignKey
ALTER TABLE "Brand" DROP CONSTRAINT "Brand_logoId_fkey";

-- DropForeignKey
ALTER TABLE "Cart" DROP CONSTRAINT "Cart_userId_fkey";

-- DropForeignKey
ALTER TABLE "CartItem" DROP CONSTRAINT "CartItem_cartId_fkey";

-- DropForeignKey
ALTER TABLE "CartItem" DROP CONSTRAINT "CartItem_variantId_fkey";

-- DropForeignKey
ALTER TABLE "Category" DROP CONSTRAINT "Category_imageId_fkey";

-- DropForeignKey
ALTER TABLE "Category" DROP CONSTRAINT "Category_parentId_fkey";

-- DropForeignKey
ALTER TABLE "CategoryAttribute" DROP CONSTRAINT "CategoryAttribute_attributeId_fkey";

-- DropForeignKey
ALTER TABLE "CategoryAttribute" DROP CONSTRAINT "CategoryAttribute_categoryId_fkey";

-- DropForeignKey
ALTER TABLE "Comment" DROP CONSTRAINT "Comment_parentId_fkey";

-- DropForeignKey
ALTER TABLE "Comment" DROP CONSTRAINT "Comment_userId_fkey";

-- DropForeignKey
ALTER TABLE "CommentAttachment" DROP CONSTRAINT "CommentAttachment_commentId_fkey";

-- DropForeignKey
ALTER TABLE "CommentAttachment" DROP CONSTRAINT "CommentAttachment_mediaId_fkey";

-- DropForeignKey
ALTER TABLE "CommentLike" DROP CONSTRAINT "CommentLike_commentId_fkey";

-- DropForeignKey
ALTER TABLE "CommentLike" DROP CONSTRAINT "CommentLike_userId_fkey";

-- DropForeignKey
ALTER TABLE "DiscountCodeCategory" DROP CONSTRAINT "DiscountCodeCategory_categoryId_fkey";

-- DropForeignKey
ALTER TABLE "DiscountCodeCategory" DROP CONSTRAINT "DiscountCodeCategory_discountCodeId_fkey";

-- DropForeignKey
ALTER TABLE "DiscountCodeProduct" DROP CONSTRAINT "DiscountCodeProduct_discountCodeId_fkey";

-- DropForeignKey
ALTER TABLE "DiscountCodeProduct" DROP CONSTRAINT "DiscountCodeProduct_productId_fkey";

-- DropForeignKey
ALTER TABLE "DiscountCodeUsage" DROP CONSTRAINT "DiscountCodeUsage_discountCodeId_fkey";

-- DropForeignKey
ALTER TABLE "DiscountCodeUsage" DROP CONSTRAINT "DiscountCodeUsage_orderId_fkey";

-- DropForeignKey
ALTER TABLE "DiscountCodeUsage" DROP CONSTRAINT "DiscountCodeUsage_userId_fkey";

-- DropForeignKey
ALTER TABLE "DiscountCodeUser" DROP CONSTRAINT "DiscountCodeUser_discountCodeId_fkey";

-- DropForeignKey
ALTER TABLE "DiscountCodeUser" DROP CONSTRAINT "DiscountCodeUser_userId_fkey";

-- DropForeignKey
ALTER TABLE "LoginAttempt" DROP CONSTRAINT "LoginAttempt_userId_fkey";

-- DropForeignKey
ALTER TABLE "Media" DROP CONSTRAINT "Media_uploadedById_fkey";

-- DropForeignKey
ALTER TABLE "Notification" DROP CONSTRAINT "Notification_userId_fkey";

-- DropForeignKey
ALTER TABLE "Order" DROP CONSTRAINT "Order_addressId_fkey";

-- DropForeignKey
ALTER TABLE "Order" DROP CONSTRAINT "Order_discountCodeId_fkey";

-- DropForeignKey
ALTER TABLE "Order" DROP CONSTRAINT "Order_shippingCompanyId_fkey";

-- DropForeignKey
ALTER TABLE "Order" DROP CONSTRAINT "Order_userId_fkey";

-- DropForeignKey
ALTER TABLE "OrderCancellation" DROP CONSTRAINT "OrderCancellation_orderId_fkey";

-- DropForeignKey
ALTER TABLE "OrderItem" DROP CONSTRAINT "OrderItem_orderId_fkey";

-- DropForeignKey
ALTER TABLE "OrderItem" DROP CONSTRAINT "OrderItem_variantId_fkey";

-- DropForeignKey
ALTER TABLE "OrderReturn" DROP CONSTRAINT "OrderReturn_orderId_fkey";

-- DropForeignKey
ALTER TABLE "OrderReturn" DROP CONSTRAINT "OrderReturn_orderItemId_fkey";

-- DropForeignKey
ALTER TABLE "OrderReturnImage" DROP CONSTRAINT "OrderReturnImage_mediaId_fkey";

-- DropForeignKey
ALTER TABLE "OrderReturnImage" DROP CONSTRAINT "OrderReturnImage_returnId_fkey";

-- DropForeignKey
ALTER TABLE "OrderStatusHistory" DROP CONSTRAINT "OrderStatusHistory_orderId_fkey";

-- DropForeignKey
ALTER TABLE "OtpCode" DROP CONSTRAINT "OtpCode_userId_fkey";

-- DropForeignKey
ALTER TABLE "Popup" DROP CONSTRAINT "Popup_mediaId_fkey";

-- DropForeignKey
ALTER TABLE "Product" DROP CONSTRAINT "Product_brandId_fkey";

-- DropForeignKey
ALTER TABLE "Product" DROP CONSTRAINT "Product_createdById_fkey";

-- DropForeignKey
ALTER TABLE "ProductCategory" DROP CONSTRAINT "ProductCategory_categoryId_fkey";

-- DropForeignKey
ALTER TABLE "ProductCategory" DROP CONSTRAINT "ProductCategory_productId_fkey";

-- DropForeignKey
ALTER TABLE "ProductComparison" DROP CONSTRAINT "ProductComparison_userId_fkey";

-- DropForeignKey
ALTER TABLE "ProductComparisonItem" DROP CONSTRAINT "ProductComparisonItem_comparisonId_fkey";

-- DropForeignKey
ALTER TABLE "ProductComparisonItem" DROP CONSTRAINT "ProductComparisonItem_productId_fkey";

-- DropForeignKey
ALTER TABLE "ProductImage" DROP CONSTRAINT "ProductImage_mediaId_fkey";

-- DropForeignKey
ALTER TABLE "ProductImage" DROP CONSTRAINT "ProductImage_productId_fkey";

-- DropForeignKey
ALTER TABLE "ProductVariant" DROP CONSTRAINT "ProductVariant_productId_fkey";

-- DropForeignKey
ALTER TABLE "ProductVariantAttributeValue" DROP CONSTRAINT "ProductVariantAttributeValue_attributeValueId_fkey";

-- DropForeignKey
ALTER TABLE "ProductVariantAttributeValue" DROP CONSTRAINT "ProductVariantAttributeValue_variantId_fkey";

-- DropForeignKey
ALTER TABLE "ProductVariantImage" DROP CONSTRAINT "ProductVariantImage_mediaId_fkey";

-- DropForeignKey
ALTER TABLE "ProductVariantImage" DROP CONSTRAINT "ProductVariantImage_variantId_fkey";

-- DropForeignKey
ALTER TABLE "ProductView" DROP CONSTRAINT "ProductView_productId_fkey";

-- DropForeignKey
ALTER TABLE "ShippingCompany" DROP CONSTRAINT "ShippingCompany_logoId_fkey";

-- DropForeignKey
ALTER TABLE "Ticket" DROP CONSTRAINT "Ticket_departmentId_fkey";

-- DropForeignKey
ALTER TABLE "Ticket" DROP CONSTRAINT "Ticket_orderId_fkey";

-- DropForeignKey
ALTER TABLE "Ticket" DROP CONSTRAINT "Ticket_userId_fkey";

-- DropForeignKey
ALTER TABLE "TicketAttachment" DROP CONSTRAINT "TicketAttachment_mediaId_fkey";

-- DropForeignKey
ALTER TABLE "TicketAttachment" DROP CONSTRAINT "TicketAttachment_messageId_fkey";

-- DropForeignKey
ALTER TABLE "TicketMessage" DROP CONSTRAINT "TicketMessage_senderId_fkey";

-- DropForeignKey
ALTER TABLE "TicketMessage" DROP CONSTRAINT "TicketMessage_ticketId_fkey";

-- DropForeignKey
ALTER TABLE "Transaction" DROP CONSTRAINT "Transaction_gatewayId_fkey";

-- DropForeignKey
ALTER TABLE "Transaction" DROP CONSTRAINT "Transaction_orderId_fkey";

-- DropForeignKey
ALTER TABLE "Transaction" DROP CONSTRAINT "Transaction_userId_fkey";

-- DropForeignKey
ALTER TABLE "User" DROP CONSTRAINT "User_avatarId_fkey";

-- DropForeignKey
ALTER TABLE "UserSession" DROP CONSTRAINT "UserSession_userId_fkey";

-- DropForeignKey
ALTER TABLE "Wallet" DROP CONSTRAINT "Wallet_userId_fkey";

-- DropForeignKey
ALTER TABLE "WalletTransaction" DROP CONSTRAINT "WalletTransaction_orderId_fkey";

-- DropForeignKey
ALTER TABLE "WalletTransaction" DROP CONSTRAINT "WalletTransaction_walletId_fkey";

-- DropForeignKey
ALTER TABLE "Wishlist" DROP CONSTRAINT "Wishlist_productId_fkey";

-- DropForeignKey
ALTER TABLE "Wishlist" DROP CONSTRAINT "Wishlist_userId_fkey";

-- DropIndex
DROP INDEX "Product_minPrice_idx";

-- DropIndex
DROP INDEX "ProductVariant_price_idx";

-- AlterTable
ALTER TABLE "Address" DROP CONSTRAINT "Address_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
DROP COLUMN "userId",
ADD COLUMN     "userId" INTEGER NOT NULL,
ADD CONSTRAINT "Address_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "Attribute" DROP CONSTRAINT "Attribute_pkey",
ADD COLUMN     "isDisplay" BOOLEAN NOT NULL DEFAULT false,
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
ADD CONSTRAINT "Attribute_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "AttributeValue" DROP CONSTRAINT "AttributeValue_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
DROP COLUMN "attributeId",
ADD COLUMN     "attributeId" INTEGER NOT NULL,
ADD CONSTRAINT "AttributeValue_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "AuditLog" DROP CONSTRAINT "AuditLog_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
DROP COLUMN "userId",
ADD COLUMN     "userId" INTEGER,
ADD CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "Banner" DROP CONSTRAINT "Banner_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
DROP COLUMN "mediaId",
ADD COLUMN     "mediaId" INTEGER NOT NULL,
ADD CONSTRAINT "Banner_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "BlockedIp" DROP CONSTRAINT "BlockedIp_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
ADD CONSTRAINT "BlockedIp_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "BlogCategory" DROP CONSTRAINT "BlogCategory_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
ADD CONSTRAINT "BlogCategory_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "BlogPost" DROP CONSTRAINT "BlogPost_pkey",
DROP COLUMN "coverImageId",
ADD COLUMN     "coverImageMediaId" INTEGER,
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
DROP COLUMN "authorId",
ADD COLUMN     "authorId" INTEGER,
DROP COLUMN "categoryId",
ADD COLUMN     "categoryId" INTEGER,
ADD CONSTRAINT "BlogPost_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "Brand" DROP CONSTRAINT "Brand_pkey",
DROP COLUMN "logoId",
ADD COLUMN     "logoMediaId" INTEGER,
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
ADD CONSTRAINT "Brand_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "Cart" DROP CONSTRAINT "Cart_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
DROP COLUMN "userId",
ADD COLUMN     "userId" INTEGER,
ADD CONSTRAINT "Cart_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "CartItem" DROP CONSTRAINT "CartItem_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
DROP COLUMN "cartId",
ADD COLUMN     "cartId" INTEGER NOT NULL,
DROP COLUMN "variantId",
ADD COLUMN     "variantId" INTEGER NOT NULL,
ADD CONSTRAINT "CartItem_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "Category" DROP CONSTRAINT "Category_pkey",
DROP COLUMN "imageId",
ADD COLUMN     "imageMediaId" INTEGER,
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
DROP COLUMN "parentId",
ADD COLUMN     "parentId" INTEGER,
ADD CONSTRAINT "Category_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "CategoryAttribute" DROP CONSTRAINT "CategoryAttribute_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
DROP COLUMN "categoryId",
ADD COLUMN     "categoryId" INTEGER NOT NULL,
DROP COLUMN "attributeId",
ADD COLUMN     "attributeId" INTEGER NOT NULL,
ADD CONSTRAINT "CategoryAttribute_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "Comment" DROP CONSTRAINT "Comment_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
DROP COLUMN "commentableId",
ADD COLUMN     "commentableId" INTEGER NOT NULL,
DROP COLUMN "userId",
ADD COLUMN     "userId" INTEGER NOT NULL,
DROP COLUMN "parentId",
ADD COLUMN     "parentId" INTEGER,
ADD CONSTRAINT "Comment_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "CommentAttachment" DROP CONSTRAINT "CommentAttachment_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
DROP COLUMN "commentId",
ADD COLUMN     "commentId" INTEGER NOT NULL,
DROP COLUMN "mediaId",
ADD COLUMN     "mediaId" INTEGER NOT NULL,
ADD CONSTRAINT "CommentAttachment_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "CommentLike" DROP CONSTRAINT "CommentLike_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
DROP COLUMN "commentId",
ADD COLUMN     "commentId" INTEGER NOT NULL,
DROP COLUMN "userId",
ADD COLUMN     "userId" INTEGER NOT NULL,
ADD CONSTRAINT "CommentLike_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "DiscountCode" DROP CONSTRAINT "DiscountCode_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
ADD CONSTRAINT "DiscountCode_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "DiscountCodeCategory" DROP CONSTRAINT "DiscountCodeCategory_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
DROP COLUMN "discountCodeId",
ADD COLUMN     "discountCodeId" INTEGER NOT NULL,
DROP COLUMN "categoryId",
ADD COLUMN     "categoryId" INTEGER NOT NULL,
ADD CONSTRAINT "DiscountCodeCategory_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "DiscountCodeProduct" DROP CONSTRAINT "DiscountCodeProduct_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
DROP COLUMN "discountCodeId",
ADD COLUMN     "discountCodeId" INTEGER NOT NULL,
DROP COLUMN "productId",
ADD COLUMN     "productId" INTEGER NOT NULL,
ADD CONSTRAINT "DiscountCodeProduct_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "DiscountCodeUsage" DROP CONSTRAINT "DiscountCodeUsage_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
DROP COLUMN "discountCodeId",
ADD COLUMN     "discountCodeId" INTEGER NOT NULL,
DROP COLUMN "userId",
ADD COLUMN     "userId" INTEGER NOT NULL,
DROP COLUMN "orderId",
ADD COLUMN     "orderId" INTEGER NOT NULL,
ADD CONSTRAINT "DiscountCodeUsage_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "DiscountCodeUser" DROP CONSTRAINT "DiscountCodeUser_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
DROP COLUMN "discountCodeId",
ADD COLUMN     "discountCodeId" INTEGER NOT NULL,
DROP COLUMN "userId",
ADD COLUMN     "userId" INTEGER NOT NULL,
ADD CONSTRAINT "DiscountCodeUser_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "LoginAttempt" DROP CONSTRAINT "LoginAttempt_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
DROP COLUMN "userId",
ADD COLUMN     "userId" INTEGER,
ADD CONSTRAINT "LoginAttempt_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "Media" DROP CONSTRAINT "Media_pkey",
DROP COLUMN "alt",
ADD COLUMN     "entityType" TEXT,
ADD COLUMN     "fileName" TEXT NOT NULL,
ADD COLUMN     "filePath" TEXT NOT NULL,
ADD COLUMN     "originalName" TEXT NOT NULL,
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
ALTER COLUMN "type" DROP DEFAULT,
ALTER COLUMN "mimeType" SET NOT NULL,
ALTER COLUMN "size" SET NOT NULL,
DROP COLUMN "uploadedById",
ADD COLUMN     "uploadedById" INTEGER,
ADD CONSTRAINT "Media_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "Notification" DROP CONSTRAINT "Notification_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
DROP COLUMN "userId",
ADD COLUMN     "userId" INTEGER NOT NULL,
ADD CONSTRAINT "Notification_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "Order" DROP CONSTRAINT "Order_pkey",
ADD COLUMN     "packageNumber" TEXT,
ADD COLUMN     "trackingCode" TEXT,
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
DROP COLUMN "userId",
ADD COLUMN     "userId" INTEGER NOT NULL,
DROP COLUMN "addressId",
ADD COLUMN     "addressId" INTEGER,
DROP COLUMN "shippingCompanyId",
ADD COLUMN     "shippingCompanyId" INTEGER,
DROP COLUMN "discountCodeId",
ADD COLUMN     "discountCodeId" INTEGER,
ADD CONSTRAINT "Order_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "OrderCancellation" DROP CONSTRAINT "OrderCancellation_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
DROP COLUMN "orderId",
ADD COLUMN     "orderId" INTEGER NOT NULL,
ADD CONSTRAINT "OrderCancellation_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "OrderItem" DROP CONSTRAINT "OrderItem_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
DROP COLUMN "orderId",
ADD COLUMN     "orderId" INTEGER NOT NULL,
DROP COLUMN "variantId",
ADD COLUMN     "variantId" INTEGER NOT NULL,
ADD CONSTRAINT "OrderItem_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "OrderReturn" DROP CONSTRAINT "OrderReturn_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
DROP COLUMN "orderId",
ADD COLUMN     "orderId" INTEGER NOT NULL,
DROP COLUMN "orderItemId",
ADD COLUMN     "orderItemId" INTEGER,
ADD CONSTRAINT "OrderReturn_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "OrderReturnImage" DROP CONSTRAINT "OrderReturnImage_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
DROP COLUMN "returnId",
ADD COLUMN     "returnId" INTEGER NOT NULL,
DROP COLUMN "mediaId",
ADD COLUMN     "mediaId" INTEGER NOT NULL,
ADD CONSTRAINT "OrderReturnImage_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "OrderStatusHistory" DROP CONSTRAINT "OrderStatusHistory_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
DROP COLUMN "orderId",
ADD COLUMN     "orderId" INTEGER NOT NULL,
ADD CONSTRAINT "OrderStatusHistory_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "OtpCode" DROP CONSTRAINT "OtpCode_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
DROP COLUMN "userId",
ADD COLUMN     "userId" INTEGER,
ADD CONSTRAINT "OtpCode_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "PaymentGateway" DROP CONSTRAINT "PaymentGateway_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
ADD CONSTRAINT "PaymentGateway_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "Popup" DROP CONSTRAINT "Popup_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
DROP COLUMN "mediaId",
ADD COLUMN     "mediaId" INTEGER,
ADD CONSTRAINT "Popup_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "Product" DROP CONSTRAINT "Product_pkey",
ADD COLUMN     "basePrice" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "discountType" "DiscountType",
ADD COLUMN     "discountValue" INTEGER,
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
DROP COLUMN "brandId",
ADD COLUMN     "brandId" INTEGER,
DROP COLUMN "createdById",
ADD COLUMN     "createdById" INTEGER,
ADD CONSTRAINT "Product_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "ProductCategory" DROP CONSTRAINT "ProductCategory_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
DROP COLUMN "productId",
ADD COLUMN     "productId" INTEGER NOT NULL,
DROP COLUMN "categoryId",
ADD COLUMN     "categoryId" INTEGER NOT NULL,
ADD CONSTRAINT "ProductCategory_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "ProductImage" DROP CONSTRAINT "ProductImage_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
DROP COLUMN "productId",
ADD COLUMN     "productId" INTEGER NOT NULL,
DROP COLUMN "mediaId",
ADD COLUMN     "mediaId" INTEGER NOT NULL,
ADD CONSTRAINT "ProductImage_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "ProductVariant" DROP CONSTRAINT "ProductVariant_pkey",
DROP COLUMN "compareAtPrice",
DROP COLUMN "discountEndAt",
DROP COLUMN "discountStartAt",
DROP COLUMN "discountType",
DROP COLUMN "discountValue",
DROP COLUMN "price",
ADD COLUMN     "priceAdjustment" INTEGER NOT NULL DEFAULT 0,
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
DROP COLUMN "productId",
ADD COLUMN     "productId" INTEGER NOT NULL,
ADD CONSTRAINT "ProductVariant_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "ProductVariantAttributeValue" DROP CONSTRAINT "ProductVariantAttributeValue_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
DROP COLUMN "variantId",
ADD COLUMN     "variantId" INTEGER NOT NULL,
DROP COLUMN "attributeValueId",
ADD COLUMN     "attributeValueId" INTEGER NOT NULL,
ADD CONSTRAINT "ProductVariantAttributeValue_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "ProductView" DROP CONSTRAINT "ProductView_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
DROP COLUMN "productId",
ADD COLUMN     "productId" INTEGER NOT NULL,
DROP COLUMN "userId",
ADD COLUMN     "userId" INTEGER,
ADD CONSTRAINT "ProductView_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "Setting" DROP CONSTRAINT "Setting_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
ADD CONSTRAINT "Setting_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "ShippingCompany" DROP CONSTRAINT "ShippingCompany_pkey",
DROP COLUMN "logoId",
ADD COLUMN     "logoMediaId" INTEGER,
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
ADD CONSTRAINT "ShippingCompany_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "Ticket" DROP CONSTRAINT "Ticket_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
DROP COLUMN "userId",
ADD COLUMN     "userId" INTEGER NOT NULL,
DROP COLUMN "departmentId",
ADD COLUMN     "departmentId" INTEGER,
DROP COLUMN "orderId",
ADD COLUMN     "orderId" INTEGER,
ADD CONSTRAINT "Ticket_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "TicketAttachment" DROP CONSTRAINT "TicketAttachment_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
DROP COLUMN "messageId",
ADD COLUMN     "messageId" INTEGER NOT NULL,
DROP COLUMN "mediaId",
ADD COLUMN     "mediaId" INTEGER NOT NULL,
ADD CONSTRAINT "TicketAttachment_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "TicketDepartment" DROP CONSTRAINT "TicketDepartment_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
ADD CONSTRAINT "TicketDepartment_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "TicketMessage" DROP CONSTRAINT "TicketMessage_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
DROP COLUMN "ticketId",
ADD COLUMN     "ticketId" INTEGER NOT NULL,
DROP COLUMN "senderId",
ADD COLUMN     "senderId" INTEGER NOT NULL,
ADD CONSTRAINT "TicketMessage_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "Transaction" DROP CONSTRAINT "Transaction_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
DROP COLUMN "orderId",
ADD COLUMN     "orderId" INTEGER,
DROP COLUMN "gatewayId",
ADD COLUMN     "gatewayId" INTEGER,
DROP COLUMN "userId",
ADD COLUMN     "userId" INTEGER NOT NULL,
ADD CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "User" DROP CONSTRAINT "User_pkey",
DROP COLUMN "avatarId",
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
ADD CONSTRAINT "User_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "UserSession" DROP CONSTRAINT "UserSession_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
DROP COLUMN "userId",
ADD COLUMN     "userId" INTEGER NOT NULL,
ADD CONSTRAINT "UserSession_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "Wallet" DROP CONSTRAINT "Wallet_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
DROP COLUMN "userId",
ADD COLUMN     "userId" INTEGER NOT NULL,
ADD CONSTRAINT "Wallet_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "WalletTransaction" DROP CONSTRAINT "WalletTransaction_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
DROP COLUMN "walletId",
ADD COLUMN     "walletId" INTEGER NOT NULL,
DROP COLUMN "orderId",
ADD COLUMN     "orderId" INTEGER,
ADD CONSTRAINT "WalletTransaction_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "Wishlist" DROP CONSTRAINT "Wishlist_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
DROP COLUMN "userId",
ADD COLUMN     "userId" INTEGER NOT NULL,
DROP COLUMN "productId",
ADD COLUMN     "productId" INTEGER NOT NULL,
ADD CONSTRAINT "Wishlist_pkey" PRIMARY KEY ("id");

-- DropTable
DROP TABLE "ProductComparison";

-- DropTable
DROP TABLE "ProductComparisonItem";

-- DropTable
DROP TABLE "ProductVariantImage";

-- CreateTable
CREATE TABLE "WalletWithdrawal" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "amount" INTEGER NOT NULL,
    "status" "WalletWithdrawalStatus" NOT NULL DEFAULT 'PENDING',
    "description" TEXT,
    "adminNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),

    CONSTRAINT "WalletWithdrawal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductDisplayAttributeValue" (
    "id" SERIAL NOT NULL,
    "productId" INTEGER NOT NULL,
    "attributeId" INTEGER NOT NULL,
    "value" TEXT NOT NULL,

    CONSTRAINT "ProductDisplayAttributeValue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductRelated" (
    "id" SERIAL NOT NULL,
    "productId" INTEGER NOT NULL,
    "relatedId" INTEGER NOT NULL,

    CONSTRAINT "ProductRelated_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductAlsoBought" (
    "id" SERIAL NOT NULL,
    "productId" INTEGER NOT NULL,
    "alsoBoughtId" INTEGER NOT NULL,

    CONSTRAINT "ProductAlsoBought_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BlogPostProduct" (
    "id" SERIAL NOT NULL,
    "blogPostId" INTEGER NOT NULL,
    "productId" INTEGER NOT NULL,

    CONSTRAINT "BlogPostProduct_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Story" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "coverImageMediaId" INTEGER NOT NULL,
    "videoMediaId" INTEGER,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Story_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StoryProduct" (
    "id" SERIAL NOT NULL,
    "storyId" INTEGER NOT NULL,
    "productId" INTEGER NOT NULL,

    CONSTRAINT "StoryProduct_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Newsletter" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Newsletter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminNotification" (
    "id" SERIAL NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "link" TEXT,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminNotification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "WalletWithdrawal_userId_idx" ON "WalletWithdrawal"("userId");

-- CreateIndex
CREATE INDEX "WalletWithdrawal_status_idx" ON "WalletWithdrawal"("status");

-- CreateIndex
CREATE UNIQUE INDEX "ProductDisplayAttributeValue_productId_attributeId_key" ON "ProductDisplayAttributeValue"("productId", "attributeId");

-- CreateIndex
CREATE UNIQUE INDEX "ProductRelated_productId_relatedId_key" ON "ProductRelated"("productId", "relatedId");

-- CreateIndex
CREATE UNIQUE INDEX "ProductAlsoBought_productId_alsoBoughtId_key" ON "ProductAlsoBought"("productId", "alsoBoughtId");

-- CreateIndex
CREATE UNIQUE INDEX "BlogPostProduct_blogPostId_productId_key" ON "BlogPostProduct"("blogPostId", "productId");

-- CreateIndex
CREATE UNIQUE INDEX "StoryProduct_storyId_productId_key" ON "StoryProduct"("storyId", "productId");

-- CreateIndex
CREATE UNIQUE INDEX "Newsletter_email_key" ON "Newsletter"("email");

-- CreateIndex
CREATE INDEX "AdminNotification_isRead_idx" ON "AdminNotification"("isRead");

-- CreateIndex
CREATE INDEX "Address_userId_idx" ON "Address"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "AttributeValue_attributeId_value_key" ON "AttributeValue"("attributeId", "value");

-- CreateIndex
CREATE INDEX "BlogPost_categoryId_idx" ON "BlogPost"("categoryId");

-- CreateIndex
CREATE UNIQUE INDEX "Cart_userId_key" ON "Cart"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "CartItem_cartId_variantId_key" ON "CartItem"("cartId", "variantId");

-- CreateIndex
CREATE INDEX "Category_parentId_idx" ON "Category"("parentId");

-- CreateIndex
CREATE UNIQUE INDEX "CategoryAttribute_categoryId_attributeId_key" ON "CategoryAttribute"("categoryId", "attributeId");

-- CreateIndex
CREATE INDEX "Comment_commentableType_commentableId_idx" ON "Comment"("commentableType", "commentableId");

-- CreateIndex
CREATE INDEX "Comment_parentId_idx" ON "Comment"("parentId");

-- CreateIndex
CREATE UNIQUE INDEX "CommentLike_commentId_userId_key" ON "CommentLike"("commentId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "DiscountCodeCategory_discountCodeId_categoryId_key" ON "DiscountCodeCategory"("discountCodeId", "categoryId");

-- CreateIndex
CREATE UNIQUE INDEX "DiscountCodeProduct_discountCodeId_productId_key" ON "DiscountCodeProduct"("discountCodeId", "productId");

-- CreateIndex
CREATE UNIQUE INDEX "DiscountCodeUsage_orderId_key" ON "DiscountCodeUsage"("orderId");

-- CreateIndex
CREATE INDEX "DiscountCodeUsage_discountCodeId_userId_idx" ON "DiscountCodeUsage"("discountCodeId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "DiscountCodeUser_discountCodeId_userId_key" ON "DiscountCodeUser"("discountCodeId", "userId");

-- CreateIndex
CREATE INDEX "Media_entityType_idx" ON "Media"("entityType");

-- CreateIndex
CREATE INDEX "Notification_userId_isRead_idx" ON "Notification"("userId", "isRead");

-- CreateIndex
CREATE INDEX "Order_userId_idx" ON "Order"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "OrderCancellation_orderId_key" ON "OrderCancellation"("orderId");

-- CreateIndex
CREATE INDEX "OrderItem_orderId_idx" ON "OrderItem"("orderId");

-- CreateIndex
CREATE INDEX "Product_brandId_idx" ON "Product"("brandId");

-- CreateIndex
CREATE INDEX "Product_basePrice_idx" ON "Product"("basePrice");

-- CreateIndex
CREATE UNIQUE INDEX "ProductCategory_productId_categoryId_key" ON "ProductCategory"("productId", "categoryId");

-- CreateIndex
CREATE INDEX "ProductImage_productId_idx" ON "ProductImage"("productId");

-- CreateIndex
CREATE INDEX "ProductVariant_productId_idx" ON "ProductVariant"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "ProductVariantAttributeValue_variantId_attributeValueId_key" ON "ProductVariantAttributeValue"("variantId", "attributeValueId");

-- CreateIndex
CREATE INDEX "ProductView_productId_idx" ON "ProductView"("productId");

-- CreateIndex
CREATE INDEX "Transaction_orderId_idx" ON "Transaction"("orderId");

-- CreateIndex
CREATE INDEX "Transaction_userId_idx" ON "Transaction"("userId");

-- CreateIndex
CREATE INDEX "UserSession_userId_idx" ON "UserSession"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Wallet_userId_key" ON "Wallet"("userId");

-- CreateIndex
CREATE INDEX "WalletTransaction_walletId_idx" ON "WalletTransaction"("walletId");

-- CreateIndex
CREATE UNIQUE INDEX "Wishlist_userId_productId_key" ON "Wishlist"("userId", "productId");

-- AddForeignKey
ALTER TABLE "WalletWithdrawal" ADD CONSTRAINT "WalletWithdrawal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Address" ADD CONSTRAINT "Address_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserSession" ADD CONSTRAINT "UserSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoginAttempt" ADD CONSTRAINT "LoginAttempt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OtpCode" ADD CONSTRAINT "OtpCode_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Media" ADD CONSTRAINT "Media_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Category" ADD CONSTRAINT "Category_imageMediaId_fkey" FOREIGN KEY ("imageMediaId") REFERENCES "Media"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Category" ADD CONSTRAINT "Category_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Brand" ADD CONSTRAINT "Brand_logoMediaId_fkey" FOREIGN KEY ("logoMediaId") REFERENCES "Media"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttributeValue" ADD CONSTRAINT "AttributeValue_attributeId_fkey" FOREIGN KEY ("attributeId") REFERENCES "Attribute"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CategoryAttribute" ADD CONSTRAINT "CategoryAttribute_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CategoryAttribute" ADD CONSTRAINT "CategoryAttribute_attributeId_fkey" FOREIGN KEY ("attributeId") REFERENCES "Attribute"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductCategory" ADD CONSTRAINT "ProductCategory_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductCategory" ADD CONSTRAINT "ProductCategory_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductImage" ADD CONSTRAINT "ProductImage_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductImage" ADD CONSTRAINT "ProductImage_mediaId_fkey" FOREIGN KEY ("mediaId") REFERENCES "Media"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductVariant" ADD CONSTRAINT "ProductVariant_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductVariantAttributeValue" ADD CONSTRAINT "ProductVariantAttributeValue_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "ProductVariant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductVariantAttributeValue" ADD CONSTRAINT "ProductVariantAttributeValue_attributeValueId_fkey" FOREIGN KEY ("attributeValueId") REFERENCES "AttributeValue"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductDisplayAttributeValue" ADD CONSTRAINT "ProductDisplayAttributeValue_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductDisplayAttributeValue" ADD CONSTRAINT "ProductDisplayAttributeValue_attributeId_fkey" FOREIGN KEY ("attributeId") REFERENCES "Attribute"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductView" ADD CONSTRAINT "ProductView_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductRelated" ADD CONSTRAINT "ProductRelated_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductRelated" ADD CONSTRAINT "ProductRelated_relatedId_fkey" FOREIGN KEY ("relatedId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductAlsoBought" ADD CONSTRAINT "ProductAlsoBought_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductAlsoBought" ADD CONSTRAINT "ProductAlsoBought_alsoBoughtId_fkey" FOREIGN KEY ("alsoBoughtId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Wishlist" ADD CONSTRAINT "Wishlist_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Wishlist" ADD CONSTRAINT "Wishlist_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cart" ADD CONSTRAINT "Cart_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CartItem" ADD CONSTRAINT "CartItem_cartId_fkey" FOREIGN KEY ("cartId") REFERENCES "Cart"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CartItem" ADD CONSTRAINT "CartItem_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "ProductVariant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiscountCodeProduct" ADD CONSTRAINT "DiscountCodeProduct_discountCodeId_fkey" FOREIGN KEY ("discountCodeId") REFERENCES "DiscountCode"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiscountCodeProduct" ADD CONSTRAINT "DiscountCodeProduct_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiscountCodeCategory" ADD CONSTRAINT "DiscountCodeCategory_discountCodeId_fkey" FOREIGN KEY ("discountCodeId") REFERENCES "DiscountCode"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiscountCodeCategory" ADD CONSTRAINT "DiscountCodeCategory_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiscountCodeUser" ADD CONSTRAINT "DiscountCodeUser_discountCodeId_fkey" FOREIGN KEY ("discountCodeId") REFERENCES "DiscountCode"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiscountCodeUser" ADD CONSTRAINT "DiscountCodeUser_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiscountCodeUsage" ADD CONSTRAINT "DiscountCodeUsage_discountCodeId_fkey" FOREIGN KEY ("discountCodeId") REFERENCES "DiscountCode"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiscountCodeUsage" ADD CONSTRAINT "DiscountCodeUsage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiscountCodeUsage" ADD CONSTRAINT "DiscountCodeUsage_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShippingCompany" ADD CONSTRAINT "ShippingCompany_logoMediaId_fkey" FOREIGN KEY ("logoMediaId") REFERENCES "Media"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_gatewayId_fkey" FOREIGN KEY ("gatewayId") REFERENCES "PaymentGateway"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_addressId_fkey" FOREIGN KEY ("addressId") REFERENCES "Address"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_shippingCompanyId_fkey" FOREIGN KEY ("shippingCompanyId") REFERENCES "ShippingCompany"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_discountCodeId_fkey" FOREIGN KEY ("discountCodeId") REFERENCES "DiscountCode"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "ProductVariant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderStatusHistory" ADD CONSTRAINT "OrderStatusHistory_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderCancellation" ADD CONSTRAINT "OrderCancellation_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderReturn" ADD CONSTRAINT "OrderReturn_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderReturn" ADD CONSTRAINT "OrderReturn_orderItemId_fkey" FOREIGN KEY ("orderItemId") REFERENCES "OrderItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderReturnImage" ADD CONSTRAINT "OrderReturnImage_returnId_fkey" FOREIGN KEY ("returnId") REFERENCES "OrderReturn"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderReturnImage" ADD CONSTRAINT "OrderReturnImage_mediaId_fkey" FOREIGN KEY ("mediaId") REFERENCES "Media"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Wallet" ADD CONSTRAINT "Wallet_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WalletTransaction" ADD CONSTRAINT "WalletTransaction_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "Wallet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WalletTransaction" ADD CONSTRAINT "WalletTransaction_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "TicketDepartment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TicketMessage" ADD CONSTRAINT "TicketMessage_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "Ticket"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TicketMessage" ADD CONSTRAINT "TicketMessage_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TicketAttachment" ADD CONSTRAINT "TicketAttachment_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "TicketMessage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TicketAttachment" ADD CONSTRAINT "TicketAttachment_mediaId_fkey" FOREIGN KEY ("mediaId") REFERENCES "Media"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Comment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommentLike" ADD CONSTRAINT "CommentLike_commentId_fkey" FOREIGN KEY ("commentId") REFERENCES "Comment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommentLike" ADD CONSTRAINT "CommentLike_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommentAttachment" ADD CONSTRAINT "CommentAttachment_commentId_fkey" FOREIGN KEY ("commentId") REFERENCES "Comment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommentAttachment" ADD CONSTRAINT "CommentAttachment_mediaId_fkey" FOREIGN KEY ("mediaId") REFERENCES "Media"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BlogPost" ADD CONSTRAINT "BlogPost_coverImageMediaId_fkey" FOREIGN KEY ("coverImageMediaId") REFERENCES "Media"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BlogPost" ADD CONSTRAINT "BlogPost_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BlogPost" ADD CONSTRAINT "BlogPost_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "BlogCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BlogPostProduct" ADD CONSTRAINT "BlogPostProduct_blogPostId_fkey" FOREIGN KEY ("blogPostId") REFERENCES "BlogPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BlogPostProduct" ADD CONSTRAINT "BlogPostProduct_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Story" ADD CONSTRAINT "Story_coverImageMediaId_fkey" FOREIGN KEY ("coverImageMediaId") REFERENCES "Media"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Story" ADD CONSTRAINT "Story_videoMediaId_fkey" FOREIGN KEY ("videoMediaId") REFERENCES "Media"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StoryProduct" ADD CONSTRAINT "StoryProduct_storyId_fkey" FOREIGN KEY ("storyId") REFERENCES "Story"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StoryProduct" ADD CONSTRAINT "StoryProduct_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Banner" ADD CONSTRAINT "Banner_mediaId_fkey" FOREIGN KEY ("mediaId") REFERENCES "Media"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Popup" ADD CONSTRAINT "Popup_mediaId_fkey" FOREIGN KEY ("mediaId") REFERENCES "Media"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
