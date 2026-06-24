import multer, { FileFilterCallback } from "multer";
import path from "node:path";
import fs from "node:fs";
import crypto from "node:crypto";
import { Request } from "express";
import { env } from "../config/env";
import { ApiError } from "../utils/ApiError";

// ----------------------------------------------------------------------------
// بخش رسانه‌ها (Media) — آیتم ۱۷.
// فعلاً فایل‌ها روی دیسک خودِ سرور ذخیره می‌شوند (ساده‌ترین حالت برای شروع).
// برای دیپلوی واقعی/مقیاس‌پذیر، بعداً این storage را با یک provider ابری
// (S3, Object Storage و ...) جای‌گزین کنید — چون کاربر و سرویس media.service.ts
// فقط با Media.url کار می‌کنند، تغییر storage تاثیری روی بقیه‌ی پروژه ندارد.
// ----------------------------------------------------------------------------

const ALLOWED_MIME_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "application/pdf": "pdf",
};

function ensureUploadDirExists(): string {
  const uploadRoot = path.isAbsolute(env.UPLOAD_DIR)
    ? env.UPLOAD_DIR
    : path.join(process.cwd(), env.UPLOAD_DIR);

  const now = new Date();
  const subDir = path.join(
    String(now.getFullYear()),
    String(now.getMonth() + 1).padStart(2, "0")
  );
  const fullDir = path.join(uploadRoot, subDir);

  fs.mkdirSync(fullDir, { recursive: true });
  return fullDir;
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    try {
      cb(null, ensureUploadDirExists());
    } catch (err) {
      cb(err as Error, "");
    }
  },
  filename: (_req, file, cb) => {
    const ext = ALLOWED_MIME_TYPES[file.mimetype] ?? "bin";
    const uniqueName = `${Date.now()}-${crypto.randomBytes(6).toString("hex")}.${ext}`;
    cb(null, uniqueName);
  },
});

function fileFilter(_req: Request, file: Express.Multer.File, cb: FileFilterCallback) {
  if (!ALLOWED_MIME_TYPES[file.mimetype]) {
    return cb(
      ApiError.badRequest(
        `فرمت فایل مجاز نیست. فرمت‌های مجاز: ${Object.keys(ALLOWED_MIME_TYPES).join(", ")}`
      ) as unknown as Error
    );
  }
  cb(null, true);
}

export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: env.MAX_FILE_SIZE_MB * 1024 * 1024, files: 10 },
});

/** مسیر نسبی روی دیسک را به URL عمومی قابل‌دسترسی تبدیل می‌کند */
export function toPublicUrl(absoluteFilePath: string): string {
  const uploadRoot = path.isAbsolute(env.UPLOAD_DIR)
    ? env.UPLOAD_DIR
    : path.join(process.cwd(), env.UPLOAD_DIR);

  const relative = path.relative(uploadRoot, absoluteFilePath).split(path.sep).join("/");
  return `${env.APP_BASE_URL}/uploads/${relative}`;
}

export function resolveUploadRoot(): string {
  return path.isAbsolute(env.UPLOAD_DIR) ? env.UPLOAD_DIR : path.join(process.cwd(), env.UPLOAD_DIR);
}

/** عکس toPublicUrl — برای حذف فایل از دیسک، آدرس عمومی را به مسیر فایل برمی‌گرداند */
export function urlToFilePath(url: string): string {
  const prefix = `${env.APP_BASE_URL}/uploads/`;
  const relative = url.startsWith(prefix) ? url.slice(prefix.length) : url.replace(/^\/?uploads\//, "");
  return path.join(resolveUploadRoot(), relative);
}
