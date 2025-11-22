import express from "express";
import rateLimit from "express-rate-limit";
const router = express.Router();

import {
  signup,
  login,
  verify,
  forgetPassword,
  resetPassword,
  verifyResetOtp,
  listUsers,
  updateUserRole,
  deleteUser,
  sendResetOtpLoggedIn,
  resendOtp,
} from "../controllers/AuthController.js";
import { verifyToken } from "../middleware/verifyToken.js";

import {
  createJob,
  listJobsPublic,
  listJobsMine,
  listJobsPending,
  getJob,
  reviewJob,
  listAllJobs,
  deleteJob,
} from "../controllers/JobController.js";

import {
  getApplicantDetails,
  applyToJob,
  listJobApplications,
  listMyApplications,
  listAllApplications,
  updateStatus,
  resumeUpload,
} from "../controllers/ApplicationController.js";

// Dashboard data fetch limiter (generous for concurrent GET requests)
const dashboardDataLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 60, // 50 requests per minute per IP
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req, _res) => req.method !== "GET", // Only limit GET requests
});

// Sensitive auth endpoints limiter (strict - brute force protection)
const sensitiveLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // 30 attempts per 15 minutes (allows reasonable testing/login attempts)
  standardHeaders: true,
  legacyHeaders: false,
  message: "Too many authentication attempts, please try again later",
});

// 🔓 Public Routes
router.post("/login", sensitiveLimiter, login);
router.post("/signup", sensitiveLimiter, signup);
router.post("/verify", sensitiveLimiter, verify);
router.post("/forgetPassword", sensitiveLimiter, forgetPassword);
router.post("/verify-reset-otp", sensitiveLimiter, verifyResetOtp);
router.post("/resetPassword", sensitiveLimiter, resetPassword);
router.post(
  "/send-reset-otp",
  verifyToken,
  sensitiveLimiter,
  sendResetOtpLoggedIn
);

router.post("/resend-otp", sensitiveLimiter, resendOtp); // <--- Add this line


// ---------- Jobs ----------
router.get("/public", listJobsPublic); // public
router.post("/createJob", verifyToken, createJob);
router.get("/mineJobList", verifyToken, dashboardDataLimiter, listJobsMine);
router.get("/pending", verifyToken, dashboardDataLimiter, listJobsPending);
router.patch("/:id/review", verifyToken, reviewJob);
router.get("/allJobs/:jobId", verifyToken, dashboardDataLimiter, getJob);
router.get("/allJobs", verifyToken, dashboardDataLimiter, listAllJobs);
router.delete("/deleteJob/job/:jobId", verifyToken, deleteJob);

// ---------- Applications ----------
router.post(
  "/job/:jobId/applyToJob",
  verifyToken,
  resumeUpload.single("resume"),
  applyToJob
);
router.get(
  "/jobApplications/job/:jobId",
  verifyToken,
  dashboardDataLimiter,
  listJobApplications
);
router.get(
  "/myApplications",
  verifyToken,
  dashboardDataLimiter,
  listMyApplications
);
router.get(
  "/allApplications",
  verifyToken,
  dashboardDataLimiter,
  listAllApplications
);
router.patch("/updateStatus/:appId/status", verifyToken, updateStatus);
router.get(
  "/applicant/:appId/details",
  verifyToken,
  dashboardDataLimiter,
  getApplicantDetails
);

router.get("/listUsers", verifyToken, dashboardDataLimiter, listUsers);
router.patch("/:userId/updateUserRole", verifyToken, updateUserRole);
router.delete("/:userId", verifyToken, deleteUser);

export default router;