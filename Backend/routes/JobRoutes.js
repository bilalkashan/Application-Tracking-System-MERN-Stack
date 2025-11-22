import express from "express";
import {
  updateJobStatus,
  assignInterviewer,
  removeInterviewer,
  getJobWithInterviewers,
  listInterviewerJobs,
} from "../controllers/JobController.js";
import { verifyToken } from "../middleware/verifyToken.js";

const router = express.Router();

router.post("/:jobId/assign-interviewer", verifyToken, assignInterviewer);
router.post("/:jobId/remove-interviewer", verifyToken, removeInterviewer);
router.get("/:jobId/with-interviewers", verifyToken, getJobWithInterviewers);
router.get("/interviewer/jobs", verifyToken, listInterviewerJobs); // alternate: /interviewer/jobs
router.patch("/:jobId/status", verifyToken, updateJobStatus);

export default router;
