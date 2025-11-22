import RequisitionForm from "../models/RequisitionForm.js";
import AdminProfile from "../models/AdminProfile.js";
import User from "../models/user.js";
import Job from "../models/Job.js";
import Application from "../models/Application.js";
import { createNotification, broadcastToRole } from "../utils/notify.js";
import sendEmail from "../utils/sendEmail.js";

export const createRequisition = async (req, res) => {
  try {
    const userRole = req.user.role;
    const userId = req.user._id;
    let requisitionDepartment;

    if (userRole === "sub_recruiter") {
      const profile = await AdminProfile.findOne({ user: userId });
      if (!profile || !profile.department) {
        return res.status(403).json({
          success: false,
          message:
            "Forbidden: Your user profile is not assigned to a department.",
        });
      }
      requisitionDepartment = profile.department;
      if (req.body.department !== requisitionDepartment) {
        return res.status(403).json({
          success: false,
          message: `Forbidden: You can only create requisitions for your own department (${requisitionDepartment}).`,
        });
      }
    } else if (["recruiter", "admin", "superAdmin", "hr"].includes(userRole)) {
      requisitionDepartment = req.body.department;
      if (!requisitionDepartment) {
        return res
          .status(400)
          .json({ success: false, message: "Department is required." });
      }
    } else {
      return res.status(403).json({
        success: false,
        message: "Forbidden: You are not authorized to create requisitions.",
      });
    }

    const hodProfile = await AdminProfile.findOne({
      department: requisitionDepartment,
      designation: "Head of Department",
    }).populate("user", "name email");

    if (!hodProfile) {
      return res.status(400).json({
        success: false,
        message: `No HOD assigned for the ${requisitionDepartment} department.`,
      });
    }

    const creatorProfile = await AdminProfile.findOne({ user: userId });

    const requisition = new RequisitionForm({
      ...req.body,
      department: requisitionDepartment,
      createdBy: userId,
      assignedHod: hodProfile.user._id,
      approvals: {
        raisedBy: {
          info: {
            name: req.user.name,
            desig: creatorProfile?.designation || req.user.role,
          },
        },
        departmentHead: {
          info: { name: hodProfile.user.name, desig: hodProfile.designation },
          approval: { status: "pending" },
        },
        hr: { approval: { status: "pending" } },
        coo: { approval: { status: "pending" } },
      },
    });

    await requisition.save();

    const creatorUser = await User.findById(userId).select("email name");

    createNotification({
      userId: userId,
      title: "Requisition Submitted",
      message: `Your requisition ${requisition.reqId} for ${requisition.position} was submitted successfully.`,
      link: `/requisitions`,
    }).catch(console.error);

    if (creatorUser) {
      await sendEmail(
        creatorUser.email,
        "Requisition Submitted Successfully",
        `Your requisition has been submitted successfully.\n\nRequisition ID: ${requisition.reqId}\nPosition: ${requisition.position}\nDepartment: ${requisition.department}\n\nYour requisition is now awaiting approval from the Head of Department.\n\nView: ${process.env.FRONTEND_URL}/requisitions/view/${requisition._id}`
      ).catch((e) => console.warn("Email to creator failed:", e.message || e));
    }

    await createNotification({
      userId: hodProfile.user._id,
      title: "New Requisition Submitted",
      message: `Requisition ${requisition.reqId} for ${requisition.position} requires your approval.`,
      link: `/requisitions/view/${requisition._id}`,
    });

    await sendEmail(
      hodProfile.user.email,
      "New Requisition Submitted",
      `A new requisition has been submitted for your approval.\n\nRequisition ID: ${requisition.reqId}\nPosition: ${requisition.position}\nDepartment: ${requisition.department}\nCreated by: ${req.user.name}\n\nPlease review it here: ${process.env.FRONTEND_URL}/requisitions/view/${requisition._id}`
    ).catch((e) => console.warn("Email to HOD failed:", e.message || e));

    broadcastToRole({
      role: "recruiter",
      title: "New Requisition Submitted",
      message: `Requisition ${requisition.reqId} for ${requisition.position} was created by ${req.user.name} and is awaiting HOD approval.`,
      link: `/requisitions/view/${requisition._id}`,
    }).catch((e) =>
      console.warn("broadcastToRole(recruiter) failed:", e.message || e)
    );

    const recruiters = await User.find({ role: "recruiter" }).select(
      "email name"
    );
    Promise.all(
      recruiters.map((recruiter) =>
        sendEmail(
          recruiter.email,
          "New Requisition Submitted",
          `A new requisition has been created by ${req.user.name}.\n\nRequisition ID: ${requisition.reqId}\nPosition: ${requisition.position}\nDepartment: ${requisition.department}\n\nThis requisition is awaiting Head of Department approval.\n\nView: ${process.env.FRONTEND_URL}/requisitions/view/${requisition._id}`
        ).catch((e) =>
          console.warn("Email to recruiter failed:", e.message || e)
        )
      )
    ).catch((e) => console.warn("Parallel email send failed:", e.message || e));

    res.status(201).json({ success: true, requisition });
  } catch (error) {
    console.error("Error creating requisition:", error);
    res.status(400).json({ success: false, message: error.message });
  }
};

