import mongoose from "mongoose";

// --- approvalSchema (unchanged) ---
const approvalSchema = new mongoose.Schema({
  status: {
    type: String,
    enum: ["pending", "approved", "rejected"],
    default: "pending"
  },
  reviewer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "user"
  },
  comments: String,
  reviewedAt: Date,
}, { _id: false });

// --- hrActionSchema (unchanged) ---
const hrActionSchema = new mongoose.Schema({
  action: {
    type: String,
    enum: ["Data Bank", "Advertisement", "Head Hunter", "Internal"],
  },
  comments: String,
  representative: {
    name: String,
    desig: String,
  },
  signedAt: Date,
}, { _id: false });

const requisitionFormSchema = new mongoose.Schema({
  // --- All existing fields (unchanged) ---
  natureOfEmployment: {
    type: String,
    enum: ["Permanent", "Contract", "Management Trainee", "Temporary", "Trainee", "Daily Wages"],
    required: true
  },
  position: { type: String, required: true },
  department: { type: String, required: true },
  requisitionType: { type: String, enum: ["New", "Replacement"], required: true },
  location: { type: String, required: true },
  company: { type: String, required: true },
  reportedTo: {
    name: String,
    desig: String,
  },
  grade: String,
  salary: Number,
  age: Number,
  gender: { type: String, enum: ["Male", "Female", "Other"] },
  replacementDetail: {
    name: String,
    desig: String,
    grade: String,
    salary: Number,
    age: Number,
    leavingDate: Date,
    reason: {
      type: String,
      enum: ["Resigned", "Terminated", "Transfer", "Retirement", "ReDesignation", "Promoted"],
      required: function () {
        return this.requisitionType === "Replacement";
      }
    }
  },
  description: { type: String, required: true },
  academicQualification: { type: String, required: true },
  professionalQualification: { type: String, required: true },
  experience: String,
  softSkills: { type: [String], required: true },
  technicalSkills: { type: [String], required: true },
  desiredDateJoin: Date,
  approvedPosition: { type: String, enum: ["Yes", "No"], required: true },
  approvals: {
    raisedBy: {
      info: { name: String, desig: String },
      approval: { type: approvalSchema, default: () => ({}) }
    },
    departmentHead: {
      info: { name: String, desig: String },
      approval: { type: approvalSchema, default: () => ({}) }
    },
    hr: {
      approval: { type: approvalSchema, default: () => ({}) },
      receiving: {
        name: String,
        desig: String,
        signedAt: Date,
        comments: String
      },
      actions: [hrActionSchema]
    },
    coo: {
      approval: { type: approvalSchema, default: () => ({}) }
    }
  },
  assignedHod: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "user"
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "user",
    required: true
  },
  isPublished: { type: Boolean, default: false },
  reqId: {
    type: String,
    unique: true,
  },

  job: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Job",
    default: null
  },

}, { timestamps: true });


requisitionFormSchema.pre("save", async function (next) {
  if (this.reqId) return next(); 

  try {
    const lastReq = await this.constructor.findOne({}, { reqId: 1 })
      .sort({ createdAt: -1 })
      .lean();

    let nextNumber = 1;
    if (lastReq && lastReq.reqId) {
      const lastNumber = parseInt(lastReq.reqId.split("-").pop(), 10);
      if (!isNaN(lastNumber)) nextNumber = lastNumber + 1; // Check for NaN
    }
    
    this.reqId = `Req-${String(nextNumber).padStart(5, "0")}`;
    next();
  } catch (err) {
    next(err);
  }
});

export default mongoose.models.RequisitionForm || mongoose.model("RequisitionForm", requisitionFormSchema);