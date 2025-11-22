import Job from "../models/Job.js";
import Application from "../models/Application.js";
import Profile from "../models/Profile.js";

export const getLifecycleReport = async (req, res) => {
  try {
    const { jobId } = req.params;

    const job = await Job.findById(jobId)
      .populate({
        path: 'requisition',
        populate: [ 
          { path: 'createdBy', select: 'name email' },
          { path: 'approvals.departmentHead.approval.reviewer', select: 'name email' },
          { path: 'approvals.hr.approval.reviewer', select: 'name email' },
          { path: 'approvals.coo.approval.reviewer', select: 'name email' }
        ]
      })
      .populate('createdBy', 'name email')
      .lean();

    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }

    const allApplications = await Application.find({ job: jobId }).lean();

    const hiredApp = await Application.findOne({ job: jobId, "currentStatus.code": "hired" })
      .populate('applicant', 'name email')
      .populate('remarks.interviewer', 'name email')
      .lean();
    
    if (hiredApp) {
        hiredApp.applicantProfile = await Profile.findOne({ user: hiredApp.applicant._id }).lean();
    }

    res.json({
      job,
      stats: {
        totalApplicants: allApplications.length,
      },
      hiredApplication: hiredApp || null, 
    });

  } catch (error) {
    console.error("Error generating lifecycle report:", error);
    res.status(500).json({ message: "Server Error" });
  }
};