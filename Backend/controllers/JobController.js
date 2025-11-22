import Job from "../models/Job.js";
import Application from "../models/Application.js";
import RequisitionForm from "../models/RequisitionForm.js";
import { createNotification, broadcastToRole } from "../utils/notify.js";
import User from "../models/user.js";
import sendEmail from "../utils/sendEmail.js";

export const createJob = async (req, res) => {
  try {
    const allowedRoles = ["recruiter", "admin", "superAdmin", "hr"];
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Forbidden: You are not authorized to create jobs.",
      });
    }

    const { reqNo } = req.body;
    const formattedReqId = `MMCL-Req-${reqNo.padStart(5, "0")}`;

    const requisition = await RequisitionForm.findOne({
      reqId: formattedReqId,
    });
    if (!requisition) {
      return res.status(404).json({ message: "Requisition form not found." });
    }

    if (requisition.job) {
      const existingJob = await Job.findById(requisition.job);
      if (existingJob) {
        return res.status(400).json({
          message: `A job (${existingJob.jobId}) already exists for this requisition.`,
        });
      }
    }
    const job = await Job.create({
      ...req.body,
      title: req.body.title || requisition.position, // Use requisition position as fallback
      position: req.body.position || requisition.position,
      department: req.body.department || requisition.department,
      location: req.body.location || requisition.location,
      experienceRequired: req.body.experienceRequired || requisition.experience,
      qualificationRequired:
        req.body.qualificationRequired || requisition.academicQualification,
      salaryRange: req.body.salaryRange || {
        min: requisition.salary,
        max: requisition.salary,
      },

      reqId: requisition.reqId,
      requisition: requisition._id,
      createdBy: req.user._id,
    });

    requisition.job = job._id;
    await requisition.save();

    if (job.isPublished) {
      const title = `New Job Posted: ${job.title}`;
      const message = `A new job for ${job.title} has been posted. Check it out.`;
      const link = `/jobs/${job._id}/apply`;
      broadcastToRole({ role: "user", title, message, link }).catch((e) =>
        console.warn("broadcastToRole failed:", e.message || e)
      );
    }

    if (String(requisition.createdBy) !== String(req.user._id)) {
      const subRecruiter = await User.findById(requisition.createdBy);
      if (subRecruiter) {
        await createNotification({
          userId: requisition.createdBy,
          title: "Job Created for your Requisition",
          message: `A new job (${job.jobId}) has been created for your requisition ${requisition.reqId}.`,
          link: `/requisitions/view/${requisition._id}`,
        });

        const isFullyApproved =
          requisition.approvals?.departmentHead?.approval?.status ===
            "approved" &&
          requisition.approvals?.hr?.approval?.status === "approved" &&
          requisition.approvals?.coo?.approval?.status === "approved";

        if (isFullyApproved) {
          await sendEmail(
            subRecruiter.email,
            "Job Created for your Requisition",
            `A new job (${job.jobId}) has been created for your requisition ${requisition.reqId} (${requisition.position}).\n\nJob Title: ${job.title}\nDepartment: ${job.department}\nLocation: ${job.location}\n\nView the job: ${process.env.FRONTEND_URL}/jobs/${job._id}/apply`
          ).catch((e) =>
            console.warn("Email to sub-recruiter failed:", e.message || e)
          );
        }
      }
    }

    const isFullyApproved =
      requisition.approvals?.departmentHead?.approval?.status === "approved" &&
      requisition.approvals?.hr?.approval?.status === "approved" &&
      requisition.approvals?.coo?.approval?.status === "approved";

    if (isFullyApproved) {
      const recruiters = await User.find({ role: "recruiter" }).select(
        "email name"
      );
      Promise.all(
        recruiters.map((recruiter) =>
          sendEmail(
            recruiter.email,
            "New Job Created from Approved Requisition",
            `A new job has been created from an approved requisition.\n\nJob ID: ${job.jobId}\nJob Title: ${job.title}\nPosition: ${requisition.position}\nDepartment: ${job.department}\nLocation: ${job.location}\nRequisition ID: ${requisition.reqId}\n\nView the job: ${process.env.FRONTEND_URL}/jobs/${job._id}\nView requisition: ${process.env.FRONTEND_URL}/requisitions/view/${requisition._id}`
          ).catch((e) =>
            console.warn("Email to recruiter failed:", e.message || e)
          )
        )
      ).catch((e) =>
        console.warn(
          "Parallel email send to recruiters failed:",
          e.message || e
        )
      );
    }

    res.status(201).json({ success: true, job });
  } catch (e) {
    console.error("Error in createJob:", e);
    res.status(500).json({ success: false, message: e.message });
  }
};

