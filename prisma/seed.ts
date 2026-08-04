// prisma/seed.ts
// اجرا: npx ts-node prisma/seed.ts  یا  npx prisma db seed

import {
  PrismaClient,
  Role,
  ProductStatus,
  PostStatus,
  DiscountType,
  AttributeInputType,
  MediaType,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  TransactionType,
  WalletTransactionType,
  TicketStatus,
  TicketPriority,
  SenderType,
  CommentStatus,
  NotificationType,
  BannerPosition,
  OtpChannel,
  OtpPurpose,
  PricingMode,
} from "../src/generated/prisma";
import * as bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import * as dotenv from "dotenv";
import { faker } from '@faker-js/faker';

dotenv.config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 شروع seed دیتابیس...");

  // پاکسازی دیتابیس (به ترتیب وابستگی معکوس)
  // console.log("🧹 پاکسازی داده‌های قبلی...");
  // await prisma.storyProduct.deleteMany();
  // await prisma.story.deleteMany();
  // await prisma.popup.deleteMany();
  // await prisma.newsletter.deleteMany();
  // await prisma.blogPostProduct.deleteMany();
  // await prisma.blogPost.deleteMany();
  // await prisma.blogCategory.deleteMany();
  // await prisma.auditLog.deleteMany();
  // await prisma.notification.deleteMany();
  // await prisma.commentAttachment.deleteMany();
  // await prisma.ticketAttachment.deleteMany();
  // await prisma.ticketMessage.deleteMany();
  // await prisma.ticket.deleteMany();
  // await prisma.ticketDepartment.deleteMany();
  // await prisma.commentLike.deleteMany();
  // await prisma.comment.deleteMany();
  // await prisma.cartItem.deleteMany();
  // await prisma.cart.deleteMany();
  // await prisma.wishlist.deleteMany();
  // await prisma.transaction.deleteMany();
  // await prisma.orderStatusHistory.deleteMany();
  // await prisma.orderItem.deleteMany();
  // await prisma.order.deleteMany();
  // await prisma.discountCodeProduct.deleteMany();
  // await prisma.discountCodeCategory.deleteMany();
  // await prisma.discountCodeUser.deleteMany();
  // await prisma.discountCode.deleteMany();
  // await prisma.paymentGateway.deleteMany();
  // await prisma.shippingCompany.deleteMany();
  // await prisma.address.deleteMany();
  // await prisma.walletTransaction.deleteMany();
  // await prisma.wallet.deleteMany();
  // await prisma.productDisplayAttributeValue.deleteMany();
  // await prisma.productVariantAttributeValue.deleteMany();
  // await prisma.productVariant.deleteMany();
  // await prisma.productImage.deleteMany();
  // await prisma.productCategory.deleteMany();
  // await prisma.product.deleteMany();
  // await prisma.categoryAttribute.deleteMany();
  // await prisma.category.deleteMany();
  // await prisma.attributeValue.deleteMany();
  // await prisma.attribute.deleteMany();
  // await prisma.brand.deleteMany();
  // await prisma.userSession.deleteMany();
  // await prisma.user.deleteMany();
  // await prisma.media.deleteMany();
  // await prisma.setting.deleteMany();
  // console.log("✅ پاکسازی انجام شد");

  // ============================================================
  // 1. Media (تصاویر placeholder)
  // ============================================================
  // console.log("📸 ایجاد media...");

  // const mediaList = await Promise.all([
  //   prisma.media.create({
  //     data: {
  //       url: "https://picsum.photos/seed/avatar1/200/200",
  //       fileName: "avatar1.jpg",
  //       originalName: "avatar1.jpg",
  //       filePath: "seed/avatar1.jpg",
  //       mimeType: "image/jpeg",
  //       size: 20000,
  //       type: MediaType.IMAGE,
  //       entityType: "USER",
  //     },
  //   }),
  //   prisma.media.create({
  //     data: {
  //       url: "https://picsum.photos/seed/avatar2/200/200",
  //       fileName: "avatar2.jpg",
  //       originalName: "avatar2.jpg",
  //       filePath: "seed/avatar2.jpg",
  //       mimeType: "image/jpeg",
  //       size: 18000,
  //       type: MediaType.IMAGE,
  //       entityType: "USER",
  //     },
  //   }),
  //   prisma.media.create({
  //     data: {
  //       url: "https://picsum.photos/seed/cat1/400/300",
  //       fileName: "cat1.jpg",
  //       originalName: "cat1.jpg",
  //       filePath: "seed/cat1.jpg",
  //       mimeType: "image/jpeg",
  //       size: 45000,
  //       type: MediaType.IMAGE,
  //       entityType: "CATEGORY",
  //     },
  //   }),
  //   prisma.media.create({
  //     data: {
  //       url: "https://picsum.photos/seed/cat2/400/300",
  //       fileName: "cat2.jpg",
  //       originalName: "cat2.jpg",
  //       filePath: "seed/cat2.jpg",
  //       mimeType: "image/jpeg",
  //       size: 42000,
  //       type: MediaType.IMAGE,
  //       entityType: "CATEGORY",
  //     },
  //   }),
  //   prisma.media.create({
  //     data: {
  //       url: "https://picsum.photos/seed/cat3/400/300",
  //       fileName: "cat3.jpg",
  //       originalName: "cat3.jpg",
  //       filePath: "seed/cat3.jpg",
  //       mimeType: "image/jpeg",
  //       size: 38000,
  //       type: MediaType.IMAGE,
  //       entityType: "CATEGORY",
  //     },
  //   }),
  //   prisma.media.create({
  //     data: {
  //       url: "https://picsum.photos/seed/brand1/300/200",
  //       fileName: "brand1.jpg",
  //       originalName: "brand1.jpg",
  //       filePath: "seed/brand1.jpg",
  //       mimeType: "image/jpeg",
  //       size: 25000,
  //       type: MediaType.IMAGE,
  //       entityType: "BRAND",
  //     },
  //   }),
  //   prisma.media.create({
  //     data: {
  //       url: "https://picsum.photos/seed/brand2/300/200",
  //       fileName: "brand2.jpg",
  //       originalName: "brand2.jpg",
  //       filePath: "seed/brand2.jpg",
  //       mimeType: "image/jpeg",
  //       size: 22000,
  //       type: MediaType.IMAGE,
  //       entityType: "BRAND",
  //     },
  //   }),
  //   prisma.media.create({
  //     data: {
  //       url: "https://picsum.photos/seed/prod1/600/600",
  //       fileName: "prod1.jpg",
  //       originalName: "prod1.jpg",
  //       filePath: "seed/prod1.jpg",
  //       mimeType: "image/jpeg",
  //       size: 80000,
  //       type: MediaType.IMAGE,
  //       entityType: "PRODUCT",
  //     },
  //   }),
  //   prisma.media.create({
  //     data: {
  //       url: "https://picsum.photos/seed/prod2/600/600",
  //       fileName: "prod2.jpg",
  //       originalName: "prod2.jpg",
  //       filePath: "seed/prod2.jpg",
  //       mimeType: "image/jpeg",
  //       size: 75000,
  //       type: MediaType.IMAGE,
  //       entityType: "PRODUCT",
  //     },
  //   }),
  //   prisma.media.create({
  //     data: {
  //       url: "https://picsum.photos/seed/prod3/600/600",
  //       fileName: "prod3.jpg",
  //       originalName: "prod3.jpg",
  //       filePath: "seed/prod3.jpg",
  //       mimeType: "image/jpeg",
  //       size: 70000,
  //       type: MediaType.IMAGE,
  //       entityType: "PRODUCT",
  //     },
  //   }),
  //   prisma.media.create({
  //     data: {
  //       url: "https://picsum.photos/seed/prod4/600/600",
  //       fileName: "prod4.jpg",
  //       originalName: "prod4.jpg",
  //       filePath: "seed/prod4.jpg",
  //       mimeType: "image/jpeg",
  //       size: 85000,
  //       type: MediaType.IMAGE,
  //       entityType: "PRODUCT",
  //     },
  //   }),
  //   prisma.media.create({
  //     data: {
  //       url: "https://picsum.photos/seed/banner1/1200/400",
  //       fileName: "banner1.jpg",
  //       originalName: "banner1.jpg",
  //       filePath: "seed/banner1.jpg",
  //       mimeType: "image/jpeg",
  //       size: 150000,
  //       type: MediaType.IMAGE,
  //       entityType: "BANNER",
  //     },
  //   }),
  //   prisma.media.create({
  //     data: {
  //       url: "https://picsum.photos/seed/banner2/1200/400",
  //       fileName: "banner2.jpg",
  //       originalName: "banner2.jpg",
  //       filePath: "seed/banner2.jpg",
  //       mimeType: "image/jpeg",
  //       size: 145000,
  //       type: MediaType.IMAGE,
  //       entityType: "BANNER",
  //     },
  //   }),
  //   prisma.media.create({
  //     data: {
  //       url: "https://picsum.photos/seed/ship1/200/100",
  //       fileName: "ship1.jpg",
  //       originalName: "ship1.jpg",
  //       filePath: "seed/ship1.jpg",
  //       mimeType: "image/jpeg",
  //       size: 12000,
  //       type: MediaType.IMAGE,
  //       entityType: "SHIPPING",
  //     },
  //   }),
  // ]);

  // const [
  //   avatarMedia1,
  //   avatarMedia2,
  //   catMedia1,
  //   catMedia2,
  //   catMedia3,
  //   brandMedia1,
  //   brandMedia2,
  //   prodMedia1,
  //   prodMedia2,
  //   prodMedia3,
  //   prodMedia4,
  //   bannerMedia1,
  //   bannerMedia2,
  //   shipMedia1,
  // ] = mediaList;

  // ============================================================
  // 2. Users
  // ============================================================
  console.log("👤 ایجاد کاربران...");

  const hashedPassword = await bcrypt.hash("a1234", 10);
  const customerPassword = await bcrypt.hash("a1234", 10);

  const admin = await prisma.user.create({
    data: {
      fullName: "مدیر سیستم",
      email: "admin@gmail.com",
      phone: "09123456789",
      password: hashedPassword,
      role: Role.ADMIN,
      emailVerifiedAt: new Date(),
      phoneVerifiedAt: new Date(),
      lastLoginAt: new Date(),
    },
  });

  // const editor = await prisma.user.create({
  //   data: {
  //     fullName: "ویراستار محتوا",
  //     email: "editor@mrkafshdoz.com",
  //     phone: "09100000002",
  //     password: hashedPassword,
  //     role: Role.EDITOR,
  //     emailVerifiedAt: new Date(),
  //     phoneVerifiedAt: new Date(),
  //   },
  // });

  // const customer1 = await prisma.user.create({
  //   data: {
  //     fullName: "علی احمدی",
  //     email: "ali@example.com",
  //     phone: "09111111111",
  //     password: customerPassword,
  //     role: Role.CUSTOMER,
  //     emailVerifiedAt: new Date(),
  //     phoneVerifiedAt: new Date(),
  //     lastLoginAt: new Date(),
  //   },
  // });

  // const customer2 = await prisma.user.create({
  //   data: {
  //     fullName: "فاطمه رضایی",
  //     email: "fateme@example.com",
  //     phone: "09222222222",
  //     password: customerPassword,
  //     role: Role.CUSTOMER,
  //     emailVerifiedAt: new Date(),
  //   },
  // });

  // const customer3 = await prisma.user.create({
  //   data: {
  //     fullName: "رضا کریمی",
  //     email: "reza@example.com",
  //     phone: "09333333333",
  //     password: customerPassword,
  //     role: Role.CUSTOMER,
  //   },
  // });

  // ============================================================
  // 3. Wallets
  // ============================================================
  // console.log("👛 ایجاد کیف پول...");

  // const wallet1 = await prisma.wallet.create({
  //   data: { userId: customer1.id, balance: 500000 },
  // });
  // await prisma.wallet.create({ data: { userId: customer2.id, balance: 0 } });
  // await prisma.wallet.create({
  //   data: { userId: customer3.id, balance: 200000 },
  // });

  // await prisma.walletTransaction.create({
  //   data: {
  //     walletId: wallet1.id,
  //     type: WalletTransactionType.DEPOSIT,
  //     amount: 500000,
  //     description: "شارژ اولیه کیف پول",
  //   },
  // });

  // ============================================================
  // 4. Addresses
  // ============================================================
  // console.log("🏠 ایجاد آدرس‌ها...");

  // const address1 = await prisma.address.create({
  //   data: {
  //     userId: customer1.id,
  //     title: "خانه",
  //     receiverName: "علی احمدی",
  //     receiverPhone: "09111111111",
  //     province: "تهران",
  //     city: "تهران",
  //     postalCode: "1234567890",
  //     fullAddress: "تهران، خیابان ولیعصر، پلاک ۱۲، واحد ۳",
  //     lat: 35.7219,
  //     lng: 51.3347,
  //     isDefault: true,
  //   },
  // });

  // await prisma.address.create({
  //   data: {
  //     userId: customer2.id,
  //     title: "محل کار",
  //     receiverName: "فاطمه رضایی",
  //     receiverPhone: "09222222222",
  //     province: "اصفهان",
  //     city: "اصفهان",
  //     postalCode: "0987654321",
  //     fullAddress: "اصفهان، خیابان چهارباغ، پلاک ۵۵",
  //     isDefault: true,
  //   },
  // });

  // ============================================================
  // 5. Brands
  // ============================================================
  // console.log("🏷️ ایجاد برندها...");

  // const nike = await prisma.brand.create({
  //   data: {
  //     name: "نایک",
  //     slug: "nike",
  //     description: "برند معروف ورزشی آمریکایی",
  //     logoMediaId: brandMedia1.id,
  //     isActive: true,
  //   },
  // });

  // const adidas = await prisma.brand.create({
  //   data: {
  //     name: "آدیداس",
  //     slug: "adidas",
  //     description: "برند ورزشی آلمانی",
  //     logoMediaId: brandMedia2.id,
  //     isActive: true,
  //   },
  // });

  // const localBrand = await prisma.brand.create({
  //   data: {
  //     name: "ایران‌پوش",
  //     slug: "iranpoosh",
  //     description: "برند ایرانی تولیدکننده پوشاک",
  //     isActive: true,
  //   },
  // });

  // ============================================================
  // 6. Attributes & Values
  // ============================================================
  // console.log("📐 ایجاد ویژگی‌ها...");

  // const colorAttr = await prisma.attribute.create({
  //   data: {
  //     name: "رنگ",
  //     slug: "color",
  //     inputType: AttributeInputType.COLOR,
  //     isFilterable: true,
  //     isVariant: true,
  //     values: {
  //       create: [
  //         { value: "مشکی", colorHex: "#000000", order: 1 },
  //         { value: "سفید", colorHex: "#FFFFFF", order: 2 },
  //         { value: "قرمز", colorHex: "#FF0000", order: 3 },
  //         { value: "آبی", colorHex: "#0000FF", order: 4 },
  //         { value: "سبز", colorHex: "#008000", order: 5 },
  //       ],
  //     },
  //   },
  //   include: { values: true },
  // });

  // const sizeAttr = await prisma.attribute.create({
  //   data: {
  //     name: "سایز",
  //     slug: "size",
  //     inputType: AttributeInputType.SELECT,
  //     isFilterable: true,
  //     isVariant: true,
  //     values: {
  //       create: [
  //         { value: "S", order: 1 },
  //         { value: "M", order: 2 },
  //         { value: "L", order: 3 },
  //         { value: "XL", order: 4 },
  //         { value: "XXL", order: 5 },
  //       ],
  //     },
  //   },
  //   include: { values: true },
  // });

  // const shoeSizeAttr = await prisma.attribute.create({
  //   data: {
  //     name: "سایز کفش",
  //     slug: "shoe-size",
  //     inputType: AttributeInputType.SELECT,
  //     isFilterable: true,
  //     isVariant: true,
  //     values: {
  //       create: [
  //         { value: "۳۹", order: 1 },
  //         { value: "۴۰", order: 2 },
  //         { value: "۴۱", order: 3 },
  //         { value: "۴۲", order: 4 },
  //         { value: "۴۳", order: 5 },
  //         { value: "۴۴", order: 6 },
  //       ],
  //     },
  //   },
  //   include: { values: true },
  // });

  // const materialAttr = await prisma.attribute.create({
  //   data: {
  //     name: "جنس",
  //     slug: "material",
  //     inputType: AttributeInputType.SELECT,
  //     isFilterable: true,
  //     isVariant: false,
  //     values: {
  //       create: [
  //         { value: "پنبه", order: 1 },
  //         { value: "پلی‌استر", order: 2 },
  //         { value: "چرم", order: 3 },
  //         { value: "کتان", order: 4 },
  //       ],
  //     },
  //   },
  //   include: { values: true },
  // });

  // ============================================================
  // 7. Categories
  // ============================================================
  // console.log("📁 ایجاد دسته‌بندی‌ها...");

  // const clothingCat = await prisma.category.create({
  //   data: {
  //     name: "پوشاک",
  //     slug: "clothing",
  //     description: "انواع لباس‌های مردانه و زنانه",
  //     imageMediaId: catMedia1.id,
  //     order: 1,
  //     isActive: true,
  //     metaTitle: "خرید پوشاک آنلاین",
  //     metaDescription: "جدیدترین مدل‌های پوشاک را در مرکافش‌دوز بخرید",
  //   },
  // });

  // const tshirtCat = await prisma.category.create({
  //   data: {
  //     name: "تی‌شرت",
  //     slug: "tshirt",
  //     parentId: clothingCat.id,
  //     order: 1,
  //     isActive: true,
  //   },
  // });

  // const hoodyCat = await prisma.category.create({
  //   data: {
  //     name: "هودی و سویشرت",
  //     slug: "hoodie",
  //     parentId: clothingCat.id,
  //     order: 2,
  //     isActive: true,
  //   },
  // });

  // const shoesCat = await prisma.category.create({
  //   data: {
  //     name: "کفش",
  //     slug: "shoes",
  //     description: "انواع کفش ورزشی و روزمره",
  //     imageMediaId: catMedia2.id,
  //     order: 2,
  //     isActive: true,
  //   },
  // });

  // const sneakersCat = await prisma.category.create({
  //   data: {
  //     name: "اسنیکر",
  //     slug: "sneakers",
  //     parentId: shoesCat.id,
  //     order: 1,
  //     isActive: true,
  //   },
  // });

  // const accessoriesCat = await prisma.category.create({
  //   data: {
  //     name: "اکسسوری",
  //     slug: "accessories",
  //     description: "کلاه، کمربند، کیف و ...",
  //     imageMediaId: catMedia3.id,
  //     order: 3,
  //     isActive: true,
  //   },
  // });

  // CategoryAttributes
  // await prisma.categoryAttribute.createMany({
  //   data: [
  //     { categoryId: clothingCat.id, attributeId: colorAttr.id },
  //     { categoryId: clothingCat.id, attributeId: sizeAttr.id },
  //     { categoryId: clothingCat.id, attributeId: materialAttr.id },
  //     { categoryId: tshirtCat.id, attributeId: colorAttr.id },
  //     { categoryId: tshirtCat.id, attributeId: sizeAttr.id },
  //     { categoryId: shoesCat.id, attributeId: colorAttr.id },
  //     { categoryId: shoesCat.id, attributeId: shoeSizeAttr.id },
  //     { categoryId: sneakersCat.id, attributeId: colorAttr.id },
  //     { categoryId: sneakersCat.id, attributeId: shoeSizeAttr.id },
  //   ],
  // });

  // ============================================================
  // 8. Products
  // ============================================================
  // console.log("📦 ایجاد محصولات...");

  // const colorBlack = colorAttr.values.find((v) => v.value === "مشکی")!;
  // const colorWhite = colorAttr.values.find((v) => v.value === "سفید")!;
  // const colorBlue = colorAttr.values.find((v) => v.value === "آبی")!;
  // const sizeM = sizeAttr.values.find((v) => v.value === "M")!;
  // const sizeL = sizeAttr.values.find((v) => v.value === "L")!;
  // const sizeXL = sizeAttr.values.find((v) => v.value === "XL")!;
  // const shoe41 = shoeSizeAttr.values.find((v) => v.value === "۴۱")!;
  // const shoe42 = shoeSizeAttr.values.find((v) => v.value === "۴۲")!;
  // const shoe43 = shoeSizeAttr.values.find((v) => v.value === "۴۳")!;

  // محصول ۱: تی‌شرت نایک
  // const product1 = await prisma.product.create({
  //   data: {
  //     name: "تی‌شرت ورزشی نایک مدل Dri-FIT",
  //     slug: "nike-dri-fit-tshirt",
  //     brandId: nike.id,
  //     shortDescription: "تی‌شرت سبک و تنفس‌پذیر برای ورزش‌های شدید",
  //     description:
  //       "<p>این تی‌شرت با فناوری Dri-FIT نایک، رطوبت را از پوست دور می‌کند و شما را خنک نگه می‌دارد.</p>",
  //     status: ProductStatus.PUBLISHED,
  //     isFeatured: true,
  //     minPrice: 450000,
  //     maxPrice: 550000,
  //     isInStock: true,
  //     hasActiveDiscount: true,
  //     createdById: admin.id,
  //     metaTitle: "خرید تی‌شرت نایک Dri-FIT",
  //     metaDescription:
  //       "تی‌شرت ورزشی نایک با فناوری Dri-FIT، مناسب برای ورزش و روزمره",
  //     categories: {
  //       create: [{ categoryId: tshirtCat.id }, { categoryId: clothingCat.id }],
  //     },
  //     images: {
  //       create: [
  //         { mediaId: prodMedia1.id, order: 1, isMain: true },
  //         { mediaId: prodMedia2.id, order: 2 },
  //       ],
  //     },
  //     variants: {
  //       create: [
  //         {
  //           sku: "NIKE-DRIFIT-BLK-M",
  //           priceAdjustment: 0,
  //           stock: 15,
  //           weight: 0.3,
  //           isDefault: true,
  //           isActive: true,
  //           attributeValues: {
  //             create: [
  //               { attributeValueId: colorBlack.id },
  //               { attributeValueId: sizeM.id },
  //             ],
  //           },
  //         },
  //         {
  //           sku: "NIKE-DRIFIT-BLK-L",
  //           priceAdjustment: 0,
  //           stock: 10,
  //           weight: 0.32,
  //           isActive: true,
  //           attributeValues: {
  //             create: [
  //               { attributeValueId: colorBlack.id },
  //               { attributeValueId: sizeL.id },
  //             ],
  //           },
  //         },
  //         {
  //           sku: "NIKE-DRIFIT-WHT-M",
  //           priceAdjustment: 30000,
  //           stock: 8,
  //           weight: 0.3,
  //           isActive: true,
  //           attributeValues: {
  //             create: [
  //               { attributeValueId: colorWhite.id },
  //               { attributeValueId: sizeM.id },
  //             ],
  //           },
  //         },
  //         {
  //           sku: "NIKE-DRIFIT-WHT-L",
  //           priceAdjustment: 30000,
  //           stock: 0,
  //           weight: 0.32,
  //           isActive: true,
  //           attributeValues: {
  //             create: [
  //               { attributeValueId: colorWhite.id },
  //               { attributeValueId: sizeL.id },
  //             ],
  //           },
  //         },
  //       ],
  //     },
  //   },
  //   include: { variants: true },
  // });

  // محصول ۲: هودی آدیداس
  // const product2 = await prisma.product.create({
  //   data: {
  //     name: "هودی آدیداس Essentials",
  //     slug: "adidas-essentials-hoodie",
  //     brandId: adidas.id,
  //     shortDescription: "هودی گرم و راحت با جنس فلیس",
  //     description:
  //       "<p>هودی Essentials آدیداس با جنس فلیس نرم، ایده‌آل برای فصل سرد است.</p>",
  //     status: ProductStatus.PUBLISHED,
  //     isFeatured: true,
  //     minPrice: 850000,
  //     maxPrice: 950000,
  //     isInStock: true,
  //     hasActiveDiscount: false,
  //     createdById: admin.id,
  //     categories: {
  //       create: [{ categoryId: hoodyCat.id }, { categoryId: clothingCat.id }],
  //     },
  //     images: { create: [{ mediaId: prodMedia3.id, order: 1, isMain: true }] },
  //     variants: {
  //       create: [
  //         {
  //           sku: "ADIDAS-HOOD-BLK-L",
  //           priceAdjustment: 0,
  //           stock: 20,
  //           weight: 0.7,
  //           isDefault: true,
  //           isActive: true,
  //           attributeValues: {
  //             create: [
  //               { attributeValueId: colorBlack.id },
  //               { attributeValueId: sizeL.id },
  //             ],
  //           },
  //         },
  //         {
  //           sku: "ADIDAS-HOOD-BLK-XL",
  //           priceAdjustment: 50000,
  //           stock: 12,
  //           weight: 0.75,
  //           isActive: true,
  //           attributeValues: {
  //             create: [
  //               { attributeValueId: colorBlack.id },
  //               { attributeValueId: sizeXL.id },
  //             ],
  //           },
  //         },
  //         {
  //           sku: "ADIDAS-HOOD-BLU-L",
  //           priceAdjustment: 20000,
  //           stock: 5,
  //           weight: 0.7,
  //           isActive: true,
  //           attributeValues: {
  //             create: [
  //               { attributeValueId: colorBlue.id },
  //               { attributeValueId: sizeL.id },
  //             ],
  //           },
  //         },
  //       ],
  //     },
  //   },
  //   include: { variants: true },
  // });

  // محصول ۳: اسنیکر نایک
  // const product3 = await prisma.product.create({
  //   data: {
  //     name: "کفش اسنیکر نایک Air Max",
  //     slug: "nike-air-max-sneaker",
  //     brandId: nike.id,
  //     shortDescription: "کفش راحت و سبک با کوشن Air Max",
  //     description:
  //       "<p>نایک Air Max با فناوری کوشن هوا، راحت‌ترین تجربه پوشیدن را فراهم می‌کند.</p>",
  //     status: ProductStatus.PUBLISHED,
  //     isFeatured: true,
  //     minPrice: 1800000,
  //     maxPrice: 2200000,
  //     isInStock: true,
  //     hasActiveDiscount: true,
  //     createdById: admin.id,
  //     categories: {
  //       create: [{ categoryId: sneakersCat.id }, { categoryId: shoesCat.id }],
  //     },
  //     images: { create: [{ mediaId: prodMedia4.id, order: 1, isMain: true }] },
  //     variants: {
  //       create: [
  //         {
  //           sku: "NIKE-AIRMAX-WHT-41",
  //           priceAdjustment: 0,
  //           stock: 6,
  //           weight: 0.8,
  //           isDefault: true,
  //           isActive: true,
  //           attributeValues: {
  //             create: [
  //               { attributeValueId: colorWhite.id },
  //               { attributeValueId: shoe41.id },
  //             ],
  //           },
  //         },
  //         {
  //           sku: "NIKE-AIRMAX-WHT-42",
  //           priceAdjustment: 50000,
  //           stock: 8,
  //           weight: 0.82,
  //           isActive: true,
  //           attributeValues: {
  //             create: [
  //               { attributeValueId: colorWhite.id },
  //               { attributeValueId: shoe42.id },
  //             ],
  //           },
  //         },
  //         {
  //           sku: "NIKE-AIRMAX-BLK-42",
  //           priceAdjustment: 200000,
  //           stock: 4,
  //           weight: 0.82,
  //           isActive: true,
  //           attributeValues: {
  //             create: [
  //               { attributeValueId: colorBlack.id },
  //               { attributeValueId: shoe42.id },
  //             ],
  //           },
  //         },
  //         {
  //           sku: "NIKE-AIRMAX-BLK-43",
  //           priceAdjustment: 400000,
  //           stock: 3,
  //           weight: 0.85,
  //           isActive: true,
  //           attributeValues: {
  //             create: [
  //               { attributeValueId: colorBlack.id },
  //               { attributeValueId: shoe43.id },
  //             ],
  //           },
  //         },
  //       ],
  //     },
  //   },
  //   include: { variants: true },
  // });

  // محصول ۴: پیش‌نویس (برای تست)
  // const product4 = await prisma.product.create({
  //   data: {
  //     name: "تی‌شرت ایران‌پوش طرح سنتی",
  //     slug: "iranpoosh-traditional-tshirt",
  //     brandId: localBrand.id,
  //     shortDescription: "تی‌شرت با طرح‌های سنتی ایرانی",
  //     status: ProductStatus.DRAFT,
  //     minPrice: 280000,
  //     maxPrice: 280000,
  //     isInStock: true,
  //     createdById: editor.id,
  //     categories: { create: [{ categoryId: tshirtCat.id }] },
  //     variants: {
  //       create: [
  //         {
  //           sku: "IRAN-TRAD-BLU-M",
  //           priceAdjustment: 0,
  //           stock: 30,
  //           weight: 0.25,
  //           isDefault: true,
  //           isActive: true,
  //           attributeValues: {
  //             create: [
  //               { attributeValueId: colorBlue.id },
  //               { attributeValueId: sizeM.id },
  //             ],
  //           },
  //         },
  //       ],
  //     },
  //   },
  //   include: { variants: true },
  // });

  // ============================================================
  // 9. Shipping Companies
  // ============================================================
  // console.log("🚚 ایجاد شرکت‌های ارسال...");

  // const postCompany = await prisma.shippingCompany.create({
  //   data: {
  //     name: "پست جمهوری اسلامی",
  //     description: "ارسال از طریق پست پیشتاز (نرخ ثابت)",
  //     pricingType: "FIXED",
  //     baseCost: 35000,
  //     acceptsPrepay: true,
  //     acceptsFreightCollect: true,
  //     estimatedDaysMin: 3,
  //     estimatedDaysMax: 7,
  //     isActive: true,
  //   },
  // });

  // const tipaxCompany = await prisma.shippingCompany.create({
  //   data: {
  //     name: "تیپاکس",
  //     description: "ارسال سریع بر اساس وزن و مسافت",
  //     pricingType: "WEIGHT_DISTANCE",
  //     pricePerKg: 15000,
  //     pricePerKm: 2000,
  //     acceptsPrepay: true,
  //     acceptsFreightCollect: false,
  //     estimatedDaysMin: 1,
  //     estimatedDaysMax: 2,
  //     isActive: true,
  //   },
  // });

  // ============================================================
  // 10. Payment Gateway
  // ============================================================
  // console.log("💳 ایجاد درگاه پرداخت...");

  // const zarinpal = await prisma.paymentGateway.create({
  //   data: {
  //     name: "زرین‌پال",
  //     slug: "zarinpal",
  //     isActive: true,
  //     config: {
  //       merchantId: "XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX",
  //       sandbox: true,
  //     },
  //   },
  // });

  // ============================================================
  // 11. Discount Codes
  // ============================================================
  // console.log("🏷️ ایجاد کدهای تخفیف...");

  // const discount1 = await prisma.discountCode.create({
  //   data: {
  //     code: "WELCOME20",
  //     type: DiscountType.PERCENT,
  //     value: 20,
  //     maxDiscountAmount: 200000,
  //     minCartAmount: 300000,
  //     maxUsage: 100,
  //     maxUsagePerUser: 1,
  //     isActive: true,
  //     expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  //   },
  // });

  // const discount2 = await prisma.discountCode.create({
  //   data: {
  //     code: "SUMMER50K",
  //     type: DiscountType.FIXED,
  //     value: 50000,
  //     minCartAmount: 500000,
  //     maxUsage: 50,
  //     maxUsagePerUser: 2,
  //     isActive: true,
  //     expiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
  //   },
  // });

  // ============================================================
  // 12. Orders (سفارش‌های نمونه)
  // ============================================================
  // console.log("🛒 ایجاد سفارش‌ها...");

  // const variant1 = product1.variants[0]; // Nike Dri-FIT Black M
  // const variant3 = product3.variants[0]; // Nike Air Max White 41

  // سفارش تحویل‌داده‌شده
  // const order1 = await prisma.order.create({
  //   data: {
  //     orderNumber: "ORD-1001",
  //     userId: customer1.id,
  //     addressId: address1.id,
  //     shippingAddress: {
  //       province: "تهران",
  //       city: "تهران",
  //       fullAddress: "تهران، خیابان ولیعصر، پلاک ۱۲، واحد ۳",
  //       receiverName: "علی احمدی",
  //       receiverPhone: "09111111111",
  //     },
  //     shippingCompanyId: postCompany.id,
  //     shippingCost: 35000,
  //     subtotal: 450000,
  //     discountAmount: 112500,
  //     taxAmount: 0,
  //     totalAmount: 372500,
  //     paymentMethod: PaymentMethod.GATEWAY,
  //     status: OrderStatus.DELIVERED,
  //     paidAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
  //     items: {
  //       create: [
  //         {
  //           variantId: variant1.id,
  //           productName: "تی‌شرت ورزشی نایک مدل Dri-FIT",
  //           variantAttributes: "مشکی - M",
  //           price: 450000,
  //           quantity: 1,
  //           discountAmount: 112500,
  //         },
  //       ],
  //     },
  //     statusHistory: {
  //       create: [
  //         {
  //           status: OrderStatus.PENDING_PAYMENT,
  //           createdAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000),
  //         },
  //         {
  //           status: OrderStatus.PROCESSING,
  //           createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
  //         },
  //         {
  //           status: OrderStatus.SHIPPED,
  //           note: "کد رهگیری: ۱۲۳۴۵۶۷۸",
  //           createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
  //         },
  //         {
  //           status: OrderStatus.DELIVERED,
  //           createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
  //         },
  //       ],
  //     },
  //   },
  // });

  // تراکنش پرداخت سفارش ۱
  // await prisma.transaction.create({
  //   data: {
  //     orderId: order1.id,
  //     gatewayId: zarinpal.id,
  //     userId: customer1.id,
  //     type: TransactionType.ORDER_PAYMENT,
  //     amount: 372500,
  //     status: PaymentStatus.SUCCESS,
  //     refId: "ZP-98765432",
  //     trackingCode: "TRK-1001-PAID",
  //   },
  // });

  // سفارش در حال پردازش
  // const order2 = await prisma.order.create({
  //   data: {
  //     orderNumber: "ORD-1002",
  //     userId: customer1.id,
  //     addressId: address1.id,
  //     shippingAddress: {
  //       province: "تهران",
  //       city: "تهران",
  //       fullAddress: "تهران، خیابان ولیعصر، پلاک ۱۲، واحد ۳",
  //       receiverName: "علی احمدی",
  //       receiverPhone: "09111111111",
  //     },
  //     shippingCompanyId: tipaxCompany.id,
  //     shippingCost: 60000,
  //     subtotal: 1800000,
  //     discountAmount: 0,
  //     taxAmount: 0,
  //     totalAmount: 1860000,
  //     paymentMethod: PaymentMethod.GATEWAY,
  //     status: OrderStatus.PROCESSING,
  //     paidAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
  //     items: {
  //       create: [
  //         {
  //           variantId: variant3.id,
  //           productName: "کفش اسنیکر نایک Air Max",
  //           variantAttributes: "سفید - ۴۱",
  //           price: 1800000,
  //           quantity: 1,
  //           discountAmount: 0,
  //         },
  //       ],
  //     },
  //     statusHistory: {
  //       create: [
  //         {
  //           status: OrderStatus.PENDING_PAYMENT,
  //           createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
  //         },
  //         {
  //           status: OrderStatus.PROCESSING,
  //           createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
  //         },
  //       ],
  //     },
  //   },
  // });

  // await prisma.transaction.create({
  //   data: {
  //     orderId: order2.id,
  //     gatewayId: zarinpal.id,
  //     userId: customer1.id,
  //     type: TransactionType.ORDER_PAYMENT,
  //     amount: 1860000,
  //     status: PaymentStatus.SUCCESS,
  //     refId: "ZP-11223344",
  //     trackingCode: "TRK-1002-PAID",
  //   },
  // });

  // بعد از ثبت سفارش‌ها، مقادیر denormalize شده را به‌روزرسانی می‌کنیم
  // چون تابع increment در سرویس order در seed مستقیم صدا زده نمی‌شود
  // (آپدیت وضعیت توسط ادمین انجام نمی‌شود، مستقیماً DELIVERED زده شده)
  // await prisma.product.update({
  //   where: { id: product1.id },
  //   data: { totalSold: 5, viewCount: 320 },
  // });
  // await prisma.product.update({
  //   where: { id: product3.id },
  //   data: { totalSold: 12, viewCount: 580 },
  // });
  // await prisma.product.update({
  //   where: { id: product2.id },
  //   data: { viewCount: 210 },
  // });

  // ============================================================
  // 13. Comments (دیدگاه‌ها)
  // ============================================================
  // console.log("💬 ایجاد دیدگاه‌ها...");

  // const comment1 = await prisma.comment.create({
  //   data: {
  //     commentableType: "PRODUCT",
  //     commentableId: product1.id,
  //     userId: customer1.id,
  //     content:
  //       "محصول خیلی عالیه، جنسش بهتر از چیزی بود که انتظار داشتم. حتماً دوباره می‌خرم.",
  //     rating: 5,
  //     status: CommentStatus.APPROVED,
  //   },
  // });

  // const comment2 = await prisma.comment.create({
  //   data: {
  //     commentableType: "PRODUCT",
  //     commentableId: product1.id,
  //     userId: customer2.id,
  //     content: "سایزبندی درسته ولی رنگ کمی با عکس تفاوت داره. کلاً راضیم.",
  //     rating: 4,
  //     status: CommentStatus.APPROVED,
  //   },
  // });

  // پاسخ به comment1
  // await prisma.comment.create({
  //   data: {
  //     commentableType: "PRODUCT",
  //     commentableId: product1.id,
  //     userId: customer3.id,
  //     parentId: comment1.id,
  //     content: "ممنون از تجربه‌ات! منم همین نظر رو دارم.",
  //     status: CommentStatus.APPROVED,
  //   },
  // });

  // await prisma.comment.create({
  //   data: {
  //     commentableType: "PRODUCT",
  //     commentableId: product3.id,
  //     userId: customer2.id,
  //     content: "کفش فوق‌العاده‌ست! راحتی‌اش بی‌نظیره. ارزش قیمتش رو داره.",
  //     rating: 5,
  //     status: CommentStatus.APPROVED,
  //   },
  // });

  // لایک دیدگاه
  // await prisma.commentLike.create({
  //   data: { commentId: comment1.id, userId: customer2.id },
  // });
  // await prisma.commentLike.create({
  //   data: { commentId: comment1.id, userId: customer3.id },
  // });

  // بازمحاسبه avgRating و reviewCount برای محصولات دارای کامنت
  // await prisma.product.update({
  //   where: { id: product1.id },
  //   data: { avgRating: 4.5, reviewCount: 2 },
  // });
  // await prisma.product.update({
  //   where: { id: product3.id },
  //   data: { avgRating: 5.0, reviewCount: 1 },
  // });

  // ============================================================
  // 13.5. Blog Posts (برای صفحه اصلی و سئو)
  // ============================================================
  // console.log("📝 ایجاد پست‌های وبلاگ...");

  // const blogCat1 = await prisma.blogCategory.create({
  //   data: {
  //     name: "راهنمای خرید",
  //     slug: "buying-guide",
  //     description: "مقالات راهنمای خرید",
  //   },
  // });
  // const blogCat2 = await prisma.blogCategory.create({
  //   data: { name: "مد و فشن", slug: "fashion", description: "اخبار دنیای مد" },
  // });

  // await prisma.blogPost.create({
  //   data: {
  //     title: "راهنمای خرید تیشرت: از سایز تا جنس پارچه",
  //     slug: "tshirt-buying-guide",
  //     content:
  //       "<p>در این مقاله به شما کمک می‌کنیم بهترین تیشرت را بر اساس سایز، جنس و مدل انتخاب کنید...</p>",
  //     excerpt: "هر آنچه باید قبل از خرید تیشرت بدانید",
  //     status: PostStatus.PUBLISHED,
  //     categoryId: blogCat1.id,
  //     authorId: editor.id,
  //     publishedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
  //     products: {
  //       create: [{ productId: product1.id }, { productId: product4.id }],
  //     },
  //   },
  // });

  // await prisma.blogPost.create({
  //   data: {
  //     title: "ترندهای بهاره ۱۴۰۵: رنگ‌های محبوب امسال",
  //     slug: "spring-1405-trends",
  //     content:
  //       "<p>امسال چه رنگ‌هایی در دنیای مد محبوب هستند؟ نگاهی به جدیدترین ترندهای بهاره...</p>",
  //     excerpt: "محبوب‌ترین رنگ‌های فصل",
  //     status: PostStatus.PUBLISHED,
  //     categoryId: blogCat2.id,
  //     authorId: editor.id,
  //     publishedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
  //   },
  // });

  // ============================================================
  // 13.6. Stories (برای صفحه اصلی)
  // ============================================================
  // console.log("📸 ایجاد استوری‌ها...");

  // await prisma.story.create({
  //   data: {
  //     title: "جدیدترین کفش‌های نایک",
  //     expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  //     order: 1,
  //     products: { create: [{ productId: product3.id }] },
  //   },
  // });

  // await prisma.story.create({
  //   data: {
  //     title: "مجموعه بهاره آدیداس",
  //     expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  //     order: 2,
  //     products: { create: [{ productId: product2.id }] },
  //   },
  // });

  // ============================================================
  // 13.7. Popups
  // ============================================================
  // console.log("💡 ایجاد پاپ‌آپ...");

  // await prisma.popup.create({
  //   data: {
  //     title: "تخفیف ویژه!",
  //     content: "با کد WELCOME20 از ۲۰٪ تخفیف اولین خرید خود بهره‌مند شوید!",
  //     link: "/products",
  //     isActive: true,
  //     showOncePerSession: true,
  //     endsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  //   },
  // });

  // ============================================================
  // 13.8. Newsletter Subscribers
  // ============================================================
  // console.log("📧 ایجاد مشترکین خبرنامه...");

  // await prisma.newsletter.createMany({
  //   data: [
  //     { email: "ali@example.com", isActive: true },
  //     { email: "fateme@example.com", isActive: true },
  //     { email: "sara@test.com", isActive: true },
  //     { email: "bounced@test.com", isActive: false },
  //   ],
  // });

  // ============================================================
  // 14. Wishlist
  // ============================================================
  // console.log("❤️ ایجاد علاقه‌مندی‌ها...");

  // await prisma.wishlist.createMany({
  //   data: [
  //     { userId: customer1.id, productId: product3.id },
  //     { userId: customer2.id, productId: product1.id },
  //     { userId: customer2.id, productId: product2.id },
  //   ],
  // });

  // ============================================================
  // 15. Cart
  // ============================================================
  // console.log("🛒 ایجاد سبد خرید...");

  // const cart2 = await prisma.cart.create({ data: { userId: customer2.id } });
  // await prisma.cartItem.create({
  //   data: { cartId: cart2.id, variantId: product2.variants[0].id, quantity: 1 },
  // });

  // سبد مهمان
  // await prisma.cart.create({
  //   data: {
  //     guestToken: "guest-token-abc123xyz",
  //     items: { create: [{ variantId: product1.variants[2].id, quantity: 2 }] },
  //   },
  // });

  // ============================================================
  // 16. Ticket Departments & Tickets
  // ============================================================
  // console.log("🎫 ایجاد تیکت‌ها...");

  // const salesDept = await prisma.ticketDepartment.create({
  //   data: { name: "فروش" },
  // });
  // const supportDept = await prisma.ticketDepartment.create({
  //   data: { name: "پشتیبانی فنی" },
  // });
  // const returnDept = await prisma.ticketDepartment.create({
  //   data: { name: "مرجوعی و بازگشت وجه" },
  // });

  // const ticket1 = await prisma.ticket.create({
  //   data: {
  //     userId: customer1.id,
  //     departmentId: supportDept.id,
  //     subject: "سوال درباره وضعیت سفارش",
  //     priority: TicketPriority.HIGH,
  //     status: TicketStatus.ANSWERED,
  //     orderId: order2.id,
  //     messages: {
  //       create: [
  //         {
  //           senderId: customer1.id,
  //           senderType: SenderType.USER,
  //           message:
  //             "سلام، سفارش ORD-1002 هنوز ارسال نشده؟ چه زمانی ارسال می‌شه؟",
  //         },
  //         {
  //           senderId: admin.id,
  //           senderType: SenderType.ADMIN,
  //           message:
  //             "سلام، سفارش شما در حال آماده‌سازی است و ظرف ۲۴ ساعت آینده ارسال خواهد شد.",
  //         },
  //       ],
  //     },
  //   },
  // });

  // await prisma.ticket.create({
  //   data: {
  //     userId: customer2.id,
  //     departmentId: salesDept.id,
  //     subject: "آیا هودی آدیداس سایز XXL هم دارید؟",
  //     priority: TicketPriority.NORMAL,
  //     status: TicketStatus.OPEN,
  //     messages: {
  //       create: [
  //         {
  //           senderId: customer2.id,
  //           senderType: SenderType.USER,
  //           message:
  //             "سلام، هودی آدیداس Essentials در سایز XXL موجود نشون نمی‌ده. آیا قراره اضافه بشه؟",
  //         },
  //       ],
  //     },
  //   },
  // });

  // ============================================================
  // 17. Notifications
  // ============================================================
  // console.log("🔔 ایجاد نوتیفیکیشن‌ها...");

  // await prisma.notification.createMany({
  //   data: [
  //     {
  //       userId: customer1.id,
  //       type: NotificationType.ORDER,
  //       title: "سفارش شما تحویل داده شد",
  //       message: "سفارش ORD-1001 با موفقیت تحویل داده شد.",
  //       link: "/orders/ORD-1001",
  //       isRead: true,
  //     },
  //     {
  //       userId: customer1.id,
  //       type: NotificationType.ORDER,
  //       title: "سفارش در حال پردازش",
  //       message: "سفارش ORD-1002 شما در حال آماده‌سازی است.",
  //       link: "/orders/ORD-1002",
  //       isRead: false,
  //     },
  //     {
  //       userId: customer1.id,
  //       type: NotificationType.TICKET,
  //       title: "تیکت شما پاسخ داده شد",
  //       message: "پشتیبانی به تیکت شما پاسخ داد.",
  //       link: "/tickets",
  //       isRead: false,
  //     },
  //     {
  //       userId: customer2.id,
  //       type: NotificationType.PROMOTION,
  //       title: "تخفیف ویژه برای شما!",
  //       message: "کد تخفیف WELCOME20 را در اولین خریدتان استفاده کنید.",
  //       isRead: false,
  //     },
  //   ],
  // });

  // ============================================================
  // 18. Banners
  // ============================================================
  // console.log("🖼️ ایجاد بنرها...");

  // await prisma.banner.create({
  //   data: {
  //     title: "حراج تابستانه",
  //     media: { connect: { id: bannerMedia1.id } },
  //     link: "/sale",
  //     position: BannerPosition.HOME_MAIN,
  //     order: 1,
  //     isActive: true,
  //     endsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  //   },
  // });

  // await prisma.banner.create({
  //   data: {
  //     title: "جدیدترین کفش‌های نایک",
  //     media: { connect: { id: bannerMedia2.id } },
  //     link: "/brand/nike",
  //     position: BannerPosition.HOME_MIDDLE,
  //     order: 1,
  //     isActive: true,
  //   },
  // });

  // ============================================================
  // 19. Currencies (ارزهای پشتیبانی‌شده)
  // ============================================================
  console.log("💱 ایجاد ارزها...");

  const currencies = [
    { code: "USD", name: "US Dollar", symbol: "$" },
    { code: "EUR", name: "Euro", symbol: "€" },
    { code: "AED", name: "UAE Dirham", symbol: "د.إ" },
    { code: "CNY", name: "Chinese Yuan", symbol: "¥" },
    { code: "TRY", name: "Turkish Lira", symbol: "₺" },
    { code: "IQD", name: "Iraqi Dinar", symbol: "د.ع" },
  ];

  for (const c of currencies) {
    await prisma.currency.upsert({
      where: { code: c.code },
      update: {},
      create: {
        code: c.code,
        name: c.name,
        symbol: c.symbol,
        isActive: true,
      },
    });
  }

  // ============================================================
  // 20. Settings
  // ============================================================
  console.log("⚙️ ایجاد تنظیمات...");

  await prisma.setting.deleteMany();

  await prisma.setting.createMany({
    data: [
      { key: "site_name", value: "مرکافش‌دوز", type: "string" },
      {
        key: "site_description",
        value: "فروشگاه آنلاین پوشاک و کفش",
        type: "string",
      },
      { key: "contact_email", value: "info@mrkafshdoz.com", type: "string" },
      { key: "contact_phone", value: "021-12345678", type: "string" },
      { key: "default_currency", value: "تومان", type: "string" },
      { key: "tax_rate", value: "0", type: "number" },
      { key: "free_shipping_threshold", value: "1000000", type: "number" },
      {
        key: "instagram",
        value: "https://instagram.com/mrkafshdoz",
        type: "string",
      },
      { key: "telegram", value: "https://t.me/mrkafshdoz", type: "string" },
      { key: "maintenance_mode", value: "false", type: "boolean" },
    ],
  });

  // ============================================================
  // 20. AuditLogs
  // ============================================================
  // console.log("📋 ایجاد لاگ‌های حسابرسی...");

  // await prisma.auditLog.createMany({
  //   data: [
  //     {
  //       userId: admin.id,
  //       action: "CREATE",
  //       entity: "Product",
  //       entityId: String(product1.id),
  //       ip: "127.0.0.1",
  //       metadata: { productName: product1.name },
  //     },
  //     {
  //       userId: admin.id,
  //       action: "CREATE",
  //       entity: "Product",
  //       entityId: String(product2.id),
  //       ip: "127.0.0.1",
  //       metadata: { productName: product2.name },
  //     },
  //     {
  //       userId: customer1.id,
  //       action: "LOGIN",
  //       entity: "User",
  //       entityId: String(customer1.id),
  //       ip: "192.168.1.1",
  //     },
  //     {
  //       userId: customer1.id,
  //       action: "CREATE",
  //       entity: "Order",
  //       entityId: String(order1.id),
  //       ip: "192.168.1.1",
  //       metadata: { orderNumber: "ORD-1001" },
  //     },
  //   ],
  // });

  // ============================================================
  // Bulk generation to meet requested counts and 6-month distribution
  // ============================================================
