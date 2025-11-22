import React, { useEffect, useMemo, useState, useRef } from "react";
import { FaBars, FaSpinner } from "react-icons/fa";
import { Search, ExternalLink, X } from "lucide-react";
import Sidebar from "../components/Sidebar";
import ProfileHeader from "../components/ProfileHeader";
import { useNavigate } from "react-router-dom";
import api from "../api";
import { toast } from "react-hot-toast";
import Footer from "../components/Footer";

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [filter, setFilter] = useState("All");
  const [selected, setSelected] = useState([]);
  const [active, setActive] = useState("Notifications");
  const [sidebarOpen, setSidebarOpen] = useState(false); // Set to false for mobile
  const [loading, setLoading] = useState(true); // Set initial loading to true
  const [query, setQuery] = useState("");
  const [error, setError] = useState(null);

  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("loggedInUser"));
  const role = user?.role;

  // Load Notifications
  const loadNotifications = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get("/notifications/getNotification");
      setNotifications(res.data);
      setFiltered(res.data); // Initially set filtered to all
      setSelected([]);
    } catch (err) {
      console.error("Failed to load notifications:", err);
      setError("Failed to load notifications. Please try again.");
      toast.error("Failed to load notifications");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  // Mark single notification as read
  const markRead = async (id) => {
    try {
      await api.put(`/notifications/readNotification/${id}/read`);
      toast.success("Notification marked as read", { duration: 2000 });
      loadNotifications(); // Refresh list
    } catch (err) {
      console.error(err);
      toast.error("Failed to mark as read");
    }
  };

  // Mark all as read
  const markAllRead = async () => {
    const unreadIds = notifications.filter((n) => !n.read).map(n => n._id);
    if (unreadIds.length === 0) return toast.success("All notifications are already read.");
    
    try {
      await Promise.all(
        unreadIds.map((id) => api.put(`/notifications/readNotification/${id}/read`))
      );
      toast.success("All notifications marked as read", { duration: 2000 });
      loadNotifications();
    } catch (err) {
      console.error(err);
      toast.error("Failed to mark all as read");
    }
  };

  // Delete single notification
  const deleteNotification = async (id) => {
    try {
      await api.delete(`/notifications/deleteNotification/${id}`);
      toast.success("Notification deleted", { duration: 2000 });
      loadNotifications();
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete notification");
    }
  };

  // Delete selected notifications
  const deleteSelected = async () => {
    if (selected.length === 0) {
      toast.error("No notifications selected");
      return;
    }
    try {
      await Promise.all(
        selected.map((id) => api.delete(`/notifications/deleteNotification/${id}`))
      );
      toast.success("Selected notifications deleted", { duration: 2000 });
      loadNotifications();
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete selected notifications");
    }
  };

  // Filter notifications
  useEffect(() => {
    let items = notifications;
    if (filter === "Read") items = items.filter((n) => n.read);
    else if (filter === "Unread") items = items.filter((n) => !n.read);

    if (query && query.trim()) {
      const q = query.trim().toLowerCase();
      items = items.filter(
        (n) =>
          (n.title || "").toLowerCase().includes(q) ||
          (n.message || "").toLowerCase().includes(q)
      );
    }
    setFiltered(items);
  }, [filter, notifications, query]);

  // grouped view memoized
  const grouped = useMemo(() => {
    const groups = { Today: [], Yesterday: [], Older: [] };
    const now = new Date();
    const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const todayStart = startOfDay(now).getTime();
    const yesterdayStart = startOfDay(
      new Date(now.getTime() - 24 * 60 * 60 * 1000)
    ).getTime();

    filtered.forEach((n) => {
      const t = new Date(n.createdAt).getTime();
      if (t >= todayStart) groups.Today.push(n);
      else if (t >= yesterdayStart) groups.Yesterday.push(n);
      else groups.Older.push(n);
    });
    return groups;
  }, [filtered]);

  // Handle checkbox toggle
  const toggleSelect = (id) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    const allIds = filtered.map((n) => n._id);
    if (selected.length === allIds.length) setSelected([]);
    else setSelected(allIds);
  };

  // Format time nicely
  const formatTime = (dateStr) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  // Handle navigation when clicking notification link
  const handleNotify = (n) => { // Pass the whole notification 'n'
    try {
      if (!n.link) return toast.error("No link defined for this notification");
      
      const markAndNavigate = async () => {
        try {
          if (!n.read) {
            await api.put(`/notifications/readNotification/${n._id}/read`);
          }
        } catch (e) {
          console.warn("Failed to mark notification read before navigate", e?.message || e);
        }

        const link = n.link;
        try {
          if (link.includes('/requisitions/view/')) {
            const userRole = role || localStorage.getItem('role');
            let target = '/recruiter/requisitionForm';
            if (userRole === 'hr') target = '/superAdmin/requisitionForm';
            else if (userRole === 'hod') target = '/hod/requisitionForm';
            else if (userRole === 'coo') target = '/coo/requisitionForm';
            else if (userRole === 'recruiter') target = '/recruiter/requisitionForm';
            navigate(target); // Navigate to the list page
            return;
          } else if (link.startsWith("http")) {
            const url = new URL(link);
            const frontendHost = window.location.origin;
            if (link.startsWith(frontendHost)) {
              navigate(url.pathname + url.search + url.hash);
              return;
            }
            window.open(link, "_blank");
            return;
          }
          navigate(link);
        } catch (navErr) {
          console.warn("Navigation helper failed, fallback to navigate()", navErr);
          navigate(n.link);
        }
      };

      markAndNavigate().finally(() => {
        loadNotifications(); // Refresh state after navigation
      });
    } catch (err) {
      console.error(err);
      toast.error("Navigation failed");
    }
  };

  // Socket Integration
  useEffect(() => {
    const onNotif = (e) => {
      const notif = e.detail;
      setNotifications((prev) => [notif, ...prev]);
    };

    window.addEventListener("app:newNotification", onNotif);
    return () => window.removeEventListener("app:newNotification", onNotif);
  }, []);

  const renderLoading = () => (
    <div className="flex items-center justify-center h-[calc(100vh-200px)]">
      <FaSpinner className="animate-spin text-4xl text-gray-700" />
      <p className="ml-3 text-lg text-gray-600">Loading Notifications...</p>
    </div>
  );

  const renderError = () => (
    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg m-6" role="alert">
      <strong className="font-bold">Error: </strong>
      <span className="block sm:inline">{error}</span>
    </div>
  );

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar
        role={role}
        active={active}
        setActive={setActive}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        <ProfileHeader
          title="Notifications"
          subtitle="All system and chat notifications appear here."
          showMenuButton={true}
          onMenuClick={() => setSidebarOpen(true)}
        />

        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              {/* Search & Filter */}
              <div className="flex flex-col-1 sm:flex-row gap-4 w-full md:w-auto">
                <div className="relative flex-1 w-full">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="w-4 h-4 text-gray-400" />
                  </div>
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search notifications"
                    className="outline-none text-sm w-full pl-10 pr-4 py-2 rounded-full border bg-white shadow-md"
                  />
                </div>
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="p-2 rounded-full border bg-white text-sm font-semibold text-gray-700 shadow-md sm:w-auto"
                >
                  <option value="All">All</option>
                  <option value="Read">Read</option>
                  <option value="Unread">Unread</option>
                </select>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 w-full md:w-auto">
                <button
                  onClick={toggleSelectAll}
                  className="px-4 py-2 text-sm font-semibold bg-white text-gray-700 border rounded-full shadow-md hover:shadow-md transition w-1/2 md:w-auto"
                >
                  {selected.length === filtered.length && filtered.length > 0 ? 'Clear' : 'Select All'}
                </button>
                <button
                  onClick={async () => {
                    if (selected.length) await Promise.all(selected.map(id => markRead(id)));
                    else await markAllRead();
                  }}
                  className="px-4 py-2 font-semibold text-sm bg-black text-white rounded-full shadow-md hover:bg-gray-800 transition w-1/4 md:w-auto"
                >
                  Read
                </button>
                <button
                  onClick={deleteSelected}
                  className="px-4 py-2 font-semibold text-sm bg-red-600 text-white rounded-full shadow-md hover:bg-red-700 transition w-1/4 md:w-auto"
                >
                  Delete
                </button>
              </div>
            </div>


            {/* main content card */}
            <div className="bg-white rounded-2xl shadow-sm border p-2 sm:p-4">
              {loading ? (
                renderLoading()
              ) : error ? (
                renderError()
              ) : (
                <div className="space-y-6">
                  {Object.entries(grouped).map(([groupName, items]) => (
                    <div key={groupName}>
                      <div className="flex items-center justify-between mb-3 px-2">
                        <h3 className="text-lg font-semibold text-gray-800">
                          {groupName}{" "}
                          <span className="text-sm text-gray-400">{items.length}</span>
                        </h3>
                      </div>

                      {items.length === 0 ? (
                        <div className="text-sm text-gray-400 mb-4 px-2">
                          No {groupName.toLowerCase()} notifications.
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {items.map((n) => (
                            <div
                              key={n._id}
                              className={`flex flex-col sm:flex-row items-start gap-4 p-3 rounded-xl border ${
                                n.read ? "bg-white" : "bg-indigo-50 border-indigo-100"
                              } hover:shadow-md transition`}
                            >
                              <div className="flex items-start gap-3 w-full">
                                <input
                                  type="checkbox"
                                  checked={selected.includes(n._id)}
                                  onChange={() => toggleSelect(n._id)}
                                  className="mt-2"
                                />
                                <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-semibold text-lg flex-shrink-0">
                                  {(n.title || "N").charAt(0)}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between">
                                    <div className="flex items-center gap-3">
                                      <div className="text-sm font-medium text-gray-900 truncate">
                                        {n.title}
                                      </div>
                                      <div className="text-xs text-gray-400">
                                        {formatTime(n.createdAt)}
                                      </div>
                                    </div>
                                    {/* --- RESPONSIVE: Moved buttons to bottom on mobile --- */}
                                    <div className="hidden sm:flex items-center gap-2">
                                      {n.link && (
                                        <button onClick={() => handleNotify(n)} className="p-2 rounded-full hover:bg-gray-100">
                                          <ExternalLink className="w-4 h-4 text-gray-500" />
                                        </button>
                                      )}
                                      {!n.read && (
                                        <button onClick={() => markRead(n._id)} className="px-3 py-1 bg-green-600 text-white rounded-md text-xs">
                                          Mark Read
                                        </button>
                                      )}
                                      <button onClick={() => deleteNotification(n._id)} className="px-2 py-1 bg-red-600 text-white rounded-md text-xs">
                                        ✕
                                      </button>
                                    </div>
                                  </div>
                                  <div className="text-sm text-gray-600 mt-2 line-clamp-2">
                                    {n.message}
                                  </div>
                                  {/* --- RESPONSIVE: Buttons for mobile --- */}
                                  <div className="flex sm:hidden items-center gap-2 mt-3">
                                      {n.link && (
                                        <button onClick={() => handleNotify(n)} className="flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-700 rounded-md text-xs">
                                          <ExternalLink className="w-3 h-3" /> View
                                        </button>
                                      )}
                                      {!n.read && (
                                        <button onClick={() => markRead(n._id)} className="px-3 py-1 bg-green-600 text-white rounded-md text-xs">
                                          Mark Read
                                        </button>
                                      )}
                                      <button onClick={() => deleteNotification(n._id)} className="px-2 py-1 bg-red-600 text-white rounded-md text-xs">
                                        Delete
                                      </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </main>

        <Footer />

      </div>
    </div>
  );
}