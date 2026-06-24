# مستندات API فروشگاه

> این فایل مرجع کامل تمام endpoint های بک‌اند است — برای استفاده‌ی تیم فرانت‌اند.
> **قانون نگه‌داری:** هر وقت یک route تغییر کرد (اضافه/حذف/تغییر ورودی-خروجی)،
> همین فایل در همان commit/پاسخ به‌روزرسانی می‌شود. این فایل تنها منبع حقیقت
> (source of truth) برای قرارداد API است، نه کدِ route ها.

---

## فهرست مطالب

1. [قراردادهای کلی](#قراردادهای-کلی)
2. [احراز هویت (Auth)](#۱-احراز-هویت-auth)
3. [دسته‌بندی (Categories)](#۲-دسته‌بندی-categories)
4. [برند (Brands)](#۳-برند-brands)
5. [ویژگی (Attributes)](#۴-ویژگی-attributes)
6. [محصولات (Products)](#۵-محصولات-products)
7. [سبد خرید (Cart)](#۶-سبد-خرید-cart)
8. [علاقه‌مندی (Wishlist)](#۷-علاقه‌مندی-wishlist)
9. [مقایسه (Comparison)](#۸-مقایسه-comparison)
10. [کد تخفیف (Discount Codes)](#۹-کد-تخفیف-discount-codes)
11. [آدرس‌ها (Addresses)](#۱۰-آدرس‌ها-addresses)
12. [شرکت‌های ارسال (Shipping Companies)](#۱۱-شرکت‌های-ارسال-shipping-companies)
13. [درگاه‌های پرداخت (Payment Gateways)](#۱۲-درگاه‌های-پرداخت-payment-gateways)
14. [کیف پول (Wallet)](#۱۳-کیف-پول-wallet)
15. [سفارش‌ها (Orders)](#۱۴-سفارش‌ها-orders)
16. [رسانه (Media)](#۱۵-رسانه-media)

---

## قراردادهای کلی

### Base URL
```
/api/v1
```
(مسیر `GET /health` بیرون از `/api/v1` و بدون نیاز به هیچ‌چیز همیشه در دسترس است)

### پاسخ موفق
همه‌ی پاسخ‌های موفق این ساختار یکدست را دارند:
```json
{
  "success": true,
  "message": "string",
  "data": "هر شکلی که در هر endpoint مشخص شده"
}
```

### پاسخ خطا
```json
{
  "success": false,
  "message": "پیام خطا به فارسی",
  "errors": "اختیاری — جزئیات خطای اعتبارسنجی (zod)، فقط روی 400"
}
```
کدهای رایج: `400` ورودی نامعتبر/قانون کسب‌وکار، `401` نیاز به ورود، `403` نبود
دسترسی، `404` پیدا نشد، `409` تعارض (مثلاً تکراری/در حال استفاده)، `429` تعداد
درخواست زیاد.

### احراز هویت
هدر زیر روی تمام مسیرهایی که «نیاز به ورود» دارند الزامی است:
```
Authorization: Bearer <accessToken>
```
`accessToken` از مسیرهای ورود/ثبت‌نام (بخش Auth) به‌دست می‌آید و عمر کوتاهی
دارد (پیش‌فرض ۱۵ دقیقه)؛ با `refreshToken` آن را تازه کنید.

### هدر مهمان (Guest)
مسیرهای **سبد خرید** و **مقایسه** برای کاربر مهمان (بدون ورود) هم کار می‌کنند.
یک هدر مشترک بین این دو استفاده می‌شود:
```
X-Guest-Token: <مقدار دلخواه شما>
```
- اگر این هدر را نفرستید، بک‌اند یک مقدار تازه می‌سازد و آن را در
  `data.guestToken` پاسخ برمی‌گرداند — آن را ذخیره (مثلاً localStorage) کنید
  و در درخواست‌های بعدی همان را بفرستید.
- بعد از ورود/ثبت‌نام کاربر، `POST /cart/merge` را با همین توکن بزنید تا
  سبد مهمان با سبد کاربر ادغام شود.

### صفحه‌بندی (Pagination)
هر endpoint که فهرست صفحه‌بندی‌شده برمی‌گرداند این ساختار را دارد:
```json
{
  "items": [ /* ... */ ],
  "meta": { "total": 42, "page": 1, "limit": 20, "totalPages": 3 }
}
```
پارامترهای query مشترک: `page` (پیش‌فرض ۱)، `limit` (پیش‌فرض ۲۰، سقف ۱۰۰).

### واحد پول
تمام مقادیر مالی (قیمت، تخفیف، موجودی و ...) عدد صحیح بدون اعشار و به
**تومان** هستند.

---

## ۱. احراز هویت (Auth)
Base path: `/api/v1/auth`

پسورد حداقل ۸ کاراکتر، شامل حداقل یک حرف و یک رقم. `identifier` می‌تواند
ایمیل یا شماره موبایل ایران (با یا بدون `0`/`+98`/`0098` ابتدایی) باشد —
بک‌اند خودش تشخیص می‌دهد کانال OTP باید SMS یا Email باشد.

| Method | Path | Auth | توضیح |
|---|---|---|---|
| POST | `/register` | ندارد | ثبت‌نام + ارسال OTP تایید |
| POST | `/register/verify-otp` | ندارد | تایید OTP ثبت‌نام → صدور توکن |
| POST | `/login` | ندارد | ورود با رمز عبور |
| POST | `/login/otp/request` | ندارد | درخواست OTP برای ورود بدون رمز |
| POST | `/login/otp/verify` | ندارد | تایید OTP ورود → صدور توکن |
| POST | `/refresh-token` | ندارد | تازه‌سازی accessToken |
| POST | `/logout` | دارد | خروج از همین دستگاه/نشست |
| POST | `/logout-all` | دارد | خروج از تمام دستگاه‌های دیگر |
| POST | `/forgot-password` | ندارد | درخواست OTP بازیابی رمز |
| POST | `/reset-password` | ندارد | تایید OTP + ثبت رمز جدید |

> همه‌ی مسیرهای این بخش زیر یک rate-limiter سخت‌گیرانه‌تر هستند (پیش‌فرض:
> حداکثر ۱۰ درخواست در دقیقه برای هر IP).

### `POST /register`
**Body:**
```json
{ "fullName": "علی رضایی", "identifier": "user@example.com", "password": "Abc12345" }
```
**Response 201** → `data`:
```json
{ "identifier": "user@example.com", "channel": "EMAIL", "expiresAt": "2026-06-24T10:05:00.000Z" }
```
**خطاها:** `409` کاربری با این مشخصات قبلاً ثبت‌نام کرده.

### `POST /register/verify-otp`
**Body:** `{ "identifier": "...", "code": "12345", "deviceName": "Chrome on Windows" }` (`deviceName` اختیاری)
**Response 200** → `data`:
```json
{
  "user": { "id": "...", "fullName": "...", "email": "...", "phone": null, "role": "CUSTOMER", "emailVerifiedAt": "...", "...": "..." },
  "accessToken": "eyJ...",
  "refreshToken": "eyJ...",
  "sessionId": "..."
}
```
**خطاها:** `400` کد اشتباه/منقضی، `429` تعداد تلاش بیش از حد.

### `POST /login`
**Body:** `{ "identifier": "...", "password": "...", "deviceName": "..." }`
**Response 200:** همان شکل `verify-otp` بالا (`user`, `accessToken`, `refreshToken`, `sessionId`)
**خطاها:** `400` شناسه/رمز اشتباه، `403` حساب مسدود، `429` قفل موقت بعد از تلاش‌های ناموفق پیاپی.

### `POST /login/otp/request`
**Body:** `{ "identifier": "..." }` → **Response 200** → `data`: `{ identifier, channel, expiresAt }`
**خطاها:** `404` کاربر پیدا نشد، `403` حساب مسدود.

### `POST /login/otp/verify`
**Body:** `{ "identifier": "...", "code": "...", "deviceName": "..." }` → خروجی مثل `register/verify-otp`.

### `POST /refresh-token`
**Body:** `{ "refreshToken": "..." }`
**Response 200** → `data`: `{ accessToken, refreshToken, sessionId }` (refresh token چرخشی است — قبلی بعد از این دیگر کار نمی‌کند)
**خطاها:** `401` نشست باطل/منقضی.

### `POST /logout` *(نیاز به توکن)*
بدون body. نشست فعلی (همان‌که accessToken متعلق به آن است) را غیرفعال می‌کند.

### `POST /logout-all` *(نیاز به توکن)*
بدون body. تمام نشست‌های دیگر کاربر (به‌جز نشست فعلی) را غیرفعال می‌کند —
برای «خروج از همه دستگاه‌ها».

### `POST /forgot-password`
**Body:** `{ "identifier": "..." }` → پاسخ همیشه عمومی (برای جلوگیری از افشای وجود حساب).

### `POST /reset-password`
**Body:** `{ "identifier": "...", "code": "...", "newPassword": "Abc12345" }`
**Response 200:** پیام موفقیت. **نکته:** بعد از این، تمام نشست‌های فعال کاربر باطل می‌شوند (باید دوباره وارد شود).

---

## ۲. دسته‌بندی (Categories)
Base path: `/api/v1/categories`

دسته‌بندی چندلایه (درختی، با `parentId`). مدیریت فقط `ADMIN`/`EDITOR`.

| Method | Path | Auth | توضیح |
|---|---|---|---|
| GET | `/tree` | ندارد | درخت کامل دسته‌بندی‌ها (تو در تو با `children`) |
| GET | `/` | ندارد | لیست تخت (flat)؛ `?includeInactive=true` برای پنل ادمین |
| GET | `/slug/:slug` | ندارد | دریافت یک دسته با slug |
| GET | `/:id` | ندارد | دریافت یک دسته با id |
| GET | `/:id/attributes` | ندارد | ویژگی‌های متصل به این دسته (برای فیلتر فروشگاه) |
| POST | `/` | ADMIN/EDITOR | ایجاد |
| PUT | `/:id` | ADMIN/EDITOR | ویرایش |
| DELETE | `/:id` | ADMIN/EDITOR | حذف (اگر زیرمجموعه دارد، `409`) |
| POST | `/:id/attributes` | ADMIN/EDITOR | اتصال یک ویژگی به این دسته |
| DELETE | `/:id/attributes/:attributeId` | ADMIN/EDITOR | قطع اتصال |

**Body ایجاد/ویرایش:**
```json
{
  "name": "موبایل",
  "slug": "mobile",
  "description": "...",
  "imageId": "media_id_اختیاری",
  "parentId": "category_id_اختیاری",
  "order": 0,
  "isActive": true,
  "metaTitle": "...", "metaDescription": "...", "canonicalUrl": "https://..."
}
```
`slug` اختیاری است — اگر نفرستید، خودکار از `name` ساخته می‌شود (و اگر
تکراری بود، `-2`، `-3` و ... اضافه می‌شود).

**خطاها:** `400` والد نامعتبر یا چرخه (والد جدید نمی‌تواند زیرمجموعه‌ی خودش
باشد)، `409` slug تکراری یا (در حذف) دسته زیرمجموعه دارد.

**اتصال ویژگی:** `POST /:id/attributes` با body `{ "attributeId": "..." }`.

---

## ۳. برند (Brands)
Base path: `/api/v1/brands`

CRUD ساده. مدیریت فقط `ADMIN`/`EDITOR`.

| Method | Path | Auth | توضیح |
|---|---|---|---|
| GET | `/` | ندارد | لیست برندها؛ `?includeInactive=true` |
| GET | `/slug/:slug` | ندارد | دریافت با slug |
| GET | `/:id` | ندارد | دریافت با id |
| POST | `/` | ADMIN/EDITOR | ایجاد |
| PUT | `/:id` | ADMIN/EDITOR | ویرایش |
| DELETE | `/:id` | ADMIN/EDITOR | حذف (اگر محصولی دارد، `409`) |

**Body:** `{ name, slug?, description?, logoId?, isActive?, metaTitle?, metaDescription? }`
(فقط `name` الزامی است؛ `slug` خودکار از `name` ساخته می‌شود اگر نفرستید)

---

## ۴. ویژگی (Attributes)
Base path: `/api/v1/attributes`

ویژگی‌های قابل تعریف برای تنوع کالا (رنگ، جنس، سایز، کشور سازنده و ...) +
مقادیر هرکدام. مدیریت فقط `ADMIN`/`EDITOR`.

| Method | Path | Auth | توضیح |
|---|---|---|---|
| GET | `/` | ندارد | لیست ویژگی‌ها همراه با `values` |
| GET | `/:id` | ندارد | یک ویژگی همراه با `values` |
| POST | `/` | ADMIN/EDITOR | ایجاد ویژگی |
| PUT | `/:id` | ADMIN/EDITOR | ویرایش ویژگی |
| DELETE | `/:id` | ADMIN/EDITOR | حذف (اگر در تنوعی استفاده شده، `409`) |
| POST | `/:id/values` | ADMIN/EDITOR | افزودن یک مقدار |
| PUT | `/values/:valueId` | ADMIN/EDITOR | ویرایش یک مقدار |
| DELETE | `/values/:valueId` | ADMIN/EDITOR | حذف یک مقدار (اگر استفاده شده، `409`) |

**Body ایجاد ویژگی:**
```json
{ "name": "رنگ", "slug": "color", "inputType": "COLOR", "isFilterable": true, "isVariant": true }
```
`inputType`: یکی از `TEXT` | `COLOR` | `SELECT`.

**Body افزودن مقدار:**
```json
{ "value": "قرمز", "colorHex": "#FF0000", "order": 0 }
```
`colorHex` فقط برای `inputType=COLOR` معنا دارد (فرمت `#RRGGBB`).

---

## ۵. محصولات (Products)
Base path: `/api/v1/products`

محصول متغیر: هر محصول حداقل یک «تنوع» (variant) دارد؛ هر تنوع SKU/قیمت/
موجودی/تخفیف جدا دارد. `minPrice`/`maxPrice`/`isInStock`/`hasActiveDiscount`
روی خود محصول کش می‌شوند و بعد از هر تغییر تنوع خودکار به‌روز می‌شوند.

| Method | Path | Auth | توضیح |
|---|---|---|---|
| GET | `/filters` | ندارد | متادیتای فیلتر فروشگاه (برندها، بازه قیمت، ویژگی‌ها) — `?categorySlug=` اختیاری |
| GET | `/admin` | ADMIN/EDITOR | لیست ادمین (همه‌ی وضعیت‌ها) با همان فیلترهای زیر + `status` |
| GET | `/admin/:id` | ADMIN/EDITOR | جزئیات کامل محصول (هر وضعیتی) |
| GET | `/` | ندارد | لیست فروشگاه (فقط `PUBLISHED`) با فیلتر/مرتب‌سازی/صفحه‌بندی |
| GET | `/:slug` | ندارد | جزئیات یک محصول منتشرشده با slug |
| POST | `/:id/view` | اختیاری | ثبت یک بازدید (برای آنالیز) |
| POST | `/` | ADMIN/EDITOR | ایجاد محصول (با تنوع‌ها و تصاویر) |
| PUT | `/:id` | ADMIN/EDITOR | ویرایش فیلدهای محصول + دسته‌بندی‌ها |
| DELETE | `/:id` | ADMIN/EDITOR | حذف (اگر در سفارشی استفاده شده، `409` — به‌جای حذف ARCHIVED کنید) |
| POST | `/:id/variants` | ADMIN/EDITOR | افزودن تنوع جدید |
| PUT | `/:id/variants/:variantId` | ADMIN/EDITOR | ویرایش تنوع |
| DELETE | `/:id/variants/:variantId` | ADMIN/EDITOR | حذف تنوع (باید حداقل ۱ تنوع باقی بماند؛ اگر سفارش دارد `409`) |
| POST | `/:id/variants/:variantId/images` | ADMIN/EDITOR | افزودن تصویر به یک تنوع |
| DELETE | `/:id/variants/:variantId/images/:imageId` | ADMIN/EDITOR | حذف تصویر تنوع |
| POST | `/:id/images` | ADMIN/EDITOR | افزودن تصویر عمومی محصول |
| DELETE | `/:id/images/:imageId` | ADMIN/EDITOR | حذف تصویر محصول |

### query پارامترهای `GET /` (فروشگاه) و `GET /admin`
| پارامتر | نوع | توضیح |
|---|---|---|
| `page`, `limit` | number | صفحه‌بندی |
| `categorySlug` | string | شامل زیرمجموعه‌های آن دسته هم می‌شود |
| `brandIds` | string | چند id با کاما جدا: `id1,id2` |
| `attributeValueIds` | string | چند id با کاما جدا — AND بین ویژگی‌های مختلف، OR بین مقادیر یک ویژگی |
| `minPrice`, `maxPrice` | number | بازه قیمت (هم‌پوشانی با بازه‌ی قیمت تنوع‌های محصول) |
| `inStock` | boolean | فقط موجود |
| `hasDiscount` | boolean | فقط تخفیف‌دار |
| `isFeatured` | boolean | فقط ویژه |
| `search` | string | جست‌وجو در نام/توضیح کوتاه |
| `sort` | enum | `newest` (پیش‌فرض) \| `price_asc` \| `price_desc` \| `popular` |
| `status` *(فقط admin)* | enum | `DRAFT` \| `PUBLISHED` \| `ARCHIVED` |

> **نکته‌ی مهم:** فیلتر چند-ویژگی‌ای در سطح *محصول* انجام می‌شود نه *تنوع* —
> یعنی محصولی با یک تنوع قرمز و یک تنوع دیگر سایز L هم در فیلتر
> «رنگ=قرمز و سایز=L» نتیجه می‌شود (نه لزوماً یک تنوع که هم قرمز هم L باشد).

### `POST /` (ایجاد محصول)
**Body:**
```json
{
  "name": "تیشرت مردانه",
  "brandId": "brand_id_اختیاری",
  "shortDescription": "...",
  "description": "<p>HTML از تکست ادیتور</p>",
  "status": "DRAFT",
  "isFeatured": false,
  "categoryIds": ["cat_id_۱"],
  "images": [{ "mediaId": "media_id", "order": 0, "isMain": true }],
  "variants": [
    {
      "sku": "TSHIRT-RED-L",
      "price": 250000,
      "compareAtPrice": 300000,
      "discountType": "PERCENT",
      "discountValue": 10,
      "discountStartAt": "2026-06-01T00:00:00Z",
      "discountEndAt": "2026-06-30T00:00:00Z",
      "stock": 20,
      "isDefault": true,
      "attributeValueIds": ["attrValue_رنگ_قرمز", "attrValue_سایز_L"]
    }
  ]
}
```
**خطاها:** `400` دسته/برند نامعتبر یا ترکیب ویژگی تکراری بین تنوع‌ها، `409` SKU تکراری یا slug تکراری.

### `PUT /:id` (ویرایش محصول)
فقط فیلدهای سطح‌بالا + `categoryIds` (که کامل جای‌گزین می‌شود). برای
تنوع‌ها/تصاویر از endpoint های مخصوص خودشان استفاده کنید.

### `POST /:id/variants` و `PUT /:id/variants/:variantId`
همان شکل یک آیتم از آرایه‌ی `variants` بالا (در PUT همه‌ی فیلدها اختیاری‌اند).

---

## ۶. سبد خرید (Cart)
Base path: `/api/v1/cart` — همه‌ی مسیرها برای **مهمان و عضو** کار می‌کنند مگر
جایی که خلافش گفته شده (نگاه کنید به «هدر مهمان» در قراردادهای کلی).

| Method | Path | Auth | توضیح |
|---|---|---|---|
| GET | `/` | اختیاری | دریافت سبد فعلی |
| POST | `/items` | اختیاری | افزودن آیتم |
| PATCH | `/items/:itemId` | اختیاری | تغییر تعداد (۰ = حذف) |
| DELETE | `/items/:itemId` | اختیاری | حذف یک آیتم |
| DELETE | `/` | اختیاری | خالی‌کردن کل سبد |
| POST | `/merge` | **دارد** | ادغام سبد مهمان با سبد کاربر بعد از لاگین |

### شکل `cart` در همه‌ی پاسخ‌ها (`data.cart`)
```json
{
  "id": "cart_id یا null اگر هنوز چیزی ثبت نشده",
  "itemCount": 2,
  "subtotal": 500000,
  "totalDiscount": 50000,
  "total": 450000,
  "items": [
    {
      "id": "cartItem_id",
      "variantId": "...",
      "productName": "تیشرت مردانه",
      "productSlug": "tshirt-mardane",
      "image": "https://.../image.jpg",
      "attributesLabel": "رنگ: قرمز، سایز: L",
      "quantity": 2,
      "unitPrice": 225000,
      "originalPrice": 250000,
      "lineTotal": 450000,
      "isAvailable": true,
      "availableStock": 18
    }
  ]
}
```
`subtotal` = جمع `originalPrice×quantity` (قبل از تخفیف تنوع) — `total` =
جمع `unitPrice×quantity` (بعد از تخفیف تنوع، **قبل از کد تخفیف**؛ کد تخفیف
در مرحله‌ی ثبت سفارش اعمال می‌شود، نه در سبد).

### `POST /items`
**Body:** `{ "variantId": "...", "quantity": 1 }`
**Response 201** → `data`: `{ cart, wasAdjusted, guestToken? }`
`wasAdjusted=true` یعنی تعداد درخواستی بیشتر از موجودی بود و خودکار به سقف موجودی کاهش یافت.
**خطاها:** `404` تنوع پیدا نشد/غیرفعال، `400` محصول منتشر نشده، `409` ناموجود.

### `PATCH /items/:itemId`
**Body:** `{ "quantity": 3 }` (صفر = حذف آیتم) → خروجی مثل بالا.

### `POST /merge` *(نیاز به توکن)*
**Body:** `{ "guestToken": "..." }` — سبد مهمانِ این توکن را با سبد کاربر فعلی
ادغام می‌کند (تعدادهای تکراری جمع می‌شوند، با رعایت سقف موجودی) و سبد مهمان
حذف می‌شود.

---

## ۷. علاقه‌مندی (Wishlist)
Base path: `/api/v1/wishlist` — **همه‌ی مسیرها نیاز به ورود دارند** (بدون حالت مهمان).

| Method | Path | توضیح |
|---|---|---|
| GET | `/?page=&limit=` | لیست صفحه‌بندی‌شده |
| POST | `/` | افزودن — Body: `{ "productId": "..." }` |
| DELETE | `/:productId` | حذف |

افزودن idempotent است (افزودن دوباره‌ی همان محصول خطا نمی‌دهد).

---

## ۸. مقایسه (Comparison)
Base path: `/api/v1/comparison` — مثل سبد خرید، هم مهمان هم عضو (همان هدر `X-Guest-Token`).
حداکثر **۴ محصول** هم‌زمان.

| Method | Path | توضیح |
|---|---|---|
| GET | `/` | دریافت لیست مقایسه‌ی فعلی |
| POST | `/` | افزودن — Body: `{ "productId": "..." }` |
| DELETE | `/:productId` | حذف یک محصول |
| DELETE | `/` | خالی‌کردن کل لیست |

پاسخ‌ها به شکل `{ comparison: { id, items: [{ id, product: {...با brand/categories} }] }, guestToken? }`
**خطاها:** `409` اگر بخواهید محصول پنجم اضافه کنید.

---

## ۹. کد تخفیف (Discount Codes)
Base path: `/api/v1/discount-codes`

| Method | Path | Auth | توضیح |
|---|---|---|---|
| POST | `/apply` | اختیاری (مهمان/عضو) | بررسی و محاسبه‌ی کد روی سبد فعلی (بدون مصرف‌کردن کد) |
| GET | `/` | ADMIN/EDITOR | لیست (صفحه‌بندی + `?isActive=` + `?search=`) |
| GET | `/:id` | ADMIN/EDITOR | جزئیات + محصولات/دسته‌ها/کاربران متصل |
| POST | `/` | ADMIN/EDITOR | ایجاد |
| PUT | `/:id` | ADMIN/EDITOR | ویرایش |
| DELETE | `/:id` | ADMIN/EDITOR | حذف (اگر قبلاً مصرف شده، `409` — غیرفعال کنید) |

### `POST /apply`
**Body:** `{ "code": "SUMMER20" }`
**Response 200** → `data`:
```json
{
  "discountCodeId": "...",
  "code": "SUMMER20",
  "type": "PERCENT",
  "value": 20,
  "cartTotal": 450000,
  "eligibleSubtotal": 450000,
  "discountAmount": 90000,
  "payableTotal": 360000,
  "eligibleVariantIds": ["..."],
  "guestToken": "فقط اگر مهمان بودید و هنوز توکن نداشتید"
}
```
این مقدار فقط پیش‌نمایش است — مصرف واقعی کد (افزایش شمارنده‌ی استفاده) فقط
هنگام ثبت قطعی سفارش (بخش Orders) اتفاق می‌افتد. اگر `code` را به
`POST /orders` بفرستید، دوباره از اول اعتبارسنجی و این‌بار واقعاً مصرف می‌شود.

**خطاها (`400` با پیام مشخص):** کد غیرفعال/منقضی/هنوز شروع‌نشده، ظرفیت
استفاده تمام شده، نیاز به ورود (اگر کد به کاربر خاص محدود است)، کد برای
حساب شما نیست، حداقل مبلغ سبد رعایت نشده، هیچ‌کدام از کالاهای سبد شامل این
کد نمی‌شوند. **`404`** کد پیدا نشد.

### `POST /` (ایجاد)
**Body:**
```json
{
  "code": "SUMMER20",
  "type": "PERCENT",
  "value": 20,
  "maxDiscountAmount": 100000,
  "minCartAmount": 200000,
  "maxUsage": 500,
  "maxUsagePerUser": 1,
  "startsAt": "2026-06-01T00:00:00Z",
  "expiresAt": "2026-06-30T23:59:59Z",
  "isActive": true,
  "productIds": [],
  "categoryIds": [],
  "userIds": []
}
```
- `type=PERCENT` → `value` باید بین ۱ تا ۱۰۰ باشد.
- `productIds`/`categoryIds` خالی = روی کل سبد اعمال می‌شود؛ پر = فقط روی آیتم‌های واجد شرایط (جزئیات در README پروژه).
- `userIds` پر = فقط همین کاربرها مجازند (یا `maxUsagePerUser` ست شده باشد) → کاربر باید لاگین کرده باشد.
- `code` همیشه با حروف بزرگ ذخیره می‌شود (case-insensitive در عمل).

**خطاها:** `409` کد تکراری، `400` محصول/دسته/کاربر نامعتبر یا `expiresAt <= startsAt`.

---

## ۱۰. آدرس‌ها (Addresses)
Base path: `/api/v1/addresses` — **همه‌ی مسیرها نیاز به ورود دارند**.
پیش‌نیاز ثبت سفارش (انتخاب آدرس ارسال) + آیتم نقشه (`lat`/`lng`).

| Method | Path | توضیح |
|---|---|---|
| GET | `/` | لیست آدرس‌های من |
| GET | `/:id` | یک آدرس |
| POST | `/` | ایجاد |
| PUT | `/:id` | ویرایش |
| DELETE | `/:id` | حذف (اگر در سفارشی استفاده شده، `409`) |

**Body:**
```json
{
  "title": "خانه",
  "receiverName": "علی رضایی",
  "receiverPhone": "09123456789",
  "province": "تهران",
  "city": "تهران",
  "postalCode": "1234567890",
  "fullAddress": "خیابان ...، پلاک ...",
  "lat": 35.6892,
  "lng": 51.3890,
  "isDefault": false
}
```
اولین آدرس کاربر خودکار `isDefault=true` می‌شود. تنظیم `isDefault=true` روی
یک آدرس، بقیه را خودکار `false` می‌کند.

---

## ۱۱. شرکت‌های ارسال (Shipping Companies)
Base path: `/api/v1/shipping-companies`

| Method | Path | Auth | توضیح |
|---|---|---|---|
| GET | `/` | ندارد | لیست فعال‌ها؛ `?includeInactive=true` برای ادمین |
| GET | `/:id` | ندارد | یک شرکت |
| POST | `/` | ADMIN/EDITOR | ایجاد |
| PUT | `/:id` | ADMIN/EDITOR | ویرایش |
| DELETE | `/:id` | ADMIN/EDITOR | حذف (اگر در سفارشی استفاده شده، `409`) |

**Body:** `{ name, logoId?, description?, baseCost, estimatedDaysMin?, estimatedDaysMax?, isActive? }`
`baseCost` هزینه‌ی ثابت ارسال (تومان) که مستقیم به `Order.shippingCost` می‌رود.

---

## ۱۲. درگاه‌های پرداخت (Payment Gateways)
Base path: `/api/v1/payment-gateways`

⚠️ این فقط رکورد «تنظیمات» یک درگاه در دیتابیس است (برای نمایش در صفحه‌ی
پرداخت). اتصال واقعی به درگاه (زرین‌پال و ...) جدا و در
`src/services/payment/payment.factory.ts` پیاده‌سازی می‌شود — `slug` اینجا
باید با همان مقداری که در factory ثبت می‌کنید یکی باشد.

| Method | Path | Auth | توضیح |
|---|---|---|---|
| GET | `/` | ندارد | لیست فعال‌ها (برای نمایش گزینه‌های پرداخت) |
| POST | `/` | ADMIN | ایجاد |
| PUT | `/:id` | ADMIN | ویرایش |
| DELETE | `/:id` | ADMIN | حذف |

**Body:** `{ name, slug, isActive?, config? }` — `config` یک شیء آزاد JSON
(مثلاً merchantId) که فقط سمت سرور خوانده می‌شود.

---

## ۱۳. کیف پول (Wallet)
Base path: `/api/v1/wallet` — **همه‌ی مسیرها نیاز به ورود دارند**.

| Method | Path | توضیح |
|---|---|---|
| GET | `/?page=&limit=` | موجودی + تاریخچه‌ی تراکنش‌ها (صفحه‌بندی‌شده) |
| POST | `/charge/initiate` | شروع شارژ از درگاه |
| POST | `/charge/:transactionId/verify` | تایید بازگشت از درگاه و افزایش موجودی |

### `GET /`
**Response 200** → `data`:
```json
{
  "balance": 150000,
  "transactions": [
    { "id": "...", "type": "DEPOSIT", "amount": 100000, "description": "...", "orderId": null, "createdAt": "..." }
  ],
  "meta": { "total": 5, "page": 1, "limit": 20, "totalPages": 1 }
}
```
`type`: `DEPOSIT` (شارژ) | `WITHDRAW` | `PURCHASE` (پرداخت سفارش) | `REFUND` | `ADMIN_ADJUST`.

### `POST /charge/initiate`
**Body:** `{ "amount": 100000, "gatewaySlug": "zarinpal" }`
**Response 200** → `data`: `{ "transactionId": "...", "redirectUrl": "https://..." }`
کاربر را به `redirectUrl` بفرستید؛ درگاه بعد از پرداخت کاربر را به همان
callback که سرور ساخته برمی‌گرداند.
**خطاها:** `404`/`400` اگر `gatewaySlug` ثبت یا فعال نباشد، یا (تا قبل از
اتصال یک درگاه واقعی در factory) «درگاه پرداخت ثبت نشده است».

### `POST /charge/:transactionId/verify`
**Body:** `{ "providerParams": { "Authority": "...", "Status": "OK" } }` (هرچه درگاه در querystring برگرداند)
**Response 200** → `data`: `{ "alreadyProcessed": false, "balance": 250000 }`
**خطاها:** `400` پرداخت ناموفق، `404` تراکنش پیدا نشد.

---

## ۱۴. سفارش‌ها (Orders)
Base path: `/api/v1/orders` — **همه‌ی مسیرها نیاز به ورود دارند** (بدون
checkout مهمان؛ قبل از سفارش باید کاربر لاگین کرده و سبدش غیرخالی باشد).

| Method | Path | Auth | توضیح |
|---|---|---|---|
| GET | `/admin` | ADMIN/SUPPORT | لیست همه‌ی سفارش‌ها (فیلتر `status`, `userId`, `search`) |
| GET | `/admin/returns` | ADMIN/SUPPORT | لیست درخواست‌های مرجوعی |
| PUT | `/admin/returns/:returnId` | ADMIN/SUPPORT | بررسی/تایید/رد مرجوعی |
| GET | `/admin/:id` | ADMIN/SUPPORT | جزئیات هر سفارشی (بدون محدودیت مالکیت) |
| PUT | `/admin/:id/status` | ADMIN/SUPPORT | تغییر دستی وضعیت سفارش |
| GET | `/` | کاربر | لیست سفارش‌های من |
| POST | `/` | کاربر | **ثبت سفارش از سبد خرید فعلی (checkout)** |
| GET | `/:id` | کاربر (مالک) | جزئیات یک سفارش من |
| POST | `/:id/cancel` | کاربر (مالک) | لغو خودکار (فقط قبل از ارسال) |
| POST | `/:id/return` | کاربر (مالک) | درخواست مرجوعی (فقط بعد از تحویل) |
| POST | `/:id/payment/initiate` | کاربر (مالک) | شروع پرداخت از درگاه برای باقی‌مانده‌ی بدهی |
| POST | `/:id/payment/verify` | کاربر (مالک) | تایید بازگشت از درگاه |

### وضعیت‌های سفارش (`OrderStatus`)
`PENDING_PAYMENT` → `PROCESSING` → `SHIPPED` → `DELIVERED`، یا در هر مرحله
قبل از ارسال: `CANCELLED`؛ بعد از تحویل: `RETURN_REQUESTED` → `RETURNED`.
(`REFUNDED`, `FAILED` هم در enum هستند برای موارد خاص ادمین.)

### `POST /` (ثبت سفارش)
**Body:**
```json
{
  "addressId": "address_id",
  "shippingCompanyId": "shipping_company_id",
  "paymentMethod": "WALLET",
  "gatewaySlug": "zarinpal",
  "discountCode": "SUMMER20"
}
```
- `paymentMethod`: `WALLET` (کامل از کیف‌پول) | `GATEWAY` (کامل از درگاه) | `MIXED` (تا جایی که کیف‌پول کافی است، باقی از درگاه).
- `gatewaySlug` برای `GATEWAY`/`MIXED` الزامی است؛ برای `WALLET` لازم نیست.
- `discountCode` اختیاری — همان منطق `POST /discount-codes/apply` اما این‌بار واقعاً مصرف می‌شود.

**رفتار بر اساس `paymentMethod`:**
| حالت | نتیجه |
|---|---|
| `WALLET` و موجودی کافی | سفارش فوراً `PROCESSING` (پرداخت‌شده) می‌شود |
| `MIXED` و موجودی کیف‌پول ≥ مبلغ کل | مثل بالا — کلش از کیف‌پول کسر می‌شود |
| `MIXED` با موجودی ناکافی، یا `GATEWAY` | سفارش `PENDING_PAYMENT` می‌ماند؛ بخش کیف‌پول (اگر بود) فوراً کسر می‌شود، باقی را با `POST /:id/payment/initiate` تکمیل کنید |

**Response 201** → `data`: جزئیات کامل سفارش (شکل `GET /:id`).

**خطاها:** `400` سبد خالی/کالای ناموجود/آدرس یا شرکت ارسال نامعتبر/موجودی
کیف‌پول کافی نیست، `404` آدرس پیدا نشد، `409` موجودی هم‌زمان توسط سفارش
دیگری مصرف شد (سبد را به‌روزرسانی کنید و دوباره تلاش کنید).

### `GET /:id` (جزئیات سفارش)
**Response 200** → `data`:
```json
{
  "id": "...", "orderNumber": "ORD-20260624-A1B2C9",
  "status": "PROCESSING", "paymentMethod": "WALLET", "paidAt": "...",
  "subtotal": 450000, "shippingCost": 30000, "discountAmount": 90000, "taxAmount": 0, "totalAmount": 390000,
  "shippingAddress": { "receiverName": "...", "fullAddress": "...", "...": "..." },
  "items": [{ "id": "...", "productName": "تیشرت مردانه", "variantAttributes": "رنگ: قرمز، سایز: L", "price": 225000, "quantity": 2, "discountAmount": 90000 }],
  "statusHistory": [{ "status": "PROCESSING", "note": null, "createdAt": "..." }],
  "shippingCompany": { "id": "...", "name": "..." },
  "address": { "...": "..." },
  "discountCode": { "id": "...", "code": "SUMMER20" },
  "transactions": [],
  "cancellation": null,
  "returns": []
}
```

### `POST /:id/cancel`
**Body:** `{ "reason": "توضیح کوتاه" }`
فقط روی سفارش‌های `PENDING_PAYMENT`/`PROCESSING` کار می‌کند؛ خودکار تایید
می‌شود (نیازی به بررسی ادمین نیست)، موجودی تنوع‌ها برمی‌گردد، و اگر پرداخت
شده بود به کیف‌پول بازگشت می‌خورد.
**خطاها:** `409` سفارش ارسال‌شده (باید مرجوعی بزنید) یا قبلاً لغو/مرجوع شده.

### `POST /:id/return`
**Body:** `{ "orderItemId": "اختیاری — اگر نباشد یعنی کل سفارش", "reason": "...", "imageMediaIds": ["media_id"] }`
فقط روی سفارش `DELIVERED` کار می‌کند؛ وضعیت `PENDING` می‌گیرد و **نیاز به
بررسی ادمین دارد** (برخلاف لغو). سفارش به `RETURN_REQUESTED` می‌رود.
**خطاها:** `409` سفارش هنوز تحویل نشده.

### `POST /:id/payment/initiate`
**Body:** `{ "gatewaySlug": "zarinpal" }` → `data`: `{ "redirectUrl": "..." }`
فقط وقتی سفارش `PENDING_PAYMENT` باشد و یک تراکنش در انتظار (از مرحله‌ی
ثبت سفارش) داشته باشد.

### `POST /:id/payment/verify`
**Body:** `{ "providerParams": {...} }` → موفق: سفارش به `PROCESSING` می‌رود
و `paidAt` ست می‌شود. **خطا:** `400` پرداخت ناموفق (قابل تلاش دوباره با initiate).

### ادمین/پشتیبانی
- `PUT /admin/:id/status` — Body: `{ "status": "SHIPPED", "note": "..." }` — هر تغییر در `OrderStatusHistory` ثبت می‌شود.
- `PUT /admin/returns/:returnId` — Body: `{ "status": "RECEIVED" | "REFUNDED" | "REJECTED" | "APPROVED", "refundAmount"?: 90000, "adminNote"?: "..." }`
  - `RECEIVED` → موجودی آیتم(های) مرجوعی برمی‌گردد.
  - `REFUNDED` → `refundAmount` الزامی، به کیف‌پول کاربر واریز می‌شود؛ اگر مرجوعی کل سفارش بود، سفارش `RETURNED` می‌شود.
  - `REJECTED` → سفارش به `DELIVERED` برمی‌گردد.

---

## ۱۵. رسانه (Media)
Base path: `/api/v1/media`

فایل‌ها فعلاً روی دیسک خودِ سرور ذخیره می‌شوند و از مسیر `/uploads/...`
(خارج از `/api/v1`) به‌صورت استاتیک قابل‌دسترسی هستند. `Media.url` در پاسخ‌ها
همیشه آدرس کامل و قابل‌استفاده مستقیم در `<img src>` است.

| Method | Path | Auth | توضیح |
|---|---|---|---|
| POST | `/` | هر کاربر لاگین‌کرده | آپلود یک فایل — `multipart/form-data`, field name: `file` (+ `alt` اختیاری) |
| POST | `/bulk` | هر کاربر لاگین‌کرده | آپلود چند فایل هم‌زمان — field name: `files` (حداکثر ۱۰ فایل) |
| GET | `/` | ADMIN/EDITOR | کتابخانه‌ی رسانه (صفحه‌بندی + فیلتر `type`/`uploadedById`) |
| GET | `/:id` | ADMIN/EDITOR | جزئیات یک فایل |
| DELETE | `/:id` | ADMIN/EDITOR | حذف (اگر در جایی استفاده شده، `409`) |

**فرمت‌های مجاز:** `image/jpeg`, `image/png`, `image/webp`, `image/gif`,
`application/pdf`. **حداکثر حجم:** پیش‌فرض ۵ مگابایت (با `MAX_FILE_SIZE_MB` در `.env` قابل تغییر).

### `POST /` (آپلود تکی)
درخواست باید `Content-Type: multipart/form-data` باشد:
```
file: <binary>
alt: "متن جای‌گزین تصویر (اختیاری)"
```
**Response 201** → `data`:
```json
{
  "id": "media_id",
  "url": "http://localhost:4000/uploads/2026/06/171999-abc123.jpg",
  "type": "IMAGE",
  "mimeType": "image/jpeg",
  "size": 245678,
  "alt": null,
  "uploadedById": "user_id",
  "createdAt": "..."
}
```
این `id` را در فیلدهایی مثل `mediaId` در محصول/دسته/برند/تیکت/کامنت و... استفاده کنید.

**خطاها:** `400` فایلی ارسال نشده / فرمت یا حجم مجاز نیست.

### `POST /bulk`
همان شکل، ولی چند فایل با field name تکراری `files` و `data` آرایه‌ای از همان شکل بالاست.

### `DELETE /:id`
قبل از حذف، استفاده‌ی فایل در همه‌جا (آواتار کاربر، تصویر محصول/تنوع، تصویر
دسته/برند/شرکت‌ارسال، بنر، پاپ‌آپ، پیوست تیکت/کامنت، تصویر مرجوعی) بررسی
می‌شود؛ اگر جایی استفاده شده باشد `409` برمی‌گردد (باید اول آن استفاده را حذف کنید).

---