//   console.log("🔁 تولید داده‌های اضافی برای تست (کاربران، محصولات، سفارشات و غیره)...");

//   function randomDateWithinPastMonths(months: number) {
//     const now = Date.now();
//     const start = new Date();
//     start.setMonth(start.getMonth() - months);
//     return new Date(start.getTime() + Math.random() * (now - start.getTime()));
//   }

//   // Ensure a minimum number of customers (create many fake customers)
//   const targetCustomers = 300;
//   const existingCustomersCount = 3; // customer1..3 created above
//   const customersToCreate = Math.max(0, targetCustomers - existingCustomersCount);

//   const extraUsers: any[] = [];
//   for (let i = 0; i < customersToCreate; i++) {
//     const isVerified = Math.random() < 0.7;
//     extraUsers.push({
//       fullName: faker.person.fullName(),
//       email: faker.internet.email().toLowerCase(),
//         phone: '09' + faker.number.int({ min: 10000000, max: 99999999 }).toString(),
//       password: await bcrypt.hash('Customer@1234', 10),
//       role: Role.CUSTOMER,
//       emailVerifiedAt: isVerified ? randomDateWithinPastMonths(6) : null,
//       phoneVerifiedAt: isVerified ? randomDateWithinPastMonths(6) : null,
//       createdAt: randomDateWithinPastMonths(6),
//     });
//   }
//   // Insert in batches
//   for (let i = 0; i < extraUsers.length; i += 50) {
//     const batch = extraUsers.slice(i, i + 50);
//     await prisma.user.createMany({ data: batch, skipDuplicates: true });
//   }

