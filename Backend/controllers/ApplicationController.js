import path from "path";
import fs from "fs";
import multer from "multer";
import { fileURLToPath } from "url";
import Application from "../models/Application.js";
import Job from "../models/Job.js";
import Profile from "../models/Profile.js";
import sendEmail from "../utils/sendEmail.js";
import {
  getStatusEmail,
  getApplicationReceivedEmail,
} from "../utils/emailTemplates.js";
import { createNotification, broadcastToRole } from "../utils/notify.js";
import { calculateMatchingScore } from "../controllers/ScoreMatchingController.js";
import { PDFDocument, rgb, StandardFonts, cmyk } from "pdf-lib";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadDir = path.join(__dirname, "..", "uploads", "resumes");
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const safeBase = path
      .parse(file.originalname)
      .name.replace(/[^a-z0-9_-]+/gi, "-");
    const ext = path.extname(file.originalname).toLowerCase();
    const uid = req.user?._id?.toString() || "anon";
    cb(null, `${safeBase}-${uid}-${Date.now()}${ext}`);
  },
});
const fileFilter = (_req, file, cb) => {
  const allowed = [".pdf", ".doc", ".docx"];
  const ext = path.extname(file.originalname).toLowerCase();
  if (!allowed.includes(ext))
    return cb(new Error("Only PDF, DOC, and DOCX files are allowed"));
  cb(null, true);
};
export const resumeUpload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});

const onboardingUploadDir = path.join(__dirname, "..", "uploads", "onboarding");
fs.mkdirSync(onboardingUploadDir, { recursive: true });

const onboardingStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, onboardingUploadDir),
  filename: (req, file, cb) => {
    const safeBase = path
      .parse(file.originalname)
      .name.replace(/[^a-z0-9_-]+/gi, "-");
    const ext = path.extname(file.originalname).toLowerCase();
    const uid = req.user?._id?.toString() || "anon";
    cb(null, `${safeBase}-${uid}-${Date.now()}${ext}`);
  },
});

const onboardingFileFilter = (_req, file, cb) => {
  const allowed = [".pdf", ".doc", ".docx", ".jpg", ".jpeg", ".png"];
  const ext = path.extname(file.originalname).toLowerCase();
  if (!allowed.includes(ext))
    return cb(new Error("Only PDF, DOC, or Image files are allowed"));
  cb(null, true);
};

export const onboardingUpload = multer({
  storage: onboardingStorage,
  fileFilter: onboardingFileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
});


export const applyToJob = async (req, res) => {
  try {
    const job = await Job.findById(req.params.jobId)
      .populate("createdBy", "name email") // --- Populated job creator
      .populate({
        path: "requisition",
        select: "createdBy technicalSkills softSkills",
      });

    if (!job || !job.isPublished)
      return res.status(404).json({ message: "Job not available" });
    if (!req.file)
      return res.status(400).json({ message: "Resume file is required" });

    const existing = await Application.findOne({
      job: job._id,
      applicant: req.user._id,
    });
    if (existing) return res.status(400).json({ message: "Already applied" });

    const { source } = req.body;

    const app = new Application({
      job: job._id,
      applicant: req.user._id,
      resumePath: `/uploads/resumes/${req.file.filename}`,
      source: source || "Unknown",
      currentStatus: {
        code: "applied",
        by: req.user._id,
        note: "Application submitted",
        at: new Date(),
      },
      history: [
        {
          code: "applied",
          by: req.user._id,
          note: "Application submitted",
          at: new Date(),
        },
      ],
    });

    app.matchingScore = await calculateMatchingScore(app);
    await app.save();

    const applicant = req.user;
    const recruiter = job.createdBy;
    const subRecruiterId = job.requisition?.createdBy;

    const emailTemplate = getApplicationReceivedEmail(job.title);
    sendEmail(
      applicant.email,
      emailTemplate.subject,
      emailTemplate.text,
      emailTemplate.html
    ).catch(console.error);

    createNotification({
      userId: applicant._id,
      title: "Application Received!",
      message: `You successfully applied for the ${job.title} position.`,
      link: `/me/applications`,
    }).catch(console.error);

    createNotification({
      userId: recruiter._id,
      title: "New Application Received",
      message: `${applicant.name} applied for the ${job.title} position.`,
      link: `/recruiter/job/${job._id}/applications`,
    }).catch(console.error);

    if (subRecruiterId && String(subRecruiterId) !== String(recruiter._id)) {
      createNotification({
        userId: subRecruiterId,
        title: "New Application for your Requisition",
        message: `${applicant.name} applied for the ${job.title} (Req: ${job.reqId}).`,
        link: `/requisitions`, 
      }).catch(console.error);
    }

    res.status(201).json(app);
  } catch (e) {
    console.error("Error in applyToJob:", e);
    res.status(500).json({ message: e.message || "Server error" });
  }
};

export const listJobApplications = async (req, res) => {
  const jobId = req.params.jobId;
  const apps = await Application.find({ job: jobId })
    .populate(
      "applicant",
      "name email phone skills qualifications experience summary"
    )
    .sort({ createdAt: -1 });
  res.json(apps);
};

export const listMyApplications = async (req, res) => {
  const apps = await Application.find({ applicant: req.user._id })
    .populate(
      "job",
      "title department designation location description comments salaryRange experienceRequired qualificationRequired deadline type reqNo requisition interviewers"
    )
    .sort({ createdAt: -1 });
  res.json(apps);
};

export const listAllApplications = async (_req, res) => {
  const apps = await Application.find()
    .populate({
      path: "job",
      select: "title department location createdBy interviewers",
      populate: {
        path: "interviewers.user",
        select: "_id name email", 
      },
    })
    .populate("applicant", "name email profilePicture") 
    .sort({ createdAt: -1 });
  res.json(apps);
};

