import { Router } from "express";
import * as comparisonController from "../controllers/comparison.controller";

const router = Router();

router.get("/", comparisonController.compare);

export default router;
