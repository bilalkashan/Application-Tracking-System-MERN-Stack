import Application from "../models/Application.js";
import { io, onlineUsers } from "../index.js";
import { createNotification } from "../utils/notify.js";

export const sendMessage = async (req, res) => {
  try {
    const { applicationId } = req.params;
    const { text } = req.body;

    if (!text?.trim()) {
      return res.status(400).json({ message: "Message cannot be empty" });
    }

    const application = await Application.findById(applicationId)
      .populate("job", "createdBy")
      .populate("applicant", "name email");

    if (!application) {
      return res.status(404).json({ message: "Application not found" });
    }

    const userId = req.user._id.toString();
    const isRecruiter = userId === application.job.createdBy.toString();
    const isApplicant = userId === application.applicant._id.toString();
    if (!isRecruiter && !isApplicant) {
      return res.status(403).json({ message: "Not authorized for this chat" });
    }

    const newMessage = { sender: req.user._id, text };
    application.messages.push(newMessage);
    await application.save();

    const populatedApp = await application.populate({
      path: "messages.sender",
      select: "name role email",
    });

    const savedMessage =
      populatedApp.messages[populatedApp.messages.length - 1];

    try {
      const recipientId = isRecruiter
        ? application.applicant._id
        : application.job.createdBy;

      const senderName = req.user?.name || req.user?.email || "Someone";
      await createNotification({
        userId: recipientId,
        title: `New message from ${senderName}`,
        message: savedMessage.text || "You have a new message",
        link: isRecruiter
          ? `/chat/${applicationId}`
          : `/recruiter/chat/${applicationId}`,
      });

      io.to(`user:${String(recipientId)}`).emit("newMessage", {
        applicationId,
        jobId: application.job?._id,
        message: savedMessage,
      });
    } catch (e) {
      console.warn(
        "Failed to emit newMessage or create notification:",
        e.message || e
      );
    }

    res.status(201).json(savedMessage);
  } catch (err) {
    console.error("sendMessage error:", err);
    res.status(500).json({ message: err.message });
  }
};

export const getMessages = async (req, res) => {
  try {
    const { applicationId } = req.params;

    const application = await Application.findById(applicationId)
      .populate("job", "createdBy")
      .populate("applicant", "name email")
      .populate("messages.sender", "name role email");

    if (!application) {
      return res.status(404).json({ message: "Application not found" });
    }

    const userId = req.user._id.toString();
    const isRecruiter = userId === application.job?.createdBy?.toString();
    const isApplicant = userId === application.applicant?._id?.toString();

    if (!isRecruiter && !isApplicant) {
      return res.status(403).json({ message: "Not authorized" });
    }

    res.json(application.messages);
  } catch (err) {
    console.error("getMessages error:", err);
    res.status(500).json({ message: err.message });
  }
};
