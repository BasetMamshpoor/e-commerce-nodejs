-- ستون comboKey برای جلوگیری از ترکیب تکراری مقادیر ویژگی روی یک محصول،
-- حتی در برخورد دو درخواست هم‌زمان (race condition). این ستون معادل
-- شناسه‌ی ترکیب مقادیر ویژگیِ هر تنوع است (مثلاً "3,7")، به‌صورت شناسه‌های
-- مرتب‌شده و جداشده با کاما؛ برای تنوع بدون هیچ ویژگی مقدار آن رشته‌ی خالی است.

-- ۱) ستون را با مقدار پیش‌فرض خالی اضافه می‌کنیم تا ردیف‌های موجود خطا ندهند
ALTER TABLE "ProductVariant" ADD COLUMN "comboKey" TEXT NOT NULL DEFAULT '';

-- ۲) برای ردیف‌های از قبل موجود، comboKey واقعی را از روی
--    ProductVariantAttributeValue محاسبه و پر می‌کنیم
UPDATE "ProductVariant" pv
SET "comboKey" = COALESCE((
  SELECT string_agg(pvav."attributeValueId"::text, ',' ORDER BY pvav."attributeValueId")
  FROM "ProductVariantAttributeValue" pvav
  WHERE pvav."variantId" = pv."id"
), '');

-- ۳) محدودیت یکتا روی (productId, comboKey).
--    نکته‌ی مهم: اگر همین الان دو تنوع با ترکیب ویژگی کاملاً یکسان برای یک
--    محصول در دیتابیس موجود باشد (داده‌ی قبلاً خراب‌شده)، این مرحله با خطای
--    "duplicate key value violates unique constraint" متوقف می‌شود. در آن
--    صورت باید قبل از اجرای دوباره‌ی این migration، آن تنوع‌های تکراری را
--    دستی پیدا و ادغام/حذف کنید (کوئری زیر پیدایشان می‌کند):
--
--    SELECT "productId", "comboKey", array_agg(id) AS variant_ids
--    FROM "ProductVariant"
--    GROUP BY "productId", "comboKey"
--    HAVING count(*) > 1;

CREATE UNIQUE INDEX "ProductVariant_productId_comboKey_key" ON "ProductVariant"("productId", "comboKey");
