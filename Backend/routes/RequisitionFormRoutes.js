import express from "express";
import rateLimit from "express-rate-limit";
import { verifyToken } from "../middleware/verifyToken.js";
import {
  createRequisition,
  hodApproval,
  hrApproval,
  cooApproval,
  listRequisitions,
  getRequisition,
  deleteRequisition,
  checkRequisitionApproval,
} from "../controllers/RequisitionController.js";

const router = express.Router();

// Dashboard data fetch limiter (generous for concurrent GET requests)
const dashboardDataLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 50, // 50 requests per minute per IP
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req, _res) => req.method !== "GET", // Only limit GET requests
});

router.post("/createRequisition", verifyToken, createRequisition);
router.get(
  "/listRequisitions",
  verifyToken,
  dashboardDataLimiter,
  listRequisitions
);
router.get("/viewRequisitionInfo/:requisitionId", verifyToken, getRequisition);

router.put("/hodApproval/:requisitionId", verifyToken, hodApproval);
router.put("/hrApproval/:requisitionId", verifyToken, hrApproval);
router.put("/cooApproval/:requisitionId", verifyToken, cooApproval);

router.delete(
  "/deleteRequisition/:requisitionId",
  verifyToken,
  deleteRequisition
);

router.get("/checkApproval/:reqNo", verifyToken, checkRequisitionApproval);

export default router;
