import express from "express";
import { searchApplicants, getFullApplicantProfile } from "../controllers/SearchController.js";
import { verifyToken } from "../middleware/verifyToken.js";

const router = express.Router();

router.get("/searchApplicants", verifyToken, searchApplicants);

router.get("/profile/user/:userId", verifyToken, getFullApplicantProfile);


export default router;