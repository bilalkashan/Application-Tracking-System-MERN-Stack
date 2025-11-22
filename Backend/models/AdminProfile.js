import mongoose from "mongoose";

const AdminProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
    department: {
      type: String,
      default: "",
    },
    designation: {
      type: String,
      default: "",
    },
    joinedAt: {
      type: Date,
      default: null,
    },
    summary: {
      type: String,
      default: "",
    },
    contactNumber: {
      type: String,
      default: "",
    },
    location: {
      type: String,
      default: "",
    },
    employeeId: {
      type: String,
      default: "",
    },
    profilePicture: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

export default mongoose.model("AdminProfile", AdminProfileSchema);
