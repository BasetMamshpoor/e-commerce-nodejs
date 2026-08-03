import path from "node:path";
import fs from "node:fs";
import crypto from "node:crypto";
import { env } from "../../config/env";
import { StoredFile, IStorageProvider } from "./storage.interface";

const MIME_TO_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/svg+xml": "svg",
  "video/mp4": "mp4",
  "video/webm": "webm",
  "application/pdf": "pdf",
  "application/msword": "doc",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
  "application/vnd.ms-excel": "xls",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "xlsx",
  "text/plain": "txt",
  "application/zip": "zip",
};

const ALL_ALLOWED_MIMES = new Set(Object.keys(MIME_TO_EXT));

const IMAGE_MIMES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/svg+xml",
]);

const VIDEO_MIMES = new Set([
  "video/mp4",
  "video/webm",
]);

export function mapMimeTypeToMediaType(mimeType: string): "IMAGE" | "VIDEO" | "DOCUMENT" {
  if (IMAGE_MIMES.has(mimeType)) return "IMAGE";
  if (VIDEO_MIMES.has(mimeType)) return "VIDEO";
  return "DOCUMENT";
}

export function isMimeAllowed(mimeType: string): boolean {
  return ALL_ALLOWED_MIMES.has(mimeType);
}

export function isMimeImage(mimeType: string): boolean {
  return IMAGE_MIMES.has(mimeType);
}

export function isMimeImageOrPdf(mimeType: string): boolean {
  return IMAGE_MIMES.has(mimeType) || mimeType === "application/pdf";
}

export function isMimeImageOrVideo(mimeType: string): boolean {
  return IMAGE_MIMES.has(mimeType) || VIDEO_MIMES.has(mimeType);
}

export class LocalStorageProvider implements IStorageProvider {
  private uploadRoot: string;

  constructor() {
    this.uploadRoot = path.isAbsolute(env.UPLOAD_DIR)
      ? env.UPLOAD_DIR
      : path.join(process.cwd(), env.UPLOAD_DIR);
    fs.mkdirSync(this.uploadRoot, { recursive: true });
  }

  async save(file: Express.Multer.File, entityType: string): Promise<StoredFile> {
    const ext = MIME_TO_EXT[file.mimetype] ?? "bin";
    const now = new Date();
    const yearMonth = path.join(
      String(now.getFullYear()),
      String(now.getMonth() + 1).padStart(2, "0")
    );
    const entityDir = path.join(this.uploadRoot, entityType.toLowerCase(), yearMonth);
    fs.mkdirSync(entityDir, { recursive: true });

    const uniqueName = `${Date.now()}-${crypto.randomBytes(6).toString("hex")}.${ext}`;
    const fullPath = path.join(entityDir, uniqueName);
    const relativePath = path.relative(this.uploadRoot, fullPath).split(path.sep).join("/");

    fs.renameSync(file.path, fullPath);

    return {
      fileName: uniqueName,
      originalName: Buffer.from(file.originalname, "latin1").toString("utf8"),
      filePath: relativePath,
      url: this.getUrl(relativePath),
      mimeType: file.mimetype,
      size: file.size,
    };
  }

  async delete(filePath: string): Promise<void> {
    const absolute = path.isAbsolute(filePath)
      ? filePath
      : path.join(this.uploadRoot, filePath);
    try {
      await fs.promises.unlink(absolute);
    } catch {
      // File may already be deleted — ignore
    }
  }

  // ⚠️ عمداً یک مسیر نسبی برمی‌گرداند، نه URL کامل با دامنه/پورت.
  // قبلاً اینجا `${env.APP_BASE_URL}/uploads/...` برگردانده می‌شد و همین
  // مقدار مستقیم در دیتابیس (Media.url و فیلدهای denormalized مثل
  // Banner.imageUrl) ذخیره می‌شد — یعنی با هر تغییر دامنه یا پورت پروژه،
  // تمام لینک‌های رسانه‌ی قبلاً ذخیره‌شده برای همیشه خراب می‌ماندند.
  // حالا فقط مسیر نسبی ذخیره می‌شود؛ تبدیل به URL کامل هر بار در لحظه‌ی
  // پاسخ‌دادن (بر اساس APP_BASE_URL همان لحظه) انجام می‌شود — ببینید
  // src/middlewares/resolveMediaUrls.middleware.ts
  getUrl(filePath: string): string {
    const clean = filePath.split(path.sep).join("/");
    return `/uploads/${clean}`;
  }

  resolveRoot(): string {
    return this.uploadRoot;
  }

  urlToFilePath(url: string): string {
    // هم مسیر نسبی جدید (/uploads/...) و هم URL کامل قدیمی (که ممکن است
    // هنوز قبل از اجرای migration در دیتابیس مانده باشد) را می‌پذیرد.
    const withoutOrigin = url.replace(/^https?:\/\/[^/]+/, "");
    const relative = withoutOrigin.replace(/^\/?uploads\//, "");
    return path.join(this.uploadRoot, relative);
  }
}

let providerInstance: IStorageProvider | null = null;

export function getStorageProvider(): IStorageProvider {
  if (!providerInstance) {
    providerInstance = new LocalStorageProvider();
  }
  return providerInstance;
}

export function setStorageProvider(provider: IStorageProvider): void {
  providerInstance = provider;
}
