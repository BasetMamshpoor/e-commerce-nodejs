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
17. [نوتیفیکیشن (Notifications)](#۱۶-نوتیفیکیشن-notifications)
18. [نوتیفیکیشن ادمین (Admin Notifications)](#۱۷-نوتیفیکیشن-ادمین-admin-notifications)
19. [تیکتینگ (Tickets)](#۱۸-تیکتینگ-tickets)
20. [دیدگاه‌های تودرتو (Comments)](#۱۹-دیدگاه‌های-تودرتو-comments)
21. [بنر (Banners)](#۲۰-بنر-banners)
22. [پاپ‌آپ (Popups)](#۲۱-پاپ‌آپ-popups)
23. [استوری (Stories)](#۲۲-استوری-stories)
24. [خبرنامه (Newsletter)](#۲۳-خبرنامه-newsletter)
25. [جستجو (Search)](#۲۴-جستجو-search)
26. [صفحه اصلی (Landing Page)](#۲۵-صفحه-اصلی-landing-page)
27. [مدیریت کاربران - ادمین (Users Admin)](#۲۶-مدیریت-کاربران---ادمین-users-admin)
28. [امنیت - بلاک IP (Security)](#۲۷-امنیت---بلاک-ip-security)
29. [آنالیز (Analytics)](#۲۸-آنالیز-analytics)
30. [پروفایل کاربر (Users Me)](#۲۹-پروفایل-کاربر-users-me)
31. [تنظیمات سایت (Settings)](#۳۰-تنظیمات-سایت-settings)
32. [سئو (sitemap.xml / robots.txt)](#۳۱-سئو-sitemapxml--robotstxt)

---

## قراردادهای کلی

### Base URL
```
/api/v1
```
(مسیر `GET /health` بیرون از `/api/v1` و بدون نیاز به هیچ‌چیز همیشه در دسترس است)

### شناسه‌ها (IDs)
تمام شناسه‌های اصلی (Primary Key) از نوع **integer** با **Auto Increment** هستند.
شناسه‌ها در URL و Body همیشه عدد صحیح مثبت هستند (مثلاً `42` نه `"abc123"`).

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
مسیر **سبد خرید** برای کاربر مهمان (بدون ورود) هم کار می‌کند.
یک هدر مشترک استفاده می‌شود:
```
X-Guest-Token: <مقدار دلخواه شما>
```
- اگر این هدر را نفرستید، بک‌اند یک مقدار تازه می‌سازد و آن را در
  `data.guestToken` پاسخ برمی‌گرداند — آن را ذخیره (مثلاً localStorage) کنید
  و در درخواست‌های بعدی همان را بفرستید.
- بعد از ورود/ثبت‌نام کاربر، `POST /cart/merge` را با همین توکن بزنید تا
  سبد مهمان با سبد کاربر ادغام شود.

### احراز هویت اختیاری
برخی مسیرها (مثل جزئیات محصول و لیست کامنت‌ها) از `optionalAuthenticate`
استفاده می‌کنند — اگر توکن بفرستید `req.user` ست می‌شود (برای فیلدهایی مثل
`isWish` و `isLiked`)، اگر نفرستید مسیر همچنان کار می‌کند.

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

### رسانه (تصاویر، ویدئوها، فایل‌ها)
یک مدل متمرکز **Media** در دیتابیس وجود دارد که تمام فایل‌های آپلودشده را
مدیریت می‌کند. هر موجودیت (محصول، دسته، برند، بنر، پاپ‌آپ، استوری و ...) با
یک **mediaId** به Media ارجاع می‌دهد. فایل‌ها روی دیسک در مسیر `uploads/{entityType}/`
ذخیره می‌شوند و URL آن‌ها به‌صورت `{APP_BASE_URL}/uploads/.../file.jpg` در
دسترس است.

فیلد `url` در اشیاء تودرتوی `media` و همچنین فیلدهای flat مثل `imageUrl`/
`logoUrl`/`avatarUrl` در پاسخ API موجود است تا فرانت‌اند هرکدام را که خواست
استفاده کند.

**تغییر مهم:** دیگر فیلد `urlMobile` و `urlTablet` وجود ندارد — برای تصاویر
Responsive فرانت‌اند باید از CDN/image proxy استفاده کند. تصاویر فقط یک URL
اصلی دارند.

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
  "user": { "id": 1, "fullName": "...", "email": "...", "phone": null, "role": "CUSTOMER", "emailVerifiedAt": "...", "...": "..." },
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
  "imageMediaId": 1,
  "parentId": 5,
  "order": 0,
  "isActive": true,
  "metaTitle": "...", "metaDescription": "...", "canonicalUrl": "https://..."
}
```
`slug` اختیاری است — اگر نفرستید، خودکار از `name` ساخته می‌شود (و اگر
تکراری بود، `-2`، `-3` و ... اضافه می‌شود). `imageMediaId` شناسه‌ی Media است.

**خطاها:** `400` والد نامعتبر یا چرخه (والد جدید نمی‌تواند زیرمجموعه‌ی خودش
باشد)، `409` slug تکراری یا (در حذف) دسته زیرمجموعه دارد.

**اتصال ویژگی:** `POST /:id/attributes` با body `{ "attributeId": 3 }`.

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

**Body:**
```json
{ "name": "اپل", "slug": "apple", "description": "...", "logoMediaId": 1, "isActive": true, "metaTitle": "...", "metaDescription": "..." }
```
(فقط `name` الزامی است؛ `slug` خودکار از `name` ساخته می‌شود اگر نفرستید)
`logoMediaId` شناسه‌ی Media است.

---

## ۴. ویژگی (Attributes)
Base path: `/api/v1/attributes`

ویژگی‌ها به سه دسته تقسیم می‌شوند:
- **فیلتر (`isFilterable=true, isVariant=false`):** صرفاً برای فیلتر کردن محصولات.
- **نمایشی (`isDisplay=true`):** فقط در صفحه جزئیات محصول نمایش داده می‌شوند.
- **تنوع (`isVariant=true`):** در ساخت Variant استفاده می‌شوند (رنگ، سایز، حافظه و ...).

مدیریت فقط `ADMIN`/`EDITOR`.

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
{ "name": "رنگ", "slug": "color", "inputType": "COLOR", "isFilterable": true, "isVariant": true, "isDisplay": false }
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

هر محصول یک **Base Price** (حداقل قیمت) دارد. اگر محصول دارای Variant باشد،
قیمت نهایی هر Variant برابر است با **Base Price + Price Adjustment**.
تخفیف متعلق به **کل محصول** است (نه Variant) و روی قیمت نهایی تمام Variantها
اعمال می‌شود.

`minPrice`/`maxPrice`/`isInStock`/`avgRating`/`reviewCount` روی خود محصول
کش می‌شوند.

| Method | Path | Auth | توضیح |
|---|---|---|---|
| GET | `/filters` | ندارد | متادیتای فیلتر فروشگاه — `?categorySlug=` اختیاری |
| GET | `/admin` | ADMIN/EDITOR | لیست ادمین (همه‌ی وضعیت‌ها) + `status` |
| GET | `/admin/:id` | ADMIN/EDITOR | جزئیات کامل محصول (هر وضعیتی) |
| GET | `/` | ندارد | لیست فروشگاه (فقط `PUBLISHED`) با فیلتر/مرتب‌سازی/صفحه‌بندی |
| GET | `/by-id/:id` | اختیاری | جزئیات یک محصول منتشرشده با id (برای فرانت) |
| GET | `/:slug` | اختیاری | جزئیات یک محصول منتشرشده با slug (ثبت خودکار بازدید) |
| POST | `/` | ADMIN/EDITOR | ایجاد محصول (با تنوع‌ها و تصاویر) |
| PUT | `/:id` | ADMIN/EDITOR | ویرایش فیلدهای محصول + دسته‌بندی‌ها |
| DELETE | `/:id` | ADMIN/EDITOR | حذف (اگر در سفارشی استفاده شده، `409` — به‌جای حذف ARCHIVED کنید) |
| POST | `/:id/variants` | ADMIN/EDITOR | افزودن تنوع جدید |
| PUT | `/:id/variants/:variantId` | ADMIN/EDITOR | ویرایش تنوع |
| DELETE | `/:id/variants/:variantId` | ADMIN/EDITOR | حذف تنوع (باید حداقل ۱ تنوع باقی بماند؛ اگر سفارش دارد `409`) |

> **نکته:** تصویر مخصوص Variant وجود ندارد — تمام تصاویر متعلق به Product هستند.
> **نکته:** Endpoint `POST /:id/view` حذف شده است — بازدید به‌صورت خودکار در
> هنگام دریافت جزئیات محصول (`GET /:slug` و `GET /by-id/:id`) ثبت می‌شود.
> **نکته:** مدیریت تصاویر محصول (افزودن/حذف) از طریق `PUT /:id` انجام می‌شود؛
> endpoint های اختصاصی `POST /:id/images` و `DELETE /:id/images/:imageId` حذف شده‌اند.

### query پارامترهای `GET /` (فروشگاه) و `GET /admin`
| پارامتر | نوع | توضیح |
|---|---|---|
| `page`, `limit` | number | صفحه‌بندی |
| `categorySlug` | string | شامل زیرمجموعه‌های آن دسته هم می‌شود |
| `brandIds` | string | چند id با کاما جدا: `1,2` |
| `attributeValueIds` | string | چند id با کاما جدا — AND بین ویژگی‌های مختلف، OR بین مقادیر یک ویژگی |
| `minPrice`, `maxPrice` | number | بازه قیمت |
| `inStock` | boolean | فقط موجود |
| `hasDiscount` | boolean | فقط تخفیف‌دار |
| `isFeatured` | boolean | فقط ویژه |
| `search` | string | جست‌وجو در نام/توضیح کوتاه |
| `sort` | enum | `newest` (پیش‌فرض) \| `price_asc` \| `price_desc` \| `popular` \| `bestselling` \| `most_viewed` \| `most_popular` |
| `status` *(فقط admin)* | enum | `DRAFT` \| `PUBLISHED` \| `ARCHIVED` |

> `most_popular` بر اساس `avgRating` (میانگین امتیاز کاربران) مرتب‌سازی می‌کند.
> `bestselling` بر اساس `totalSold` (تعداد فروش واقعی از سفارش‌های تحویل‌شده) مرتب‌سازی می‌کند.
> `popular` و `most_viewed` بر اساس `viewCount` (تعداد بازدید) مرتب‌سازی می‌کنند.

### `POST /` (ایجاد محصول)

دو روش برای ارسال تصاویر وجود دارد:

**روش ۱ (توصیه‌شده) — multipart/form-data با آپلود مستقیم فایل:**
```json
// فیلدهای متنی:
name: "تیشرت مردانه"
brandId: "1"
shortDescription: "توضیح کوتاه"
description: "<p>HTML از تکست ادیتور</p>"
basePrice: "250000"
discountType: "PERCENT"
discountValue: "10"
status: "DRAFT"
isFeatured: "false"
categoryIds: "[1, 2]"

// فیلدهای فایل:
images: [فایل‌های تصویر]  // (آرایه، حداکثر ۲۰ فایل)
```

**روش ۲ — JSON (فقط با mediaId از قبل آپلود شده):**
```json
{
  "name": "تیشرت مردانه",
  "brandId": 1,
  "shortDescription": "...",
  "description": "<p>HTML از تکست ادیتور</p>",
  "basePrice": 250000,
  "discountType": "PERCENT",
  "discountValue": 10,
  "status": "DRAFT",
  "isFeatured": false,
  "categoryIds": [1, 2],
  "images": [
    { "mediaId": 1, "order": 0, "isMain": true }
  ],
  "variants": [
    {
      "sku": "TSHIRT-RED-L",
      "priceAdjustment": 0,
      "stock": 20,
      "isDefault": true,
      "attributeValueIds": [1, 5]
    }
  ],
  "displayAttributes": [
    { "attributeId": 3, "value": "کشوری سازنده: ایران" }
  ]
}
```

- `basePrice`: حداقل قیمت محصول (تومان).
- `discountType`/`discountValue`: تخفیف کل محصول (`PERCENT` یا `FIXED`) — روی تمام Variantها اعمال می‌شود.
- `variants[].priceAdjustment`: مقدار افزایش قیمت نسبت به Base Price (می‌تواند ۰ باشد).
- `variants[].attributeValueIds`: فقط Attributeهای نوع تنوع (Variant Attributes).
- `images`: در روش JSON آرایه‌ای از `{ mediaId, order, isMain }` (mediaId از قبل آپلود شده). در روش multipart فایل‌ها مستقیم آپلود می‌شوند و mediaId به‌طور خودکار ایجاد می‌گردد.
- `displayAttributes`: Attributeهای نمایشی (فقط در صفحه جزئیات نمایش داده می‌شوند).

**خطاها:** `400` دسته/برند نامعتبر یا ترکیب ویژگی تکراری بین تنوع‌ها، `409` SKU تکراری یا slug تکراری.

### `PUT /:id` (ویرایش محصول — شامل مدیریت تصاویر)
فیلدهای سطح‌بالا + `categoryIds` (که کامل جای‌گزین می‌شود). برای تنوع‌ها از
endpoint های مخصوص خودشان استفاده کنید.

**مدیریت تصاویر از طریق همین endpoint:**
- `deletedImages`: آرایه‌ای از `ProductImage.id` برای حذف تصاویر موجود
- فایل‌های جدید: از طریق `multipart/form-data` با field name `images` ارسال می‌شوند
- تصاویر آپلودشده به‌طور خودکار به محصول متصل می‌شوند

**نمونه (JSON-only — بدون تغییر تصویر):**
```json
{
  "name": "تیشرت مردانه ویرایش‌شده",
  "brandId": 1,
  "categoryIds": [1, 2],
  "deletedImages": [3, 5]
}
```

**نمونه (multipart — همراه با فایل):**
- Field `body`: `{ "name": "تیشرت جدید", "categoryIds": [1,2] }` (JSON string)
- Field `images`: فایل‌های تصویر (آرایه)
- فایل‌ها ابتدا به Media آپلود می‌شوند و سپس به محصول متصل می‌گردند

> **تغییر مهم:** endpoint های `POST /:id/images` و `DELETE /:id/images/:imageId`
> حذف شده‌اند. تمام عملیات تصاویر از طریق `PUT /:id` انجام می‌شود.

### `POST /:id/variants` و `PUT /:id/variants/:variantId`
```json
{
  "sku": "TSHIRT-BLUE-M",
  "priceAdjustment": 5000,
  "stock": 15,
  "isDefault": false,
  "isActive": true,
  "attributeValueIds": [2, 6]
}
```

### پاسخ جزئیات محصول (`GET /:slug` یا `GET /by-id/:id`)
شامل فیلدهای زیر است:
- اطلاعات کامل محصول (brand, images, categories به‌صورت flat, variants با attributeValues)
- `isWish`: اگر کاربر لاگین‌کرده باشد، نشان می‌دهد آیا محصول در Wishlist اوست.
- `relatedProducts`: محصولات مرتبط.
- `alsoBoughtProducts`: محصولاتی که همراه این محصول بیشتر خریداری شده‌اند.
- `relatedBlogPosts`: وبلاگ‌های مرتبط.
- `displayAttributeValues`: Attributeهای نمایشی.
- `avgRating` / `reviewCount`: میانگین امتیاز و تعداد نظرات.
- `totalSold`: تعداد کل فروش واقعی (از سفارش‌های تحویل‌شده).
- بازدید (viewCount) به‌صورت خودکار با هر درخواست GET افزایش می‌یابد.

---

## ۶. سبد خرید (Cart)
Base path: `/api/v1/cart` — همه‌ی مسیرها برای **مهمان و عضو** کار می‌کنند مگر
جایی که خلافش گفته شده (نگاه کنید به «هدر مهمان» در قراردادهای کلی).

شناسه یکتای هر آیتم سبد = **CartItem.id** (عدد صحیح). فرانت باید از این شناسه
برای PATCH/DELETE استفاده کند.

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
  "id": 1,
  "itemCount": 2,
  "subtotal": 500000,
  "totalDiscount": 50000,
  "total": 450000,
  "items": [
    {
      "id": 1,
      "variantId": 5,
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
قیمت نهایی هر آیتم = `Base Price + Price Adjustment`، سپس تخفیف کل محصول
اعمال می‌شود. `total` = جمع `unitPrice×quantity` (بعد از تخفیف محصول، **قبل از
کد تخفیف**؛ کد تخفیف در مرحله‌ی ثبت سفارش اعمال می‌شود).

### `POST /items`
**Body:** `{ "variantId": 5, "quantity": 1 }`
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
| GET | `/?page=&limit=` | لیست صفحه‌بندی‌شده — فقط تصویر اصلی (`isMain=true`) برگردانده می‌شود |
| POST | `/` | افزودن — Body: `{ "productId": 1 }` |
| DELETE | `/:productId` | حذف |

افزودن idempotent است (افزودن دوباره‌ی همان محصول خطا نمی‌دهد).
در پاسخ `GET /`، تصویر اصلی محصول (`isMain=true`) برگردانده می‌شود.

---

## ۸. مقایسه (Comparison)
Base path: `/api/v1/comparison`

> **تغییر مهم:** Endpointهای افزودن، حذف و خالی کردن حذف شده‌اند.
> فقط یک Endpoint کافی است.

Frontend باید حداقل ۱ و حداکثر ۴ شناسه محصول را از طریق Query ارسال کند.

| Method | Path | Auth | توضیح |
|---|---|---|---|
| GET | `/?productIds=1,2,3` | ندارد | اطلاعات کامل همان محصولات برای مقایسه |

**مثال:** `GET /comparison?productIds=1,5,12`

**Response 200** → `data`:
```json
{
  "items": [
    { "product": { "id": 1, "name": "...", "brand": {...}, "categories": [...], "images": [...], "variants": [...] } },
    { "product": { "id": 5, "name": "...", ... } }
  ]
}
```
عملیات مقایسه توسط Frontend انجام می‌شود. Backend فقط اطلاعات کامل محصولات را برمی‌گرداند.
**خطاها:** `400` اگر کمتر از ۱ یا بیشتر از ۴ محصول ارسال شود.

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
  "discountCodeId": 1,
  "code": "SUMMER20",
  "type": "PERCENT",
  "value": 20,
  "cartTotal": 450000,
  "eligibleSubtotal": 450000,
  "discountAmount": 90000,
  "payableTotal": 360000,
  "eligibleVariantIds": [5, 8],
  "guestToken": "فقط اگر مهمان بودید و هنوز توکن نداشتید"
}
```

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
- `productIds`/`categoryIds`/`userIds` اعداد صحیح هستند.
- `code` همیشه با حروف بزرگ ذخیره می‌شود (case-insensitive در عمل).

**خطاها:** `409` کد تکراری، `400` محصول/دسته/کاربر نامعتبر یا `expiresAt <= startsAt`.

---

## ۱۰. آدرس‌ها (Addresses)
Base path: `/api/v1/addresses` — **همه‌ی مسیرها نیاز به ورود دارند**.

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
اولین آدرس کاربر خودکار `isDefault=true` می‌شود.

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

**Body:**
```json
{ "name": "پست پیشتاز", "logoMediaId": 1, "description": "...", "baseCost": 30000, "estimatedDaysMin": 2, "estimatedDaysMax": 5, "isActive": true }
```
`baseCost` هزینه‌ی ثابت ارسال (تومان) که مستقیم به `Order.shippingCost` می‌رود.
`logoMediaId` شناسه‌ی Media است.

---

## ۱۲. درگاه‌های پرداخت (Payment Gateways)
Base path: `/api/v1/payment-gateways`

| Method | Path | Auth | توضیح |
|---|---|---|---|
| GET | `/` | ندارد | لیست فعال‌ها (برای نمایش گزینه‌های پرداخت) |
| POST | `/` | ADMIN | ایجاد |
| PUT | `/:id` | ADMIN | ویرایش |
| DELETE | `/:id` | ADMIN | حذف |

**Body:** `{ name, slug, isActive?, config? }` — `config` یک شیء آزاد JSON.

---

## ۱۳. کیف پول (Wallet)
Base path: `/api/v1/wallet` — **همه‌ی مسیرها نیاز به ورود دارند**.

| Method | Path | Auth | توضیح |
|---|---|---|---|
| GET | `/?page=&limit=` | کاربر | موجودی + تاریخچه‌ی تراکنش‌ها (صفحه‌بندی‌شده) |
| POST | `/charge/initiate` | کاربر | شروع شارژ از درگاه |
| POST | `/charge/:transactionId/verify` | کاربر | تایید بازگشت از درگاه و افزایش موجودی |
| POST | `/withdrawals` | کاربر | ثبت درخواست برداشت از کیف پول |
| GET | `/withdrawals` | کاربر | لیست درخواست‌های برداشت من |
| GET | `/admin/withdrawals` | ADMIN | لیست همه‌ی درخواست‌های برداشت |
| PUT | `/admin/withdrawals/:id` | ADMIN | بررسی/تایید/رد درخواست برداشت |

### `GET /`
```json
{
  "balance": 150000,
  "transactions": [
    { "id": 1, "type": "DEPOSIT", "amount": 100000, "description": "...", "orderId": null, "createdAt": "..." }
  ],
  "meta": { "total": 5, "page": 1, "limit": 20, "totalPages": 1 }
}
```
`type`: `DEPOSIT` | `WITHDRAW` | `PURCHASE` | `REFUND` | `ADMIN_ADJUST` | `WITHDRAWAL_REQUEST`.

### `POST /charge/initiate`
**Body:** `{ "amount": 100000, "gatewaySlug": "zarinpal" }`
**Response 200** → `data`: `{ "transactionId": 1, "redirectUrl": "https://..." }`

### `POST /charge/:transactionId/verify`
**Body:** `{ "providerParams": { "Authority": "...", "Status": "OK" } }`
**Response 200** → `data`: `{ "alreadyProcessed": false, "balance": 250000 }`

### `POST /withdrawals` (درخواست برداشت)
**Body:** `{ "amount": 50000, "description": "برداشت به حساب بانکی" }`
**Response 201** → `data`: `{ "id": 1, "userId": 1, "amount": 50000, "status": "PENDING", "createdAt": "..." }`
درخواست‌های برداشت باید توسط ادمین بررسی و تایید/رد شوند.

### `PUT /admin/withdrawals/:id` *(ADMIN)*
**Body:** `{ "status": "APPROVED" | "REJECTED", "adminNote": "..." }`
- `APPROVED` → مبلغ از کیف پول کاربر کسر می‌شود.
- `REJECTED` → تغییر وضعیت به رد شده.

---

## ۱۴. سفارش‌ها (Orders)
Base path: `/api/v1/orders` — **همه‌ی مسیرها نیاز به ورود دارند**.

> **مهم:** ثبت نهایی سفارش (`POST /`) فقط برای کاربران با نقش `CUSTOMER` مجاز است.

| Method | Path | Auth | توضیح |
|---|---|---|---|
| GET | `/admin` | ADMIN/SUPPORT | لیست همه‌ی سفارش‌ها (فیلتر `status`, `userId`, `search`) |
| GET | `/admin/returns` | ADMIN/SUPPORT | لیست درخواست‌های مرجوعی (فیلتر `status`, `orderId`, `userId`) |
| GET | `/admin/returns/:returnId` | ADMIN/SUPPORT | جزئیات کامل یک مرجوعی (شامل سفارش، آیتم‌ها، یادداشت مشتری) |
| PUT | `/admin/returns/:returnId` | ADMIN/SUPPORT | بررسی/تایید/رد مرجوعی |
| GET | `/admin/:id` | ADMIN/SUPPORT | جزئیات هر سفارشی (بدون محدودیت مالکیت) |
| PUT | `/admin/:id/status` | ADMIN/SUPPORT | تغییر دستی وضعیت سفارش |
| GET | `/` | کاربر | لیست سفارش‌های من |
| POST | `/` | **CUSTOMER** | **ثبت سفارش از سبد خرید فعلی (checkout)** |
| GET | `/:id` | کاربر (مالک) | جزئیات یک سفارش من |
| POST | `/:id/cancel` | کاربر (مالک) | لغو خودکار (فقط قبل از ارسال) |
| POST | `/:id/return` | کاربر (مالک) | درخواست مرجوعی (فقط بعد از تحویل) |
| POST | `/:id/payment/initiate` | کاربر (مالک) | شروع پرداخت از درگاه |
| POST | `/:id/payment/verify` | کاربر (مالک) | تایید بازگشت از درگاه |

### `POST /` (ثبت سفارش)
**Body:**
```json
{
  "addressId": 1,
  "shippingCompanyId": 2,
  "paymentMethod": "WALLET",
  "gatewaySlug": "zarinpal",
  "discountCode": "SUMMER20"
}
```
- `paymentMethod`: `WALLET` | `GATEWAY` | `MIXED`.
- فقط کاربران با نقش `CUSTOMER` می‌توانند سفارش ثبت کنند (`403` برای نقش‌های دیگر).
- پس از ثبت موفق سفارش، نوتیفیکیشن برای کاربر و ادمین ارسال می‌شود.
- در صورت وجود شماره موبایل، پیامک ارسال می‌شود؛ در غیر این صورت ایمیل.

**Response 201** → `data`: جزئیات کامل سفارش.

### `GET /:id` (جزئیات سفارش)
```json
{
  "id": 1, "orderNumber": "ORD-20260624-A1B2C9",
  "status": "PROCESSING", "paymentMethod": "WALLET", "paidAt": "...",
  "subtotal": 450000, "shippingCost": 30000, "discountAmount": 90000, "taxAmount": 0, "totalAmount": 390000,
  "trackingCode": "1234567890",
  "packageNumber": "PKG-001",
  "shippingAddress": { "receiverName": "...", "fullAddress": "...", "...": "..." },
  "items": [{ "id": 1, "productName": "تیشرت مردانه", "variantAttributes": "رنگ: قرمز، سایز: L", "price": 225000, "quantity": 2, "discountAmount": 90000 }],
  "statusHistory": [{ "status": "PROCESSING", "note": null, "createdAt": "..." }],
  "shippingCompany": { "id": 1, "name": "..." },
  "address": { "...": "..." },
  "discountCode": { "id": 1, "code": "SUMMER20" },
  "transactions": [],
  "cancellation": null,
  "returns": []
}
```

### `POST /:id/return`
**Body:** `{ "orderItemId": 3, "reason": "...", "imageMediaIds": [1, 2] }`
فقط روی سفارش `DELIVERED`. `imageMediaIds` آرایه‌ای از شناسه‌های Media است.

### `PUT /admin/:id/status`
**Body:**
```json
{ "status": "SHIPPED", "note": "...", "trackingCode": "1234567890", "packageNumber": "PKG-001" }
```
`trackingCode` و `packageNumber` اختیاری هستند و برای ثبت کد مرسوله و شماره بسته استفاده می‌شوند.

### `GET /admin/returns/:returnId` (جزئیات مرجوعی)
تمام جزئیات مرجوعی شامل: اطلاعات کامل سفارش، آیتم‌های سفارش، یادداشت مشتری،
اطلاعات مرجوعی، تصاویر مرجوعی و سایر جزئیات مرتبط را برمی‌گرداند.
همچنین مبلغ پرداخت‌شده (totalAmount سفارش) در لیست مرجوعی نمایش داده می‌شود.

---

## ۱۵. رسانه (Media)
Base path: `/api/v1/media`

مدل متمرکز **Media** تمام فایل‌های آپلودشده را مدیریت می‌کند. فایل‌ها روی دیسک
در پوشه‌های تفکیک‌شده بر اساس `entityType` ذخیره می‌شوند. هر موجودیت (محصول،
دسته، برند و ...) از طریق `mediaId` به Media ارجاع می‌دهد.

| Method | Path | Auth | توضیح |
|---|---|---|---|
| POST | `/` | ADMIN/EDITOR | آپلود یک فایل — `multipart/form-data`, field name: `file` |
| POST | `/bulk` | ADMIN/EDITOR | آپلود چند فایل هم‌زمان — field name: `files` (حداکثر ۲۰ فایل) |
| GET | `/` | ADMIN/EDITOR | لیست رسانه‌ها — فیلتر: `?type=&entityType=&search=` |
| GET | `/:id` | ADMIN/EDITOR | جزئیات یک رسانه |
| GET | `/:id/usage` | ADMIN/EDITOR | محل‌های استفاده از این رسانه (در کدام موجودیت‌ها استفاده شده) |
| GET | `/:id/download` | ADMIN/EDITOR | دانلود فایل با Content-Type و Content-Disposition مناسب |
| DELETE | `/:id` | ADMIN/EDITOR | حذف از دیسک و دیتابیس — اگر در جایی استفاده شده باشد `409` |

### `GET /` (لیست ادمین)
پارامترهای query: `page`, `limit`, `type` (IMAGE/VIDEO/DOCUMENT/OTHER),
`entityType` (products/categories/brands/...), `search` (در fileName).

### `GET /:id/usage`
محل‌های استفاده از رسانه را به‌صورت تفکیک‌شده برمی‌گرداند:
```json
{
  "usage": [
    { "entityType": "products", "entityId": 1, "entityName": "تیشرت مردانه" },
    { "entityType": "categories", "entityId": 5, "entityName": "موبایل" }
  ]
}
```

### `POST /` (آپلود تکی)
**Request:** `multipart/form-data` با field name `file`.
**Response 201** → `data`:
```json
{
  "id": 1,
  "fileName": "171999-abc123.jpg",
  "originalName": "photo.jpg",
  "url": "http://localhost:4000/uploads/products/2026/06/171999-abc123.jpg",
  "mimeType": "image/jpeg",
  "size": 245678,
  "type": "IMAGE",
  "entityType": "products"
}
```

### `POST /bulk` (آپلود گروهی)
**Request:** `multipart/form-data` با field name `files` (حداکثر ۲۰ فایل).
**Response 201** → `data`: آرایه‌ای از اشیاء Media مثل بالا.

### `DELETE /:id`
اگر رسانه در هیچ‌کدام از موجودیت‌های زیر استفاده نشده باشد، از دیسک و دیتابیس
حذف می‌شود: محصولات (تصاویر)، دسته‌ها، برندها، بنرها، پاپ‌آپ‌ها، استوری‌ها,
وبلاگ، تیکت‌ها، کامنت‌ها، مرجوعی‌ها، شرکت‌های ارسال.
در صورت استفاده `409` برگردانده می‌شود.

---

## ۱۶. نوتیفیکیشن (Notifications)
Base path: `/api/v1/notifications` — **همه‌ی مسیرها نیاز به ورود دارند**.

| Method | Path | Auth | توضیح |
|---|---|---|---|
| GET | `/?page=&limit=&isRead=` | کاربر | لیست نوتیفیکیشن‌های من |
| GET | `/unread-count` | کاربر | تعداد نخوانده |
| PATCH | `/read-all` | کاربر | همه را خوانده‌شده علامت بزن |
| PATCH | `/:id/read` | کاربر | یکی را خوانده‌شده علامت بزن |
| DELETE | `/:id` | کاربر | حذف یک نوتیفیکیشن |
| POST | `/admin/broadcast` | ADMIN/EDITOR | پخش همگانی/گروهی |

`type`: `ORDER` | `SYSTEM` | `TICKET` | `PROMOTION` | `WALLET` | `COMMENT`.

### `POST /admin/broadcast`
```json
{
  "userIds": [1, 2],
  "type": "PROMOTION",
  "title": "جشنواره تابستانه",
  "message": "تا ۵۰٪ تخفیف!",
  "link": "/products?hasDiscount=true"
}
```
اگر `userIds` نفرستید، برای **همه‌ی کاربران** ارسال می‌شود.

---

## ۱۷. نوتیفیکیشن ادمین (Admin Notifications)
Base path: `/api/v1/admin/notifications` — **همه‌ی مسیرها فقط ADMIN/SUPPORT/EDITOR**.

سیستم اعلان برای ادمین تا رویدادهای مهم (سفارش جدید، درخواست مرجوعی، درخواست
برداشت کیف پول و ...) را نمایش دهد.

| Method | Path | توضیح |
|---|---|---|
| GET | `/?page=&limit=&isRead=` | لیست نوتیفیکیشن‌های ادمین |
| GET | `/unread-count` | تعداد نخوانده |
| PUT | `/:id/read` | خوانده‌شده علامت بزن |
| PUT | `/read-all` | همه را خوانده‌شده علامت بزن |

نوتیفیکیشن‌های ادمین به‌صورت خودکار توسط سیستم ایجاد می‌شوند (مثلاً بعد از
ثبت سفارش جدید، درخواست مرجوعی، درخواست برداشت کیف پول).

---

## ۱۸. تیکتینگ (Tickets)
Base path: `/api/v1/tickets` — **همه‌ی مسیرها نیاز به ورود دارند**.

> **بستن خودکار:** تیکت‌هایی که ۵ روز از آخرین پاسخ پشتیبانی آن‌ها گذشته باشد،
> به‌صورت خودکار بسته می‌شوند.

| Method | Path | Auth | توضیح |
|---|---|---|---|
| GET | `/departments` | هر کاربر لاگین‌کرده | لیست بخش‌های پشتیبانی |
| POST | `/departments` | ADMIN | ایجاد بخش |
| PUT | `/departments/:id` | ADMIN | ویرایش بخش |
| DELETE | `/departments/:id` | ADMIN | حذف (اگر تیکت دارد، `409`) |
| GET | `/?status=` | کاربر | لیست تیکت‌های من |
| POST | `/` | کاربر | ایجاد تیکت جدید + پیام اول |
| GET | `/:id` | کاربر (مالک) | جزئیات تیکت من + پیام‌ها |
| POST | `/:id/messages` | کاربر (مالک) | افزودن پیام به تیکت من |
| GET | `/admin?status=&departmentId=&priority=&search=&userId=` | ADMIN/SUPPORT | لیست همه‌ی تیکت‌ها |
| GET | `/admin/:id` | ADMIN/SUPPORT | جزئیات هر تیکتی |
| PUT | `/admin/:id` | ADMIN/SUPPORT | تغییر `status`/`priority`/`departmentId` |
| POST | `/admin/:id/messages` | ADMIN/SUPPORT | پاسخ پشتیبانی |

**فیلترهای ادمین:** `status`, `departmentId`, `priority`, `search` (در subject یا
شماره تیکت)، `userId`.

### `POST /` (ایجاد تیکت)
```json
{
  "subject": "مشکل در پرداخت سفارش",
  "departmentId": 1,
  "priority": "NORMAL",
  "orderId": 5,
  "message": "سلام، سفارشم پرداخت شد ولی...",
  "attachmentMediaIds": [1, 2]
}
```

> **آپلود فایل هم‌زمان:** می‌توانید فایل‌ها را به‌صورت `multipart/form-data` با
> field name `attachments` ارسال کنید. فایل‌ها ابتدا به Media آپلود می‌شوند و
> شناسه آن‌ها به `attachmentMediaIds` اضافه می‌گردد. هم فایل و هم `message` و
> سایر فیلدها در یک درخواست ارسال می‌شوند.

### `POST /:id/messages`
```json
{ "message": "...", "attachmentMediaIds": [3] }
```
`attachmentMediaIds` آرایه‌ای از شناسه‌های Media است. مانند ایجاد تیکت، می‌توانید
فایل‌ها را به‌صورت multipart با field name `attachments` ارسال کنید.

### پاسخ `GET /:id` و `GET /admin/:id` (جزئیات تیکت)
پیام‌های تیکت شامل فیلد `attachments` با جزئیات کامل فایل هستند:
```json
{
  "messages": [
    {
      "id": 1,
      "message": "...",
      "senderType": "USER",
      "createdAt": "...",
      "attachments": [
        {
          "id": 1,
          "mediaId": 1,
          "media": {
            "id": 1,
            "url": "http://localhost:4000/uploads/tickets/.../photo.jpg",
            "mimeType": "image/jpeg",
            "originalName": "photo.jpg",
            "size": 245678
          }
        }
      ]
    }
  ]
}
```

---

## ۱۹. دیدگاه‌های تودرتو (Comments)
Base path: `/api/v1/comments`

دیدگاه‌های جدید با وضعیت `PENDING` ثبت می‌شوند و فقط بعد از تایید
ادمین/ادیتور در لیست عمومی نمایش داده می‌شوند.

> **نکته:** نمایش کامنت‌ها برای کاربر و ادمین به‌صورت درختی (Tree) است.
> فیلد `isLiked` براساس Token کاربر و با استفاده از `optionalAuthenticate` برگردانده می‌شود.
> فیلدهای `authorId` و `authorName` در تمام Responseهای کامنت وجود دارند.
> امتیاز (rating) فقط روی کامنت‌های اصلی (سطح اول) معنا دارد — پاسخ‌ها rating ندارند.

| Method | Path | Auth | توضیح |
|---|---|---|---|
| GET | `/product/:productId?page=&limit=` | اختیاری | دیدگاه‌های تاییدشده‌ی یک محصول، به‌صورت درختی + `isLiked` + `authorName` |
| POST | `/product/:productId` | کاربر | ثبت دیدگاه/پاسخ جدید |
| GET | `/blog/:postId?page=&limit=` | اختیاری | دیدگاه‌های تاییدشده‌ی یک پست وبلاگ |
| POST | `/blog/:postId` | کاربر | ثبت دیدگاه روی پست وبلاگ |
| PUT | `/:id` | کاربر (مالک) | ویرایش متن (دوباره می‌رود در صف بررسی) |
| DELETE | `/:id` | کاربر (مالک) یا ADMIN/EDITOR/SUPPORT | حذف (اگر پاسخ دارد، `409`) |
| POST | `/:id/like` | کاربر | لایک/آن‌لایک (toggle) |
| GET | `/admin?status=&commentableType=&isReviewed=&productSearch=&search=` | ADMIN/EDITOR | لیست همه‌ی دیدگاه‌ها |
| PUT | `/admin/:id` | ADMIN/EDITOR | تایید/رد — Body: `{ "status": "APPROVED" }` |

**فیلترهای ادمین:**
- `status`: `PENDING` / `APPROVED` / `REJECTED`
- `commentableType`: `PRODUCT` / `BLOG_POST`
- `isReviewed`: `true` (status غیر از PENDING) / `false` (فقط PENDING)
- `productSearch`: جستجو بر اساس نام محصول (نوع کامنت را خودکار به PRODUCT تنظیم می‌کند)
- `search`: جستجو در متن دیدگاه

> وقتی `moderateComment` یک کامنت محصول را تایید یا رد می‌کند، `avgRating` و
> `reviewCount` محصول مربوطه به‌صورت خودکار بازمحاسبه می‌شود.

### `GET /product/:productId`
```json
{
  "items": [
    {
      "id": 1, "content": "کیفیت عالی بود", "rating": 5, "createdAt": "...",
      "authorId": 10, "authorName": "علی رضایی",
      "likeCount": 3, "isLiked": false,
      "replies": [
        { "id": 2, "content": "موافقم!", "rating": null, "likeCount": 0, "isLiked": true, "authorName": "سارا", "replies": [] }
      ]
    }
  ],
  "meta": { "total": 12, "page": 1, "limit": 20, "totalPages": 1 },
  "ratingSummary": { "average": 4.6, "count": 8 }
}
```

### `POST /product/:productId`
می‌توانید فایل‌های ضمیمه را به‌صورت multipart/form-data با field name `attachments`
ارسال کنید. فیلدهای متنی (`content`, `parentId`, `rating`) همزمان ارسال می‌شوند.
```json
// اگر فایلی نیست — درخواست JSON معمولی:
{ "content": "...", "parentId": 1, "rating": 5 }
```
`parentId` اختیاری (اگر باشد یعنی پاسخ است). `rating` فقط برای دیدگاه اصلی.

---

## ۲۰. بنر (Banners)
Base path: `/api/v1/banners`

| Method | Path | Auth | توضیح |
|---|---|---|---|
| GET | `/?position=` | ندارد | بنرهای فعال و در بازه‌ی زمانی فعلی |
| GET | `/admin` | ADMIN/EDITOR | همه‌ی بنرها |
| POST | `/` | ADMIN/EDITOR | ایجاد |
| PUT | `/:id` | ADMIN/EDITOR | ویرایش |
| DELETE | `/:id` | ADMIN/EDITOR | حذف |

**Body:**
```json
{
  "title": "جشنواره تابستانه",
  "mediaId": 1,
  "link": "/products?hasDiscount=true",
  "position": "HOME_MAIN",
  "order": 0,
  "isActive": true,
  "startsAt": "2026-06-01T00:00:00Z",
  "endsAt": "2026-06-30T23:59:59Z"
}
```
`position`: `HOME_MAIN` | `HOME_MIDDLE` | `CATEGORY_TOP` | `SIDEBAR`.
`mediaId` شناسه‌ی Media است.

---

## ۲۱. پاپ‌آپ (Popups)
Base path: `/api/v1/popups`

| Method | Path | Auth | توضیح |
|---|---|---|---|
| GET | `/` | ندارد | پاپ‌آپ‌(های) فعال فعلی |
| GET | `/admin` | ADMIN/EDITOR | همه‌ی پاپ‌آپ‌ها |
| POST | `/` | ADMIN/EDITOR | ایجاد |
| PUT | `/:id` | ADMIN/EDITOR | ویرایش |
| DELETE | `/:id` | ADMIN/EDITOR | حذف |

**Body:**
```json
{
  "title": "جشنواره تابستانه",
  "content": "تا ۵۰٪ تخفیف!",
  "mediaId": 1,
  "link": "/products?hasDiscount=true",
  "isActive": true,
  "startsAt": "2026-06-01T00:00:00Z",
  "endsAt": "2026-06-30T23:59:59Z",
  "showOncePerSession": true
}
```
`mediaId` شناسه‌ی Media است.

---

## ۲۲. استوری (Stories)
Base path: `/api/v1/stories`

| Method | Path | Auth | توضیح |
|---|---|---|---|
| GET | `/` | ندارد | استوری‌های فعال فعلی (با `nextId` و `prevId`) |
| GET | `/admin` | ADMIN/EDITOR | لیست همه‌ی استوری‌ها |
| POST | `/` | ADMIN/EDITOR | ایجاد |
| PUT | `/:id` | ADMIN/EDITOR | ویرایش |
| DELETE | `/:id` | ADMIN/EDITOR | حذف |

هر Story شامل فیلدهای: `title`, `coverImage` (با Media), `video` (با Media,
اختیاری), `expiresAt`, `nextId`, `prevId`, و محصولات مرتبط.

**Body ایجاد:**
```json
{
  "title": "استوری تابستانه",
  "coverImageMediaId": 1,
  "videoMediaId": 2,
  "expiresAt": "2026-07-30T00:00:00Z",
  "order": 0,
  "productIds": [1, 5, 12]
}
```

---

## ۲۳. خبرنامه (Newsletter)
Base path: `/api/v1/newsletter`

| Method | Path | Auth | توضیح |
|---|---|---|---|
| POST | `/subscribe` | ندارد | عضویت در خبرنامه |
| POST | `/unsubscribe` | ندارد | لغو عضویت |
| GET | `/admin/subscribers` | ADMIN | لیست مشترکین |

**Body subscribe/unsubscribe:** `{ "email": "user@example.com" }`

---

## ۲۴. جستجو (Search)
Base path: `/api/v1/search`

سه نوع جستجو در دسترس است:

### ۲۴.۱. جستجوی سراسری (Global Search)
| Method | Path | Auth | توضیح |
|---|---|---|---|
| GET | `/?q=` | ندارد | جستجو در محصولات، وبلاگ‌ها، دسته‌ها و برندها |

**مثال:** `GET /search?q=تیشرت`

**Response 200** → `data`:
```json
{
  "products": [{ "id": 1, "name": "...", "slug": "...", "minPrice": 250000, "maxPrice": 300000 }],
  "blogPosts": [{ "id": 1, "title": "...", "slug": "...", "coverImageUrl": "..." }],
  "categories": [{ "id": 1, "name": "...", "slug": "..." }],
  "brands": [{ "id": 1, "name": "...", "slug": "..." }]
}
```

### ۲۴.۲. جستجوی سریع (Quick Search / Autocomplete)
| Method | Path | Auth | توضیح |
|---|---|---|---|
| GET | `/quick?q=` | ندارد | پیشنهادات سریع برای autocomplete (نتیجه محدود به ۵ مورد از هر نوع) |

**مثال:** `GET /search/quick?q=تیشرت`

**Response 200** → `data`: آرایه‌ای تخت از نتایج
```json
[
  { "type": "product", "id": 1, "title": "تیشرت مردانه", "slug": "tshirt-mardane" },
  { "type": "category", "id": 5, "title": "تیشرت", "slug": "tshirt" },
  { "type": "blog_post", "id": 3, "title": "راهنمای خرید تیشرت", "slug": "tshirt-buying-guide" }
]
```

### ۲۴.۳. جستجوی اصلی (Main Search)
| Method | Path | Auth | توضیح |
|---|---|---|---|
| GET | `/main?q=&sort=&minPrice=&maxPrice=&brandIds=&categoryIds=&inStock=&hasDiscount=` | ندارد | جستجوی محصولات با فیلترهای داینامیک و صفحه‌بندی |

| پارامتر | نوع | توضیح |
|---|---|---|
| `q` | string (required) | عبارت جستجو (حداقل ۲ کاراکتر) |
| `page`, `limit` | number | صفحه‌بندی |
| `sort` | enum | `relevance` (پیش‌فرض) \| `price_asc` \| `price_desc` \| `newest` \| `most_popular` \| `bestselling` |
| `minPrice`, `maxPrice` | number | فیلتر بازه قیمت |
| `brandIds` | string | چند id با کاما جدا |
| `categoryIds` | string | چند id با کاما جدا |
| `inStock` | boolean | فقط محصولات موجود |
| `hasDiscount` | boolean | فقط محصولات تخفیف‌دار |

**Response 200** → `data`:
```json
{
  "items": [{ "id": 1, "name": "...", "...": "..." }],
  "filters": {
    "brands": [{ "id": 1, "name": "اپل", "slug": "apple", "logoUrl": "..." }],
    "priceRange": { "min": 100000, "max": 50000000 },
    "hasDiscount": true,
    "inStock": true
  },
  "meta": { "total": 42, "page": 1, "limit": 20, "totalPages": 3 }
}
```

فیلتر `filters` بر اساس نتایج فعلی ساخته می‌شود — فقط برندها و محدوده قیمتی که
در نتایج جستجو وجود دارند نمایش داده می‌شوند.

---
## وبلاگ (Blog)

Base path: `/api/v1/blog`

وبلاگ شامل پست‌ها و دسته‌بندی‌ها است. برخی مسیرها فقط برای نقش‌های
`ADMIN`/`EDITOR` قابل دسترسی‌اند.

| Method | Path | Auth | توضیح |
|---|---|---|---|
| GET | `/` | ندارد | لیست مقالات منتشرشده (فیلتر/صفحه‌بندی) |
| GET | `/:slug` | ندارد | جزئیات یک پست با slug |
| GET | `/categories` | ندارد | لیست دسته‌بندی‌های وبلاگ |
| POST | `/` | ADMIN/EDITOR | ایجاد پست — می‌تواند multipart برای coverImage باشد |
| PUT | `/:id` | ADMIN/EDITOR | ویرایش پست |
| DELETE | `/:id` | ADMIN/EDITOR | حذف پست |
| GET | `/admin` | ADMIN/EDITOR | لیست ادمین (فیلتر/صفحه‌بندی، همه وضعیت‌ها) |
| GET | `/admin/:id` | ADMIN/EDITOR | جزئیات پست برای ادمین |
| POST | `/categories` | ADMIN/EDITOR | ایجاد دسته‌بندی |
| PUT | `/categories/:id` | ADMIN/EDITOR | ویرایش دسته‌بندی |
| DELETE | `/categories/:id` | ADMIN/EDITOR | حذف دسته‌بندی |

نمونه: برای ارسال تصویر کاور همراه با فیلدهای متنی از `multipart/form-data` استفاده کنید و نام فیلد تصویر را `coverImage` بگذارید — سرور `coverImageUrl` و `coverImageMediaId` را تولید می‌کند.

---

## ۲۵. صفحه اصلی (Landing Page)
Base path: `/api/v1/landing`

تمام اطلاعات موردنیاز صفحه اصلی از این Endpoint دریافت می‌شوند.
خروجی به صورت یک آرایه‌ی `sections` است تا فرانت‌اند به‌راحتی بتواند بخش‌های
مختلف را به ترتیب دلخواه نمایش دهد.

| Method | Path | Auth | توضیح |
|---|---|---|---|
| GET | `/` | ندارد | تمام داده‌های صفحه اصلی |

**Response 200** → `data`:
```json
{
  "sections": [
    { "type": "banners", "data": [...] },
    { "type": "popups", "data": [...] },
    { "type": "stories", "data": [...] },
    { "type": "categories", "data": [...] },
    { "type": "featured_products", "label": "محصولات ویژه", "data": [...] },
    { "type": "latest_products", "label": "جدیدترین محصولات", "data": [...] },
    { "type": "top_rated_products", "label": "محصولات پرامتیاز", "data": [...] },
    { "type": "flash_sales", "label": "تخفیف‌های ویژه", "data": [...] },
    { "type": "latest_blog_posts", "label": "آخرین مقالات", "data": [...] },
    { "type": "popular_brands", "data": [...] }
  ],
  "settings": { "store_name": "...", "instagram_url": "...", ... }
}
```

بخش‌های موجود:
| type | توضیح |
|---|---|
| `banners` | بنرهای فعال (اسلایدر و ...) |
| `popups` | پاپ‌آپ‌های فعال |
| `stories` | استوری‌های فعال با `nextId`/`prevId` |
| `categories` | دسته‌بندی‌های سطح اول |
| `featured_products` | محصولات ویژه (isFeatured) |
| `latest_products` | جدیدترین محصولات |
| `top_rated_products` | پرمیامتیازترین محصولات (بر اساس avgRating) |
| `flash_sales` | محصولات تخفیف‌دار |
| `latest_blog_posts` | آخرین مقالات وبلاگ |
| `popular_brands` | برندهای پرطرفدار |

---

## ۲۶. مدیریت کاربران - ادمین (Users Admin)
Base path: `/api/v1/users` — **مسیرهای `/admin/*` فقط `ADMIN`**.

| Method | Path | توضیح |
|---|---|---|
| GET | `/admin?page=&limit=&role=&isBlocked=&search=` | لیست/جست‌وجوی کاربران |
| GET | `/admin/:id` | جزئیات کاربر + نشست فعال + تعداد سفارش + موجودی کیف‌پول + سفارش‌های اخیر |
| PUT | `/admin/:id/block` | مسدودکردن — Body: `{ "reason": "..." }` |
| PUT | `/admin/:id/unblock` | رفع مسدودیت |
| PUT | `/admin/:id/role` | تغییر نقش — Body: `{ "role": "EDITOR" }` |
| POST | `/admin/:id/wallet/adjust` | افزایش/کاهش موجودی کیف پول — Body: `{ "amount": 50000, "description": "..." }` |
| GET | `/admin/:id/sessions` | لیست نشست‌های فعال/غیرفعال |
| DELETE | `/admin/:id/sessions/:sessionId` | باطل‌کردن یک نشست |
| DELETE | `/admin/:id/sessions` | باطل‌کردن همه‌ی نشست‌ها |

- مسدودکردن یک کاربر **همان لحظه همه‌ی نشست‌های فعالش را باطل می‌کند**.
- کاربر با نقش `ADMIN` قابل مسدودکردن نیست (`403`).
- `POST /admin/:id/wallet/adjust` با `amount>0` افزایش و `amount<0` کاهش موجودی است.

---

## ۲۷. امنیت - بلاک IP (Security)
Base path: `/api/v1/security` — **همه‌ی مسیرها فقط `ADMIN`**.

| Method | Path | توضیح |
|---|---|---|
| GET | `/blocked-ips` | لیست IP های مسدودشده |
| POST | `/blocked-ips` | مسدودکردن یک IP |
| DELETE | `/blocked-ips/:id` | رفع مسدودیت |

**Body مسدودکردن:** `{ "ip": "1.2.3.4", "reason": "...", "expiresAt": "2026-07-01T00:00:00Z" }`

---

## ۲۸. آنالیز (Analytics)
Base path: `/api/v1/analytics` — **همه‌ی مسیرها فقط `ADMIN`**.

| Method | Path | توضیح |
|---|---|---|
| GET | `/overview` | KPI های کلی |
| GET | `/sales-over-time?from=&to=&period=` | نمودار فروش |
| GET | `/order-status-breakdown` | تعداد سفارش به ازای هر وضعیت |
| GET | `/top-products?limit=&from=&to=` | پرفروش‌ترین محصولات |
| GET | `/new-users-over-time?from=&to=&period=` | نمودار ثبت‌نام کاربران جدید |

`period`: `day` (پیش‌فرض) | `week` | `month`.

---

## ۲۹. پروفایل کاربر (Users Me)
Base path: `/api/v1/users/me` — **همه‌ی مسیرها نیاز به ورود دارند**.

| Method | Path | توضیح |
|---|---|---|
| GET | `/` | پروفایل من (+ موجودی کیف‌پول) |
| PUT | `/` | ویرایش `fullName` |
| PUT | `/password` | تغییر رمز عبور (با دانستن رمز فعلی) |
| POST | `/change-identifier/request` | درخواست تغییر ایمیل/موبایل — ارسال OTP به مقدار جدید |
| POST | `/change-identifier/verify` | تایید OTP و اعمال تغییر |

### `PUT /password`
**Body:** `{ "currentPassword": "...", "newPassword": "Abc12345" }`
بعد از تغییر موفق، تمام نشست‌های **دیگر** باطل می‌شوند.

### `POST /change-identifier/request` و `/verify`
**Body request:** `{ "newIdentifier": "new@example.com" }`
**Body verify:** `{ "newIdentifier": "new@example.com", "code": "12345" }`
**خطاها:** `409` این شناسه قبلاً توسط حساب دیگری استفاده شده است.

---

## ۳۰. تنظیمات سایت (Settings)
Base path: `/api/v1/settings`

| Method | Path | Auth | توضیح |
|---|---|---|---|
| GET | `/` | ندارد | همه‌ی تنظیمات به‌صورت `{ key: value }` |
| GET | `/admin` | ADMIN | لیست خام همه‌ی تنظیمات |
| PUT | `/admin/:key` | ADMIN | ایجاد/ویرایش یک تنظیم (upsert) |
| DELETE | `/admin/:key` | ADMIN | حذف یک تنظیم |

### `PUT /admin/:key`
**Body:** `{ "value": "فروشگاه من", "type": "string" }`
`type`: `string` (پیش‌فرض) | `number` | `boolean` | `json`.

---

## ۳۱. سئو (sitemap.xml / robots.txt)

⚠️ این دو مسیر **بیرون از `/api/v1`** و در ریشه‌ی سرور هستند (مثل `/health`):

| Method | Path | توضیح |
|---|---|---|
| GET | `/sitemap.xml` | نقشه‌ی سایت XML با محصولات فعال + دسته‌بندی‌ها + برندهای فعال + وبلاگ‌ها |
| GET | `/robots.txt` | فایل robots استاندارد + ارجاع به sitemap |

لینک‌های داخل sitemap از `PUBLIC_SITE_URL` در `.env` ساخته می‌شوند.

---