//   // Create additional media entries for products and other models
//   const extraMediaCount = 300;
//   const mediaCreates = [];
//   for (let i = 0; i < extraMediaCount; i++) {
//     const w = faker.number.int({ min: 200, max: 1200 });
//     const h = faker.number.int({ min: 200, max: 1200 });
//     mediaCreates.push({
//       url: `https://picsum.photos/seed/seed${Date.now()}${i}/${w}/${h}`,
//       fileName: `seed${i}.jpg`,
//       originalName: `seed${i}.jpg`,
//       filePath: `seed/seed${i}.jpg`,
//       mimeType: 'image/jpeg',
//       size: faker.number.int({ min: 10000, max: 200000 }),
//       type: MediaType.IMAGE,
//       entityType: 'PRODUCT',
//       createdAt: randomDateWithinPastMonths(6),
//     });
//   }
//   for (let i = 0; i < mediaCreates.length; i += 100) {
//     await prisma.media.createMany({ data: mediaCreates.slice(i, i + 100) });
//   }

//   // Refresh media list (grab many media ids to attach to products)
//   const manyMedia = await prisma.media.findMany({ take: 400 });

//   // Create extra brands if needed
//   const existingBrands = await prisma.brand.findMany();
//   const brandNames = ['Puma', 'Reebok', 'NewBalance', 'Vans', 'Converse', 'UnderArmour', 'Fila', 'H&M', 'Zara', 'Uniqlo'];
//   for (const name of brandNames) {
//     if (!existingBrands.find((b) => b.name === name)) {
//       await prisma.brand.create({ data: { name, slug: faker.helpers.slugify(name).toLowerCase(), isActive: true, logoMediaId: manyMedia[Math.floor(Math.random() * manyMedia.length)]?.id || null } });
//     }
//   }

