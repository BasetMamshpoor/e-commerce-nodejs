import { Router } from "express";
import * as storyController from "../controllers/story.controller";
import { validate } from "../middlewares/validate";
import { authenticate, authorize } from "../middlewares/auth.middleware";
import { createStorySchema, updateStorySchema } from "../validations/story.validation";
import { uploadStoryMedia } from "../middlewares/upload.middleware";
import { saveFileToMedia } from "../services/media/media.service";

const router = Router();
const manageOnly = [authenticate, authorize("ADMIN", "EDITOR")] as const;

router.get("/", storyController.listActive);

function uploadCoverImage(req: any, _res: any, next: any) {
  uploadStoryMedia.single("coverImage")(req, _res, async (err: unknown) => {
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
}

function uploadVideo(req: any, _res: any, next: any) {
  uploadStoryMedia.single("video")(req, _res, async (err: unknown) => {
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
}

router.post(
  "/",
  ...manageOnly,
  uploadCoverImage,
  uploadVideo,
  validate(createStorySchema),
  storyController.create
);

router.put(
  "/:id",
  ...manageOnly,
  uploadCoverImage,
  uploadVideo,
  validate(updateStorySchema),
  storyController.update
);

router.delete("/:id", ...manageOnly, storyController.remove);
router.get("/admin", ...manageOnly, storyController.listAdmin);

export default router;