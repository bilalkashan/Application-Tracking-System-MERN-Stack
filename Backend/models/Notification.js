// models/Notification.js
import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema({
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "user", 
    required: true 
},
  title: { 
    type: String, 
    required: true 
},
  message: { 
    type: String,
    required: true 
},
  link: { 
    type: String 
}, // e.g., /requisitions/view/123
  read: { 
    type: Boolean, 
    default: false 
},
  createdAt: { 
    type: Date, 
    default: Date.now 
},
});

export default mongoose.model("Notification", notificationSchema);