//   const allBrands = await prisma.brand.findMany();

//   // Ensure at least 20 categories
//   const existingCategories = await prisma.category.findMany();
//   const categoriesToMake = Math.max(0, 20 - existingCategories.length);
//   for (let i = 0; i < categoriesToMake; i++) {
//     await prisma.category.create({ data: { name: faker.commerce.department(), slug: faker.lorem.slug(), isActive: true, order: i + 10, imageMediaId: manyMedia[Math.floor(Math.random() * manyMedia.length)]?.id || null } });
//   }

//   const allCategories = await prisma.category.findMany();

//   // Create attributes/values if missing to ensure product variants
//   const attrs = await prisma.attribute.findMany({ include: { values: true } });
//   const colorAttribute = attrs.find((a) => a.slug === 'color') || colorAttr;
//   const sizeAttribute = attrs.find((a) => a.slug === 'size') || sizeAttr;
//   const shoeAttribute = attrs.find((a) => a.slug === 'shoe-size') || shoeSizeAttr;

//   // Helper to pick random variant attribute values
//   function pickVariantValues(isShoe: boolean) {
//     const vals: any[] = [];
//     const colors = colorAttribute.values;
//     if (colors && colors.length) vals.push(colors[Math.floor(Math.random() * colors.length)].id);
//     if (isShoe) {
//       const shoes = shoeAttribute.values;
//       if (shoes && shoes.length) vals.push(shoes[Math.floor(Math.random() * shoes.length)].id);
//     } else {
//       const sizes = sizeAttribute.values;
//       if (sizes && sizes.length) vals.push(sizes[Math.floor(Math.random() * sizes.length)].id);
//     }
//     return vals;
//   }

