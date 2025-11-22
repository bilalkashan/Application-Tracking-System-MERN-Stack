import mongoose from "mongoose";

const approvalSchema = new mongoose.Schema(
  {
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    reviewer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
    },
    comments: String,
    reviewedAt: Date,
  },
  { _id: false }
);

// Interviewer Schema
const interviewerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "user" }, // optional link to account
    type: {
      type: String,
      enum: ["first-interview", "second-interview"],
      default: "first-interview",
    },
    date: { type: Date, required: true },
    addedBy: { type: mongoose.Schema.Types.ObjectId, ref: "user" }, // recruiter who assigned
    notified: { type: Boolean, default: false }, // if notification/email sent
  },
  { timestamps: true }
);

// Candidate Remarks Schema
const candidateRemarkSchema = new mongoose.Schema(
  {
    application: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Application",
      required: true,
    },
    interviewer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
    round: {
      type: String,
      enum: ["first-interview", "second-interview"],
      required: true,
    },
    remarks: { type: String, required: true },
    rating: { type: Number, min: 1, max: 5 },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

// Job Schema
const jobSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    department: { type: String, required: true },
    designation: { type: String, required: true },
    description: { type: String, required: true },
    experienceRequired: { type: String, required: true },
    location: { type: String, required: true },
    type: {
      type: String,
      enum: ["full-time", "part-time", "contract", "internship"],
      default: "full-time",
    },
    qualificationRequired: { type: String, required: true },
    deadline: { type: Date, required: true },
    comments: { type: String },
    salaryRange: {
      min: { type: Number, required: true },
      max: { type: Number, required: true },
      currency: { type: String, default: "PKR" },
    },
    budget: {
      type: String,
      enum: ["Budgeted", "Non-budgeted"],
      default: "Budgeted",
    },
    jobId: { type: String, unique: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "user", required: true },
    approval: { type: approvalSchema, default: () => ({}) },
    isPublished: { type: Boolean, default: false },
    status: {
        type: String,
        enum: ['Draft', 'Open', 'Closed'],
        default: 'Draft'
    },
    closedAt: { type: Date }, 
    reqId: { type: String, required: true },
    requisition: { type: mongoose.Schema.Types.ObjectId, ref: "RequisitionForm", required: true },
    interviewers: [interviewerSchema],
    candidateRemarks: [candidateRemarkSchema],
  },
  { timestamps: true }
);

// Auto-generate jobId
jobSchema.pre("save", async function (next) {
  if (!this.jobId) {
    const lastJob = await this.constructor.findOne({}).sort({ _id: -1 });
    let newJobIdNumber = 1;
    if (lastJob?.jobId) {
      const lastNumber = parseInt(lastJob.jobId.split("-")[2]);
      if (!isNaN(lastNumber)) newJobIdNumber = lastNumber + 1;
    }
    this.jobId = `Job-${String(newJobIdNumber).padStart(5, "0")}`;
  }
  next();
});

export default mongoose.models.Job || mongoose.model("Job", jobSchema);