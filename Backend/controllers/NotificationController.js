import Notification from "../models/Notification.js";

export const getNotification =  async (req, res) => {
  const userId = req.user._id;
  const notifs = await Notification.find({ user: userId }).sort({ createdAt: -1 });
  res.json(notifs);
};

export const readNotification = async (req, res) => {
  await Notification.findByIdAndUpdate(req.params.id, { read: true });
  res.json({ success: true });
};

export const deleteNotification = async (req, res) => {
  try {
    await Notification.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Notification deleted" });
  } catch (err) {
    console.error("Error deleting notification:", err);
    res.status(500).json({ success: false, message: "Failed to delete notification" });
  }
};
