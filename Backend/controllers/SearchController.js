import Profile from "../models/Profile.js";
import mongoose from "mongoose";

// Helper function to create case-insensitive regex
const toIRegex = (str) => new RegExp(str, 'i');

export const searchApplicants = async (req, res) => {
  try {
    const { 
      query = "", 
      university, 
      major, 
      skills, 
      location, 
      page = 1, 
      limit = 10 
    } = req.query;

    if (!query && !university && !major && !skills && !location) {
      return res.status(400).json({ message: "A search query or at least one filter is required." });
    }

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const matchStage = {};

    if (query) {
      matchStage.$text = { $search: query };
    }

    if (university) {
      matchStage['education.institution'] = { $regex: toIRegex(university) };
    }

    if (major) {
      matchStage['education.major'] = { $regex: toIRegex(major) };
    }

    if (skills) {
      const skillList = skills.split(',').map(s => s.trim()).filter(Boolean);
      if (skillList.length > 0) {
        matchStage.technicalSkills = { $all: skillList.map(toIRegex) };
      }
    }
    
    if (location) {
      matchStage.$or = [
        { currentAddress: { $regex: toIRegex(location) } },
        { preferredLocations: { $regex: toIRegex(location) } }
      ];
    }
    
    matchStage.email = { $not: { $regex: /@(mastermotor\.com\.pk|mmcl\.com\.pk)$/i } };
    
    const results = await Profile.aggregate([
      { $match: matchStage },
      {
        $lookup: {
          from: "users",
          localField: "user",
          foreignField: "_id",
          as: "userDetails",
        },
      },
      {
        $unwind: { path: "$userDetails", preserveNullAndEmptyArrays: true },
      },
      {
        $lookup: {
          from: "applications",
          localField: "user",
          foreignField: "applicant",
          as: "applications",
        },
      },
      {
        $addFields: {
          applicationCount: { $size: "$applications" },
          name: { $ifNull: ["$userDetails.name", "$name"] },
          email: { $ifNull: ["$userDetails.email", "$email"] },
          score: query ? { $meta: "textScore" } : 0
        },
      },
      {
        $project: {
          _id: 1,
          user: 1,
          name: 1,
          email: 1,
          resume: 1,
          profilePicture: 1,
          applicationCount: 1,
          score: 1,
          experienceDetails: 1, 
        },
      },
      { $sort: { score: -1 } },
      {
        $facet: {
          metadata: [{ $count: "total" }, { $addFields: { page: pageNum } }],
          data: [{ $skip: skip }, { $limit: limitNum }],
        },
      },
    ]);

    if (!results[0] || !results[0].data) {
      return res.json({
        success: true,
        applicants: [],
        pagination: { totalItems: 0, totalPages: 0, currentPage: pageNum },
      });
    }

    const data = results[0].data;
    const total = results[0].metadata[0]?.total || 0;
    const totalPages = Math.ceil(total / limitNum);

    res.json({
      success: true,
      applicants: data,
      pagination: {
        totalItems: total,
        totalPages,
        currentPage: pageNum,
      },
    });
  } catch (error) {
    console.error("Error in searchApplicants:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// This controller remains unchanged, it's already correct.
export const getFullApplicantProfile = async (req, res) => {
  try {
    const { userId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid user ID format." });
    }

    const profile = await Profile.findOne({ user: userId })
      .populate("user", "name email")
      .lean();

    if (!profile) {
      return res.status(404).json({ message: "Profile not found." });
    }

    if (profile.resume) {
      profile.resumeUrl = `${process.env.BASE_URL || "http://localhost:8080"}${
        profile.resume
      }`;
    }
    if (profile.profilePicture) {
      profile.profilePictureUrl = `${process.env.BASE_URL || "http://localhost:88080"}${
        profile.profilePicture
      }`;
    }

    res.json({ success: true, profile });
  } catch (error) {
    console.error("Error in getFullApplicantProfile:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};