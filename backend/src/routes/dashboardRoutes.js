import { Router } from "express";
import { dashboard } from "../controllers/dashboardController.js";
import { authMiddleware } from "../middleware/auth.js";

const router = Router();

router.use(authMiddleware);
router.get("/", dashboard);

export default router;
