import express from "express";
import { sendMessage, getMessages } from "../controllers/MessageController.js";
import { verifyToken } from "../middleware/verifyToken.js";

const router = express.Router();

router.post("/sendMessage/:applicationId", verifyToken, sendMessage);
router.get("/getMessages/:applicationId", verifyToken, getMessages);

export default router;