//   // Create products until we have at least 200
//   const existingProducts = await prisma.product.count();
//   const targetProducts = 200;
//   const productsToCreate = Math.max(0, targetProducts - existingProducts);

//   const productCreationBatches = [];
//   const mediaLen = manyMedia.length;
//   for (let i = 0; i < productsToCreate; i++) {
//     const name = faker.commerce.productName() + ' ' + faker.commerce.productAdjective();
//     const brand = allBrands[Math.floor(Math.random() * allBrands.length)];
//     const category = allCategories[Math.floor(Math.random() * allCategories.length)];
//     const minPrice = faker.number.int({ min: 50000, max: 2000000 });
//     const variantsCount = faker.number.int({ min: 1, max: 3 });
//     const createdAt = randomDateWithinPastMonths(6);
//     const productData: any = {
//       name,
//       slug: faker.lorem.slug(),
//       brandId: brand?.id || undefined,
//       shortDescription: faker.commerce.productDescription(),
//       description: `<p>${faker.lorem.paragraph()}</p>`,
//       status: ProductStatus.PUBLISHED,
//       isFeatured: Math.random() < 0.1,
//       minPrice,
//       maxPrice: minPrice + faker.number.int({ min: 0, max: 300000 }),
//       isInStock: true,
//       hasActiveDiscount: Math.random() < 0.2,
//       createdById: admin.id,
//       metaTitle: name,
//       metaDescription: faker.lorem.sentence(),
//       createdAt,
//       categories: { create: [{ categoryId: category.id }] },
//       images: { create: [ { mediaId: manyMedia[(i * 3) % mediaLen]?.id || null, order: 1, isMain: true } ] },
//     };

