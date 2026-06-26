// prisma/seed.ts
// اجرا: npx ts-node prisma/seed.ts  یا  npx prisma db seed

import { PrismaClient, Role, ProductStatus, DiscountType, AttributeInputType, MediaType, OrderStatus, PaymentMethod, PaymentStatus, TransactionType, WalletTransactionType, TicketStatus, TicketPriority, SenderType, CommentStatus, NotificationType, BannerPosition, OtpChannel, OtpPurpose } from '../src/generated/prisma';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 شروع seed دیتابیس...');

  // ============================================================
  // 1. Media (تصاویر placeholder)
  // ============================================================
  console.log('📸 ایجاد media...');

  const mediaList = await Promise.all([
    prisma.media.create({ data: { url: 'https://picsum.photos/seed/avatar1/200/200', type: MediaType.IMAGE, mimeType: 'image/jpeg', size: 20000, alt: 'آواتار کاربر ۱' } }),
    prisma.media.create({ data: { url: 'https://picsum.photos/seed/avatar2/200/200', type: MediaType.IMAGE, mimeType: 'image/jpeg', size: 18000, alt: 'آواتار کاربر ۲' } }),
    prisma.media.create({ data: { url: 'https://picsum.photos/seed/cat1/400/300', type: MediaType.IMAGE, mimeType: 'image/jpeg', size: 45000, alt: 'دسته‌بندی پوشاک' } }),
    prisma.media.create({ data: { url: 'https://picsum.photos/seed/cat2/400/300', type: MediaType.IMAGE, mimeType: 'image/jpeg', size: 42000, alt: 'دسته‌بندی کفش' } }),
    prisma.media.create({ data: { url: 'https://picsum.photos/seed/cat3/400/300', type: MediaType.IMAGE, mimeType: 'image/jpeg', size: 38000, alt: 'دسته‌بندی اکسسوری' } }),
    prisma.media.create({ data: { url: 'https://picsum.photos/seed/brand1/300/200', type: MediaType.IMAGE, mimeType: 'image/jpeg', size: 25000, alt: 'لوگو نایک' } }),
    prisma.media.create({ data: { url: 'https://picsum.photos/seed/brand2/300/200', type: MediaType.IMAGE, mimeType: 'image/jpeg', size: 22000, alt: 'لوگو آدیداس' } }),
    prisma.media.create({ data: { url: 'https://picsum.photos/seed/prod1/600/600', type: MediaType.IMAGE, mimeType: 'image/jpeg', size: 80000, alt: 'تصویر محصول ۱' } }),
    prisma.media.create({ data: { url: 'https://picsum.photos/seed/prod2/600/600', type: MediaType.IMAGE, mimeType: 'image/jpeg', size: 75000, alt: 'تصویر محصول ۲' } }),
    prisma.media.create({ data: { url: 'https://picsum.photos/seed/prod3/600/600', type: MediaType.IMAGE, mimeType: 'image/jpeg', size: 70000, alt: 'تصویر محصول ۳' } }),
    prisma.media.create({ data: { url: 'https://picsum.photos/seed/prod4/600/600', type: MediaType.IMAGE, mimeType: 'image/jpeg', size: 85000, alt: 'تصویر محصول ۴' } }),
    prisma.media.create({ data: { url: 'https://picsum.photos/seed/banner1/1200/400', type: MediaType.IMAGE, mimeType: 'image/jpeg', size: 150000, alt: 'بنر اصلی' } }),
    prisma.media.create({ data: { url: 'https://picsum.photos/seed/banner2/1200/400', type: MediaType.IMAGE, mimeType: 'image/jpeg', size: 145000, alt: 'بنر میانی' } }),
    prisma.media.create({ data: { url: 'https://picsum.photos/seed/ship1/200/100', type: MediaType.IMAGE, mimeType: 'image/jpeg', size: 12000, alt: 'لوگو پست' } }),
  ]);

  const [avatarMedia1, avatarMedia2, catMedia1, catMedia2, catMedia3, brandMedia1, brandMedia2, prodMedia1, prodMedia2, prodMedia3, prodMedia4, bannerMedia1, bannerMedia2, shipMedia1] = mediaList;

  // ============================================================
  // 2. Users
  // ============================================================
  console.log('👤 ایجاد کاربران...');

  const hashedPassword = await bcrypt.hash('Admin@1234', 10);
  const customerPassword = await bcrypt.hash('Customer@1234', 10);

  const admin = await prisma.user.create({
    data: {
      fullName: 'مدیر سیستم',
      email: 'admin@mrkafshdoz.com',
      phone: '09100000001',
      password: hashedPassword,
      role: Role.ADMIN,
      avatarId: avatarMedia1.id,
      emailVerifiedAt: new Date(),
      phoneVerifiedAt: new Date(),
      lastLoginAt: new Date(),
    },
  });

  const editor = await prisma.user.create({
    data: {
      fullName: 'ویراستار محتوا',
      email: 'editor@mrkafshdoz.com',
      phone: '09100000002',
      password: hashedPassword,
      role: Role.EDITOR,
      emailVerifiedAt: new Date(),
      phoneVerifiedAt: new Date(),
    },
  });

  const customer1 = await prisma.user.create({
    data: {
      fullName: 'علی احمدی',
      email: 'ali@example.com',
      phone: '09111111111',
      password: customerPassword,
      role: Role.CUSTOMER,
      avatarId: avatarMedia2.id,
      emailVerifiedAt: new Date(),
      phoneVerifiedAt: new Date(),
      lastLoginAt: new Date(),
    },
  });

  const customer2 = await prisma.user.create({
    data: {
      fullName: 'فاطمه رضایی',
      email: 'fateme@example.com',
      phone: '09222222222',
      password: customerPassword,
      role: Role.CUSTOMER,
      emailVerifiedAt: new Date(),
    },
  });

  const customer3 = await prisma.user.create({
    data: {
      fullName: 'رضا کریمی',
      email: 'reza@example.com',
      phone: '09333333333',
      password: customerPassword,
      role: Role.CUSTOMER,
    },
  });

  // ============================================================
  // 3. Wallets
  // ============================================================
  console.log('👛 ایجاد کیف پول...');

  const wallet1 = await prisma.wallet.create({
    data: { userId: customer1.id, balance: 500000 },
  });
  await prisma.wallet.create({ data: { userId: customer2.id, balance: 0 } });
  await prisma.wallet.create({ data: { userId: customer3.id, balance: 200000 } });

  await prisma.walletTransaction.create({
    data: {
      walletId: wallet1.id,
      type: WalletTransactionType.DEPOSIT,
      amount: 500000,
      description: 'شارژ اولیه کیف پول',
    },
  });

  // ============================================================
  // 4. Addresses
  // ============================================================
  console.log('🏠 ایجاد آدرس‌ها...');

  const address1 = await prisma.address.create({
    data: {
      userId: customer1.id,
      title: 'خانه',
      receiverName: 'علی احمدی',
      receiverPhone: '09111111111',
      province: 'تهران',
      city: 'تهران',
      postalCode: '1234567890',
      fullAddress: 'تهران، خیابان ولیعصر، پلاک ۱۲، واحد ۳',
      lat: 35.7219,
      lng: 51.3347,
      isDefault: true,
    },
  });

  await prisma.address.create({
    data: {
      userId: customer2.id,
      title: 'محل کار',
      receiverName: 'فاطمه رضایی',
      receiverPhone: '09222222222',
      province: 'اصفهان',
      city: 'اصفهان',
      postalCode: '0987654321',
      fullAddress: 'اصفهان، خیابان چهارباغ، پلاک ۵۵',
      isDefault: true,
    },
  });

  // ============================================================
  // 5. Brands
  // ============================================================
  console.log('🏷️ ایجاد برندها...');

  const nike = await prisma.brand.create({
    data: {
      name: 'نایک',
      slug: 'nike',
      description: 'برند معروف ورزشی آمریکایی',
      logoId: brandMedia1.id,
      isActive: true,
    },
  });

  const adidas = await prisma.brand.create({
    data: {
      name: 'آدیداس',
      slug: 'adidas',
      description: 'برند ورزشی آلمانی',
      logoId: brandMedia2.id,
      isActive: true,
    },
  });

  const localBrand = await prisma.brand.create({
    data: {
      name: 'ایران‌پوش',
      slug: 'iranpoosh',
      description: 'برند ایرانی تولیدکننده پوشاک',
      isActive: true,
    },
  });

  // ============================================================
  // 6. Attributes & Values
  // ============================================================
  console.log('📐 ایجاد ویژگی‌ها...');

  const colorAttr = await prisma.attribute.create({
    data: {
      name: 'رنگ',
      slug: 'color',
      inputType: AttributeInputType.COLOR,
      isFilterable: true,
      isVariant: true,
      values: {
        create: [
          { value: 'مشکی', colorHex: '#000000', order: 1 },
          { value: 'سفید', colorHex: '#FFFFFF', order: 2 },
          { value: 'قرمز', colorHex: '#FF0000', order: 3 },
          { value: 'آبی', colorHex: '#0000FF', order: 4 },
          { value: 'سبز', colorHex: '#008000', order: 5 },
        ],
      },
    },
    include: { values: true },
  });

  const sizeAttr = await prisma.attribute.create({
    data: {
      name: 'سایز',
      slug: 'size',
      inputType: AttributeInputType.SELECT,
      isFilterable: true,
      isVariant: true,
      values: {
        create: [
          { value: 'S', order: 1 },
          { value: 'M', order: 2 },
          { value: 'L', order: 3 },
          { value: 'XL', order: 4 },
          { value: 'XXL', order: 5 },
        ],
      },
    },
    include: { values: true },
  });

  const shoeSizeAttr = await prisma.attribute.create({
    data: {
      name: 'سایز کفش',
      slug: 'shoe-size',
      inputType: AttributeInputType.SELECT,
      isFilterable: true,
      isVariant: true,
      values: {
        create: [
          { value: '۳۹', order: 1 },
          { value: '۴۰', order: 2 },
          { value: '۴۱', order: 3 },
          { value: '۴۲', order: 4 },
          { value: '۴۳', order: 5 },
          { value: '۴۴', order: 6 },
        ],
      },
    },
    include: { values: true },
  });

  const materialAttr = await prisma.attribute.create({
    data: {
      name: 'جنس',
      slug: 'material',
      inputType: AttributeInputType.SELECT,
      isFilterable: true,
      isVariant: false,
      values: {
        create: [
          { value: 'پنبه', order: 1 },
          { value: 'پلی‌استر', order: 2 },
          { value: 'چرم', order: 3 },
          { value: 'کتان', order: 4 },
        ],
      },
    },
    include: { values: true },
  });

  // ============================================================
  // 7. Categories
  // ============================================================
  console.log('📁 ایجاد دسته‌بندی‌ها...');

  const clothingCat = await prisma.category.create({
    data: {
      name: 'پوشاک',
      slug: 'clothing',
      description: 'انواع لباس‌های مردانه و زنانه',
      imageId: catMedia1.id,
      order: 1,
      isActive: true,
      metaTitle: 'خرید پوشاک آنلاین',
      metaDescription: 'جدیدترین مدل‌های پوشاک را در مرکافش‌دوز بخرید',
    },
  });

  const tshirtCat = await prisma.category.create({
    data: {
      name: 'تی‌شرت',
      slug: 'tshirt',
      parentId: clothingCat.id,
      order: 1,
      isActive: true,
    },
  });

  const hoodyCat = await prisma.category.create({
    data: {
      name: 'هودی و سویشرت',
      slug: 'hoodie',
      parentId: clothingCat.id,
      order: 2,
      isActive: true,
    },
  });

  const shoesCat = await prisma.category.create({
    data: {
      name: 'کفش',
      slug: 'shoes',
      description: 'انواع کفش ورزشی و روزمره',
      imageId: catMedia2.id,
      order: 2,
      isActive: true,
    },
  });

  const sneakersCat = await prisma.category.create({
    data: {
      name: 'اسنیکر',
      slug: 'sneakers',
      parentId: shoesCat.id,
      order: 1,
      isActive: true,
    },
  });

  const accessoriesCat = await prisma.category.create({
    data: {
      name: 'اکسسوری',
      slug: 'accessories',
      description: 'کلاه، کمربند، کیف و ...',
      imageId: catMedia3.id,
      order: 3,
      isActive: true,
    },
  });

  // CategoryAttributes
  await prisma.categoryAttribute.createMany({
    data: [
      { categoryId: clothingCat.id, attributeId: colorAttr.id },
      { categoryId: clothingCat.id, attributeId: sizeAttr.id },
      { categoryId: clothingCat.id, attributeId: materialAttr.id },
      { categoryId: tshirtCat.id, attributeId: colorAttr.id },
      { categoryId: tshirtCat.id, attributeId: sizeAttr.id },
      { categoryId: shoesCat.id, attributeId: colorAttr.id },
      { categoryId: shoesCat.id, attributeId: shoeSizeAttr.id },
      { categoryId: sneakersCat.id, attributeId: colorAttr.id },
      { categoryId: sneakersCat.id, attributeId: shoeSizeAttr.id },
    ],
  });

  // ============================================================
  // 8. Products
  // ============================================================
  console.log('📦 ایجاد محصولات...');

  const colorBlack = colorAttr.values.find(v => v.value === 'مشکی')!;
  const colorWhite = colorAttr.values.find(v => v.value === 'سفید')!;
  const colorBlue  = colorAttr.values.find(v => v.value === 'آبی')!;
  const sizeM      = sizeAttr.values.find(v => v.value === 'M')!;
  const sizeL      = sizeAttr.values.find(v => v.value === 'L')!;
  const sizeXL     = sizeAttr.values.find(v => v.value === 'XL')!;
  const shoe41     = shoeSizeAttr.values.find(v => v.value === '۴۱')!;
  const shoe42     = shoeSizeAttr.values.find(v => v.value === '۴۲')!;
  const shoe43     = shoeSizeAttr.values.find(v => v.value === '۴۳')!;

  // محصول ۱: تی‌شرت نایک
  const product1 = await prisma.product.create({
    data: {
      name: 'تی‌شرت ورزشی نایک مدل Dri-FIT',
      slug: 'nike-dri-fit-tshirt',
      brandId: nike.id,
      shortDescription: 'تی‌شرت سبک و تنفس‌پذیر برای ورزش‌های شدید',
      description: '<p>این تی‌شرت با فناوری Dri-FIT نایک، رطوبت را از پوست دور می‌کند و شما را خنک نگه می‌دارد.</p>',
      status: ProductStatus.PUBLISHED,
      isFeatured: true,
      minPrice: 450000,
      maxPrice: 550000,
      isInStock: true,
      hasActiveDiscount: true,
      createdById: admin.id,
      metaTitle: 'خرید تی‌شرت نایک Dri-FIT',
      metaDescription: 'تی‌شرت ورزشی نایک با فناوری Dri-FIT، مناسب برای ورزش و روزمره',
      categories: { create: [{ categoryId: tshirtCat.id }, { categoryId: clothingCat.id }] },
      images: { create: [{ mediaId: prodMedia1.id, order: 1, isMain: true }, { mediaId: prodMedia2.id, order: 2 }] },
      variants: {
        create: [
          {
            sku: 'NIKE-DRIFIT-BLK-M',
            price: 450000,
            compareAtPrice: 600000,
            discountType: DiscountType.PERCENT,
            discountValue: 25,
            stock: 15,
            weight: 0.3,
            isDefault: true,
            isActive: true,
            attributeValues: { create: [{ attributeValueId: colorBlack.id }, { attributeValueId: sizeM.id }] },
          },
          {
            sku: 'NIKE-DRIFIT-BLK-L',
            price: 450000,
            compareAtPrice: 600000,
            discountType: DiscountType.PERCENT,
            discountValue: 25,
            stock: 10,
            weight: 0.32,
            isActive: true,
            attributeValues: { create: [{ attributeValueId: colorBlack.id }, { attributeValueId: sizeL.id }] },
          },
          {
            sku: 'NIKE-DRIFIT-WHT-M',
            price: 480000,
            compareAtPrice: 600000,
            stock: 8,
            weight: 0.3,
            isActive: true,
            attributeValues: { create: [{ attributeValueId: colorWhite.id }, { attributeValueId: sizeM.id }] },
          },
          {
            sku: 'NIKE-DRIFIT-WHT-L',
            price: 480000,
            stock: 0,
            weight: 0.32,
            isActive: true,
            attributeValues: { create: [{ attributeValueId: colorWhite.id }, { attributeValueId: sizeL.id }] },
          },
        ],
      },
    },
    include: { variants: true },
  });

  // محصول ۲: هودی آدیداس
  const product2 = await prisma.product.create({
    data: {
      name: 'هودی آدیداس Essentials',
      slug: 'adidas-essentials-hoodie',
      brandId: adidas.id,
      shortDescription: 'هودی گرم و راحت با جنس فلیس',
      description: '<p>هودی Essentials آدیداس با جنس فلیس نرم، ایده‌آل برای فصل سرد است.</p>',
      status: ProductStatus.PUBLISHED,
      isFeatured: true,
      minPrice: 850000,
      maxPrice: 950000,
      isInStock: true,
      hasActiveDiscount: false,
      createdById: admin.id,
      categories: { create: [{ categoryId: hoodyCat.id }, { categoryId: clothingCat.id }] },
      images: { create: [{ mediaId: prodMedia3.id, order: 1, isMain: true }] },
      variants: {
        create: [
          {
            sku: 'ADIDAS-HOOD-BLK-L',
            price: 850000,
            stock: 20,
            weight: 0.7,
            isDefault: true,
            isActive: true,
            attributeValues: { create: [{ attributeValueId: colorBlack.id }, { attributeValueId: sizeL.id }] },
          },
          {
            sku: 'ADIDAS-HOOD-BLK-XL',
            price: 900000,
            stock: 12,
            weight: 0.75,
            isActive: true,
            attributeValues: { create: [{ attributeValueId: colorBlack.id }, { attributeValueId: sizeXL.id }] },
          },
          {
            sku: 'ADIDAS-HOOD-BLU-L',
            price: 870000,
            stock: 5,
            weight: 0.7,
            isActive: true,
            attributeValues: { create: [{ attributeValueId: colorBlue.id }, { attributeValueId: sizeL.id }] },
          },
        ],
      },
    },
    include: { variants: true },
  });

  // محصول ۳: اسنیکر نایک
  const product3 = await prisma.product.create({
    data: {
      name: 'کفش اسنیکر نایک Air Max',
      slug: 'nike-air-max-sneaker',
      brandId: nike.id,
      shortDescription: 'کفش راحت و سبک با کوشن Air Max',
      description: '<p>نایک Air Max با فناوری کوشن هوا، راحت‌ترین تجربه پوشیدن را فراهم می‌کند.</p>',
      status: ProductStatus.PUBLISHED,
      isFeatured: true,
      minPrice: 1800000,
      maxPrice: 2200000,
      isInStock: true,
      hasActiveDiscount: true,
      createdById: admin.id,
      categories: { create: [{ categoryId: sneakersCat.id }, { categoryId: shoesCat.id }] },
      images: { create: [{ mediaId: prodMedia4.id, order: 1, isMain: true }] },
      variants: {
        create: [
          {
            sku: 'NIKE-AIRMAX-WHT-41',
            price: 1800000,
            compareAtPrice: 2500000,
            discountType: DiscountType.FIXED,
            discountValue: 700000,
            stock: 6,
            weight: 0.8,
            isDefault: true,
            isActive: true,
            attributeValues: { create: [{ attributeValueId: colorWhite.id }, { attributeValueId: shoe41.id }] },
          },
          {
            sku: 'NIKE-AIRMAX-WHT-42',
            price: 1850000,
            compareAtPrice: 2500000,
            discountType: DiscountType.FIXED,
            discountValue: 650000,
            stock: 8,
            weight: 0.82,
            isActive: true,
            attributeValues: { create: [{ attributeValueId: colorWhite.id }, { attributeValueId: shoe42.id }] },
          },
          {
            sku: 'NIKE-AIRMAX-BLK-42',
            price: 2000000,
            stock: 4,
            weight: 0.82,
            isActive: true,
            attributeValues: { create: [{ attributeValueId: colorBlack.id }, { attributeValueId: shoe42.id }] },
          },
          {
            sku: 'NIKE-AIRMAX-BLK-43',
            price: 2200000,
            stock: 3,
            weight: 0.85,
            isActive: true,
            attributeValues: { create: [{ attributeValueId: colorBlack.id }, { attributeValueId: shoe43.id }] },
          },
        ],
      },
    },
    include: { variants: true },
  });

  // محصول ۴: پیش‌نویس (برای تست)
  const product4 = await prisma.product.create({
    data: {
      name: 'تی‌شرت ایران‌پوش طرح سنتی',
      slug: 'iranpoosh-traditional-tshirt',
      brandId: localBrand.id,
      shortDescription: 'تی‌شرت با طرح‌های سنتی ایرانی',
      status: ProductStatus.DRAFT,
      minPrice: 280000,
      maxPrice: 280000,
      isInStock: true,
      createdById: editor.id,
      categories: { create: [{ categoryId: tshirtCat.id }] },
      variants: {
        create: [
          {
            sku: 'IRAN-TRAD-BLU-M',
            price: 280000,
            stock: 30,
            weight: 0.25,
            isDefault: true,
            isActive: true,
            attributeValues: { create: [{ attributeValueId: colorBlue.id }, { attributeValueId: sizeM.id }] },
          },
        ],
      },
    },
    include: { variants: true },
  });

  // ============================================================
  // 9. Shipping Companies
  // ============================================================
  console.log('🚚 ایجاد شرکت‌های ارسال...');

  const postCompany = await prisma.shippingCompany.create({
    data: {
      name: 'پست جمهوری اسلامی',
      logoId: shipMedia1.id,
      description: 'ارسال از طریق پست پیشتاز',
      baseCost: 35000,
      estimatedDaysMin: 3,
      estimatedDaysMax: 7,
      isActive: true,
    },
  });

  const tipaxCompany = await prisma.shippingCompany.create({
    data: {
      name: 'تیپاکس',
      description: 'ارسال سریع درون‌شهری',
      baseCost: 60000,
      estimatedDaysMin: 1,
      estimatedDaysMax: 2,
      isActive: true,
    },
  });

  // ============================================================
  // 10. Payment Gateway
  // ============================================================
  console.log('💳 ایجاد درگاه پرداخت...');

  const zarinpal = await prisma.paymentGateway.create({
    data: {
      name: 'زرین‌پال',
      slug: 'zarinpal',
      isActive: true,
      config: { merchantId: 'XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX', sandbox: true },
    },
  });

  // ============================================================
  // 11. Discount Codes
  // ============================================================
  console.log('🏷️ ایجاد کدهای تخفیف...');

  const discount1 = await prisma.discountCode.create({
    data: {
      code: 'WELCOME20',
      type: DiscountType.PERCENT,
      value: 20,
      maxDiscountAmount: 200000,
      minCartAmount: 300000,
      maxUsage: 100,
      maxUsagePerUser: 1,
      isActive: true,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  });

  const discount2 = await prisma.discountCode.create({
    data: {
      code: 'SUMMER50K',
      type: DiscountType.FIXED,
      value: 50000,
      minCartAmount: 500000,
      maxUsage: 50,
      maxUsagePerUser: 2,
      isActive: true,
      expiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
    },
  });

  // ============================================================
  // 12. Orders (سفارش‌های نمونه)
  // ============================================================
  console.log('🛒 ایجاد سفارش‌ها...');

  const variant1 = product1.variants[0]; // Nike Dri-FIT Black M
  const variant3 = product3.variants[0]; // Nike Air Max White 41

  // سفارش تحویل‌داده‌شده
  const order1 = await prisma.order.create({
    data: {
      orderNumber: 'ORD-1001',
      userId: customer1.id,
      addressId: address1.id,
      shippingAddress: {
        province: 'تهران',
        city: 'تهران',
        fullAddress: 'تهران، خیابان ولیعصر، پلاک ۱۲، واحد ۳',
        receiverName: 'علی احمدی',
        receiverPhone: '09111111111',
      },
      shippingCompanyId: postCompany.id,
      shippingCost: 35000,
      subtotal: 450000,
      discountAmount: 112500,
      taxAmount: 0,
      totalAmount: 372500,
      paymentMethod: PaymentMethod.GATEWAY,
      status: OrderStatus.DELIVERED,
      paidAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      items: {
        create: [{
          variantId: variant1.id,
          productName: 'تی‌شرت ورزشی نایک مدل Dri-FIT',
          variantAttributes: 'مشکی - M',
          price: 450000,
          quantity: 1,
          discountAmount: 112500,
        }],
      },
      statusHistory: {
        create: [
          { status: OrderStatus.PENDING_PAYMENT, createdAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000) },
          { status: OrderStatus.PROCESSING, createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000) },
          { status: OrderStatus.SHIPPED, note: 'کد رهگیری: ۱۲۳۴۵۶۷۸', createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
          { status: OrderStatus.DELIVERED, createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) },
        ],
      },
    },
  });

  // تراکنش پرداخت سفارش ۱
  await prisma.transaction.create({
    data: {
      orderId: order1.id,
      gatewayId: zarinpal.id,
      userId: customer1.id,
      type: TransactionType.ORDER_PAYMENT,
      amount: 372500,
      status: PaymentStatus.SUCCESS,
      refId: 'ZP-98765432',
      trackingCode: 'TRK-1001-PAID',
    },
  });

  // سفارش در حال پردازش
  const order2 = await prisma.order.create({
    data: {
      orderNumber: 'ORD-1002',
      userId: customer1.id,
      addressId: address1.id,
      shippingAddress: {
        province: 'تهران',
        city: 'تهران',
        fullAddress: 'تهران، خیابان ولیعصر، پلاک ۱۲، واحد ۳',
        receiverName: 'علی احمدی',
        receiverPhone: '09111111111',
      },
      shippingCompanyId: tipaxCompany.id,
      shippingCost: 60000,
      subtotal: 1800000,
      discountAmount: 0,
      taxAmount: 0,
      totalAmount: 1860000,
      paymentMethod: PaymentMethod.GATEWAY,
      status: OrderStatus.PROCESSING,
      paidAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      items: {
        create: [{
          variantId: variant3.id,
          productName: 'کفش اسنیکر نایک Air Max',
          variantAttributes: 'سفید - ۴۱',
          price: 1800000,
          quantity: 1,
          discountAmount: 0,
        }],
      },
      statusHistory: {
        create: [
          { status: OrderStatus.PENDING_PAYMENT, createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) },
          { status: OrderStatus.PROCESSING, createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) },
        ],
      },
    },
  });

  await prisma.transaction.create({
    data: {
      orderId: order2.id,
      gatewayId: zarinpal.id,
      userId: customer1.id,
      type: TransactionType.ORDER_PAYMENT,
      amount: 1860000,
      status: PaymentStatus.SUCCESS,
      refId: 'ZP-11223344',
      trackingCode: 'TRK-1002-PAID',
    },
  });

  // ============================================================
  // 13. Comments (دیدگاه‌ها)
  // ============================================================
  console.log('💬 ایجاد دیدگاه‌ها...');

  const comment1 = await prisma.comment.create({
    data: {
      productId: product1.id,
      userId: customer1.id,
      content: 'محصول خیلی عالیه، جنسش بهتر از چیزی بود که انتظار داشتم. حتماً دوباره می‌خرم.',
      rating: 5,
      status: CommentStatus.APPROVED,
    },
  });

  const comment2 = await prisma.comment.create({
    data: {
      productId: product1.id,
      userId: customer2.id,
      content: 'سایزبندی درسته ولی رنگ کمی با عکس تفاوت داره. کلاً راضیم.',
      rating: 4,
      status: CommentStatus.APPROVED,
    },
  });

  // پاسخ به comment1
  await prisma.comment.create({
    data: {
      productId: product1.id,
      userId: customer3.id,
      parentId: comment1.id,
      content: 'ممنون از تجربه‌ات! منم همین نظر رو دارم.',
      status: CommentStatus.APPROVED,
    },
  });

  await prisma.comment.create({
    data: {
      productId: product3.id,
      userId: customer2.id,
      content: 'کفش فوق‌العاده‌ست! راحتی‌اش بی‌نظیره. ارزش قیمتش رو داره.',
      rating: 5,
      status: CommentStatus.APPROVED,
    },
  });

  // لایک دیدگاه
  await prisma.commentLike.create({
    data: { commentId: comment1.id, userId: customer2.id },
  });
  await prisma.commentLike.create({
    data: { commentId: comment1.id, userId: customer3.id },
  });

  // ============================================================
  // 14. Wishlist
  // ============================================================
  console.log('❤️ ایجاد علاقه‌مندی‌ها...');

  await prisma.wishlist.createMany({
    data: [
      { userId: customer1.id, productId: product3.id },
      { userId: customer2.id, productId: product1.id },
      { userId: customer2.id, productId: product2.id },
    ],
  });

  // ============================================================
  // 15. Cart
  // ============================================================
  console.log('🛒 ایجاد سبد خرید...');

  const cart2 = await prisma.cart.create({ data: { userId: customer2.id } });
  await prisma.cartItem.create({
    data: { cartId: cart2.id, variantId: product2.variants[0].id, quantity: 1 },
  });

  // سبد مهمان
  await prisma.cart.create({
    data: {
      guestToken: 'guest-token-abc123xyz',
      items: { create: [{ variantId: product1.variants[2].id, quantity: 2 }] },
    },
  });

  // ============================================================
  // 16. Ticket Departments & Tickets
  // ============================================================
  console.log('🎫 ایجاد تیکت‌ها...');

  const salesDept = await prisma.ticketDepartment.create({ data: { name: 'فروش' } });
  const supportDept = await prisma.ticketDepartment.create({ data: { name: 'پشتیبانی فنی' } });
  const returnDept = await prisma.ticketDepartment.create({ data: { name: 'مرجوعی و بازگشت وجه' } });

  const ticket1 = await prisma.ticket.create({
    data: {
      userId: customer1.id,
      departmentId: supportDept.id,
      subject: 'سوال درباره وضعیت سفارش',
      priority: TicketPriority.HIGH,
      status: TicketStatus.ANSWERED,
      orderId: order2.id,
      messages: {
        create: [
          {
            senderId: customer1.id,
            senderType: SenderType.USER,
            message: 'سلام، سفارش ORD-1002 هنوز ارسال نشده؟ چه زمانی ارسال می‌شه؟',
          },
          {
            senderId: admin.id,
            senderType: SenderType.ADMIN,
            message: 'سلام، سفارش شما در حال آماده‌سازی است و ظرف ۲۴ ساعت آینده ارسال خواهد شد.',
          },
        ],
      },
    },
  });

  await prisma.ticket.create({
    data: {
      userId: customer2.id,
      departmentId: salesDept.id,
      subject: 'آیا هودی آدیداس سایز XXL هم دارید؟',
      priority: TicketPriority.NORMAL,
      status: TicketStatus.OPEN,
      messages: {
        create: [{
          senderId: customer2.id,
          senderType: SenderType.USER,
          message: 'سلام، هودی آدیداس Essentials در سایز XXL موجود نشون نمی‌ده. آیا قراره اضافه بشه؟',
        }],
      },
    },
  });

  // ============================================================
  // 17. Notifications
  // ============================================================
  console.log('🔔 ایجاد نوتیفیکیشن‌ها...');

  await prisma.notification.createMany({
    data: [
      {
        userId: customer1.id,
        type: NotificationType.ORDER,
        title: 'سفارش شما تحویل داده شد',
        message: 'سفارش ORD-1001 با موفقیت تحویل داده شد.',
        link: '/orders/ORD-1001',
        isRead: true,
      },
      {
        userId: customer1.id,
        type: NotificationType.ORDER,
        title: 'سفارش در حال پردازش',
        message: 'سفارش ORD-1002 شما در حال آماده‌سازی است.',
        link: '/orders/ORD-1002',
        isRead: false,
      },
      {
        userId: customer1.id,
        type: NotificationType.TICKET,
        title: 'تیکت شما پاسخ داده شد',
        message: 'پشتیبانی به تیکت شما پاسخ داد.',
        link: '/tickets',
        isRead: false,
      },
      {
        userId: customer2.id,
        type: NotificationType.PROMOTION,
        title: 'تخفیف ویژه برای شما!',
        message: 'کد تخفیف WELCOME20 را در اولین خریدتان استفاده کنید.',
        isRead: false,
      },
    ],
  });

  // ============================================================
  // 18. Banners
  // ============================================================
  console.log('🖼️ ایجاد بنرها...');

  await prisma.banner.create({
    data: {
      title: 'حراج تابستانه',
      mediaId: bannerMedia1.id,
      link: '/sale',
      position: BannerPosition.HOME_MAIN,
      order: 1,
      isActive: true,
      endsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  });

  await prisma.banner.create({
    data: {
      title: 'جدیدترین کفش‌های نایک',
      mediaId: bannerMedia2.id,
      link: '/brand/nike',
      position: BannerPosition.HOME_MIDDLE,
      order: 1,
      isActive: true,
    },
  });

  // ============================================================
  // 19. Settings
  // ============================================================
  console.log('⚙️ ایجاد تنظیمات...');

  await prisma.setting.createMany({
    data: [
      { key: 'site_name', value: 'مرکافش‌دوز', type: 'string' },
      { key: 'site_description', value: 'فروشگاه آنلاین پوشاک و کفش', type: 'string' },
      { key: 'contact_email', value: 'info@mrkafshdoz.com', type: 'string' },
      { key: 'contact_phone', value: '021-12345678', type: 'string' },
      { key: 'default_currency', value: 'تومان', type: 'string' },
      { key: 'tax_rate', value: '0', type: 'number' },
      { key: 'free_shipping_threshold', value: '1000000', type: 'number' },
      { key: 'instagram', value: 'https://instagram.com/mrkafshdoz', type: 'string' },
      { key: 'telegram', value: 'https://t.me/mrkafshdoz', type: 'string' },
      { key: 'maintenance_mode', value: 'false', type: 'boolean' },
    ],
  });

  // ============================================================
  // 20. AuditLogs
  // ============================================================
  console.log('📋 ایجاد لاگ‌های حسابرسی...');

  await prisma.auditLog.createMany({
    data: [
      { userId: admin.id, action: 'CREATE', entity: 'Product', entityId: product1.id, ip: '127.0.0.1', metadata: { productName: product1.name } },
      { userId: admin.id, action: 'CREATE', entity: 'Product', entityId: product2.id, ip: '127.0.0.1', metadata: { productName: product2.name } },
      { userId: customer1.id, action: 'LOGIN', entity: 'User', entityId: customer1.id, ip: '192.168.1.1' },
      { userId: customer1.id, action: 'CREATE', entity: 'Order', entityId: order1.id, ip: '192.168.1.1', metadata: { orderNumber: 'ORD-1001' } },
    ],
  });

  // ============================================================
  // خلاصه نتیجه
  // ============================================================
  console.log('\n✅ Seed با موفقیت انجام شد!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`👤 کاربران: admin, editor, 3 customer`);
  console.log(`🏷️ برندها: نایک، آدیداس، ایران‌پوش`);
  console.log(`📁 دسته‌بندی‌ها: ۶ دسته (۲ سطح)`);
  console.log(`📦 محصولات: ۴ محصول با ${product1.variants.length + product2.variants.length + product3.variants.length + product4.variants.length} تنوع`);
  console.log(`🛒 سفارش‌ها: ORD-1001 (تحویل‌شده)، ORD-1002 (در پردازش)`);
  console.log(`🏷️ کدهای تخفیف: WELCOME20، SUMMER50K`);
  console.log(`\n🔑 رمز ادمین: Admin@1234`);
  console.log(`🔑 رمز مشتریان: Customer@1234`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

main()
  .catch((e) => {
    console.error('❌ خطا در seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });