import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  is_active: { type: Boolean, default: true },
  is_verified: { type: Boolean, default: false },
  lastLogin: { type: Date },
  otp: { type: String, required: true },
  role: { 
    type: String, 
    enum: [
      "admin", 
      "recruiter", 
      "user", 
      "coo", 
      "hod", 
      "hr", 
      "interviewer", 
      "sub_recruiter" // New Role
    ], 
    default: "user" 
  },
  userId: { type: String, unique: true } // custom MMCL-00000 ID
});

// Auto-generate MMCL userId (unchanged)
UserSchema.pre("save", async function (next) {
  if (!this.userId) {
    const lastUser = await this.constructor.findOne({}).sort({ _id: -1 });
    let newIdNumber = 1;
    if (lastUser?.userId) {
      const lastNumber = parseInt(lastUser.userId.split("-")[1]);
      if (!isNaN(lastNumber)) newIdNumber = lastNumber + 1; // Added NaN check
    }
    this.userId = `User-${String(newIdNumber).padStart(5, "0")}`;
  }
  next();
});

export default mongoose.models.user || mongoose.model("user", UserSchema);