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

const router = Router();
const manageOnly = [authenticate, authorize("ADMIN", "EDITOR")] as const;

// --- دسته‌بندی‌های وبلاگ ---
router.get("/categories", blogController.listCategories);
router.post(
  "/categories",
  ...manageOnly,
  validate(createBlogCategorySchema),
  blogController.createCategory
);
router.put(
  "/categories/:id",
  ...manageOnly,
  validate(updateBlogCategorySchema),
  blogController.updateCategory
);
router.delete("/categories/:id", ...manageOnly, blogController.removeCategory);

// ⚠️ مسیرهای ثابت ادمین قبل از /:slug
router.get(
  "/admin",
  ...manageOnly,
  validate(adminListBlogPostsQuerySchema, "query"),
  blogController.listAdmin
);
router.get("/admin/:id", ...manageOnly, blogController.getByIdAdmin);

// --- پست‌های وبلاگ ---
router.get("/", validate(listBlogPostsQuerySchema, "query"), blogController.listPublic);
router.get("/:slug", blogController.getBySlugPublic);
router.post("/:id/view", optionalAuthenticate, blogController.trackView);

router.post("/", ...manageOnly, validate(createBlogPostSchema), blogController.createPost);
router.put("/:id", ...manageOnly, validate(updateBlogPostSchema), blogController.updatePost);
router.delete("/:id", ...manageOnly, blogController.removePost);

export default router;
