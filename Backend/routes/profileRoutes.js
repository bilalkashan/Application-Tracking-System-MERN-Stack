import express from "express";
import rateLimit from "express-rate-limit";
import { verifyToken } from "../middleware/verifyToken.js";
import {
  updateStep,
  getProfile,
  uploadResume,
  uploadProfilePicture,
} from "../controllers/ProfileController.js";

import {
  updateAdminProfile,
  getAdminProfile,
} from "../controllers/AdminProfileController.js";

import { userResume, userProfilePicture } from "../middleware/multer.js";

const router = express.Router();

// Protect upload endpoints from brute-force/DoS by limiting number of uploads
const uploadLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // max 10 upload requests per minute per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many upload requests, please try again later." },
});

// --- (All old multer, fs, path, and makeStorage code has been removed) ---

// ---------------- User Profile Routes ----------------
router.get("/getProfile", verifyToken, getProfile);
router.put("/step/:stepNumber", verifyToken, updateStep);

// --- FIX: Use the imported middleware ---
router.put(
  "/resume",
  verifyToken,
  uploadLimiter,
  userResume.single("resume"), // Use new middleware
  uploadResume
);

router.put(
  "/profilePicture",
  verifyToken,
  uploadLimiter,
  userProfilePicture.single("profilePicture"),
  uploadProfilePicture
);

router.get("/getAdminProfile", verifyToken, getAdminProfile);

router.put(
  "/update",
  verifyToken,
  uploadLimiter,
  userProfilePicture.single("profilePicture"),
  updateAdminProfile
);

export default router;
