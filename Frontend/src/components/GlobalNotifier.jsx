import { useEffect, useRef } from "react";
import { Toaster, toast } from "react-hot-toast";
import { notifyIndicator } from "../utils/indicators";

export default function GlobalNotifier() {
  const seenRef = useRef(new Set());

  useEffect(() => {
    const seen = seenRef.current;

    const dedupe = (key, ttl = 5000) => {
      if (!key) return false;
      if (seen.has(key)) return true;
      seen.add(key);
      setTimeout(() => seen.delete(key), ttl);
      return false;
    };

    const onNotif = (e) => {
      const notif = e.detail;
      try {
        const title = (notif.title || "").toString().toLowerCase();
        const link = (notif.link || "").toString().toLowerCase();
        const isChatNotif = title.includes("new message") || title.includes("message from") || link.includes("/chat/");
        if (isChatNotif) return;

        const key = notif?._id || `${notif?.title}:${notif?.message}`;
        if (dedupe(key)) return;
        const msg = notif.message || "You have a new notification";
        toast.success(`${notif.title}: ${msg}`, { duration: 4000 });
        try {
          notifyIndicator('sidebar:notifications', { notif });
          const link = (notif.link || '').toString().toLowerCase();
          if (link.includes('/chat/')) {
            const appId = notif.link.split('/').pop();
            notifyIndicator(`chat:application:${appId}`, { applicationId: appId });
          }
        } catch (e) {
          console.warn('indicator notify failed', e);
        }
      } catch (err) {
        console.warn("GlobalNotifier failed to show notif toast", err);
      }
    };

    const onMsg = (e) => {
      try {
        const data = e.detail || {};
        const message = data.message || data;
        const key = message?._id || `${data.applicationId}:${message?.text}`;
        if (dedupe(key)) return;
        const text = message?.text || "New message received";
        const sender = message?.sender?.name || message?.sender?.email || "Someone";
        toast.success(`Message from ${sender}: ${text}`, { duration: 4000 });
        try {
          notifyIndicator('sidebar:notifications', { message: true });
          if (data.jobId) notifyIndicator(`job:posted:${data.jobId}`, { jobId: data.jobId });
          if (data.applicationId) notifyIndicator(`chat:application:${data.applicationId}`, { applicationId: data.applicationId });
        } catch (err) {
          console.warn('indicator notify failed', err);
        }
      } catch (err) {
        console.warn("GlobalNotifier failed to show message toast", err);
      }
    };

    window.addEventListener("app:newNotification", onNotif);
    window.addEventListener("app:newMessage", onMsg);
    return () => {
      window.removeEventListener("app:newNotification", onNotif);
      window.removeEventListener("app:newMessage", onMsg);
    };
  }, []);

  return <Toaster position="top-center" reverseOrder={false} />;
}
