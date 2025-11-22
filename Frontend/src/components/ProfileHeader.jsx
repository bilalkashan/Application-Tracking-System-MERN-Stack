import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { IoNotifications } from "react-icons/io5";
import { FaUser, FaBars } from "react-icons/fa"; // Import FaBars
import api from "../api";

export default function ProfileHeader({
  title,
  subtitle,
  showMenuButton = false, // Add prop to show button
  onMenuClick, // Add prop for click handler
}) {
  const [unreadCount, setUnreadCount] = useState(0);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [latestNotifs, setLatestNotifs] = useState([]);
  const dropdownRef = useRef();
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("loggedInUser"));
  const role = user?.role;

  const fetchNotifs = async () => {
    try {
      const res = await api.get("/notifications/getNotification");
      const unread = res.data.filter((n) => !n.read).length;
      setUnreadCount(unread);
      setLatestNotifs(res.data.slice(0, 5));
    } catch (err) {
      console.error("Failed to fetch notifications", err);
    }
  };

  useEffect(() => {
    fetchNotifs();

    const onNotif = (e) => {
      const notif = e.detail;
      setUnreadCount((prev) => prev + 1);
      setLatestNotifs((prev) => [notif, ...prev].slice(0, 5));
    };
    const onMsg = (e) => setUnreadCount((prev) => prev + 1);

    window.addEventListener("app:newNotification", onNotif);
    window.addEventListener("app:newMessage", onMsg);

    // click outside to close dropdown
    const onDocClick = (ev) => {
      if (dropdownRef.current && !dropdownRef.current.contains(ev.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("click", onDocClick);

    return () => {
      window.removeEventListener("app:newNotification", onNotif);
      window.removeEventListener("app:newMessage", onMsg);
      document.removeEventListener("click", onDocClick);
    };
  }, []);

  return (
    <div className="bg-[#BFBFBF] py-3 px-4 sm:px-6 text-white shadow-md sticky top-0 z-30">
      <div className="flex items-center justify-between">
        <div className="flex items-center min-w-0">
          {/* --- Hamburger Menu Button --- */}
          {showMenuButton && (
            <button
              className="py-2 rounded-full text-[#111111] mr-2 md:hidden hover:bg-[#111] hover:text-white transition"
              onClick={onMenuClick}
            >
              <FaBars className="text-xl" />
            </button>
          )}
          
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold text-[#111111] truncate">
              {title}
            </h1>
            {subtitle && (
              <p className="text-sm opacity-90 text-[#1A1A1A] truncate">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-2">
          <div className="relative" ref={dropdownRef}>
            <div
              className="relative cursor-pointer"
              onClick={() => setDropdownOpen((s) => !s)}
            >
              <IoNotifications
                size={32}
                className="p-2 rounded-full bg-[#111111] hover:text-[#e5383b] text-[#ffffff] transition"
              />
              {unreadCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full">
                  {unreadCount}
                </span>
              )}
            </div>

            {/* --- RESPONSIVE: Notification Dropdown --- */}
            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-full max-w-sm sm:w-96 bg-white text-black rounded-lg shadow-2xl z-50 p-3 border">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-semibold">Notifications</h4>
                  <div className="text-xs text-gray-500">
                    {unreadCount} unread
                  </div>
                </div>

                <div className="divide-y max-h-80 overflow-auto">
                  {latestNotifs.length === 0 && (
                    <div className="p-4 text-center text-gray-500">
                      No notifications
                    </div>
                  )}

                  {latestNotifs.map((n) => (
                    <button
                      key={n._id}
                      onClick={async () => {
                        try {
                          try {
                            if (!n.read)
                              await api.put(
                                `/notifications/readNotification/${n._id}/read`
                              );
                          } catch (markErr) {
                            console.warn(
                              "Failed to mark notif read before navigation",
                              markErr
                            );
                          }

                          if (n.link) {
                            const link = n.link;
                            try {
                              if (link.includes("/requisitions/view/")) {
                                const userRole = role || localStorage.getItem("role");
                                let target = "/recruiter/requisitionForm";
                                if (userRole === "hr")
                                  target = "/superAdmin/requisitionForm";
                                else if (userRole === "hod")
                                  target = "/hod/requisitionForm";
                                else if (userRole === "coo")
                                  target = "/coo/requisitionForm";
                                else if (userRole === "recruiter")
                                  target = "/recruiter/requisitionForm";
                                navigate(target);
                              } else if (link.startsWith("http")) {
                                const url = new URL(link);
                                const frontendHost = window.location.origin;
                                if (link.startsWith(frontendHost)) {
                                  navigate(
                                    url.pathname + url.search + url.hash
                                  );
                                } else {
                                  window.open(link, "_blank");
                                }
                              } else {
                                navigate(link);
                              }
                            } catch (navErr) {
                              console.warn(
                                "Navigation helper failed, fallback to navigate()",
                                navErr
                              );
                              navigate(n.link);
                            }
                          }
                        } catch (e) {
                          console.error(e);
                        } finally {
                          fetchNotifs();
                          setDropdownOpen(false);
                        }
                      }}
                      className="w-full text-left p-3 hover:bg-gray-50 flex gap-3 items-start"
                    >
                      <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold flex-shrink-0">
                        {(n.title || "N").charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <div className="text-sm font-medium text-gray-800 truncate">
                            {n.title}
                          </div>
                          <div className="text-[11px] text-gray-400 flex-shrink-0 ml-2">
                            {new Date(n.createdAt).toLocaleTimeString()}
                          </div>
                        </div>
                        <div
                          className={`text-sm mt-1 ${
                            n.read
                              ? "text-gray-500"
                              : "text-gray-700 font-medium"
                          } truncate`}
                        >
                          {n.message}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>

                <div className="mt-3 flex items-center justify-between">
                  <button
                    onClick={async () => {
                      try {
                        await Promise.all(
                          latestNotifs
                            .filter((n) => !n.read)
                            .map((n) =>
                              api.put(
                                `/notifications/readNotification/${n._id}/read`
                              )
                            )
                        );
                        fetchNotifs();
                      } catch (e) {
                        console.error(e);
                      }
                    }}
                    className="text-xs px-3 py-1 rounded bg-gray-100 hover:bg-gray-200"
                  >
                    Mark all read
                  </button>

                  <button
                    onClick={() => navigate("/my/notifications")}
                    className="text-xs text-indigo-600 font-semibold"
                  >
                    Manage all
                  </button>
                </div>
              </div>
            )}
          </div>

          <FaUser
            size={32}
            className="p-2 rounded-full text-[#ffffff] bg-[#111111] hover:text-[#e5383b] transition cursor-pointer"
            onClick={() =>
              navigate(role === "user" ? "/me/profile" : "/my/profile")
            }
          />
        </div>
      </div>
    </div>
  );
}