//     // variants will be created after product is created (to simplify nested relations)
//     productCreationBatches.push({ productData, variantsCount });
//   }

//   // Create products in chunks and then create variants
//   for (let i = 0; i < productCreationBatches.length; i += 20) {
//     const chunk = productCreationBatches.slice(i, i + 20);
//     // create products one by one to be able to add variants
//     for (const item of chunk) {
//       const p = await prisma.product.create({ data: item.productData });
//       const isShoe = /shoe|sneaker|کفش/i.test(p.name);
//       // create variants
//       for (let v = 0; v < item.variantsCount; v++) {
//         const sku = `${p.slug.toUpperCase().slice(0, 10)}-${faker.string.alpha({ length: 4 }).toUpperCase()}-${v}`;
//         const priceAdj = faker.number.int({ min: 0, max: 200000 });
//         const stock = faker.number.int({ min: 0, max: 50 });
//         const weight = Number((faker.number.int({ min: 200, max: 1200 }) / 1000).toFixed(2));
//         const attrVals = pickVariantValues(isShoe);
//         const createdVariant = await prisma.productVariant.create({
//           data: {
//             productId: p.id,
//             sku,
//             priceAdjustment: priceAdj,
//             stock,
//             weight,
//             isDefault: v === 0,
//             isActive: true,
//           },
//         });
//         // attach attribute values (field is `variantId` in current schema)
//         for (const av of attrVals) {
//           await prisma.productVariantAttributeValue.create({ data: { variantId: createdVariant.id, attributeValueId: av } });
//         }
//       }
//     }
//   }

