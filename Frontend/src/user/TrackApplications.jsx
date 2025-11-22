import React, { useEffect, useState, useMemo, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import {
  Loader2,
} from "lucide-react";
import { FaSearch, FaDownload, FaBriefcase, FaMapMarkerAlt, FaCalendarAlt, FaClipboardList,FaLayerGroup   } from "react-icons/fa";
import api, { fileUrl } from "../api";
import Sidebar from "../components/Sidebar";
import ProfileHeader from "../components/ProfileHeader";
import StatusBadge from "../components/StatusBadge";
import UserChat from "./UserChat";
import Timeline from "../components/Timeline";
import Footer from "../components/Footer";

// --- NEW: Filter out internal system statuses from timeline ---
const filterUserFriendlyTimeline = (history) => {
  const internalNotes = [
    "Offer submitted for HOD approval",
    "Offer submitted for COO approval",
    "Offer submitted for HR approval",
  ];
  return (history || []).filter((item) => {
    // Hide if note contains internal approval messages
    if (item.note && internalNotes.some(note => item.note.includes(note))) {
      return false;
    }
    return true;
  });
};

const formatCurrency = (value) => {
  if (!value) return "-";
  if (typeof value === "string") return value;
  if (typeof value === "number") return `Rs. ${value.toLocaleString()}/-`;
  return value;
};

// Reusable DetailCard for the modal
const DetailCard = ({ title, data }) => (
  <div className="bg-gray-50 p-4 rounded-lg shadow-sm border mt-4">
    <h3 className="text-md font-semibold text-gray-700 border-b pb-2 mb-3">
      {title}
    </h3>
    <div className="space-y-2 text-sm">
      {Object.entries(data).map(([key, value]) => (
        <div key={key} className="flex justify-between items-start">
          <span className="text-gray-500 whitespace-nowrap mr-4">{key}:</span>
          <span className="font-medium text-gray-800 text-right">
            {value || "-"}
          </span>
        </div>
      ))}
    </div>
  </div>
);

// --- NEW: Date & Time Formatter ---
const formatDateTime = (dateString) => {
  if (!dateString) return "Not Scheduled";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "Invalid Date";

  return date.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export default function TrackApplications() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const pageSize = 6;
  const [selectedApp, setSelectedApp] = useState(null);
  const [showChat, setShowChat] = useState(false);
  const [selectedChatApp, setSelectedChatApp] = useState(null);

  const [userComment, setUserComment] = useState("");
  const [isResponding, setIsResponding] = useState(false);

  const modalRef = useRef(null);
  const navigate = useNavigate();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [active, setActive] = useState("Track Applications");
  const user = JSON.parse(localStorage.getItem("loggedInUser"));
  const role = user?.role || "user";

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const res = await api.get("/auth/myApplications");
      setApplications(res.data || []);
    } catch (e) {
      console.error(e);
      toast.error("Failed to load applications.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  useEffect(() => {
    if (!selectedApp) return;
    setUserComment("");
    const onKey = (e) => {
      if (e.key === "Escape") setSelectedApp(null);
      if (e.key === "Tab" && modalRef.current) {
        const focusable = modalRef.current.querySelectorAll(
          'a,button,input,textarea,select,[tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    setTimeout(() => modalRef.current?.focus?.(), 0);
    return () => document.removeEventListener("keydown", onKey);
  }, [selectedApp]);

  const filtered = useMemo(() => {
    let list = applications || [];
    if (statusFilter !== "all") {
      if (statusFilter === "interview") {
        list = list.filter((a) =>
          (a.currentStatus?.code || "").toLowerCase().includes("interview")
        );
      } else {
        list = list.filter(
          (a) =>
            (a.currentStatus?.code || "").toLowerCase() ===
            statusFilter.toLowerCase()
        );
      }
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((a) => {
        return (
          a.job?.title?.toLowerCase().includes(q) ||
          a.job?.department?.toLowerCase().includes(q) ||
          a.job?.designation?.toLowerCase().includes(q)
        );
      });
    }
    return list;
  }, [applications, statusFilter, search]);

  const paginated = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page]);

  const handleOfferResponse = async (responseType) => {
    if (!selectedApp) return;
    setIsResponding(true);
    try {
      const res = await api.patch(
        `/applications/${selectedApp._id}/offer-response`,
        {
          response: responseType,
          comment: userComment,
        }
      );

      setSelectedApp(null); 
      toast.success(`Offer ${responseType} successfully!`);
      fetchApplications();
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to respond to offer"
      );
    } finally {
      setIsResponding(false);
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar
        role={role}
        active={active}
        setActive={setActive}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
      />

      <main className="flex-1 flex flex-col overflow-auto">
        <ProfileHeader
          title="My Applications"
          subtitle="Track the progress of jobs you've applied to and chat with recruiters."
          showMenuButton={true}
          onMenuClick={() => setSidebarOpen(true)}
        />

        <div className="p-4 md:p-6 max-w-7xl mx-auto flex-1 overflow-y-auto w-full">
          <div className="max-w-7xl mx-auto">
            <div className="bg-white rounded-xl shadow-lg p-5 mb-6">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3 w-full md:w-auto">
                  <div className="relative w-full md:w-72">
                    <input
                      value={search}
                      onChange={(e) => {
                        setSearch(e.target.value);
                        setPage(1);
                      }}
                      placeholder="Search job, department..."
                      className="pl-10 pr-4 py-2 rounded-full border border-gray-300 bg-gray-50 text-sm w-full focus:outline-none focus:ring-1 focus:ring-[#111]"
                    />
                    <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap justify-center">
                  {[
                    "all",
                    "applied",
                    "shortlisted",
                    "interview",
                    "offer",
                    "rejected",
                  ].map((s) => (
                    <button
                      key={s}
                      onClick={() => {
                        setStatusFilter(s);
                        setPage(1);
                      }}
                      className={`px-4 py-1.5 rounded-full text-sm font-medium transition ${
                        statusFilter === s
                          ? "bg-[#E30613] text-white shadow"
                          : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-100"
                      }`}
                    >
                      {s === "all" ? "All" : s[0].toUpperCase() + s.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* --- Content Area --- */}
            <div className="bg-transparent rounded-2xl">
              {loading ? (
                <div className="p-6 text-gray-600 text-center">
                  <Loader2 className="animate-spin text-4xl text-gray-700 mx-auto" />
                  <p className="mt-3 text-lg">Loading applications...</p>
                </div>
              ) : !filtered.length ? (
                <div className="p-10 text-center bg-white rounded-xl shadow-lg text-gray-500">
                  <h3 className="text-xl font-semibold text-gray-800">
                    No applications found.
                  </h3>
                  <p className="mt-2">
                    It looks like you haven't applied to any jobs that match
                    your filters.
                  </p>
                  <div className="mt-6">
                    <button
                      onClick={() => navigate("/jobsBoard")}
                      className="px-5 py-2.5 rounded-full bg-[#E30613] text-white font-semibold hover:bg-red-700 transition shadow-md"
                    >
                      Browse Open Positions
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="grid gap-6 grid-cols-1 md:grid-cols-2 items-stretch">
                    {paginated.map((a) => {
                      const isOfferReady =
                        a.currentStatus?.code === "offer" &&
                        a.offer?.approvalStatus === "approved" &&
                        a.offer?.status === "pending";

                      const isInterviewStage =
                        a.currentStatus?.code === "first-interview" ||
                        a.currentStatus?.code === "second-interview";

                      return (
                        <div
                          key={a._id}
                          className="bg-white rounded-xl shadow-lg hover:shadow-xl transition transform hover:-translate-y-1 overflow-hidden flex flex-col border-t-4 border-[#BFBFBF]"
                        >
                          <div className="p-5 flex-1 flex flex-col justify-between">
                            {/* Top Content */}
                            <div>
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex items-center gap-4 min-w-0">
                                  <div className="w-14 h-14 rounded-lg bg-gray-100 flex items-center justify-center text-[#E30613] font-bold text-xl flex-shrink-0">
                                    {a.job?.title?.[0] || "J"}
                                  </div>
                                  <div className="min-w-0">
                                    <h3
                                      className="text-lg font-semibold text-gray-900 mb-1 truncate"
                                      title={a.job?.title}
                                    >
                                      {a.job?.title}
                                    </h3>
                                    <p className="text-sm text-gray-500 truncate">
                                      {a.job?.department} • {a.job?.location}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex flex-col items-end flex-shrink-0">
                                  <StatusBadge
                                    status={
                                      a.currentStatus?.code || a.currentStatus
                                    }
                                  />
                                  <div className="text-xs text-gray-400 mt-2">
                                    {a.createdAt
                                      ? new Date(
                                          a.createdAt
                                        ).toLocaleDateString()
                                      : "N/A"}
                                  </div>
                                </div>
                              </div>

                              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-gray-600">
                                <div className="flex items-center gap-2">
                                  <FaBriefcase className="text-gray-400 flex-shrink-0" />{" "}
                                  <div>
                                    <span className="font-medium text-gray-700">
                                      Designation:
                                    </span>{" "}
                                    {a.job?.designation || "—"}
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <FaMapMarkerAlt className="text-gray-400 flex-shrink-0" />{" "}
                                  <div>
                                    <span className="font-medium text-gray-700">
                                      Location:
                                    </span>{" "}
                                    {a.job?.location || "—"}
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <FaCalendarAlt className="text-gray-400 flex-shrink-0" />{" "}
                                  <div>
                                    <span className="font-medium text-gray-700">
                                      Deadline:
                                    </span>{" "}
                                    {a.job?.deadline
                                      ? new Date(
                                          a.job.deadline
                                        ).toLocaleDateString()
                                      : "—"}
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <FaClipboardList className="text-gray-400 flex-shrink-0" />{" "}
                                  <div>
                                    <span className="font-medium text-gray-700">
                                      Experience:
                                    </span>{" "}
                                    {a.job?.experienceRequired || "—"}
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 mt-3 text-sm text-gray-700">
                                <FaLayerGroup className="text-gray-400 flex-shrink-0" />{" "}
                                <div>
                                  <span className="font-medium text-gray-700">
                                    Qualification:
                                  </span>{" "}
                                  {a.job?.qualificationRequired || "—"}
                                </div>
                              </div>
                              <p className="mt-4 text-sm text-gray-600 line-clamp-3">
                                {a.job?.description ||
                                  "No description available."}
                              </p>
                            </div>

                            {/* --- Interview Date/Time --- */}
                            {isInterviewStage &&
                              a.interviewSchedule?.date && (
                                <div className="mt-4 p-3 bg-red-50 border-2 border-dashed border-red-200 rounded-lg text-center animate-pulse">
                                  <div className="flex items-center justify-center gap-2">
                                    <FaCalendarAlt className="w-4 h-4 text-red-700" />
                                    <p className="text-sm font-semibold text-red-800">
                                      Interview Scheduled:{" "}
                                      {formatDateTime(a.interviewSchedule.date)}
                                    </p>
                                  </div>
                                </div>
                              )}

                            {/* Bottom Content */}
                            <div className="mt-5 pt-4 border-t border-gray-100 flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                {a.resumePath && (
                                  <a
                                    href={fileUrl(a.resumePath)}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-2 bg-red-700 border px-3 py-1.5 rounded-full text-sm hover:bg-gray-200 hover:text-black transition text-white"
                                  >
                                    <FaDownload className="text-sm" /> Resume
                                  </a>
                                )}
                              </div>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => {
                                    setSelectedChatApp(a);
                                    setShowChat(true);
                                    window.dispatchEvent(
                                      new CustomEvent("app:indicator:clear", {
                                        detail: {
                                          key: `chat:application:${a._id}`,
                                        },
                                      })
                                    );
                                  }}
                                  className="px-3 py-1.5 bg-[#BFBFBF] text-black border border-gray-300 font-semibold rounded-full hover:bg-gray-100 transition relative flex items-center gap-2 text-sm"
                                >
                                  <span className="text-lg">💬</span>
                                  <span>Chat</span>
                                </button>
                                <button
                                  onClick={() => setSelectedApp(a)}
                                  className={`px-4 py-1.5 font-semibold text-sm rounded-full shadow-md transition ${
                                    isOfferReady
                                      ? "bg-green-600 text-white hover:bg-green-700 animate-pulse"
                                      : "bg-[#111] text-white hover:bg-red-700"
                                  }`}
                                >
                                  {isOfferReady
                                    ? "View Offer"
                                    : "Track Status"}
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="mt-6 flex items-center justify-center gap-3">
                    <button
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="px-3 py-1 bg-white border border-gray-300 rounded-md disabled:opacity-50 hover:bg-gray-100"
                    >
                      Prev
                    </button>
                    <div className="text-sm text-gray-600">
                      Page {page} of{" "}
                      {Math.max(1, Math.ceil(filtered.length / pageSize))}
                    </div>
                    <button
                      onClick={() =>
                        setPage((p) =>
                          Math.min(
                            Math.ceil(filtered.length / pageSize),
                            p + 1
                          )
                        )
                      }
                      disabled={page >= Math.ceil(filtered.length / pageSize)}
                      className="px-3 py-1 bg-white border border-gray-300 rounded-md disabled:opacity-50 hover:bg-gray-100"
                    >
                      Next
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        <Footer />
      </main>

      {/* --- Chat Modal (Themed) --- */}
      {showChat && selectedChatApp && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-50"
          onClick={() => setShowChat(false)}
        >
          <div
            className="relative bg-white rounded-2xl shadow-2xl w-full max-w-3xl h-[80vh] flex flex-col animate-fadeInUp overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-5 bg-[#BFBFBF] text-black flex items-center justify-between border-b-2 border-[#1A1A1A]">
              <div className="flex items-center gap-4">
                <div className="w-1.5 h-8 rounded-full bg-[#E30613]" />
                <div>
                  <h3 className="text-xl font-semibold">Chat with Recruiter</h3>
                  <p className="text-sm font-semibold text-black">
                    {selectedChatApp?.job?.title || "Application Chat"}
                  </p>
                </div>
              </div>
              <div>
                <button
                  onClick={() => setShowChat(false)}
                  className="bg-transparent hover:bg-black/30 font-semibold hover:text-white rounded-full p-2 text-black transition"
                  aria-label="Close update profile"
                >
                  ✕
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto bg-white p-5 rounded-b-2xl">
              <UserChat applicationId={selectedChatApp._id} />
            </div>
          </div>
        </div>
      )}

      {/* --- Status Tracking & Offer Modal (Themed) --- */}
      {selectedApp && (
        <div
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm overflow-y-auto"
          onClick={() => setSelectedApp(null)}
          tabIndex={-1}
        >
          <div className="min-h-screen flex items-center justify-center p-4">
            <div
              ref={modalRef}
              className="bg-gray-50 rounded-2xl w-full max-w-3xl shadow-2xl relative max-h-[90vh] overflow-hidden transform transition-all duration-200 outline-none"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="mb-4 overflow-hidden rounded-t-2xl">
                <div className="flex items-start justify-between px-6 py-4 bg-[#BFBFBF] border-b-2 border-[#1A1A1A]">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-lg bg-gray-100 flex items-center justify-center text-[#E30613] font-bold text-xl flex-shrink-0">
                      {selectedApp.job?.title?.[0] || "J"}
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900">
                        {selectedApp.job?.title}
                      </h3>
                      <p className="text-sm text-black">
                        {selectedApp.job?.department} •{" "}
                        {selectedApp.job?.location}
                      </p>
                      <div className="mt-2">
                        <StatusBadge
                          status={
                            selectedApp.currentStatus?.code ||
                            selectedApp.currentStatus
                          }
                        />
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedApp(null)}
                    className="bg-transparent text-2xl hover:bg-black/30 font-semibold hover:text-white rounded-full p-2 text-black transition"
                  >
                    &times;
                  </button>
                </div>
              </div>

              {/* Modal Body */}
              <div
                className="overflow-y-auto px-6 pb-6"
                style={{ maxHeight: "calc(90vh - 140px)" }}
              >
                
                {/* --- LOGIC FIX: Simplified Offer Section --- */}
                {selectedApp.currentStatus?.code === "offer" ? (
                  <>
                    {/* STATE 1: Offer is ready for user */}
                    {selectedApp.offer?.approvalStatus === "approved" &&
                    selectedApp.offer?.status === "pending" ? (
                      <div className="bg-green-50 border-2 border-green-200 p-5 rounded-lg mb-6 shadow-inner">
                        <h3 className="text-xl font-bold text-green-800">
                          You Have Received an Offer!
                        </h3>
                        <p className="text-sm text-green-700 mb-4">
                          Please review the offer details below and respond.
                        </p>

                        <DetailCard
                          title="Offer Details"
                          data={{
                            Designation: selectedApp.offer.designation,
                            Grade: selectedApp.offer.grade,
                            Department: selectedApp.offer.department,
                            Location: selectedApp.offer.location,
                            "Offered Salary": formatCurrency(
                              selectedApp.offer.offeredSalary
                            ),
                            "Vehicle Entitlement":
                              selectedApp.offer.vehicleEntitlement,
                            "Mobile Allowance":
                              selectedApp.offer.mobileAllowance,
                            "Fuel Allowance": `${
                              selectedApp.offer.fuelAllowance || 0
                            } Liter`,
                            "System Requirement":
                              selectedApp.offer.systemRequirement,
                          }}
                        />

                        <div className="mt-4">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Add a Comment (Optional)
                          </label>
                          <textarea
                            value={userComment}
                            onChange={(e) => setUserComment(e.target.value)}
                            placeholder="e.g., I am excited to accept this offer..."
                            rows={3}
                            className="w-full p-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-[#E30613] focus:outline-none"
                          />
                        </div>

                        <div className="mt-5 flex gap-4">
                          <button
                            onClick={() => handleOfferResponse("accepted")}
                            disabled={isResponding}
                            className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-green-300 flex items-center justify-center gap-2"
                          >
                            {isResponding ? (
                              <Loader2 className="animate-spin" size={16} />
                            ) : (
                              "Accept Offer"
                            )}
                          </button>
                          <button
                            onClick={() => handleOfferResponse("rejected")}
                            disabled={isResponding}
                            className="flex-1 px-4 py-2 bg-[#E30613] text-white rounded-lg hover:bg-red-700 disabled:bg-red-300 flex items-center justify-center gap-2"
                          >
                            {isResponding ? (
                              <Loader2 className="animate-spin" size={16} />
                            ) : (
                              "Reject Offer"
                            )}
                          </button>
                        </div>
                      </div>
                    ) : // STATE 2: User has already accepted
                    selectedApp.offer?.status === "accepted" ? (
                      <div className="bg-blue-50 border-2 border-blue-200 p-5 rounded-lg mb-6 shadow-inner">
                        <h3 className="text-xl font-bold text-blue-800">
                          Offer Accepted
                        </h3>
                        <p className="text-sm text-blue-700">
                          You accepted this offer on{" "}
                          {new Date(
                            selectedApp.offer.respondedAt
                          ).toLocaleDateString()}
                          . The recruiter will be in touch with the next steps.
                        </p>
                        {selectedApp.offer.userComment && (
                          <p className="text-sm text-blue-600 italic mt-2">
                            Your comment: "{selectedApp.offer.userComment}"
                          </p>
                        )}
                      </div>
                    ) : // STATE 3: User has already rejected
                    selectedApp.offer?.status === "rejected" ? (
                      <div className="bg-gray-50 border-2 border-gray-200 p-5 rounded-lg mb-6 shadow-inner">
                        <h3 className="text-xl font-bold text-gray-800">
                          Offer Rejected
                        </h3>
                        <p className="text-sm text-gray-700">
                          You rejected this offer on{" "}
                          {new Date(
                            selectedApp.offer.respondedAt
                          ).toLocaleDateString()}
                          .
                        </p>
                        {selectedApp.offer.userComment && (
                          <p className="text-sm text-gray-600 italic mt-2">
                            Your comment: "{selectedApp.offer.userComment}"
                          </p>
                        )}
                      </div>
                    ) : (
                      // STATE 4 (Catch-all): Offer is in review, pending internal, or was withdrawn
                      <div className="bg-yellow-50 border-2 border-yellow-200 p-5 rounded-lg mb-6 shadow-inner">
                        <h3 className="text-xl font-bold text-yellow-800">
                          Offer in Review
                        </h3>
                        <p className="text-sm text-yellow-700">
                          Your application is in the final stages. An offer is
                          being prepared. You will be notified here once it is
                          ready for your review.
                        </p>
                      </div>
                    )}
                  </>
                ) : null}
                {/* --- END OF LOGIC FIX --- */}

                {/* --- Existing Timeline --- */}
                <h4 className="text-sm font-semibold text-red-600 mb-3">
                  Status Timeline
                </h4>
                <div className="bg-white rounded-lg p-4 border shadow-sm">
                  <Timeline items={filterUserFriendlyTimeline(selectedApp.history)} />
                </div>
              </div>

              {/* Modal Footer */}
              <div className="mt-4 pt-4 border-t border-gray-200 flex justify-end gap-3 p-6 bg-gray-100 rounded-b-2xl">
                <button
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-full hover:bg-gray-300 transition"
                  onClick={() => setSelectedApp(null)}
                >
                  Close
                </button>
                <button
                  onClick={() =>
                    navigate(`/user/job-info/${selectedApp.job?._id}`, {
                      state: { job: selectedApp.job },
                    })
                  }
                  className="px-4 py-2 bg-[#111111] text-white rounded-full hover:bg-[#6B6F73] transition"
                >
                  View Job Details
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}