import React, { useEffect, useState, useMemo, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Loader2,
  Plus,
  User,
  Filter,
  ChevronDown,
  ChevronUp,
  Building2,
  CheckCircle2,
  XCircle,
  AlertCircle,
} from "lucide-react";
import { FaBars, FaSpinner } from "react-icons/fa";
import toast from "react-hot-toast";
import api, { fileUrl } from "../api";
import Sidebar from "../components/Sidebar";
import ProfileHeader from "../components/ProfileHeader";
import RemarksForm from "../components/RemarksForm";
import StatusBadge from "../components/StatusBadge";
import ScoreCircle from "../components/ScoreCircle";
import defaultAvatar from "../assets/MMC-Logo.png";
import Footer from "../components/Footer";

// Reusable Modal Component (Unchanged)
function Modal({ children, onClose, title, showFooter = false, submitLoading = false }) {
  return (
    <div
      onClick={onClose}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden animate-scaleIn flex flex-col max-h-[90vh]"
      >
        {/* Header */}
            <div className="p-5 bg-[#BFBFBF] text-black flex items-center justify-between border-b-2 border-[#1A1A1A]">
              <div className="flex items-center gap-4">
                <div className="w-1.5 h-8 rounded-full bg-[#E30613]" />
                <div>
                  <h3 className="text-xl font-semibold">{title}</h3>
                </div>
              </div>
              <div>
                <button
                  onClick={onClose}
                  className="bg-transparent hover:bg-black/30 font-semibold hover:text-white rounded-full p-2 text-black transition"
                  aria-label="Close update profile"
                >
                  ✕
                </button>
              </div>
            </div>
        <div className="p-6 overflow-y-auto flex-1">{children}</div>
        {showFooter && (
          <div className="flex justify-end gap-3 border-t bg-gray-50 px-6 py-4 rounded-b-2xl flex-shrink-0">
            <button
              type="button"
              onClick={onClose}
              disabled={submitLoading}
              className="px-5 py-2 border rounded-full text-gray-700 bg-white hover:bg-gray-100 transition disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="remarksForm" // This ID must match the form ID in RemarksForm
              disabled={submitLoading}
              className={`flex items-center justify-center gap-2 px-6 py-2 rounded-full text-white font-semibold shadow-md transition ${
                submitLoading
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-[#E30613] hover:bg-red-700"
              }`}
            >
              {submitLoading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                "Submit Remarks"
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// --- NEW: Recommendation Icon ---
const RecommendationIcon = ({ recommendation }) => {
  if (!recommendation) return null;

  if (["Strongly Recommend", "Recommend"].includes(recommendation)) {
    return (
      <span
        className="flex items-center gap-1 text-xs font-semibold text-green-700 bg-green-100 px-2 py-0.5 rounded-full"
        title={recommendation}
      >
        <CheckCircle2 size={12} /> {recommendation}
      </span>
    );
  }
  if (["Not Suitable"].includes(recommendation)) {
    return (
      <span
        className="flex items-center gap-1 text-xs font-semibold text-red-700 bg-red-100 px-2 py-0.5 rounded-full"
        title={recommendation}
      >
        <XCircle size={12} /> {recommendation}
      </span>
    );
  }
  if (["Consider with Reservations"].includes(recommendation)) {
    return (
      <span
        className="flex items-center gap-1 text-xs font-semibold text-yellow-700 bg-yellow-100 px-2 py-0.5 rounded-full"
        title={recommendation}
      >
        <AlertCircle size={12} /> {recommendation}
      </span>
    );
  }
  return null;
};

// --- UPDATED: Remark Card (Themed) ---
function RemarkCard({ remark: r }) {
  return (
    <div className="border border-gray-200 rounded-xl p-5 bg-white shadow-sm transition-all duration-300">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h4 className="font-semibold text-gray-800">
            {r.interviewer?.name || "Unknown"}
          </h4>
          <p className="text-sm text-gray-500">{r.role || "Interviewer"}</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          {/* --- NEW: Added RecommendationIcon --- */}
          <RecommendationIcon recommendation={r.recommendation} />
          <span className="text-xs text-gray-400">
            {new Date(r.createdAt).toLocaleDateString()}
          </span>
        </div>
      </div>

      {r.evaluations?.length > 0 && (
        <div className="mb-4">
          <h5 className="text-sm font-semibold text-gray-700 mb-2">
            Evaluation Summary
          </h5>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-sm">
            {r.evaluations.map((ev, idx) => (
              <div
                key={idx}
                className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 flex justify-between items-center text-gray-700"
              >
                <span className="truncate pr-2">{ev.competency}</span>
                <span className="font-medium text-gray-900 whitespace-nowrap">
                  {ev.rating} / 5
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {r.generalImpression && (
        // <InfoBlock title="General Impression" content={r.generalImpression} />
        <div className="mt-4 flex justify-end">
          <span className="bg-[#BFBFBF] text-black text-xs px-3 py-1 rounded-full font-medium">
            General Impression: {r.generalImpression}
          </span>
        </div>
      )}

      {/* --- NEW: Added 'comment' field if it exists --- */}

      <div className="grid sm:grid-cols-2 gap-4 text-sm text-gray-700 mt-4">
        {r.keyStrengths && (
          <InfoBlock title="Key Strengths" content={r.keyStrengths} />
        )}
        {r.areasForImprovement && (
          <InfoBlock
            title="Areas for Improvement"
            content={r.areasForImprovement}
          />
        )}

        {r.motivationCareerAspiration && (
          <InfoBlock
            title="Motivation & Career Aspiration"
            content={r.motivationCareerAspiration}
          />
        )}

        {r.expectedCompensation && (
          <InfoBlock
            title="Expected Compensation"
            content={r.expectedCompensation}
          />
        )}

        {r.availabilityNoticePeriod && (
          <InfoBlock
            title="Availability Notice Period"
            content={r.availabilityNoticePeriod}
          />
        )}

        {r.comment && (
            <InfoBlock title="Additional Comment" content={r.comment} />
        )}
      </div>

      {r.overallAverageScore !== undefined && r.overallAverageScore !== null && (
        <div className="mt-4 flex justify-end">
          <span className="bg-[#111111] text-white text-xs px-3 py-1 rounded-full font-medium">
            Avg Score: {Number(r.overallAverageScore).toFixed(1)} / 5
          </span>
        </div>
      )}
    </div>
  );
}

// --- UPDATED: InfoBlock (Themed) ---
function InfoBlock({ title, content, span }) {
  return (
    <div className={`py-2 ${span ? "sm:col-span-2" : ""}`}>
      <p className="font-semibold text-gray-600 mb-1 text-xs uppercase tracking-wider">
        {title}
      </p>
      <p className="text-gray-800 text-sm whitespace-pre-wrap">{content}</p>
    </div>
  );
}

// --- NEW: Job Summary Card ---
const JobSummaryCard = ({ job }) => {
  if (!job) return null;
  return (
    <div className="bg-white p-6 rounded-2xl shadow-lg border-t-4 border-[#111] mb-6">
      <div className="flex flex-col md:flex-row justify-between md:items-center">
        <div>
          <p className="text-sm font-medium text-gray-500">Reviewing for</p>
          <h2 className="text-2xl font-bold text-[#111111]">{job.title}</h2>
          <p className="text-md text-gray-600 flex items-center gap-2 mt-1">
            <Building2 size={16} /> {job.department}
          </p>
        </div>
        <div className="grid grid-cols-2 gap-x-6 gap-y-2 mt-4 md:mt-0 md:text-right">
          <div className="text-gray-700">
            <p className="text-xs text-gray-500 font-semibold uppercase">Experience</p>
            <p className="font-medium">{job.experienceRequired}</p>
          </div>
          <div className="text-gray-700">
            <p className="text-xs text-gray-500 font-semibold uppercase">Qualification</p>
            <p className="font-medium">{job.qualificationRequired}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

// ---- UPDATED: Applicant Card (Now Expandable) ----
const ApplicantCard = ({ app, onAddRemark, isExpanded, onToggleExpand }) => {
  const [remarks, setRemarks] = useState([]);
  const [remarksLoading, setRemarksLoading] = useState(false);

  // Fetch remarks only when the card is expanded
  useEffect(() => {
    if (isExpanded && remarks.length === 0) {
      (async () => {
        try {
          setRemarksLoading(true);
          const { data } = await api.get(`/applications/${app._id}/with-remarks`);
          setRemarks(data.remarks || []);
        } catch (err) {
          console.error("Failed to load remarks:", err);
          toast.error("Failed to load remarks");
        } finally {
          setRemarksLoading(false);
        }
      })();
    }
  }, [isExpanded, app._id, remarks.length]);

  const hasRemarks = (app.remarks || []).length > 0;

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-lg transition-all duration-300">
      {/* --- Card Header (Always Visible) --- */}
      <div className="p-5">
        <div className="grid grid-cols-12 gap-4 items-center">
          <div className="col-span-12 md:col-span-5 flex items-center gap-4 min-w-0">
            <img
              src={
                app.applicantProfile?.profilePicture
                  ? fileUrl(app.applicantProfile.profilePicture)
                  : `https://ui-avatars.com/api/?name=${encodeURIComponent(
                      app.applicant?.name || "A"
                    )}&background=random&color=fff`
              }
              alt="avatar"
              className="w-14 h-14 rounded-full object-cover ring-2 ring-gray-100 flex-shrink-0"
              onError={(e) => {
                e.target.src = defaultAvatar;
              }}
            />
            <div className="min-w-0">
              <h3
                className="font-semibold text-gray-900 text-lg truncate"
                title={app.applicant?.name}
              >
                {app.applicant?.name || "Applicant"}
              </h3>
              <p
                className="text-sm text-gray-500 truncate"
                title={app.applicant?.email}
              >
                {app.applicant?.email}
              </p>
            </div>
          </div>
          <div className="col-span-6 md:col-span-3 flex items-center justify-center gap-6">
            <div className="text-center">
              <h4 className="text-xs text-gray-500 font-semibold mb-1">
                MATCH
              </h4>
              <ScoreCircle score={app.matchingScore || 0} size="small" />
            </div>
            <div className="text-center">
              <h4 className="text-xs text-gray-500 font-semibold mb-1">
                STATUS
              </h4>
              <StatusBadge status={app.currentStatus?.code} />
            </div>
          </div>
          <div className="col-span-6 md:col-span-4 flex flex-wrap justify-end gap-2">
            <button
              onClick={onToggleExpand}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-full border border-gray-300 bg-white text-gray-700 hover:bg-gray-100 transition whitespace-nowrap"
            >
              {isExpanded ? (
                <ChevronUp size={14} />
              ) : (
                <ChevronDown size={14} />
              )}
              {isExpanded ? "Hide Details" : "View Details"}
              {hasRemarks && !isExpanded && (
                <span className="bg-[#E30613] text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center">
                  {app.remarks.length}
                </span>
              )}
            </button>
            <button
              onClick={onAddRemark}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-full bg-[#E30613] text-white hover:bg-red-700 transition whitespace-nowrap"
            >
              <Plus size={14} />
              Add/Edit Remark
            </button>
          </div>
        </div>
      </div>

      {/* --- NEW: Expandable Area --- */}
      {isExpanded && (
        <div className="border-t-2 border-dashed border-gray-200 bg-gray-50/50 p-5">
          {remarksLoading ? (
            <div className="flex items-center justify-center py-10 text-gray-500">
              <Loader2 className="animate-spin" size={20} />
              <span className="ml-2">Loading remarks...</span>
            </div>
          ) : remarks.length === 0 ? (
            <p className="text-gray-500 text-center py-10">
              No remarks have been added yet.
            </p>
          ) : (
            <div className="space-y-6">
              {remarks.map((r, index) => (
                <RemarkCard key={r._id || index} remark={r} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// --- Main Component ---
export default function InterviewerJobApplications() {
  const { jobId } = useParams();
  const user = JSON.parse(localStorage.getItem("loggedInUser")) || {};
  const navigate = useNavigate();

  const [job, setJob] = useState(null);
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeApp, setActiveApp] = useState(null);
  const [showAddRemarkModal, setShowAddRemarkModal] = useState(false);
  const [sortOrder, setSortOrder] = useState("desc");
  const [isSubmittingRemark, setIsSubmittingRemark] = useState(false);
  const [expandedAppId, setExpandedAppId] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [active, setActive] = useState("Remarks");

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const [jobRes, appsRes] = await Promise.all([
          api.get(`/jobs/${jobId}/with-interviewers`),
          api.get(`/auth/jobApplications/job/${jobId}`),
        ]);
        setJob(jobRes.data);
        const appsWithRemarks = (appsRes.data || []).map(app => ({
          ...app,
          remarks: app.remarks || [], 
        }));
        setApps(appsWithRemarks);
      } catch (err) {
        console.error("Failed to load:", err);
        toast.error("Failed to load job or applications");
      } finally {
        setLoading(false);
      }
    })();
  }, [jobId]);

  // --- UPDATED: Simplified modal opener ---
  const handleAddRemark = (app) => {
    setActiveApp(app);
    setShowAddRemarkModal(true);
  };

  const closeModals = () => {
    setShowAddRemarkModal(false);
    setActiveApp(null);
  };

  // --- UPDATED: Remark success handler (now simpler) ---
  const handleRemarkSuccess = async (newRemark) => {
    setIsSubmittingRemark(true);

    // This logic ensures the card's internal state (remarks) is updated
    setApps(prevApps => prevApps.map(app => {
        if (app._id === activeApp?._id) {
            const remarkId = newRemark._id;
            const existingRemarkIndex = app.remarks.findIndex(r => r._id === remarkId);

            let updatedRemarks;
            if (existingRemarkIndex > -1) {
                updatedRemarks = [...app.remarks];
                updatedRemarks[existingRemarkIndex] = newRemark;
            } else {
                updatedRemarks = [...app.remarks, newRemark];
            }
            return { ...app, remarks: updatedRemarks };
        }
        return app;
    }));

    setIsSubmittingRemark(false);
    closeModals();
    toast.success("Remark submitted successfully!");

    setExpandedAppId(null);
  };

  const sortedApps = useMemo(
    () =>
      [...apps].sort((a, b) =>
        sortOrder === "desc"
          ? (b.matchingScore || 0) - (a.matchingScore || 0)
          : (a.matchingScore || 0) - (b.matchingScore || 0)
      ),
    [apps, sortOrder]
  );

  if (loading)
    return (
      <div className="flex h-screen bg-gray-100">
        <Sidebar
          role={user?.role}
          active={active}
          setActive={setActive}
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
        />
        <main className="flex-1 overflow-y-auto">
          <ProfileHeader
            title={"Loading Job..."}
            subtitle={"Please wait..."}
          />
          <div className="flex items-center justify-center h-64 text-gray-600">
            <FaSpinner className="animate-spin text-4xl text-gray-700" />
            <p className="ml-3 text-lg">Loading applications...</p>
          </div>

          
        </main>
      </div>
    );

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar
        role={user?.role}
        active={active}
        setActive={setActive}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
      />

      <main className="flex-1 overflow-y-auto">
        <ProfileHeader
          title={job?.title || "Job Applications"}
          subtitle={`Review applicants for the ${job?.title || ""} role`}
          showMenuButton={true}
          onMenuClick={() => setSidebarOpen(true)}
        />

        <div className="p-4 md:p-6 max-w-7xl mx-auto">
          {/* --- NEW: Job Summary --- */}
          <JobSummaryCard job={job} />

          {/* Filter Bar */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-800">
              Applicants ({apps.length})
            </h2>
            <div className="flex items-center gap-3">
              <Filter size={18} className="text-gray-500" />
              <select
                className="px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white shadow-sm focus:ring-2 focus:ring-[#E30613] focus:outline-none transition"
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
              >
                <option value="desc">Highest Match → Lowest</option>
                <option value="asc">Lowest Match → Highest</option>
              </select>
            </div>
          </div>

          {/* Applicant Cards */}
          {apps.length === 0 ? (
            <div className="bg-white border border-gray-200 p-10 rounded-2xl text-center text-gray-500 shadow-sm">
              <User size={32} className="mx-auto text-gray-400" />
              <h3 className="mt-2 font-medium">No applicants yet.</h3>
              <p className="text-sm">
                Check back later to review candidates.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {sortedApps.map((app) => (
                <ApplicantCard
                  key={app._id}
                  app={app}
                  onAddRemark={() => handleAddRemark(app)}
                  isExpanded={expandedAppId === app._id}
                  onToggleExpand={() =>
                    setExpandedAppId(
                      expandedAppId === app._id ? null : app._id
                    )
                  }
                />
              ))}
            </div>
          )}
        </div>

        {/* Add/Edit Remark Modal */}
        {showAddRemarkModal && activeApp && (
          <Modal
            onClose={closeModals}
            title={`Add/Edit Your Remark for ${activeApp.applicant?.name}`}
            showFooter={true}
            submitLoading={isSubmittingRemark}
          >
            <RemarksForm
              appId={activeApp._id}
              onClose={closeModals}
              onSuccess={handleRemarkSuccess}
              userRole={user?.role}
              // --- UPDATED: Pass the specific remark by the current user ---
              existingRemarks={
                activeApp.remarks?.find(r => 
                    r.interviewer?._id === user._id || r.interviewer === user._id
                )
              }
            />
          </Modal>
        )}

        <Footer />
      </main>
      
    </div>
  );
}