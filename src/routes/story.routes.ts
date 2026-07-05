import { Router } from "express";
import * as storyController from "../controllers/story.controller";
import { validate } from "../middlewares/validate";
import { authenticate, authorize } from "../middlewares/auth.middleware";
import { z } from "zod";
import { entityUpload } from "../services/media/upload-helper";
import { uploadStoryMedia } from "../middlewares/upload.middleware";
import { saveFileToMedia } from "../services/media/media.service";

const router = Router();
const manageOnly = [authenticate, authorize("ADMIN", "EDITOR")] as const;

router.get("/", storyController.listActive);

// استوری هم تصویر کاور و هم ویدئو می‌تواند داشته باشد — هر دو در یک درخواست
router.post(
  "/",
  ...manageOnly,
  // ابتدا فیلد coverImage را پردازش کن (اگر موجود باشد)
  (req, res, next) => {
    uploadStoryMedia.single("coverImage")(req, res, async (err) => {
      if (err) return next(err);
      if (req.file) {
        try {
          const saved = await saveFileToMedia(req.file, "stories", req.user?.id);
          req.body.coverImageUrl = saved.url;
          req.body.coverImageMediaId = saved.id;
        } catch (e) { return next(e); }
      }
      next();
    });
  },
  // سپس فیلد video را پردازش کن (اگر موجود باشد)
  (req, res, next) => {
    uploadStoryMedia.single("video")(req, res, async (err) => {
      if (err) return next(err);
      if (req.file) {
        try {
          const saved = await saveFileToMedia(req.file, "stories", req.user?.id);
          req.body.videoUrl = saved.url;
          req.body.videoMediaId = saved.id;
        } catch (e) { return next(e); }
      }
      next();
    });
  },
  validate(z.object({
    title: z.string().min(1).max(200),
    coverImageUrl: z.string().optional(),
    coverImageMediaId: z.coerce.number().int().positive().optional(),
    videoUrl: z.string().optional(),
    videoMediaId: z.coerce.number().int().positive().optional(),
    expiresAt: z.coerce.date(),
    order: z.coerce.number().int().optional().default(0),
    productIds: z.array(z.coerce.number().int()).optional().default([]),
  })),
  storyController.create
);

router.put(
  "/:id",
  ...manageOnly,
  (req, res, next) => {
    uploadStoryMedia.single("coverImage")(req, res, async (err) => {
      if (err) return next(err);
      if (req.file) {
        try {
          const saved = await saveFileToMedia(req.file, "stories", req.user?.id);
          req.body.coverImageUrl = saved.url;
          req.body.coverImageMediaId = saved.id;
        } catch (e) { return next(e); }
      }
      next();
    });
  },
  (req, res, next) => {
    uploadStoryMedia.single("video")(req, res, async (err) => {
      if (err) return next(err);
      if (req.file) {
        try {
          const saved = await saveFileToMedia(req.file, "stories", req.user?.id);
          req.body.videoUrl = saved.url;
          req.body.videoMediaId = saved.id;
        } catch (e) { return next(e); }
      }
      next();
    });
  },
  storyController.update
);
router.delete("/:id", ...manageOnly, storyController.remove);
router.get("/admin", ...manageOnly, storyController.listAdmin);

export default router;
