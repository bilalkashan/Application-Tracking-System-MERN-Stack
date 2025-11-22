import express from "express";
import { 
    getNotification, 
    readNotification, 
    deleteNotification 
} from "../controllers/NotificationController.js";
import { verifyToken } from "../middleware/verifyToken.js";

const router = express.Router();

router.get("/getNotification", verifyToken,  getNotification); 
router.put("/readNotification/:id/read", verifyToken, readNotification); 
router.delete("/deleteNotification/:id", verifyToken, deleteNotification);

export default router;
