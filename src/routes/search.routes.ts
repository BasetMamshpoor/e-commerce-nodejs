import { Router } from "express";
import * as searchController from "../controllers/search.controller";

const router = Router();

router.get("/", searchController.search);
router.get("/quick", searchController.quickSearch);
router.get("/main", searchController.mainSearch);

export default router;