//   // Refresh products and variants lists for creating orders/comments
//   const allProducts = await prisma.product.findMany({ include: { variants: true } });
//   const allVariants = allProducts.flatMap((p) => p.variants);

//   // Create comments (>= 200)
//   const existingComments = await prisma.comment.count();
//   const targetComments = 500;
//   const commentsToCreate = Math.max(0, targetComments - existingComments);
//   for (let i = 0; i < commentsToCreate; i++) {
//     const prod = allProducts[Math.floor(Math.random() * allProducts.length)];
//     const user = (await prisma.user.findMany({ where: { role: Role.CUSTOMER }, take: 1, skip: Math.floor(Math.random() * 200) }))[0];
//     await prisma.comment.create({ data: { commentableType: 'PRODUCT', commentableId: prod.id, userId: user?.id || customer1.id, content: faker.lorem.sentences(2), rating: faker.number.int({ min: 1, max: 5 }), status: CommentStatus.APPROVED, createdAt: randomDateWithinPastMonths(6) } });
//   }

//   // Create orders (>= 150)
//   const existingOrders = await prisma.order.count();
//   const targetOrders = 150;
//   const ordersToCreate = Math.max(0, targetOrders - existingOrders);
//   const customers = await prisma.user.findMany({ where: { role: Role.CUSTOMER }, take: 500 });
//   for (let i = 0; i < ordersToCreate; i++) {
//     const buyer = customers[Math.floor(Math.random() * customers.length)] || customer1;
//     const variant = allVariants[Math.floor(Math.random() * allVariants.length)];
//     const createdAt = randomDateWithinPastMonths(6);
//     const price = faker.number.int({ min: 50000, max: 2000000 });
//     const qty = faker.number.int({ min: 1, max: 3 });
//     const status = Math.random() < 0.8 ? OrderStatus.DELIVERED : OrderStatus.PROCESSING;
//     const order = await prisma.order.create({
//       data: {
//         orderNumber: `ORD-${faker.number.int({ min: 10000, max: 99999 })}`,
//         userId: buyer.id,
//         addressId: address1.id,
//         shippingAddress: {
//           province: 'تهران',
//           city: 'تهران',
//           fullAddress: faker.location.streetAddress(),
//           receiverName: buyer.fullName,
//           receiverPhone: buyer.phone,
//         },
//         shippingCompanyId: Math.random() < 0.5 ? postCompany.id : tipaxCompany.id,
//         shippingCost: faker.number.int({ min: 20000, max: 80000 }),
//         subtotal: price * qty,
//         discountAmount: 0,
//         taxAmount: 0,
//         totalAmount: price * qty + faker.number.int({ min: 20000, max: 80000 }),
//         paymentMethod: PaymentMethod.GATEWAY,
//         status,
//         paidAt: createdAt,
//         createdAt,
//         items: { create: [{ variantId: variant.id, productName: 'Product', variantAttributes: '', price, quantity: qty, discountAmount: 0 }] },
//       },
//     });
//     // transaction
//     await prisma.transaction.create({ data: { orderId: order.id, gatewayId: zarinpal.id, userId: buyer.id, type: TransactionType.ORDER_PAYMENT, amount: order.totalAmount, status: PaymentStatus.SUCCESS, refId: `ZP-${faker.string.uuid()}`, trackingCode: `TRK-${Date.now()}-${i}-${faker.number.int({ min: 1000, max: 9999 })}` } });
//   }

