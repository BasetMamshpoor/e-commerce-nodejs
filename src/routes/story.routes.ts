import { Router } from "express";
import * as storyController from "../controllers/story.controller";
import { validate } from "../middlewares/validate";
import { authenticate, authorize } from "../middlewares/auth.middleware";
import { createStorySchema, updateStorySchema } from "../validations/story.validation";
import { entityUploadFields } from "../services/media/upload-helper";

const router = Router();
const manageOnly = [authenticate, authorize("ADMIN", "EDITOR")] as const;

router.get("/", storyController.listActive);

router.post(
  "/",
  ...manageOnly,
  entityUploadFields(["storyCover", "storyVideo"]),
  validate(createStorySchema),
  storyController.create
);

router.put(
  "/:id",
  ...manageOnly,
  entityUploadFields(["storyCover", "storyVideo"]),
  validate(updateStorySchema),
  storyController.update
);

router.delete("/:id", ...manageOnly, storyController.remove);
router.get("/admin", ...manageOnly, storyController.listAdmin);

export default router;