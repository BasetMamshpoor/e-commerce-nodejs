import { Router } from "express";
import * as blogController from "../controllers/blog.controller";
import { validate } from "../middlewares/validate";
import { authenticate, authorize, optionalAuthenticate } from "../middlewares/auth.middleware";
import {
  createBlogPostSchema,
  updateBlogPostSchema,
  listBlogPostsQuerySchema,
  adminListBlogPostsQuerySchema,
  createBlogCategorySchema,
  updateBlogCategorySchema,
} from "../validations/blog.validation";
import { entityUpload } from "../services/media/upload-helper";

const router = Router();
const manageOnly = [authenticate, authorize("ADMIN", "EDITOR")] as const;

// --- دسته‌بندی‌های وبلاگ ---
router.get("/categories", blogController.listCategories);
router.post("/categories", ...manageOnly, validate(createBlogCategorySchema), blogController.createCategory);
router.put("/categories/:id", ...manageOnly, validate(updateBlogCategorySchema), blogController.updateCategory);
router.delete("/categories/:id", ...manageOnly, blogController.removeCategory);

// ⚠️ مسیرهای ثابت ادمین قبل از /:slug
router.get("/admin", ...manageOnly, validate(adminListBlogPostsQuerySchema, "query"), blogController.listAdmin);
router.get("/admin/:id", ...manageOnly, blogController.getByIdAdmin);

// --- پست‌های وبلاگ ---
router.get("/", validate(listBlogPostsQuerySchema, "query"), blogController.listPublic);
router.get("/:slug", blogController.getBySlugPublic);
router.post("/:id/view", optionalAuthenticate, blogController.trackView);

// آپلود تصویر کاور به همراه فیلدهای فرم — اگر درخواست multipart باشد،
// فایل coverImage پردازش شده و coverImageUrl + coverImageMediaId به req.body اضافه می‌شود
router.post("/", ...manageOnly, entityUpload("blogCover"), validate(createBlogPostSchema), blogController.createPost);
router.put("/:id", ...manageOnly, entityUpload("blogCover"), validate(updateBlogPostSchema), blogController.updatePost);
router.delete("/:id", ...manageOnly, blogController.removePost);

export default router;
