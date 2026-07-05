// ----------------------------------------------------------------------------
// راهنما: این ماژول توابع کمکی برای آپلود فایل به‌عنوان بخشی از ثبت/ویرایش
// موجودیت‌ها فراهم می‌کند. هدف این است که فایل و فیلدهای فرم در یک درخواست
// (multipart/form-data) ارسال شوند و سرور فایل را آپلود کند، رکورد Media
// بسازد و body را با imageUrl و mediaId به‌روزرسانی کند.
//
// نحوه استفاده در کنترلر:
//   1. از uploadEntityImage به‌عنوان middleware استفاده کنید
//   2. req.body به‌طور خودکار imageUrl و mediaId را دارد
// ----------------------------------------------------------------------------
import { Request, Response, NextFunction } from "express";
import { ApiError } from "../../utils/ApiError";
import { saveFileToMedia, SavedMedia } from "./media.service";
import { uploadBannerImage, uploadProductImages, uploadCategoryImage, uploadBrandLogo, uploadPopupMedia, uploadStoryMedia, uploadBlogCover, uploadShippingLogo, uploadTicketAttachments } from "../../middlewares/upload.middleware";

type UploadFieldConfig = {
  fieldName: string;      // نام فیلد فرم که فایل در آن ارسال می‌شود
  entityType: string;     // نوع موجودیت برای ذخیره‌سازی
  mimeSetter: ReturnType<typeof import("../../middlewares/upload.middleware").createUpload>; // multer middleware
};

// پیکربندی upload برای هر موجودیت — هر زمان موجودیت جدید اضافه شد،
// یک ورودی به این map اضافه کنید
const UPLOAD_CONFIGS: Record<string, UploadFieldConfig> = {
  banner:            { fieldName: "image",      entityType: "banners",   mimeSetter: uploadBannerImage },
  category:          { fieldName: "image",      entityType: "categories", mimeSetter: uploadCategoryImage },
  brand:             { fieldName: "logo",       entityType: "brands",    mimeSetter: uploadBrandLogo },
  popup:             { fieldName: "media",      entityType: "popups",    mimeSetter: uploadPopupMedia },
  product:           { fieldName: "images",     entityType: "products",  mimeSetter: uploadProductImages },
  storyCover:        { fieldName: "coverImage", entityType: "stories",   mimeSetter: uploadStoryMedia },
  storyVideo:        { fieldName: "video",      entityType: "stories",   mimeSetter: uploadStoryMedia },
  blogCover:         { fieldName: "coverImage", entityType: "blog",      mimeSetter: uploadBlogCover },
  shippingLogo:      { fieldName: "logo",       entityType: "shipping",  mimeSetter: uploadShippingLogo },
  ticket:            { fieldName: "attachments", entityType: "tickets",   mimeSetter: uploadTicketAttachments },
};

/**
 * middleware برای آپلود یک تصویر به‌عنوان بخشی از فرم ثبت/ویرایش موجودیت.
 *
 * نحوه استفاده:
 *   router.post("/", entityUpload("banner"), validate(schema), controller);
 *
 * بعد از این middleware، اگر فایلی ارسال شده باشد:
 *   - req.body.imageUrl = آدرس کامل فایل
 *   - req.body.mediaId = شناسه رکورد Media
 *   - (بسته به موجودیت، نام فیلد متفاوت است — مثلاً logo برای برند)
 */
export function entityUpload(uploadKey: string) {
  const config = UPLOAD_CONFIGS[uploadKey];
  if (!config) {
    throw new Error(`Upload config not found for key: ${uploadKey}`);
  }

  const multerMiddleware = config.mimeSetter.single(config.fieldName);

  return async (req: Request, res: Response, next: NextFunction) => {
    multerMiddleware(req, res, async (err: unknown) => {
      if (err) {
        return next(err);
      }

      if (!req.file) {
        // اگر فایلی ارسال نشده، ادامه بده (مقادیر قبلی حفظ می‌شوند)
        return next();
      }

      try {
        const saved: SavedMedia = await saveFileToMedia(
          req.file,
          config.entityType,
          req.user?.id
        );

        // تعیین نام فیلد URL بر اساس entityType
        const urlField = mapEntityTypeToUrlField(config.entityType);
        const mediaIdField = mapEntityTypeToMediaIdField(config.entityType);

        // تنظیم مقادیر در req.body برای استفاده در کنترلر
        req.body = {
          ...req.body,
          [urlField]: saved.url,
          [mediaIdField]: saved.id,
        };

        next();
      } catch (error) {
        next(error);
      }
    });
  };
}

/** نگاشت entityType به نام فیلد URL در دیتابیس */
function mapEntityTypeToUrlField(entityType: string): string {
  const map: Record<string, string> = {
    banners:    "imageUrl",
    categories: "imageUrl",
    brands:     "logoUrl",
    popups:     "mediaUrl",
    products:   "", // محصولات چند تصویر دارند — با منطق جداگانه مدیریت می‌شوند
    blog:       "coverImageUrl",
    stories:    "coverImageUrl",
    shipping:   "logoUrl",
  };
  return map[entityType] ?? "imageUrl";
}

/** نگاشت entityType به نام فیلد mediaId در دیتابیس */
function mapEntityTypeToMediaIdField(entityType: string): string {
  const map: Record<string, string> = {
    banners:    "mediaId",
    categories: "imageMediaId",
    brands:     "logoMediaId",
    popups:     "mediaId",
    blog:       "coverImageMediaId",
    stories:    "coverImageMediaId",
    shipping:   "logoMediaId",
  };
  return map[entityType] ?? "mediaId";
}

/**
 * آپلود چند فایل برای محصولات — هر فایل تبدیل به یک رکورد Media می‌شود
 * و result در req.body.uploadedImages ذخیره می‌شود.
 */
/**
 * آپلود فایل‌های ضمیمه تیکت — فایل‌ها تبدیل به رکورد Media می‌شوند
 * و ID آن‌ها به آرایه‌ی attachmentMediaIds در req.body اضافه می‌شود
 */
export function uploadTicketAttachmentsMiddleware() {
  const uploader = uploadTicketAttachments.array("attachments", 10);

  return async (req: Request, _res: Response, next: NextFunction) => {
    uploader(req, _res, async (err: unknown) => {
      if (err) return next(err);
      if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
        return next();
      }

      try {
        const results = await Promise.all(
          req.files.map((f) => saveFileToMedia(f, "tickets", req.user?.id))
        );
        const newIds = results.map((r) => r.id);
        const existingIds: number[] = Array.isArray(req.body.attachmentMediaIds)
          ? req.body.attachmentMediaIds.map((x: string | number) => Number(x))
          : [];
        req.body.attachmentMediaIds = [...existingIds, ...newIds];
        next();
      } catch (error) {
        next(error);
      }
    });
  };
}

export function uploadProductImagesMiddleware() {
  const uploader = uploadProductImages.array("images", 20);

  return async (req: Request, _res: Response, next: NextFunction) => {
    uploader(req, _res, async (err: unknown) => {
      if (err) return next(err);
      if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
        return next();
      }

      try {
        const results = await Promise.all(
          req.files.map((f) => saveFileToMedia(f, "products", req.user?.id))
        );
        req.body.uploadedImages = results.map((r) => ({
          mediaId: r.id,
          url: r.url,
        }));
        next();
      } catch (error) {
        next(error);
      }
    });
  };
}
