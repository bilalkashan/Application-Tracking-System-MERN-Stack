import Profile from "../models/Profile.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const updateStep = async (req, res) => {
  try {
    const { stepNumber } = req.params;
    const data = req.body || {}; 

    Object.keys(data).forEach((key) => {
      if (data[key] === "" || data[key] === null) {
        data[key] = undefined;
      }
    });

    let profile = await Profile.findOne({ user: req.user._id });
    if (!profile) {
      profile = new Profile({ user: req.user._id, ...data });
    } else {
      Object.assign(profile, data);
    }

    await profile.save();

    res.json({
      message: `Step ${stepNumber} completed successfully`,
      profile,
    });
  } catch (err) {
    console.error("updateStep error:", err);
    res.status(500).json({ message: err.message });
  }
};

export const getProfile = async (req, res) => {
  try {
    let profile = await Profile.findOne({ user: req.user._id }).populate(
      "user",
      "name email userId role" 
    ); 

    if (!profile) {
      profile = new Profile({
        user: req.user._id,
        name: req.user.name || "",
      });
      await profile.save(); 
      profile = await Profile.findById(profile._id).populate(
        "user",
        "name email userId role"
      );
    }

    const steps = [
      "Personal Info",
      "Internal Applicant Details",
      "Job Application",
      "Education",
      "Experience",
      "Achievements",
      "Motivation",
      "Skills",
      "Salary & Benefits",
      "Compliance",
      "Diversity",
      "Declarations",
      "Resume",
    ];

    const isInternal = !!profile.employeeId || profile.department === "MMCL";
    const requiredSteps = isInternal
      ? steps
      : steps.filter((s) => s !== "Internal Applicant Details");

    const completedSteps = [];
    if (profile.name && profile.cnicNumber)
      completedSteps.push("Personal Info");
    if (isInternal && (profile.designation || profile.department))
      completedSteps.push("Internal Applicant Details");
    if (profile.positionApplied) completedSteps.push("Job Application");
    if (profile.education?.length) completedSteps.push("Education");
    if (profile.experienceDetails?.length) completedSteps.push("Experience");
    if (profile.achievements?.length) completedSteps.push("Achievements");
    if (profile.motivation?.reasonToJoin) completedSteps.push("Motivation");
    if (profile.technicalSkills?.length) completedSteps.push("Skills");
    if (profile.expectedSalary) completedSteps.push("Salary & Benefits");
    if (profile.conflicts) completedSteps.push("Compliance");
    if (profile.diversity) completedSteps.push("Diversity");
    if (profile.declarations?.infoAccurate) completedSteps.push("Declarations");
    if (profile.resume) completedSteps.push("Resume");

    const progress = Math.round(
      (completedSteps.length / requiredSteps.length) * 100
    );

    const profileData = profile.toObject();

    if (profileData.profilePicture) {
      const picPath = path.join(
        __dirname,
        "..",
        profileData.profilePicture.replace(/^\//, "")
      );
      if (!fs.existsSync(picPath)) {
        console.warn(
          "⚠️ Profile picture in DB doesn't exist on disk:",
          profileData.profilePicture
        );
        profileData.profilePicture = null; 
      }
    }

    res.json({
      profile: {
        ...profileData,
        name: profile.user?.name || profile.name, 
        email: profile.user?.email,
        userId: profile.user?.userId, 
        role: profile.user?.role,
      },
      steps: requiredSteps,
      completedSteps,
      progress,
      isInternal,
    });
  } catch (err) {
    console.error("getProfile error:", err);
    res.status(500).json({ message: err.message });
  }
};

export const uploadResume = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No resume uploaded" });
    }

    const filename = req.file.filename;
    const webPath = `/uploads/resumes/${filename}`; 

    let profile = await Profile.findOne({ user: req.user._id });

    if (!profile) {
      profile = new Profile({ user: req.user._id, resume: webPath });
    } else {
      if (profile.resume) {
        const oldPath = path.join(
          __dirname,
          "..",
          profile.resume.replace(/^\//, "")
        );
        fs.unlink(oldPath, (err) => {
          if (err) console.warn("⚠️ Could not delete old resume:", err.message);
        });
      }
      profile.resume = webPath;
    }

    await profile.save();

    res.json({
      message: "Resume uploaded successfully",
      resume: webPath,
    });
  } catch (err) {
    console.error("uploadResume error:", err);
    res.status(500).json({ message: err.message });
  }
};

export const uploadProfilePicture = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No profile picture uploaded" });
    }

    const filename = req.file.filename;
    const webPath = `/uploads/profilePictures/${filename}`;
    console.log("📸 Profile picture uploaded:", {
      filename,
      webPath,
      fieldName: req.file.fieldname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      destination: req.file.destination,
    });

    let profile = await Profile.findOne({ user: req.user._id });

    if (!profile) {
      profile = new Profile({ user: req.user._id, profilePicture: webPath });
    } else {
      if (profile.profilePicture) {
        const oldPath = path.join(
          __dirname,
          "..",
          profile.profilePicture.replace(/^\//, "")
        );
        fs.unlink(oldPath, (err) => {
          if (err) {
            console.warn(
              "⚠️ Could not delete old profile picture:",
              err.message
            );
          }
        });
      }

      profile.profilePicture = webPath;
    }

    await profile.save();

    res.json({
      message: "Profile picture uploaded successfully",
      profilePicture: webPath,
    });
  } catch (err) {
    console.error("uploadProfilePicture error:", err);
    res.status(500).json({ message: err.message });
  }
};