export const hodApproval = async (req, res) => {
  try {
    const { requisitionId } = req.params;
    const { status, comments } = req.body;
    const requisition = await RequisitionForm.findById(requisitionId)
      .populate("createdBy", "name email")
      .populate("assignedHod", "name email");

    if (!requisition) return res.status(404).json({ message: "Not found" });
    if (requisition.approvals.departmentHead.approval.status !== "pending") {
      return res.status(400).json({ message: "Already reviewed by HOD" });
    }

    const hodProfile = await AdminProfile.findOne({ user: req.user._id });

    requisition.approvals.departmentHead.approval = {
      status,
      comments,
      reviewer: req.user._id,
      reviewedAt: new Date(),
      name: req.user?.name,
      desig: hodProfile?.designation || "Head of Department",
    };
    await requisition.save();

    Promise.all([
      createNotification({
        userId: requisition.createdBy._id,
        title: `HOD ${status} Requisition`,
        message: `Your requisition (${requisition.reqId}) for ${requisition.position} was ${status} by HOD.`,
        link: `/requisitions/view/${requisition._id}`,
      }).catch((e) =>
        console.warn(
          "Portal notification to sub-recruiter failed:",
          e.message || e
        )
      ),

      sendEmail(
        requisition.createdBy.email,
        `Requisition ${status} by Head of Department`,
        `Your requisition (${requisition.reqId}) for ${
          requisition.position
        } was ${status} by the Head of Department.\n\nComments: ${
          comments || "None"
        }`
      ).catch((e) =>
        console.warn("Email to sub-recruiter failed:", e.message || e)
      ),

      broadcastToRole({
        role: "hr",
        title: "Requisition HOD Review Complete",
        message: `Requisition ${requisition.reqId} for ${requisition.position} has been ${status} by HOD and awaits your review.`,
        link: `/requisitions/view/${requisition._id}`,
      }).catch((e) =>
        console.warn("broadcastToRole(hr) failed:", e.message || e)
      ),
    ]).catch((e) =>
      console.warn("Parallel operations failed:", e.message || e)
    );

    res.json({ success: true, requisition });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const hrApproval = async (req, res) => {
  try {
    const { requisitionId } = req.params;
    const { status, comments } = req.body;
    const requisition = await RequisitionForm.findById(requisitionId)
      .populate("createdBy", "name email")
      .populate("assignedHod", "name email");

    if (!requisition) return res.status(404).json({ message: "Not found" });
    if (requisition.approvals.departmentHead.approval.status !== "approved") {
      return res.status(400).json({ message: "HOD approval required first" });
    }
    if (requisition.approvals.hr.approval.status !== "pending") {
      return res.status(400).json({ message: "Already reviewed by HR" });
    }

    const hrProfile = await AdminProfile.findOne({ user: req.user._id });

    requisition.approvals.hr.approval = {
      status,
      comments,
      reviewer: req.user._id,
      reviewedAt: new Date(),
      name: req.user?.name,
      desig: hrProfile?.designation || "HR",
    };
    await requisition.save();

    const notificationPromises = [
      createNotification({
        userId: requisition.createdBy._id,
        title: `HR ${status} Requisition`,
        message: `Your requisition (${requisition.reqId}) for ${requisition.position} was ${status} by HR.`,
        link: `/requisitions/view/${requisition._id}`,
      }).catch((e) =>
        console.warn(
          "Portal notification to sub-recruiter failed:",
          e.message || e
        )
      ),

      sendEmail(
        requisition.createdBy.email,
        `Requisition ${status} by HR`,
        `Your requisition (${requisition.reqId}) for ${
          requisition.position
        } was ${status} by HR.\n\nComments: ${comments || "None"}`
      ).catch((e) =>
        console.warn("Email to sub-recruiter failed:", e.message || e)
      ),
    ];

    if (requisition.assignedHod) {
      notificationPromises.push(
        createNotification({
          userId: requisition.assignedHod._id,
          title: `HR ${status} Requisition`,
          message: `Requisition (${requisition.reqId}) for ${requisition.position} was ${status} by HR.`,
          link: `/requisitions/view/${requisition._id}`,
        }).catch((e) =>
          console.warn("Portal notification to HOD failed:", e.message || e)
        ),
        sendEmail(
          requisition.assignedHod.email,
          `Requisition ${status} by HR`,
          `Requisition (${requisition.reqId}) for ${requisition.position} was ${status} by HR.\n\nView: ${process.env.FRONTEND_URL}/requisitions/view/${requisition._id}`
        ).catch((e) => console.warn("Email to HOD failed:", e.message || e))
      );
    }

    if (status === "approved") {
      notificationPromises.push(
        broadcastToRole({
          role: "coo",
          title: "New Requisition Awaiting COO Approval",
          message: `Requisition (${requisition.reqId}) for ${requisition.position} has been approved by HR and awaits your review.`,
          link: `/requisitions/view/${requisition._id}`,
        }).catch((e) =>
          console.warn("broadcastToRole(coo) failed:", e.message || e)
        )
      );
    }

    Promise.all(notificationPromises).catch((e) =>
      console.warn("Parallel operations failed:", e.message || e)
    );

    res.json({ success: true, requisition });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const cooApproval = async (req, res) => {
  try {
    const { requisitionId } = req.params;
    const { status, comments } = req.body;
    const requisition = await RequisitionForm.findById(requisitionId)
      .populate("createdBy", "name email")
      .populate("assignedHod", "name email");

    if (!requisition) return res.status(404).json({ message: "Not found" });
    if (requisition.approvals.hr.approval.status !== "approved") {
      return res.status(400).json({ message: "HR approval required first" });
    }
    if (requisition.approvals.coo.approval.status !== "pending") {
      return res.status(400).json({ message: "Already reviewed by COO" });
    }

    const cooProfile = await AdminProfile.findOne({ user: req.user._id });

    requisition.approvals.coo.approval = {
      status,
      comments,
      reviewer: req.user._id,
      reviewedAt: new Date(),
      name: req.user?.name,
      desig: cooProfile?.designation || "COO",
    };
    await requisition.save();

    const notificationPromises = [
      createNotification({
        userId: requisition.createdBy._id,
        title: `COO ${status} Requisition`,
        message: `Your requisition (${requisition.reqId}) for ${requisition.position} was ${status} by COO.`,
        link: `/requisitions/view/${requisition._id}`,
      }).catch((e) =>
        console.warn(
          "Portal notification to sub-recruiter failed:",
          e.message || e
        )
      ),

      sendEmail(
        requisition.createdBy.email,
        `Requisition ${status} by COO`,
        `Your requisition (${requisition.reqId}) for ${
          requisition.position
        } was ${status} by COO.\n\nComments: ${comments || "None"}`
      ).catch((e) =>
        console.warn("Email to sub-recruiter failed:", e.message || e)
      ),
    ];

    if (requisition.assignedHod) {
      notificationPromises.push(
        createNotification({
          userId: requisition.assignedHod._id,
          title: `COO ${status} Requisition`,
          message: `Requisition (${requisition.reqId}) for ${requisition.position} was ${status} by COO.`,
          link: `/requisitions/view/${requisition._id}`,
        }).catch((e) =>
          console.warn("Portal notification to HOD failed:", e.message || e)
        ),
        sendEmail(
          requisition.assignedHod.email,
          `Requisition ${status} by COO`,
          `Requisition (${requisition.reqId}) for ${requisition.position} was ${status} by COO.\n\nView: ${process.env.FRONTEND_URL}/requisitions/view/${requisition._id}`
        ).catch((e) => console.warn("Email to HOD failed:", e.message || e))
      );
    }

    if (status === "approved") {
      notificationPromises.push(
        broadcastToRole({
          role: "hr",
          title: "Requisition Approved by COO",
          message: `Requisition ${requisition.reqId} for ${requisition.position} has been approved by COO and is finalized.`,
          link: `/requisitions/view/${requisition._id}`,
        }).catch((e) =>
          console.warn(
            "broadcastToRole(hr) after COO approval failed:",
            e.message || e
          )
        )
      );
    }

    Promise.all(notificationPromises).catch((e) =>
      console.warn("Parallel operations failed:", e.message || e)
    );

    res.json({ success: true, requisition });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const listRequisitions = async (req, res) => {
  try {
    let filter = {};
    const userRole = req.user.role;
    const userId = req.user._id;

    if (userRole === "sub_recruiter") {
      filter.createdBy = userId;
    } else if (userRole === "hod") {
      filter.assignedHod = userId;
    } else if (userRole === "hr") {
      filter["approvals.departmentHead.approval.status"] = "approved";
    } else if (["recruiter", "coo", "admin", "superAdmin"].includes(userRole)) {
      filter = {};
    } else {
      return res.json({ success: true, requisitions: [] });
    }

    const requisitions = await RequisitionForm.find(filter)
      .populate("createdBy", "name email")
      .populate("assignedHod", "name email")
      .populate("approvals.departmentHead.approval.reviewer", "name email")
      .populate("approvals.hr.approval.reviewer", "name email")
      .populate("approvals.coo.approval.reviewer", "name email")
      .populate("job", "jobId title status")
      .sort({ createdAt: -1 });

    res.json({ success: true, requisitions });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getRequisition = async (req, res) => {
  try {
    const { requisitionId } = req.params;
    const requisition = await RequisitionForm.findById(requisitionId)
      .populate("createdBy", "name email")
      .populate("assignedHod", "name email")
      .populate("approvals.departmentHead.approval.reviewer", "name email")
      .populate("approvals.hr.approval.reviewer", "name email")
      .populate("approvals.coo.approval.reviewer", "name email")
      .populate("job", "jobId title status");

    if (!requisition) return res.status(404).json({ message: "Not found" });

    const allowedRoles = [
      "recruiter",
      "sub_recruiter",
      "hod",
      "hr",
      "coo",
      "admin",
      "superAdmin",
    ];
    const isCreator =
      String(requisition.createdBy?._id) === String(req.user._id);
    const isAssignedHod =
      String(requisition.assignedHod?._id) === String(req.user._id);

    if (!allowedRoles.includes(req.user.role) && !isCreator && !isAssignedHod) {
      return res.status(403).json({ message: "Forbidden" });
    }
    res.json({ success: true, requisition });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const checkRequisitionApproval = async (req, res) => {
  try {
    const { reqNo } = req.params;
    const reqId = reqNo.startsWith("MMCL-Req-")
      ? reqNo
      : `MMCL-Req-${reqNo.padStart(5, "0")}`;
    const requisition = await RequisitionForm.findOne({ reqId: reqId });

    if (!requisition) {
      return res
        .status(404)
        .json({ success: false, message: "Requisition not found" });
    }

    if (requisition.job) {
      return res.status(400).json({
        success: false,
        message: "A job has already been created for this requisition.",
      });
    }

    const hodStatus = requisition.approvals?.departmentHead?.approval?.status;
    const hrStatus = requisition.approvals?.hr?.approval?.status;
    const cooStatus = requisition.approvals?.coo?.approval?.status;

    const allApproved =
      hodStatus === "approved" &&
      hrStatus === "approved" &&
      cooStatus === "approved";

    if (!allApproved) {
      return res.status(400).json({
        success: false,
        message: "This requisition is not fully approved yet.",
      });
    }

    res.status(200).json({
      success: true,
      message: "Requisition fully approved.",
      requisition,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const deleteRequisition = async (req, res) => {
  try {
    const requisitionId = req.params.requisitionId;
    const requisition = await RequisitionForm.findById(requisitionId);
    if (!requisition)
      return res.status(404).json({ message: "Requisition Form not found" });

    const isOwner = String(requisition.createdBy) === String(req.user._id);
    const isAdmin = ["admin", "superAdmin"].includes(req.user.role);
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const jobs = await Job.find({ requisition: requisitionId });
    const jobIds = jobs.map((job) => job._id);

    await Application.deleteMany({ job: { $in: jobIds } });
    await Job.deleteMany({ requisition: requisitionId });
    await RequisitionForm.findByIdAndDelete(requisitionId);

    res.json({
      message:
        "Requisition form, linked jobs, and all related applications deleted successfully.",
    });
  } catch (error) {
    console.error("❌ Error deleting requisition:", error);
    res.status(500).json({ message: error.message });
  }
};
