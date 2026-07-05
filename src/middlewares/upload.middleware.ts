import multer, { FileFilterCallback } from "multer";
import path from "node:path";
import fs from "node:fs";
import crypto from "node:crypto";
import { Request } from "express";
import { env } from "../config/env";
import { ApiError } from "../utils/ApiError";
function resolveUploadRoot(): string {
  const dir = path.isAbsolute(env.UPLOAD_DIR) ? env.UPLOAD_DIR : path.join(process.cwd(), env.UPLOAD_DIR);
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

const ALL_ALLOWED: Record<string, string> = {
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

function ensureDir(entityType: string): string {
  const root = resolveUploadRoot();
  const now = new Date();
  const sub = path.join(
    entityType.toLowerCase(),
    String(now.getFullYear()),
    String(now.getMonth() + 1).padStart(2, "0")
  );
  const full = path.join(root, sub);
  fs.mkdirSync(full, { recursive: true });
  return full;
}

function storage(entityType: string) {
  return multer.diskStorage({
    destination: (_req, _file, cb) => {
      try { cb(null, ensureDir(entityType)); } catch (err) { cb(err as Error, ""); }
    },
    filename: (_req, file, cb) => {
      const ext = ALL_ALLOWED[file.mimetype] ?? "bin";
      const name = `${Date.now()}-${crypto.randomBytes(6).toString("hex")}.${ext}`;
      cb(null, name);
    },
  });
}

function fileFilter(allowedMimes: Set<string>) {
  return (_req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
    if (!allowedMimes.has(file.mimetype)) {
      return cb(
        ApiError.badRequest(`فرمت فایل مجاز نیست: ${file.mimetype}. فرمت‌های مجاز: ${Array.from(allowedMimes).join(", ")}`) as unknown as Error
      );
    }
    cb(null, true);
  };
}

const IMAGE_MIMES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif", "image/svg+xml"]);
const IMAGE_VIDEO_MIMES = new Set([...IMAGE_MIMES, "video/mp4", "video/webm"]);
const ALL_MIMES = new Set(Object.keys(ALL_ALLOWED));
const IMAGE_PDF_MIMES = new Set([...IMAGE_MIMES, "application/pdf"]);

const LIMITS = { fileSize: env.MAX_FILE_SIZE_MB * 1024 * 1024, files: 20 };

export function createUpload(entityType: string, mimes: Set<string> = ALL_MIMES) {
  return multer({
    storage: storage(entityType),
    fileFilter: fileFilter(mimes),
    limits: LIMITS,
  });
}

export const uploadProductImages = createUpload("products", IMAGE_MIMES);
export const uploadBlogCover = createUpload("blog", IMAGE_MIMES);
export const uploadStoryMedia = createUpload("stories", IMAGE_VIDEO_MIMES);
export const uploadBannerImage = createUpload("banners", IMAGE_MIMES);
export const uploadPopupMedia = createUpload("popups", IMAGE_MIMES);
export const uploadCategoryImage = createUpload("categories", IMAGE_MIMES);
export const uploadBrandLogo = createUpload("brands", IMAGE_MIMES);
export const uploadShippingLogo = createUpload("shipping", IMAGE_MIMES);
export const uploadTicketAttachments = createUpload("tickets", ALL_MIMES);
export const uploadCommentAttachments = createUpload("comments", IMAGE_PDF_MIMES);
export const uploadReturnImages = createUpload("returns", IMAGE_MIMES);

export const upload = multer({
  storage: storage("misc"),
  fileFilter: fileFilter(ALL_MIMES),
  limits: LIMITS,
});

export { resolveUploadRoot };