//   // Create newsletters up to 100
//   const existingNews = await prisma.newsletter.count();
//   const targetNews = 100;
//   if (existingNews < targetNews) {
//     const newsData = [];
//     for (let i = 0; i < targetNews - existingNews; i++) newsData.push({ email: faker.internet.email().toLowerCase(), isActive: Math.random() < 0.9, createdAt: randomDateWithinPastMonths(6) });
//     await prisma.newsletter.createMany({ data: newsData });
//   }

//   // Create tickets up to 80
//   const existingTickets = await prisma.ticket.count();
//   const targetTickets = 80;
//   const ticketDept = salesDept;
//   const ticketUsers = customers.slice(0, 80);
//   for (let i = 0; i < Math.max(0, targetTickets - existingTickets); i++) {
//     const u = ticketUsers[Math.floor(Math.random() * ticketUsers.length)] || customer1;
//     await prisma.ticket.create({ data: { userId: u.id, departmentId: ticketDept.id, subject: faker.lorem.sentence(), priority: TicketPriority.NORMAL, status: TicketStatus.OPEN, messages: { create: [{ senderId: u.id, senderType: SenderType.USER, message: faker.lorem.sentences(2) }] }, createdAt: randomDateWithinPastMonths(6) } });
//   }

//   // Notifications many
//   const existingNotifs = await prisma.notification.count();
//   const targetNotifs = 500;
//   for (let i = 0; i < Math.max(0, targetNotifs - existingNotifs); i++) {
//     const u = customers[Math.floor(Math.random() * customers.length)] || customer1;
//     await prisma.notification.create({ data: { userId: u.id, type: NotificationType.PROMOTION, title: faker.lorem.words(3), message: faker.lorem.sentence(), link: '/products', isRead: Math.random() < 0.5, createdAt: randomDateWithinPastMonths(6) } });
//   }

//   // Banners up to 60
//   const existingBanners = await prisma.banner.count();
//   for (let i = existingBanners; i < 60; i++) {
//     const pickedMedia = manyMedia[Math.floor(Math.random() * manyMedia.length)];
//     const bannerData: any = { title: faker.lorem.words(2), link: '/sale', position: BannerPosition.HOME_MIDDLE, order: i + 1, isActive: Math.random() < 0.9 };
//     if (pickedMedia && pickedMedia.id) bannerData.media = { connect: { id: pickedMedia.id } };
//     else bannerData.media = { connect: { id: bannerMedia1.id } };
//     await prisma.banner.create({ data: bannerData });
//   }

//   // Audit logs up to 500
//   const existingAudit = await prisma.auditLog.count();
//   for (let i = existingAudit; i < 500; i++) {
//     const u = customers[Math.floor(Math.random() * customers.length)] || customer1;
//     await prisma.auditLog.create({ data: { userId: u.id, action: ['CREATE', 'UPDATE', 'DELETE', 'LOGIN'][Math.floor(Math.random() * 4)], entity: 'Product', entityId: String(allProducts[Math.floor(Math.random() * allProducts.length)]?.id || product1.id), ip: faker.internet.ip(), metadata: { info: faker.lorem.word() }, createdAt: randomDateWithinPastMonths(6) } });
//   }

//   // ============================================================
//   // خلاصه نتیجه
//   // ============================================================
  console.log("\n✅ Seed با موفقیت انجام شد!");
//   console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
//   console.log(`👤 کاربران: admin, editor, 3 customer`);
//   console.log(`🏷️ برندها: نایک، آدیداس، ایران‌پوش`);
//   console.log(`📁 دسته‌بندی‌ها: ۶ دسته (۲ سطح)`);
//   console.log(
//     `📦 محصولات: ۴ محصول با ${product1.variants.length + product2.variants.length + product3.variants.length + product4.variants.length} تنوع`,
//   );
//   console.log(`🛒 سفارش‌ها: ORD-1001 (تحویل‌شده)، ORD-1002 (در پردازش)`);
//   console.log(`🏷️ کدهای تخفیف: WELCOME20، SUMMER50K`);
//   console.log(`📝 پست وبلاگ: ۲ پست منتشرشده`);
//   console.log(`📸 استوری: ۲ استوری فعال`);
//   console.log(`📧 خبرنامه: ۴ مشترک`);
//   console.log(`\n🔑 رمز ادمین: Admin@1234`);
//   console.log(`🔑 رمز مشتریان: Customer@1234`);
//   console.log(`💡 totalSold: تیشرت نایک=۵، کفش نایک=۱۲`);
//   console.log(`⭐ avgRating: تیشرت نایک=۴.۵، کفش نایک=۵.۰`);
//   console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
}

main()
  .catch((e) => {
    console.error("❌ خطا در seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