export const listJobsPublic = async (_req, res) => {
  const today = new Date();
  try {
    const jobs = await Job.find({
      $or: [
        { status: "Open" },
        {
          status: { $exists: false },
          isPublished: true,
          "approval.status": "approved",
        },
      ],
      deadline: { $gte: today },
    })
      .populate({
        // <--- START CHANGE
        path: "requisition",
        select: "softSkills technicalSkills",
      })
      .sort({ createdAt: -1 });

    res.json(jobs);
  } catch (error) {
    console.error("Error in listJobsPublic:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

// --- listJobsPending ---
export const listJobsPending = async (_req, res) => {
  const jobs = await Job.find({ "approval.status": "pending" })
    .populate("createdBy", "name email")
    .sort({ createdAt: -1 });
  res.json({ jobs });
};

// --- getJob ---
export const getJob = async (req, res) => {
  try {
    const job = await Job.findById(req.params.jobId)
      .populate("createdBy", "name email designation")
      .populate("requisition", "technicalSkills softSkills");
    if (!job) return res.status(404).json({ message: "Job not found" });
    res.json(job);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

// --- reviewJob ---
export const reviewJob = async (req, res) => {
  const { action, comments } = req.body;
  const job = await Job.findById(req.params.id);
  if (!job) return res.status(404).json({ message: "Job not found" });

  if (action === "approve") {
    job.approval = {
      status: "approved",
      reviewer: req.user._id,
      comments: comments || "",
      reviewedAt: new Date(),
    };
    job.isPublished = true;
    job.status = "Open";
  } else if (action === "reject") {
    job.approval = {
      status: "rejected",
      reviewer: req.user._id,
      comments: comments || "",
      reviewedAt: new Date(),
    };
    job.isPublished = false;
  } else {
    return res.status(400).json({ message: "Invalid action" });
  }

  await job.save();
  res.json(job);
};

// --- listJobsMine ---
export const listJobsMine = async (req, res) => {
  try {
    const jobs = await Job.find({ createdBy: req.user._id }).sort({
      createdAt: -1,
    });

    const jobsWithStats = await Promise.all(
      jobs.map(async (job) => {
        const total = await Application.countDocuments({ job: job._id });
        const shortlisted = await Application.countDocuments({
          job: job._id,
          "currentStatus.code": "shortlisted", // <-- Corrected field
        });
        const rejected = await Application.countDocuments({
          job: job._id,
          "currentStatus.code": "rejected", // <-- Corrected field
        });

        return {
          ...job.toObject(),
          stats: { total, shortlisted, rejected },
        };
      })
    );

    res.json(jobsWithStats);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

// --- listAllJobs ---
export const listAllJobs = async (req, res) => {
  try {
    const { department, status } = req.query;
    let filter = {};

    if (status === "Open") {
      filter = {
        $or: [
          { status: "Open" },
          {
            status: { $exists: false },
            isPublished: true,
            "approval.status": "approved",
          },
        ],
      };
    } else if (status === "Closed") {
      filter = { status: "Closed" };
    } else if (!status) {
      filter = {
        $or: [
          { status: "Open" },
          {
            status: { $exists: false },
            isPublished: true,
            "approval.status": "approved",
          },
        ],
      };
    }

    if (department && department !== "All Departments") {
      filter.department = department;
    }

    const jobs = await Job.find(filter)
      .populate("createdBy", "name email")
      .populate("requisition")
      .sort({ createdAt: -1 });

    res.json({ jobs });
  } catch (error) {
    console.error("Error in listAllJobs:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

// --- UPDATED deleteJob (NO notifications on delete) ---
export const deleteJob = async (req, res) => {
  try {
    const jobId = req.params.jobId;
    const job = await Job.findById(jobId).populate("requisition", "createdBy");
    if (!job) return res.status(404).json({ message: "Job not found" });

    const isOwner = String(job.createdBy) === String(req.user._id);
    const isAdmin = ["admin", "superAdmin", "hr"].includes(req.user.role); // Also allow HR
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: "Forbidden" });
    }

    if (job.requisition) {
      await RequisitionForm.updateOne(
        { _id: job.requisition._id },
        { $set: { job: null } }
      );
    }

    await Application.deleteMany({ job: job._id });

    await Job.findByIdAndDelete(jobId);

    res.json({
      message: "Job and related applications deleted. Requisition is now open.",
    });
  } catch (e) {
    console.error("Error in deleteJob:", e);
    res.status(500).json({ message: e.message });
  }
};

// --- assignInterviewer ---
export const assignInterviewer = async (req, res) => {
  try {
    const { jobId } = req.params;
    const { name, email, type = "first-interview", date } = req.body;
    if (!name || !email)
      return res.status(400).json({ message: "Name and email required" });

    const job = await Job.findById(jobId);
    if (!job) return res.status(404).json({ message: "Job not found" });

    if (
      String(job.createdBy) !== String(req.user._id) &&
      !["admin", "superAdmin", "hr"].includes(req.user.role)
    ) {
      return res.status(403).json({ message: "Forbidden" });
    }

    let interviewerUser = await User.findOne({ email });
    if (!interviewerUser) {
      interviewerUser = await User.create({
        name,
        email,
        role: "interviewer",
        password: "Temp@123",
        otp: Math.floor(100000 + Math.random() * 900000).toString(),
        is_verified: true,
      });
    } else {
      if (
        ![
          "interviewer",
          "recruiter",
          "admin",
          "superAdmin",
          "hr",
          "hod",
          "coo",
        ].includes(interviewerUser.role)
      ) {
        if (interviewerUser.role === "user") {
          interviewerUser.role = "interviewer";
          await interviewerUser.save();
        }
      }
    }

    const already = job.interviewers.some(
      (i) => String(i.user) === String(interviewerUser._id) && i.type === type
    );
    if (already) {
      return res
        .status(400)
        .json({ message: "Interviewer already assigned for this type" });
    }

    job.interviewers.push({
      name,
      email,
      user: interviewerUser._id,
      type,
      date: date ? new Date(date) : undefined,
      addedBy: req.user._id,
    });

    await job.save();

    try {
      await sendEmail(
        interviewerUser.email,
        `Assigned as Interviewer — ${job.title || job.position}`,
        `You are assigned as ${type.replace("-", " ")} interviewer.`,
        `<p>Hi ${name},</p><p>You were assigned as an interviewer for <b>${
          job.title || job.position
        }</b> scheduled at ${
          date ? new Date(date).toLocaleString() : "TBD"
        }.</p>`
      );
    } catch (e) {
      console.warn("Email failed:", e.message || e);
    }

    await createNotification({
      userId: interviewerUser._id,
      title: "You've been assigned an interview",
      message: `You are assigned as ${type.replace("-", " ")} interviewer for ${
        job.title
      }.`,
      link: `/interviewer/jobs`, // Link to their dashboard
    });

    const populated = await Job.findById(jobId).populate(
      "interviewers.user",
      "name email role"
    );
    res.json({ message: "Interviewer assigned", job: populated });
  } catch (err) {
    console.error("assignInterviewer:", err);
    res.status(500).json({ message: err.message });
  }
};

// --- removeInterviewer ---
export const removeInterviewer = async (req, res) => {
  try {
    const { jobId } = req.params;
    const { interviewerId } = req.body; // This is the _id of the interviewer sub-document
    const job = await Job.findById(jobId);
    if (!job) return res.status(404).json({ message: "Job not found" });

    if (
      String(job.createdBy) !== String(req.user._id) &&
      !["admin", "superAdmin", "hr"].includes(req.user.role)
    ) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const interviewerEntry = job.interviewers.find(
      (i) => String(i._id) === String(interviewerId)
    );

    job.interviewers = job.interviewers.filter(
      (i) => String(i._id) !== String(interviewerId)
    );
    await job.save();

    if (interviewerEntry) {
      await createNotification({
        userId: interviewerEntry.user,
        title: "Interview Assignment Removed",
        message: `You have been unassigned as an interviewer for ${job.title}.`,
        link: `/interviewer/jobs`,
      });
    }

    res.json({ message: "Interviewer removed", job });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// --- getJobWithInterviewers ---
export const getJobWithInterviewers = async (req, res) => {
  try {
    const job = await Job.findById(req.params.jobId)
      .populate("interviewers.user", "name email role")
      .populate("createdBy", "name email");
    if (!job) return res.status(404).json({ message: "Job not found" });
    res.json(job);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// --- listInterviewerJobs ---
export const listInterviewerJobs = async (req, res) => {
  try {
    const jobs = await Job.find({ "interviewers.user": req.user._id })
      .populate("createdBy", "name email")
      .populate("interviewers.user", "name email role")
      .sort({ createdAt: -1 })
      .lean();

    const jobsWithCounts = await Promise.all(
      jobs.map(async (job) => {
        const totalApplicants = await Application.countDocuments({
          job: job._id,
        });

        const myStages = job.interviewers
          .filter((i) => String(i.user._id) === String(req.user._id))
          .map((i) => i.type);

        const myPending = await Application.countDocuments({
          job: job._id,
          "currentStatus.code": {
            $in: myStages.length > 0 ? myStages : ["n/a"],
          },
        });
        const rejected = await Application.countDocuments({
          job: job._id,
          "currentStatus.code": "rejected",
        });

        return {
          ...job,
          stats: {
            totalApplicants,
            myPending,
            rejected,
          },
        };
      })
    );

    res.json(jobsWithCounts);
  } catch (err) {
    console.error("listInterviewerJobs error:", err);
    res.status(500).json({ message: err.message });
  }
};

export const updateJobStatus = async (req, res) => {
  try {
    const { jobId } = req.params;
    const { status } = req.body;

    if (!["Open", "Closed"].includes(status)) {
      return res.status(400).json({ message: "Invalid status provided." });
    }

    const updateData = { status };
    if (status === "Closed") {
      updateData.closedAt = new Date();
    }

    const job = await Job.findByIdAndUpdate(
      jobId,
      { $set: updateData },
      { new: true }
    ).populate("requisition"); // Populate requisition to get creator

    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }

    await createNotification({
      userId: job.createdBy,
      title: "Job Status Updated",
      message: `The status of your job "${job.title}" has been set to ${status}.`,
      link: `/recruiter/job/${job._id}/applications`,
    });

    if (
      job.requisition &&
      String(job.requisition.createdBy) !== String(job.createdBy)
    ) {
      await createNotification({
        userId: job.requisition.createdBy,
        title: "Job Status Updated",
        message: `The status of the job for your requisition "${job.reqId}" has been set to ${status}.`,
        link: `/requisitions/view/${job.requisition._id}`,
      });
    }

    res.json({ message: `Job status updated to ${status}`, job });
  } catch (err) {
    console.error("updateJobStatus error:", err);
    res.status(500).json({ message: err.message });
  }
};