export const updateStatus = async (req, res) => {
  try {
    const { appId } = req.params;
    const { code, note, interviewDate } = req.body;
    const userId = req.user._id;

    const app = await Application.findById(appId)
      .populate("applicant", "name email")
      .populate({
        path: "job",
        select: "title createdBy requisition interviewers",
        populate: {
          path: "requisition",
          select: "createdBy",
        },
      });

    if (!app) return res.status(404).json({ message: "Application not found" });

    app.currentStatus = { code, by: userId, note, at: new Date() };
    app.history.push({ code, by: userId, note, at: new Date() });

    if (code.includes("interview") && interviewDate) {
      app.interviewSchedule = {
        stage: code,
        date: new Date(interviewDate),
      };
    }

    await app.save();

    if (code === "hired") {
      await Job.findByIdAndUpdate(app.job._id, {
        status: "Closed",
        closedAt: new Date(),
      });

      const subject = `Welcome to MMCL! Please Submit Your Documents`;
      const text = `Hi ${app.applicant.name},\n\nCongratulations on your new position! To complete your onboarding, please log in to the portal and submit the required documents from the 'Submit Documents' tab.\n\nThank you,\nMMCL HR Team`;
      const html = `<p>Hi ${app.applicant.name},</p><p>Congratulations on your new position! To complete your onboarding, please log in to the portal and submit the required documents from the 'Submit Documents' tab.</p><p>Thank you,<br>MMCL HR Team</p>`;
      sendEmail(app.applicant.email, subject, text, html).catch(console.error);

      createNotification({
        userId: app.applicant._id,
        title: `Welcome Aboard!`,
        message: `Congratulations! Please submit your required documents to complete onboarding.`,
        link: `/me/onboarding`,
      }).catch(console.error);
    } else if (app.applicant?.email) {
      const template = getStatusEmail(code, app.job?.title, note);
      sendEmail(
        app.applicant.email,
        template.subject,
        template.text,
        template.html
      ).catch(console.error);

      createNotification({
        userId: app.applicant._id,
        title: `Update on your ${app.job.title} application`,
        message: `Your application status has been updated to: ${code.replace(
          "-",
          " "
        )}.`,
        link: `/me/applications`,
      }).catch(console.error);
    }

    const recruiterId = app.job.createdBy;
    const subRecruiterId = app.job.requisition?.createdBy;
    const applicantName = app.applicant.name;
    const jobTitle = app.job.title;

    if (
      code === "hired" ||
      code === "rejected" ||
      code === "offer-accepted" ||
      code === "offer-rejected"
    ) {
      const message = `Application for ${applicantName} (${jobTitle}) was updated to: ${code}.`;
      createNotification({
        userId: recruiterId,
        title: `Application Status Updated: ${applicantName}`,
        message: message,
        link: `/recruiter/job/${app.job._id}/applications`,
      }).catch(console.error);

      if (subRecruiterId && String(subRecruiterId) !== String(recruiterId)) {
        createNotification({
          userId: subRecruiterId,
          title: `Application Status Updated: ${applicantName}`,
          message: message,
          link: `/requisitions`,
        }).catch(console.error);
      }
    }

    if (code === "first-interview" || code === "second-interview") {
      const interviewers = app.job.interviewers?.filter((i) => i.type === code);
      for (const interviewer of interviewers) {
        createNotification({
          userId: interviewer.user,
          title: `New Interview Scheduled: ${applicantName}`,
          message: `${applicantName} is ready for their ${code} for ${jobTitle}.`,
          link: `/interviewer/job/${app.job._id}/applications`,
        }).catch(console.error);
      }
    }

    let populated = await Application.findById(appId)
      .populate("job", "title department location createdBy designation grade")
      .populate("applicant", "name email");

    let profile = await Profile.findOne({ user: populated.applicant._id })
      .populate("user", "name email userId role")
      .lean();

    if (profile) {
      if (profile.profilePicture) {
        const picPath = path.join(
          __dirname,
          "..",
          profile.profilePicture.replace(/^\//, "")
        );
        if (!fs.existsSync(picPath)) {
          console.warn(
            "⚠️ Profile picture missing on disk:",
            profile.profilePicture
          );
          profile.profilePicture = null;
        }
      }

      profile = {
        ...profile,
        name: profile.user?.name || profile.name,
        email: profile.user?.email || populated.applicant?.email,
        userId: profile.user?.userId,
        role: profile.user?.role,
      };
    }

    const resumeUrl = populated.resumePath
      ? `${process.env.BASE_URL || "http://localhost:8080"}${
          populated.resumePath
        }`
      : null;

    res.json({
      ...populated.toObject(),
      applicantProfile: profile,
      resumeUrl,
    });
  } catch (err) {
    console.error("updateStatus error:", err);
    res.status(500).json({ message: err.message });
  }
};

export const getApplicantDetails = async (req, res) => {
  try {
    const app = await Application.findById(req.params.appId)
      .populate("job", "title department location createdBy designation grade")
      .populate("applicant", "name email");

    if (!app) return res.status(404).json({ message: "Application not found" });

    if (
      req.user.role === "recruiter" &&
      String(app.job?.createdBy) !== String(req.user._id)
    ) {
      return res.status(403).json({ message: "Forbidden" });
    }

    let profile = await Profile.findOne({ user: app.applicant._id })
      .populate("user", "name email userId role")
      .lean();

    if (profile) {
      if (profile.profilePicture) {
        const picPath = path.join(
          __dirname,
          "..",
          profile.profilePicture.replace(/^\//, "")
        );
        if (!fs.existsSync(picPath)) {
          console.warn(
            "⚠️ Profile picture missing on disk:",
            profile.profilePicture
          );
          profile.profilePicture = null;
        }
      }

      profile = {
        ...profile,
        name: profile.user?.name || profile.name,
        email: profile.user?.email || app.applicant?.email,
        userId: profile.user?.userId,
        role: profile.user?.role,
      };
    }

    const resumeUrl = app.resumePath
      ? `${process.env.BASE_URL || "http://localhost:8080"}${app.resumePath}`
      : null;

    res.json({
      ...app.toObject(),
      applicantProfile: profile,
      resumeUrl,
    });
  } catch (err) {
    console.error("getApplicantDetails error:", err);
    res.status(500).json({ message: err.message });
  }
};

export const getApplicationWithRemarks = async (req, res) => {
  try {
    const app = await Application.findById(req.params.appId)
      .populate("applicant", "name email")
      .populate("job", "title createdBy interviewers")
      .populate("remarks.interviewer", "name email role")
      .lean();

    if (!app) return res.status(404).json({ message: "Application not found" });

    const job = await Job.findById(app.job._id);
    if (!job)
      return res.status(404).json({ message: "Associated job not found" });

    const isAssigned = job.interviewers.some(
      (i) => String(i.user) === String(req.user._id)
    );
    const isOwner = String(job.createdBy) === String(req.user._id);
    if (
      !isAssigned &&
      !isOwner &&
      !["admin", "superAdmin", "hr"].includes(req.user.role) 
    ) {
      return res.status(403).json({ message: "Forbidden" });
    }

    let profile = await Profile.findOne({ user: app.applicant._id })
      .populate("user", "name email userId role")
      .lean();

    if (profile) {
      if (profile.profilePicture) {
        const picPath = path.join(
          __dirname,
          "..",
          profile.profilePicture.replace(/^\//, "")
        );
        if (!fs.existsSync(picPath)) {
          console.warn(
            "⚠️ Profile picture missing on disk:",
            profile.profilePicture
          );
          profile.profilePicture = null;
        }
      }

      profile = {
        ...profile,
        name: profile.user?.name || profile.name,
        email: profile.user?.email || app.applicant?.email,
        userId: profile.user?.userId,
        role: profile.user?.role,
      };
    }
    const resumeUrl = app.resumePath
      ? `${process.env.BASE_URL || "http://localhost:8080"}${app.resumePath}`
      : null;
    res.json({ ...app, applicantProfile: profile, resumeUrl });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const addRemark = async (req, res) => {
  try {
    const { appId } = req.params;
    const remarkDataFromRequest = req.body;
    const userId = req.user?._id;

    if (!userId) {
      return res.status(401).json({ message: "Authentication required." });
    }

    const { interviewType, evaluations, recommendation, generalImpression } =
      remarkDataFromRequest;
    if (
      !interviewType ||
      !["first-interview", "second-interview"].includes(interviewType)
    ) {
      return res.status(400).json({ message: "Valid interview type required" });
    }
    if (evaluations !== undefined && !Array.isArray(evaluations)) {
      return res.status(400).json({ message: "Evaluations must be an array" });
    }
    if (
      evaluations &&
      evaluations.some(
        (ev) =>
          !ev.competency ||
          typeof ev.rating !== "number" ||
          ev.rating < 1 ||
          ev.rating > 5
      )
    ) {
      return res.status(400).json({
        message: "Each evaluation must have competency and rating (1-5).",
      });
    }
    if (!recommendation)
      return res.status(400).json({ message: "Recommendation is required." });
    if (!generalImpression)
      return res
        .status(400)
        .json({ message: "General Impression is required." });

    const app = await Application.findById(appId)
      .populate({
        path: "job",
        select: "createdBy interviewers title", 
      })
      .populate("applicant", "name"); 

    if (!app) return res.status(404).json({ message: "Application not found" });
    if (!app.job)
      return res.status(404).json({ message: "Associated job not found." });

    const job = app.job;

    const isRecruiter = String(job.createdBy) === String(userId);
    const isAssignedInterviewer = job.interviewers?.some(
      (i) => String(i.user) === String(userId)
    );
    const isAdminOrHR = ["admin", "superAdmin", "hr"].includes(req.user.role);

    if (!isRecruiter && !isAssignedInterviewer && !isAdminOrHR) {
      console.warn(
        `AUTH FAIL: User ${userId} (Role: ${req.user.role}) trying to add remark.`
      );
      return res
        .status(403)
        .json({ message: "Forbidden: Not authorized to add remarks." });
    }

    const remarkRole = isAdminOrHR
      ? req.user.role
      : isRecruiter
      ? "recruiter"
      : "interviewer";

    const remarkData = {
      ...remarkDataFromRequest, 
      interviewer: userId, 
      role: remarkRole, 
      createdAt: new Date(),
    };

    const existingRemarkIndex = app.remarks.findIndex(
      (r) =>
        String(r.interviewer) === String(userId) &&
        r.interviewType === interviewType
    );

    if (existingRemarkIndex > -1) {
      app.remarks[existingRemarkIndex] = {
        ...app.remarks[existingRemarkIndex].toObject(),
        ...remarkData,
      };
    } else {
      app.remarks.push(remarkData);
    }

    await app.save();

    if (isAssignedInterviewer && !isRecruiter) {
      createNotification({
        user: job.createdBy,
        title: "New Remark Submitted",
        message: `${req.user.name} submitted remarks for ${app.applicant.name} (${job.title}).`,
        link: `/recruiter/job/${job._id}/applications`,
      }).catch(console.error);
    }

    await app.populate({
      path: "remarks.interviewer",
      select: "name email role",
    });

    const populatedRemark = app.remarks.find(
      (r) =>
        String(r.interviewer._id) === String(userId) &&
        r.interviewType === interviewType
    );

    res.status(200).json({
      message: "Remark added successfully",
      remark: populatedRemark,
    });
  } catch (error) {
    console.error("Error adding remark:", error);
    if (error.name === "ValidationError") {
      res.status(400).json({ message: `Validation Error: ${error.message}` });
    } else {
      res.status(500).json({ message: "Server error while adding remark." });
    }
  }
};

export const createOrUpdateOffer = async (req, res) => {
  try {
    const { appId } = req.params;
    const offerData = req.body;

    const app = await Application.findById(appId)
      .populate("applicant", "name email")
      .populate({
        path: "job",
        select: "title requisition",
        populate: {
          path: "requisition",
          select: "assignedHod createdBy", 
        },
      });

    if (!app) return res.status(404).json({ message: "Application not found" });

    const hodId = app.job?.requisition?.assignedHod;
    if (!hodId) {
      return res
        .status(400)
        .json({ message: "Cannot send offer: No HOD assigned." });
    }

    app.offer = {
      ...offerData,
      sentBy: req.user._id,
      sentAt: new Date(),
      approvalStatus: "pending_hod",
      hodApproval: { status: "pending" },
      cooApproval: { status: "pending" },
      status: "pending",
    };

    const newStatus = {
      code: "offer",
      by: req.user._id,
      note: "Offer submitted for HOD approval.",
      at: new Date(),
    };
    app.currentStatus = newStatus;
    app.history.push(newStatus);

    await app.save();

    createNotification({
      user: hodId,
      title: `Offer Approval Required for ${app.job.title}`,
      message: `An offer for ${app.applicant.name} is awaiting your approval.`,
      link: `/offer-approvals`,
    }).catch(console.error);

    const subRecruiterId = app.job.requisition?.createdBy;
    if (subRecruiterId && String(subRecruiterId) !== String(req.user._id)) {
      createNotification({
        user: subRecruiterId,
        title: `Offer Sent for Approval`,
        message: `An offer for ${app.applicant.name} (${app.job.title}) has been sent to HOD.`,
        link: `/requisitions`, // Link to their req dashboard
      }).catch(console.error);
    }

    let populated = await Application.findById(app._id)
      .populate("job", "title department location createdBy")
      .populate("applicant", "name email");

    let profile = await Profile.findOne({ user: populated.applicant._id })
      .populate("user", "name email userId role")
      .lean();

    if (profile) {
      profile = {
        ...profile,
        name: profile.user?.name || profile.name,
        email: profile.user?.email || populated.applicant?.email,
        userId: profile.user?.userId,
        role: profile.user?.role,
      };
    }
    const resumeUrl = populated.resumePath
      ? `${process.env.BASE_URL || "http://localhost:8080"}${
          populated.resumePath
        }`
      : null;
    res.json({
      ...populated.toObject(),
      applicantProfile: profile,
      resumeUrl,
    });
  } catch (error) {
    console.error("Error creating offer:", error);
    res.status(500).json({ message: error.message });
  }
};

export const hodApproveOffer = async (req, res) => {
  try {
    const { appId } = req.params;
    const { status, comments } = req.body;

    const app = await Application.findById(appId)
      .populate("applicant", "name email")
      .populate({
        path: "job",
        select: "title createdBy requisition",
        populate: {
          path: "requisition",
          select: "createdBy", // Get Sub-Recruiter
        },
      });

    if (!app || !app.offer)
      return res.status(404).json({ message: "Offer not found" });

    app.offer.hodApproval = {
      status,
      comments,
      reviewer: req.user._id,
      reviewedAt: new Date(),
    };

    const recruiterId = app.job.createdBy;
    const subRecruiterId = app.job.requisition?.createdBy;
    const notifyMsg = `The offer for ${app.applicant.name} (${app.job.title}) was ${status} by HOD.`;

    if (status === "approved") {
      app.offer.approvalStatus = "pending_coo";
      broadcastToRole({
        role: "coo",
        title: `Offer Approval Required for ${app.job.title}`,
        message: `An offer for ${app.applicant.name} has been approved by HOD and awaits your review.`,
        link: `/offer-approvals`,
      }).catch(console.error);
    } else {
      app.offer.approvalStatus = "rejected";

      const template = getStatusEmail(
        "rejected",
        app.job.title,
        `Offer rejected by HOD: ${comments}`
      );
      sendEmail(
        app.applicant.email,
        template.subject,
        template.text,
        template.html
      ).catch(console.error);
      createNotification({
        userId: app.applicant._id,
        title: `Update on your ${app.job.title} application`,
        message: `Unfortunately, your application did not pass the final approval stage.`,
        link: `/me/applications`,
      }).catch(console.error);
    }

    await app.save();

    createNotification({
      userId: recruiterId,
      title: `Offer ${status} by HOD`,
      message: notifyMsg,
      link: `/recruiter/job/${app.job._id}/applications`,
    }).catch(console.error);

    if (subRecruiterId && String(subRecruiterId) !== String(recruiterId)) {
      createNotification({
        userId: subRecruiterId,
        title: `Offer ${status} by HOD`,
        message: notifyMsg,
        link: `/requisitions`,
      }).catch(console.error);
    }

    res.json(app);
  } catch (error) {
    console.error("HOD approve offer error:", error);
    res.status(500).json({ message: error.message });
  }
};

export const cooApproveOffer = async (req, res) => {
  try {
    const { appId } = req.params;
    const { status, comments } = req.body;

    const app = await Application.findById(appId)
      .populate("applicant", "name email")
      .populate({
        path: "job",
        select: "title createdBy requisition",
        populate: {
          path: "requisition",
          select: "createdBy assignedHod", 
        },
      });

    if (!app || !app.offer)
      return res.status(404).json({ message: "Offer not found" });

    app.offer.cooApproval = {
      status,
      comments,
      reviewer: req.user._id,
      reviewedAt: new Date(),
    };

    const recruiterId = app.job.createdBy;
    const subRecruiterId = app.job.requisition?.createdBy;
    const hodId = app.job.requisition?.assignedHod;
    const notifyMsg = `The offer for ${app.applicant.name} (${app.job.title}) was ${status} by COO.`;

    if (status === "approved") {
      app.offer.approvalStatus = "approved";

      const subject = `Congratulations! You've Received an Offer for ${app.job.title}`;
      const text = `Hi ${app.applicant.name},\n\nYou have received an offer for the position of ${app.job.title}. Please log in to the portal to review and respond.\n\nThank you,\nMMCL HR Team`;
      const html = `<p>Hi ${app.applicant.name},</p><p>You have received an offer for the position of <strong>${app.job.title}</strong>. Please log in to the portal to review and respond.</p>`;
      sendEmail(app.applicant.email, subject, text, html).catch(console.error);

      createNotification({
        userId: app.applicant._id,
        title: `You've Received an Offer!`,
        message: `Congratulations! You have an offer for ${app.job.title}. Please review it now.`,
        link: `/me/applications`,
      }).catch(console.error);
    } else {
      app.offer.approvalStatus = "rejected";
      const template = getStatusEmail(
        "rejected",
        app.job.title,
        `Offer rejected by COO: ${comments}`
      );
      sendEmail(
        app.applicant.email,
        template.subject,
        template.text,
        template.html
      ).catch(console.error);
      createNotification({
        userId: app.applicant._id,
        title: `Update on your ${app.job.title} application`,
        message: `Unfortunately, your application did not pass the final approval stage.`,
        link: `/me/applications`,
      }).catch(console.error);
    }

    await app.save();

    createNotification({
      userId: recruiterId,
      title: `Offer ${status} by COO`,
      message: `${notifyMsg} The offer is now ${app.offer.approvalStatus}.`,
      link: `/recruiter/job/${app.job._id}/applications`,
    }).catch(console.error);

    if (subRecruiterId && String(subRecruiterId) !== String(recruiterId)) {
      createNotification({
        userId: subRecruiterId,
        title: `Offer ${status} by COO`,
        message: notifyMsg,
        link: `/requisitions`,
      }).catch(console.error);
    }

    if (hodId) {
      createNotification({
        userId: hodId,
        title: `Offer ${status} by COO`,
        message: notifyMsg,
        link: `/requisitions`, // HODs also use req dashboard
      }).catch(console.error);
    }

    broadcastToRole({
      role: "hr",
      title: `Offer ${status} by COO`,
      message: notifyMsg,
      link: `/requisitions`,
    }).catch(console.error);

    res.json(app);
  } catch (error) {
    console.error("COO approve offer error:", error);
    res.status(500).json({ message: error.message });
  }
};

export const respondToOffer = async (req, res) => {
  try {
    const { appId } = req.params;
    const { response, comment } = req.body;

    const app = await Application.findById(appId)
      .populate("applicant", "name")
      .populate({
        path: "job",
        select: "title createdBy requisition",
        populate: [
          { path: "createdBy", select: "name email" }, 
          {
            path: "requisition",
            select: "createdBy assignedHod", 
          },
        ],
      });

    if (!app) return res.status(404).json({ message: "Application not found" });
    if (String(app.applicant._id) !== String(req.user._id)) {
      return res.status(403).json({ message: "Forbidden" });
    }

    if (!app.offer || app.offer.approvalStatus !== "approved") {
      return res
        .status(400)
        .json({ message: "No approved offer to respond to." });
    }
    if (app.offer.status !== "pending") {
      return res
        .status(400)
        .json({ message: "You have already responded to this offer." });
    }

    app.offer.status = response;
    app.offer.userComment = comment;
    app.offer.respondedAt = new Date();

    const newStatus = {
      code: `offer-${response}`,
      by: req.user._id,
      note: `Candidate ${response} the offer.${
        comment ? ` Comment: ${comment}` : ""
      }`,
      at: new Date(),
    };
    app.currentStatus = newStatus;
    app.history.push(newStatus);

    await app.save();

    const recruiter = app.job.createdBy;
    const subRecruiterId = app.job.requisition?.createdBy;
    const hodId = app.job.requisition?.assignedHod;
    const notifyMsg = `${app.applicant.name} has ${response} the offer for ${app.job.title}.`;

    if (recruiter) {
      const subject = `Offer ${response} by ${app.applicant.name}`;
      const text = `Hi ${recruiter.name},\n\n${notifyMsg}\n\nComment: ${
        comment || "N/A"
      }`;
      sendEmail(recruiter.email, subject, text, `<p>${text}</p>`).catch(
        console.error
      );

      createNotification({
        userId: recruiter._id,
        title: `Offer ${response}!`,
        message: notifyMsg,
        link: `/recruiter/job/${app.job._id}/applications`,
      }).catch(console.error);
    }

    if (subRecruiterId && String(subRecruiterId) !== String(recruiter?._id)) {
      createNotification({
        userId: subRecruiterId,
        title: `Offer ${response}`,
        message: notifyMsg,
        link: `/requisitions`,
      }).catch(console.error);
    }

    if (hodId) {
      createNotification({
        userId: hodId,
        title: `Offer ${response}`,
        message: notifyMsg,
        link: `/requisitions`,
      }).catch(console.error);
    }

    broadcastToRole({
      role: "hr",
      title: `Offer ${response}`,
      message: notifyMsg,
      link: `/requisitions`,
    }).catch(console.error);
    broadcastToRole({
      role: "coo",
      title: `Offer ${response}`,
      message: notifyMsg,
      link: `/requisitions`,
    }).catch(console.error);

    res.json(app);
  } catch (error) {
    console.error("Error responding to offer:", error);
    res.status(500).json({ message: error.message });
  }
};

export const getPendingOffers = async (req, res) => {
  try {
    const { role, _id } = req.user;
    let applications = [];

    if (role === "coo" || role === "admin" || role === "hr") {
      applications = await Application.find({
        "offer.approvalStatus": "pending_coo",
      })
        .populate("applicant", "name email")
        .populate("job", "title department")
        .populate("offer.sentBy", "name")
        .lean();
    }

    if (role === "hod" || role === "admin" || role === "hr") {
      const allPendingHod = await Application.find({
        "offer.approvalStatus": "pending_hod",
      })
        .populate("applicant", "name email")
        .populate("offer.sentBy", "name")
        .populate({
          path: "job",
          select: "title department requisition",
          populate: { path: "requisition", select: "assignedHod" },
        })
        .lean();
      let hodApps;
      if (role === "hod") {
        hodApps = allPendingHod.filter(
          (app) => String(app.job?.requisition?.assignedHod) === String(_id)
        );
      } else {
        hodApps = allPendingHod;
      }
      const existingIds = new Set(applications.map((a) => a._id.toString()));
      const newApps = hodApps.filter((a) => !existingIds.has(a._id.toString()));
      applications = [...applications, ...newApps];
    }

    res.json(applications);
  } catch (error) {
    console.error("Error fetching pending offers:", error);
    res.status(500).json({ message: error.message });
  }
};

export const submitOnboardingDocument = async (req, res) => {
  try {
    const { appId } = req.params;
    const { documentType } = req.body;

    if (!req.file) {
      return res.status(400).json({ message: "File is required." });
    }

    const app = await Application.findById(appId)
      .populate({
        path: "job",
        select: "createdBy",
      })
      .populate("applicant", "name"); // <-- Populate applicant name

    if (!app)
      return res.status(404).json({ message: "Application not found." });

    if (String(app.applicant._id) !== String(req.user._id)) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const newDocument = {
      documentType,
      filePath: `/uploads/onboarding/${req.file.filename}`,
      fileName: req.file.originalname,
      uploadedAt: new Date(),
      status: "pending", // <-- Reset status to pending on new upload
      rejectionComment: undefined,
      reviewedBy: undefined,
      reviewedAt: undefined,
    };

    const existingDocIndex = app.onboardingDocuments.findIndex(
      (doc) => doc.documentType === documentType
    );

    if (existingDocIndex > -1) {
      app.onboardingDocuments[existingDocIndex] = newDocument;
    } else {
      app.onboardingDocuments.push(newDocument);
    }

    await app.save();

    broadcastToRole({
      role: "hr",
      title: "Onboarding Document Submitted",
      message: `${app.applicant.name} submitted: ${documentType}`,
      link: `/admin/onboarding-review`,
    }).catch(console.error);

    res.json(app);
  } catch (error) {
    console.error("Error submitting document:", error);
    res.status(500).json({ message: error.message });
  }
};

export const listOnboardingCandidates = async (req, res) => {
  try {
    const applications = await Application.find({
      "currentStatus.code": {
        $in: ["hired", "onboarding", "onboarding-complete"],
      },
    })
      .populate("applicant", "name email")
      .populate("job", "title department") // <-- Ensured job title is populated
      .populate("onboardingDocuments.reviewedBy", "name")
      .sort({ updatedAt: -1 });

    res.json(applications);
  } catch (error) {
    console.error("Error listing onboarding candidates:", error);
    res.status(500).json({ message: error.message });
  }
};

export const reviewOnboardingDocument = async (req, res) => {
  try {
    const { appId } = req.params;
    const { documentType, status, comment } = req.body; // status is 'approved' or 'rejected'

    const app = await Application.findById(appId)
      .populate("applicant", "name email")
      .populate("job", "title");
    if (!app)
      return res.status(404).json({ message: "Application not found." });

    const doc = app.onboardingDocuments.find(
      (d) => d.documentType === documentType
    );
    if (!doc) return res.status(404).json({ message: "Document not found." });

    doc.status = status;
    doc.rejectionComment = status === "rejected" ? comment : undefined;
    doc.reviewedBy = req.user._id;
    doc.reviewedAt = new Date();

    await app.save();

    if (status === "rejected") {
      createNotification({
        userId: app.applicant._id,
        title: `Document Rejected: ${documentType}`,
        message: `Your document "${documentType}" was rejected. Reason: ${
          comment || "Please re-upload."
        }`,
        link: `/me/onboarding`,
      }).catch(console.error);
    }

    res.json(app);
  } catch (error) {
    console.error("Error reviewing document:", error);
    res.status(500).json({ message: error.message });
  }
};

export const completeOnboarding = async (req, res) => {
  try {
    const { appId } = req.params;

    const app = await Application.findById(appId)
      .populate("applicant", "name email")
      .populate("job", "title");
    if (!app)
      return res.status(404).json({ message: "Application not found." });

    const newStatus = {
      code: "onboarding-complete",
      by: req.user._id,
      note: "All documents approved and onboarding completed by HR.",
      at: new Date(),
    };
    app.currentStatus = newStatus;
    app.history.push(newStatus);

    await app.save();

    createNotification({
      userId: app.applicant._id,
      title: `Onboarding Complete!`,
      message: `Congratulations, your onboarding for ${app.job.title} is complete!`,
      link: `/me/applications`,
    }).catch(console.error);

    res.json(app);
  } catch (error) {
    console.error("Error completing onboarding:", error);
    res.status(500).json({ message: error.message });
  }
};

export const getMyApplicationDetails = async (req, res) => {
  try {
    const { appId } = req.params;
    const userId = req.user._id;

    const app = await Application.findOne({
      _id: appId,
      applicant: userId,
    }).populate("job", "title"); // <-- Populate the job title

    if (!app) {
      return res.status(404).json({ message: "Application not found." });
    }

    const allowedStatus = ["hired", "onboarding", "onboarding-complete"];
    if (!allowedStatus.includes(app.currentStatus.code)) {
      return res.status(403).json({
        message: "Onboarding is not yet active for this application.",
      });
    }

    res.json(app);
  } catch (error) {
    console.error("Error in getMyApplicationDetails:", error);
    res.status(500).json({ message: error.message });
  }
};

export const submitEmploymentForm = async (req, res) => {
  try {
    const { appId } = req.params;
    const formData = req.body;
    const userId = req.user._id;

    const app = await Application.findOne({ _id: appId, applicant: userId })
      .populate("applicant", "name email") 
      .populate("job", "title createdBy"); 

    if (!app)
      return res.status(404).json({ message: "Application not found." });
    if (!formData || !formData.fullName || !formData.cnic)
      return res.status(400).json({ message: "Required form fields missing." });

    const allowedStatus = ["hired", "onboarding", "onboarding-complete"];
    if (!allowedStatus.includes(app.currentStatus.code))
      return res.status(403).json({ message: "Cannot submit form now." });

    app.employmentFormData = {
      ...formData,
      declarationAccepted: true,
      submissionDate: new Date(),
      email: app.applicant.email, // Ensure email is consistent
    };

    if (app.currentStatus.code === "hired") {
      const statusUpdate = {
        code: "onboarding",
        by: userId,
        note: "Employment form submitted.",
        at: new Date(),
      };
      app.currentStatus = statusUpdate;
      app.history.push(statusUpdate);
    }

    await app.save();

    broadcastToRole({
    }).catch(console.error);
    if (app.job?.createdBy) {
      createNotification({
      }).catch(console.error);
    }

    res.status(200).json(app);
  } catch (error) {
    console.error("Error submitting employment form:", error);
    res
      .status(500)
      .json({ message: error.message || "Server error submitting form." });
  }
};

const drawText = (
  page,
  text,
  { x, y, size = 9, font, color = rgb(0, 0, 0) }
) => {
  if (text !== undefined && text !== null && String(text) !== "undefined") {
    page.drawText(String(text), { x, y, size, font, color });
  }
};

const drawCheckMark = (page, { x, y, size = 11, thickness = 1.5 }) => {
  const startX = x + size * 0.15;
  const startY = y + size * 0.45; // Adjusted Y for standard checkmark

  const midX = x + size * 0.4;
  const midY = y + size * 0.2; // Adjusted Y for standard checkmark

  const endX = x + size * 0.85;
  const endY = y + size * 0.7; // Adjusted Y for standard checkmark

  page.drawLine({
    start: { x: startX, y: startY },
    end: { x: midX, y: midY },
    thickness: thickness,
    color: rgb(0, 0, 0),
  });

  page.drawLine({
    start: { x: midX, y: midY },
    end: { x: endX, y: endY },
    thickness: thickness,
    color: rgb(0, 0, 0),
  });
};

const drawCheck = (page, isChecked, { x, y, size = 11 }) => {
  if (isChecked) {
    drawCheckMark(page, { x, y, size, thickness: 1.5 });
  }
};

const formatDate = (dateString) => {
  if (!dateString) return "";
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "";
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  } catch (e) {
    return "";
  }
};

const _generatePdfBytes = async (appId) => {
  const app = await Application.findById(appId)
    .populate("applicant", "name email")
    .populate("job", "title");

  if (!app) {
    throw new Error("Application not found.");
  }
  if (!app.employmentFormData) {
    throw new Error("Employment form data not found for this applicant.");
  }

  const profile = await Profile.findOne({ user: app.applicant._id });
  const data = app.employmentFormData;

  const templatePath = path.join(
    __dirname,
    "..",
    "templates",
    "Employment_Application_Form.pdf"
  );

  if (!fs.existsSync(templatePath)) {
    console.error(`[PDF ERROR] Template PDF not found at: ${templatePath}`);
    throw new Error(`Template PDF not found at specified path.`);
  }

  const templatePdfBytes = fs.readFileSync(templatePath);
  const pdfDoc = await PDFDocument.load(templatePdfBytes);
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const pages = pdfDoc.getPages();
  const whiteColor = cmyk(0, 0, 0, 0);

  for (const page of pages) {
    page.drawRectangle({
      x: 180,
      y: 805,
      width: 250,
      height: 15,
      color: whiteColor,
      opacity: 1,
    });
  }

  const page1 = pages[0];

  if (profile?.profilePicture) {
    try {
      const cleanPath = profile.profilePicture.startsWith("/")
        ? profile.profilePicture.substring(1)
        : profile.profilePicture;
      const photoPath = path.join(__dirname, "..", cleanPath);
      if (fs.existsSync(photoPath)) {
        const photoBytes = fs.readFileSync(photoPath);
        let photoImage;
        if (photoPath.toLowerCase().endsWith(".png")) {
          photoImage = await pdfDoc.embedPng(photoBytes);
        } else {
          photoImage = await pdfDoc.embedJpg(photoBytes);
        }
        page1.drawImage(photoImage, {
          x: 437,
          y: 593,
          width: 90,
          height: 113,
        });
      } else {
        console.error(`[PDF Debug] Photo not found at path: ${photoPath}`);
      }
    } catch (imgError) {
      console.error("Could not embed profile picture:", imgError);
    }
  } else {
    console.error(`[PDF Debug] No profile.profilePicture found for user.`);
  }

  const cnicDates =
    data.cnicIssueDate || data.cnicExpiryDate
      ? `${formatDate(data.cnicIssueDate)} | ${formatDate(data.cnicExpiryDate)}`
      : "";
  const licenseDates =
    data.licenseIssueDate || data.licenseExpiryDate
      ? `${formatDate(data.licenseIssueDate)} | ${formatDate(
          data.licenseExpiryDate
        )}`
      : "";
  const nextOfKin =
    data.nextOfKinName || data.nextOfKinRelationship
      ? `${data.nextOfKinName || ""} (${data.nextOfKinRelationship || ""})`
      : "";
  const nextOfKinDetails =
    data.nextOfKinAddress || data.nextOfKinContact
      ? `${data.nextOfKinAddress || ""} / ${data.nextOfKinContact || ""}`
      : "";
  const disabilityDetails = data.hasDisabilityOrIllness
    ? `Yes: ${data.disabilityOrIllnessDetails || ""}`
    : "No";
  const criminalDetails = data.involvedInCriminalActivity
    ? `Yes: ${data.criminalActivityDetails || ""}`
    : "No";
  const signatureText = `Submitted by ${app.applicant.name || ""}`;

  drawText(page1, data.currentSalary, { x: 147, y: 604, font });
  drawText(page1, data.expectedSalary, { x: 340, y: 604, font });
  drawText(page1, data.fullName, { x: 120, y: 544, font });
  drawText(page1, data.fatherName, { x: 120, y: 510, font });
  drawText(page1, data.placeOfBirth, { x: 440, y: 544, font });
  drawText(page1, formatDate(data.dob), { x: 390, y: 544, font });
  drawText(page1, data.age, { x: 330, y: 527, font });
  drawText(page1, data.fatherOccupation, { x: 390, y: 510, font });
  drawText(page1, data.drivingLicense, { x: 390, y: 476, font });
  drawText(page1, licenseDates, { x: 395, y: 452, font });
  drawText(page1, data.cnic, { x: 105, y: 476, font });
  drawText(page1, cnicDates, { x: 155, y: 452, font });
  drawText(page1, data.currentAddress, { x: 58, y: 425, font });
  drawText(page1, data.currentPhone, { x: 360, y: 435, font });
  drawText(page1, data.permanentAddress, { x: 145, y: 398, font });
  drawText(page1, data.permanentPhone, { x: 360, y: 418, font });
  drawText(page1, data.mobile, { x: 360, y: 398, font });
  drawText(page1, data.email, { x: 370, y: 382, font });
  drawText(page1, data.politicalAffiliationParty, { x: 58, y: 343, font });
  drawText(page1, data.politicalAffiliationRank, { x: 400, y: 353, font });
  drawText(page1, data.maritalStatus, { x: 120, y: 308, font });
  drawText(page1, data.children, { x: 350, y: 307, font });
  drawText(page1, nextOfKin, { x: 59, y: 260, font });
  drawText(page1, nextOfKinDetails, { x: 305, y: 260, font });
  drawText(page1, data.motherTongue, { x: 130, y: 231, font });
  drawText(page1, data.otherLanguages, { x: 465, y: 231, font });
  drawText(page1, disabilityDetails, { x: 59, y: 180, font });
  drawText(page1, data.bloodGroup, { x: 363, y: 192, font });
  drawText(page1, criminalDetails, { x: 325, y: 157, font });
  drawText(page1, data.emergencyContactName, { x: 235, y: 115, font });
  drawText(page1, data.emergencyContactAddress, { x: 105, y: 95, font });
  drawText(page1, data.emergencyContactPhone, { x: 433, y: 115, font });

  const page2 = pages[1];
  let yPos = 676;
  if (data.education && data.education.length > 0) {
    data.education.forEach((edu) => {
      if (edu) {
        drawText(page2, edu.institution, { x: 90, y: yPos, font });
        drawText(page2, edu.tenureYears, { x: 230, y: yPos, font });
        drawText(page2, edu.degree, { x: 263, y: yPos, font });
        drawText(page2, edu.subject, { x: 360, y: yPos, font });
        drawText(page2, edu.completionYear, { x: 450, y: yPos, font });
        drawText(page2, edu.grade, { x: 515, y: yPos, font });
        yPos -= 28;
      }
    });
  }
  drawText(page2, data.coCurricularAchievements, { x: 65, y: 472, font });
  yPos = 265;
  if (data.trainings && data.trainings.length > 0) {
    data.trainings.forEach((training) => {
      if (training) {
        drawText(page2, training.course, { x: 100, y: yPos, font });
        drawText(page2, training.institution, { x: 260, y: yPos, font });
        drawText(page2, training.qualification, { x: 390, y: yPos, font });
        drawText(page2, training.datePeriod, { x: 490, y: yPos, font });
        yPos -= 20;
      }
    });
  }
  drawText(page2, data.selfEmployedDetails, { x: 58, y: 168, font });

  const page3 = pages[2];
  if (data.employmentHistory && data.employmentHistory.length > 0) {
    const job1 = data.employmentHistory[0];
    if (job1) {
      drawText(page3, job1.organization, { x: 185, y: 701, font });
      drawText(page3, job1.natureOfBusiness, { x: 185, y: 678, font });
      drawText(page3, job1.address, { x: 185, y: 654, font });
      drawText(page3, job1.managerName, { x: 185, y: 631, font });
      drawText(page3, job1.phone, { x: 185, y: 607, font });
      drawText(page3, job1.startingPosition, { x: 185, y: 582, font });
      drawText(page3, job1.lastPosition, { x: 185, y: 558, font });
      drawText(page3, job1.dateJoined, { x: 185, y: 534, font });
      drawText(page3, job1.dateLeft, { x: 185, y: 509, font });
      drawText(page3, job1.totalDuration, { x: 185, y: 485, font });
      drawText(page3, job1.startingSalary, { x: 185, y: 461, font });
      drawText(page3, job1.lastSalary, { x: 185, y: 437, font });
      drawText(page3, job1.reasonForLeaving, { x: 185, y: 413, font });
    }
  }

  const page4 = pages[3];
  drawText(page4, data.keyRolesAndAchievements, {
    x: 80,
    y: 729,
    font,
    size: 8,
  });
  const b = data.benefits || {};
  const vehicleDetails = `${b.vehicleType || ""} ${b.vehicleDetails || ""}`;

  drawCheck(page4, b.vehicleProvided, { x: 279, y: 567, font });
  drawCheck(page4, !b.vehicleProvided, { x: 360, y: 567, font });
  drawText(page4, vehicleDetails, { x: 232, y: 544, font });
  drawCheck(page4, b.buyBackOption, { x: 279, y: 514, font });
  drawCheck(page4, !b.buyBackOption, { x: 360, y: 514, font });
  drawCheck(page4, b.bonus, { x: 279, y: 486, font });
  drawCheck(page4, !b.bonus, { x: 360, y: 486, font });
  drawText(page4, b.bonusDetails, { x: 282, y: 463, font });
  drawText(page4, b.bonusBasedOn, { x: 300, y: 437, font });
  drawCheck(page4, b.lfa, { x: 279, y: 409, font });
  drawCheck(page4, !b.lfa, { x: 360, y: 409, font });
  drawText(page4, b.lfaBasedOn, { x: 232, y: 389, font });
  drawCheck(page4, b.gratuity, { x: 279, y: 360, font });
  drawCheck(page4, !b.gratuity, { x: 360, y: 530, font });
  drawText(page4, b.gratuityBasedOn, { x: 250, y: 340, font });
  drawCheck(page4, b.providentFund, { x: 279, y: 486, font });
  drawCheck(page4, !b.providentFund, { x: 360, y: 486, font });
  drawCheck(page4, b.bonus, { x: 279, y: 486, font });
  drawCheck(page4, !b.bonus, { x: 360, y: 486, font });

  const page5 = pages[4];
  yPos = 720;
  if (data.bloodRelativesInCompany && data.bloodRelativesInCompany.length > 0) {
    data.bloodRelativesInCompany.forEach((rel) => {
      if (rel) {
        drawText(page5, rel.name, { x: 92, y: yPos, font });
        drawText(page5, rel.designation, { x: 232, y: yPos, font });
        drawText(page5, rel.company, { x: 314, y: yPos, font });
        drawText(page5, rel.location, { x: 380, y: yPos, font });
        drawText(page5, rel.relationship, { x: 452, y: yPos, font });
        yPos -= 18;
      }
    });
  }
  const appliedDetails = data.appliedBefore
    ? `Yes: ${data.appliedBeforeDetails || ""}`
    : "No";
  drawText(page5, appliedDetails, { x: 58, y: 644, font });
  drawText(page5, data.relativeOrFriendInCompany, { x: 58, y: 593, font });
  drawText(page5, data.otherMeansOfSubsistenceDetails, { x: 58, y: 543, font });
  drawText(page5, data.noticePeriod, { x: 58, y: 490, font });
  yPos = 360;
  if (data.references && data.references.length > 0) {
    data.references.forEach((ref) => {
      if (ref) {
        drawText(page5, ref.name, { x: 92, y: yPos, font });
        drawText(page5, ref.occupation, { x: 246, y: yPos, font });
        drawText(page5, ref.address, { x: 354, y: yPos, font });
        drawText(page5, ref.phone, { x: 470, y: yPos, font });
        yPos -= 18;
      }
    });
  }

  drawText(page5, formatDate(data.submissionDate), { x: 150, y: 68, font });
  drawText(page5, signatureText, { x: 400, y: 68, font, size: 8 });

  return await pdfDoc.save();
};

export const downloadEmploymentFormPdf = async (req, res) => {
  try {
    const { appId } = req.params;
    const pdfBytes = await _generatePdfBytes(appId);
    const app = await Application.findById(appId).populate("applicant", "name");
    const filename = `EmploymentForm_${
      app.applicant.name.replace(/\s+/g, "_") || "Applicant"
    }.pdf`;
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.send(Buffer.from(pdfBytes));
  } catch (err) {
    console.error("Error generating PDF for download:", err);
    res.status(500).json({ message: err.message || "Failed to generate PDF." });
  }
};

export const previewEmploymentFormPdf = async (req, res) => {
  try {
    const { appId } = req.params;
    const pdfBytes = await _generatePdfBytes(appId);
    res.setHeader("Content-Type", "application/pdf");
    res.send(Buffer.from(pdfBytes));
  } catch (err) {
    console.error("Error generating PDF for preview:", err);
    res.status(500).json({ message: err.message || "Failed to generate PDF." });
  }
};
