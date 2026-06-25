import { Router } from "express";
import * as ticketController from "../controllers/ticket.controller";
import { validate } from "../middlewares/validate";
import { authenticate, authorize } from "../middlewares/auth.middleware";
import {
  createTicketSchema,
  addTicketMessageSchema,
  updateTicketMetaSchema,
  listTicketsQuerySchema,
  adminListTicketsQuerySchema,
  createDepartmentSchema,
  updateDepartmentSchema,
} from "../validations/ticket.validation";

const router = Router();
const staffOnly = [authenticate, authorize("ADMIN", "SUPPORT")] as const;

router.use(authenticate);

// --- بخش‌های پشتیبانی (مدیریت فقط ادمین) ---
router.get("/departments", ticketController.listDepartments);
router.post(
  "/departments",
  authorize("ADMIN"),
  validate(createDepartmentSchema),
  ticketController.createDepartment
);
router.put(
  "/departments/:id",
  authorize("ADMIN"),
  validate(updateDepartmentSchema),
  ticketController.updateDepartment
);
router.delete("/departments/:id", authorize("ADMIN"), ticketController.removeDepartment);

// ⚠️ مسیرهای ثابت ادمین قبل از /:id
router.get(
  "/admin",
  ...staffOnly,
  validate(adminListTicketsQuerySchema, "query"),
  ticketController.listAdmin
);
router.get("/admin/:id", ...staffOnly, ticketController.getByIdAdmin);
router.put(
  "/admin/:id",
  ...staffOnly,
  validate(updateTicketMetaSchema),
  ticketController.updateMeta
);
router.post(
  "/admin/:id/messages",
  ...staffOnly,
  validate(addTicketMessageSchema),
  ticketController.addMessage
);

// --- مشتری ---
router.get("/", validate(listTicketsQuerySchema, "query"), ticketController.listMine);
router.post("/", validate(createTicketSchema), ticketController.create);
router.get("/:id", ticketController.getMine);
router.post("/:id/messages", validate(addTicketMessageSchema), ticketController.addMessage);

export default router;
