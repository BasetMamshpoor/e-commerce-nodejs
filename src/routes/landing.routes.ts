import { Router } from "express";
import * as landingController from "../controllers/landing.controller";

const router = Router();

router.get("/", landingController.getLandingData);

export default router;
