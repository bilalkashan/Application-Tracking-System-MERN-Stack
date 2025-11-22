import express from "express";
import { getLifecycleReport } from "../controllers/ReportController.js";
import { verifyToken } from "../middleware/verifyToken.js";

const router = express.Router();

router.get("/lifecycle/:jobId", verifyToken, getLifecycleReport);

export default router;
