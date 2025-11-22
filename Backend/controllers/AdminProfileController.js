import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import AdminProfile from "../models/AdminProfile.js";
import User from "../models/user.js";

const formatProfile = (profile) => {
  if (!profile) return null;
  return {
    _id: profile._id,
    name: profile.user?.name || "",
    email: profile.user?.email || "",
    role: profile.user?.role || "",
    department: profile.department || "",
    designation: profile.designation || "",
    joinedAt: profile.joinedAt || null,
    summary: profile.summary || "",
    contactNumber: profile.contactNumber || "",
    location: profile.location || "",
    employeeId: profile.employeeId || "",
    profilePicture: profile.profilePicture || "",
  };
};

export const getAdminProfile = async (req, res) => {
  try {
    const userId = req.user._id;
    
    // 1. Try to find the profile
    let profile = await AdminProfile.findOne({ user: userId }).populate(
      "user",
      "name email role"
    );

    // 2. If NO profile exists, create a default empty one
    if (!profile) {
      profile = new AdminProfile({
        user: userId,
      });
      await profile.save();

      // Populate the user details for the newly created profile
      profile = await AdminProfile.findById(profile._id).populate(
        "user",
        "name email role"
      );
    }

    // 3. Return the profile (existing or newly created)
    res.json({ success: true, profile: formatProfile(profile) });
  } catch (err) {
    console.error("❌ getAdminProfile error:", err);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

export const updateAdminProfile = async (req, res) => {
  try {
    const userId = req.user._id;
    const {
      name,
      department,
      designation,
      joinedAt,
      summary,
      contactNumber,
      location,
      employeeId,
    } = req.body;

    let profilePicture;

    // ✅ If new file uploaded, build correct URL
    if (req.file) {
      profilePicture = `/uploads/profilePictures/${req.file.filename}`;

      // Delete old picture if exists
      const existing = await AdminProfile.findOne({ user: userId });
      if (existing?.profilePicture) {
        // Build filesystem path relative to this file
        const oldRelative = existing.profilePicture.startsWith("/")
          ? existing.profilePicture.slice(1)
          : existing.profilePicture;
        const oldPath = path.join(__dirname, "..", oldRelative);

        fs.unlink(oldPath, (err) => {
          if (err)
            console.warn(
              "⚠️ Could not delete old profile picture:",
              err.message
            );
        });
      }
    }

    // Update User name
    if (name) {
      await User.findByIdAndUpdate(userId, { name });
    }

    // Build updateData
    const updateData = {};
    if (department) updateData.department = department;
    if (designation) updateData.designation = designation;
    if (profilePicture) updateData.profilePicture = profilePicture;
    // parse joinedAt if provided (string YYYY-MM-DD)
    if (joinedAt) {
      const d = new Date(joinedAt);
      if (!isNaN(d)) updateData.joinedAt = d;
    }
    if (summary !== undefined) updateData.summary = summary;
    if (contactNumber !== undefined) updateData.contactNumber = contactNumber;
    if (location !== undefined) updateData.location = location;
    if (employeeId !== undefined) updateData.employeeId = employeeId;

    const updatedProfile = await AdminProfile.findOneAndUpdate(
      { user: userId },
      { $set: updateData },
      { new: true, upsert: true }
    ).populate("user", "name email role");

    res.json({
      success: true,
      message: "Profile updated successfully",
      profile: formatProfile(updatedProfile),
    });
  } catch (err) {
    console.error("❌ updateAdminProfile error:", err);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};