// models/Department.js
import mongoose from "mongoose";

const departmentSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  hods: [
    {
      user: { type: mongoose.Schema.Types.ObjectId, ref: "user" }, // link to user table
      name: String,
      email: String
    }
  ]
});

export default mongoose.models.Department || mongoose.model("Department", departmentSchema);
