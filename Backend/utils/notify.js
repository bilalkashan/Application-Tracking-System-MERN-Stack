import Notification from "../models/Notification.js";
import { io, onlineUsers } from "../index.js"; // import socket instance
import User from "../models/user.js";

export const createNotification = async ({ userId, title, message, link }) => {
  const notif = new Notification({ user: userId, title, message, link });
  await notif.save();

  // Emit to the per-user room so any socket of the user receives it
  try {
    io.to(`user:${userId}`).emit("newNotification", notif);
    // console.log("📨 Live notification emitted to room user:", userId);
  } catch (e) {
    console.warn("Failed to emit notification to user room", e.message || e);
  }

  return notif;
};

export const broadcastToUsers = async ({ userIds, title, message, link }) => {
  if (!Array.isArray(userIds) || userIds.length === 0) return [];
  const created = [];
  for (const uid of userIds) {
    const n = await createNotification({ userId: uid, title, message, link });
    created.push(n);
  }
  return created;
};

export const broadcastToRole = async ({ role, title, message, link }) => {
  const users = await User.find({ role }).select("_id");
  const ids = users.map((u) => u._id);
  // emit live to role room once
  try {
    io.to(`role:${role}`).emit("newNotification", { title, message, link });
  } catch (e) {
    console.warn("broadcastToRole emit failed", e.message || e);
  }

  // persist per-user notifications without emitting again to avoid duplicates
  if (!ids || ids.length === 0) return [];
  const docs = ids.map((uid) => ({ user: uid, title, message, link }));
  try {
    const created = await Notification.insertMany(docs);
    return created;
  } catch (e) {
    console.warn("Failed to persist role notifications", e.message || e);
    // fallback to creating individually but without emitting
    const created = [];
    for (const uid of ids) {
      const n = new Notification({ user: uid, title, message, link });
      await n.save();
      created.push(n);
    }
    return created;
  }
};

export const broadcastToDepartment = async ({
  department,
  title,
  message,
  link,
}) => {
  // Try finding AdminProfile users for the department (HODs)
  const AdminProfile = await import("../models/AdminProfile.js");
  const profiles = await AdminProfile.default
    .find({ department })
    .populate("user", "_id");
  const ids = profiles.map((p) => p.user._id);
  return broadcastToUsers({ userIds: ids, title, message, link });
};
