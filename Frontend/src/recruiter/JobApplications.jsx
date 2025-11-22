import React, { useEffect, useState, useMemo, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Dialog, Menu } from "@headlessui/react";
import { toast } from "react-hot-toast";
import {
  Briefcase,
  MapPin,
  FileText,
  Users,
  Eye,
  Filter,
  Search,
  Loader2,
  MessageSquare,
  Plus,
  User,
  StickyNote,
  ChevronDown,
  GraduationCap,
  Award,
  Settings,
  Star,
  Flag,
  ShieldCheck,
  GitMerge,
  Calendar,
} from "lucide-react";
import { FaSpinner, FaBars } from "react-icons/fa";
import api, { fileUrl } from "../api";
import Sidebar from "../components/Sidebar";
import ProfileHeader from "../components/ProfileHeader";
import RemarksForm from "../components/RemarksForm";
import StatusBadge from "../components/StatusBadge";
import ScoreCircle from "../components/ScoreCircle";
import defaultAvatar from "../assets/MMC-Logo.png";
import OfferModal from "./OfferModal.jsx";
import RecruiterChat from "./RecruiterChat";

function Modal({ children, onClose, title, showFooter = false, submitLoading = false }) {
  return (
    <Dialog open={true} onClose={onClose} className="relative z-50">
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm animate-fadeIn"
        aria-hidden="true"
      />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel
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

          <div className="p-6 overflow-y-auto flex-1 bg-gray-50">{children}</div>
          {showFooter && (
            <div className="flex justify-end gap-3 border-t bg-white px-6 py-4 rounded-b-2xl flex-shrink-0">
              <button
                type="button"
                onClick={onClose}
                disabled={submitLoading}
                className="px-4 py-2 border rounded-full text-sm text-black bg-[#BFBFBF] hover:bg-gray-100 transition disabled:opacity-50 font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="remarksForm"
                disabled={submitLoading}
                className={`flex items-center justify-center gap-2 px-4 py-2 text-sm rounded-full text-white font-semibold shadow-md transition ${
                  submitLoading
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-[#111] hover:bg-red-700"
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
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}

// --- Reusable Themed RemarkCard Component ---
function RemarksCard({ remark: r }) {
  return (
    <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6 hover:shadow-lg transition duration-300">
      <div className="flex justify-between items-center border-b pb-3 mb-4">
        <div>
          <h3 className="font-semibold text-lg text-gray-800">
            {r.interviewType ? r.interviewType.replace("-", " ") : "General Remark"}
          </h3>
          <p className="text-sm text-gray-500">
            Added by{" "}
            <span className="font-medium text-gray-700">
              {r.interviewer?.name || "Unknown User"}
            </span>{" "}
            ({r.interviewer?.role || "Team Member"})
          </p>
        </div>
        <span className="text-xs text-gray-400">
          {r.createdAt ? new Date(r.createdAt).toLocaleString() : "—"}
        </span>
      </div>
      {r.evaluations?.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-4">
          {r.evaluations.map((ev, i) => (
            <div key={i} className="bg-gray-50 border rounded-lg p-3 text-sm hover:bg-gray-100 transition">
              <p className="font-semibold text-gray-700">{ev.competency}</p>
              <p className="text-gray-500">⭐ {ev.rating}/5</p>
            </div>
          ))}
        </div>
      )}
      {r.comment && (
        <div className="bg-gray-50 border-l-4 border-gray-300 p-4 rounded-lg shadow-inner mb-4">
          <p className="text-gray-700 leading-relaxed italic">“{r.comment}”</p>
        </div>
      )}
      <div className="space-y-2 text-sm text-gray-700">
        {r.keyStrengths && (
          <p>
            <span className="font-semibold text-gray-800">Key Strengths:</span>{" "}
            {r.keyStrengths}
          </p>
        )}
        {r.areasForImprovement && (
          <p>
            <span className="font-semibold text-gray-800">
              Areas for Improvement:
            </span>{" "}
            {r.areasForImprovement}
          </p>
        )}
        {r.generalImpression && (
          <p>
            <span className="font-semibold text-gray-800">
              General Impression:
            </span>{" "}
            {r.generalImpression}
          </p>
        )}
        {r.recommendation && (
          <p>
            <span className="font-semibold text-gray-800">
              Recommendation:
            </span>{" "}
            {r.recommendation}
          </p>
        )}
      </div>
      {r.overallAverageScore && (
        <div className="mt-5 flex justify-end">
          <span className="bg-[#111111] text-white text-sm px-4 py-1 rounded-full font-medium">
            Avg Score: {r.overallAverageScore.toFixed(1)} / 5
          </span>
        </div>
      )}
    </div>
  );
}

// --- Helper: Formats YYYY-MM-DD for date inputs ---
function dateOnly(val) {
  if (!val) return "";
  const d = new Date(val);
  if (Number.isNaN(d.getTime())) return "";
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mm}-${dd}`;
}

// --- Reusable Themed Profile Card Components ---
const ProfileCard = ({ title, icon, children, full }) => (
  <section
    className={`bg-gray-50 border border-gray-200 rounded-xl p-6 shadow-sm ${
      full ? "col-span-1 md:col-span-2" : ""
    }`}
  >
    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-gray-800">
      {icon} {title}
    </h3>
    <div className="text-sm text-gray-700 space-y-1">{children}</div>
  </section>
);

const InfoList = ({ data }) => (
  <ul className="space-y-2">
    {Object.entries(data).map(([k, v]) => {
      let displayValue = v;
      if (typeof v === "boolean") {
        displayValue = v ? "Yes" : "No";
      } else if (Array.isArray(v)) {
        displayValue = v.join(", ") || "-";
      } else if (!v) {
        displayValue = "-";
      }
      return (
        <li key={k} className="flex justify-between items-start gap-4">
          <span className="font-medium text-gray-500 whitespace-nowrap">
            {k}:
          </span>
          <span className="font-semibold text-gray-900 text-right">
            {displayValue}
          </span>
        </li>
      );
    })}
  </ul>
);

const ComplianceItem = ({ label, conflict }) => (
  <div className="py-2">
    <span className="font-medium text-gray-500">{label}:</span>
    <span
      className={`font-semibold text-right ml-2 ${
        conflict?.hasConflict ? "text-red-600" : "text-green-600"
      }`}
    >
      {conflict?.hasConflict ? "Yes" : "No"}
    </span>
    {conflict?.hasConflict && (
      <p className="text-xs text-gray-700 italic border-l-2 border-gray-300 pl-2 ml-2 mt-1">
        {conflict.details}
      </p>
    )}
  </div>
);

const ThemedTimeline = ({ items, icon }) => (
  <div className="relative border-l-2 border-gray-200 ml-4">
    {items.map((item, i) => (
      <div key={i} className="mb-6 ml-6 relative">
        <span className="absolute -left-[13px] top-1 w-5 h-5 bg-[#6B6F73] rounded-full ring-4 ring-white flex items-center justify-center">
          {icon === "exp" ? (
            <Briefcase size={12} className="text-white" />
          ) : (
            <GraduationCap size={12} className="text-white" />
          )}
        </span>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <h4 className="font-semibold text-gray-800">{item.title || "-"}</h4>
          <p className="text-sm text-gray-600">{item.subtitle}</p>
          <p className="text-sm text-gray-500">{item.period}</p>
          <p className="text-sm mt-1">{item.description || "-"}</p>
        </div>
      </div>
    ))}
  </div>
);

// --- FULL PROFILE SECTION ---
const ProfileSections = ({ selected }) => {
  const profile = selected.applicantProfile || {};

  return (
    <div className="space-y-6 mt-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ProfileCard title="Personal Info" icon={<User size={18} />}>
          <InfoList
            data={{
              "Full Name": profile.name,
              "Father's Name": profile.fathersName,
              Gender: profile.gender,
              "Date of Birth": profile.dob ? dateOnly(profile.dob) : "-",
              "Marital Status": profile.maritalStatus,
              Nationality: profile.nationality,
              CNIC: profile.cnicNumber,
              Contact: profile.contactNumber,
              Address: profile.currentAddress,
            }}
          />
        </ProfileCard>

        <ProfileCard title="Application Details" icon={<Briefcase size={18} />}>
          <InfoList
            data={{
              "Position Applied": profile.positionApplied,
              "Application Type": profile.applicationType,
              "Area of Interest": profile.areaOfInterest,
              "Preferred Locations": profile.preferredLocations,
              Availability: profile.availability,
              "Willing to Travel": profile.willingToTravel,
              "Willing to Relocate": profile.willingToRelocate,
              "Expected Salary": profile.expectedSalary
                ? `PKR ${Number(profile.expectedSalary).toLocaleString()}`
                : "-",
            }}
          />
        </ProfileCard>
      </div>

      {profile.employeeId && (
        <ProfileCard title="Internal Applicant" icon={<Settings size={18} />} full>
          <InfoList
            data={{
              "Employee ID": profile.employeeId,
              Designation: profile.designation,
              Department: profile.department,
              Location: profile.location,
              "Date of Joining": profile.dateOfJoining
                ? dateOnly(profile.dateOfJoining)
                : "-",
            }}
          />
        </ProfileCard>
      )}

      <ProfileCard title="Experience" icon={<Briefcase size={18} />} full>
        {profile.experienceDetails?.length ? (
          <ThemedTimeline
            icon="exp"
            items={profile.experienceDetails.map((ex) => ({
              title: ex.jobTitle,
              subtitle: ex.organization,
              period: `${ex.from ? dateOnly(ex.from) : "-"} → ${
                ex.to ? dateOnly(ex.to) : "-"
              }`,
              description: ex.responsibilities,
            }))}
          />
        ) : (
          <p className="text-gray-500">No experience data</p>
        )}
      </ProfileCard>

      <ProfileCard title="Education" icon={<GraduationCap size={18} />} full>
        {profile.education?.length ? (
          <ThemedTimeline
            icon="edu"
            items={profile.education.map((ed) => ({
              title: ed.highestQualification,
              subtitle: ed.institution,
              period: `Year: ${ed.graduationYear || "-"}`,
              description: `Major: ${ed.major || "-"} | CGPA: ${ed.cgpa || "-"}`,
            }))}
          />
        ) : (
          <p className="text-gray-500">No education data</p>
        )}
      </ProfileCard>

      <ProfileCard title="Skills" icon={<Star size={18} />} full>
        <InfoList
          data={{
            Technical: profile.technicalSkills?.join(", ") || "-",
            Digital: profile.digitalSkills?.join(", ") || "-",
            Languages: profile.languages?.join(", ") || "-",
            "Soft Skills": profile.softSkills?.join(", ") || "-",
          }}
        />
      </ProfileCard>

      <ProfileCard title="Achievements" icon={<Award size={18} />} full>
        <InfoList
          data={{
            Achievements: profile.achievements?.join(", ") || "-",
            Projects: profile.majorProjects?.join(", ") || "-",
            Leadership: profile.leadershipRoles?.join(", ") || "-",
          }}
        />
      </ProfileCard>

      {profile.motivation?.reasonToJoin && (
        <ProfileCard title="Motivation" icon={<Flag size={18} />} full>
          <p className="font-medium text-gray-500">
            Why do you want to join?
          </p>
          <p className="text-gray-700 italic">
            "{profile.motivation.reasonToJoin}"
          </p>

          <p className="font-medium text-gray-500 mt-3">Five Year Plan:</p>
          <p className="text-gray-700 italic">
            "{profile.motivation.fiveYearPlan || "-"}"
          </p>
        </ProfileCard>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ProfileCard title="Compliance" icon={<ShieldCheck size={18} />}>
          <ComplianceItem
            label="Business with company"
            conflict={profile.conflicts?.businessWithCompany}
          />
          <ComplianceItem
            label="Relatives employed"
            conflict={profile.conflicts?.relativesEmployed}
          />
          <ComplianceItem
            label="Previously worked here"
            conflict={profile.conflicts?.previouslyWorked}
          />
          <ComplianceItem
            label="Legal cases"
            conflict={profile.conflicts?.legalCases}
          />
        </ProfileCard>

        <ProfileCard
          title="Diversity & References"
          icon={<GitMerge size={18} />}
        >
          <InfoList
            data={{
              Disability: profile.diversity?.disability,
              Veteran: profile.diversity?.veteran,
              References: profile.diversity?.references,
            }}
          />
        </ProfileCard>
      </div>
    </div>
  );
};

// --- NEW: Interview Schedule Modal ---
function InterviewScheduleModal({ app, interviewType, onClose, onSuccess }) {
  const [scheduleDate, setScheduleDate] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!scheduleDate) {
      return toast.error("Please select a date and time for the interview.");
    }

    setLoading(true);
    try {
      const payload = {
        code: interviewType,
        note: `Interview scheduled for ${new Date(
          scheduleDate
        ).toLocaleString()}`,
        interviewDate: scheduleDate,
      };

      const res = await api.patch(
        `/auth/updateStatus/${app._id}/status`,
        payload
      );

      onSuccess(res.data);
      toast.success(`Interview scheduled for ${interviewType.replace("-", " ")}!`);
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to schedule interview.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={true} onClose={onClose} className="relative z-50">
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        aria-hidden="true"
      />
      <div className="fixed inset-0 flex items-center justify-center p-4 animate-fadeIn">
        <Dialog.Panel
          onClick={(e) => e.stopPropagation()}
          className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-scaleIn flex flex-col"
        >
          <form onSubmit={handleSubmit}>
            <div className="flex items-center justify-between px-6 py-4 bg-[#111111] text-white border-b-4 border-[#E30613]">
              <h3 className="text-lg font-semibold">Schedule Interview</h3>
              <button
                type="button"
                onClick={onClose}
                className="text-gray-300 hover:text-white text-3xl leading-none"
              >
                &times;
              </button>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-sm text-gray-600">
                Select a date and time for the{" "}
                <strong>{interviewType.replace("-", " ")}</strong> for{" "}
                <strong>{app.applicant.name}</strong>.
              </p>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1 uppercase">
                  Interview Date & Time
                </label>
                <input
                  type="datetime-local"
                  value={scheduleDate}
                  onChange={(e) => setScheduleDate(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg shadow-sm bg-gray-50 focus:ring-2 focus:ring-[#E30613] focus:outline-none transition"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t bg-gray-50 px-6 py-4 rounded-b-2xl">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="px-5 py-2 border rounded-full text-gray-700 bg-white hover:bg-gray-100 transition disabled:opacity-50 font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className={`flex items-center justify-center gap-2 px-6 py-2 rounded-full text-white font-semibold shadow-md transition ${
                  loading
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-[#E30613] hover:bg-red-700"
                }`}
              >
                {loading ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  "Schedule & Update Status"
                )}
              </button>
            </div>
          </form>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}
// --- End New Modal ---

// --- Main Component ---
export default function JobApplications() {
  const { jobId } = useParams();
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [query, setQuery] = useState("");
  const [showChat, setShowChat] = useState(false);
  const [active, setActive] = useState("My Posted Jobs");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showRemarks, setShowRemarks] = useState(false);
  const [remarks, setRemarks] = useState([]);
  const [remarksLoading, setRemarksLoading] = useState(false);
  const [showRemarksForm, setShowRemarksForm] = useState(false);
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [isSubmittingRemark, setIsSubmittingRemark] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [interviewType, setInterviewType] = useState("");

  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("loggedInUser"));
  const role = user?.role || "recruiter";

  const [sortOrder, setSortOrder] = useState("high-to-low");

  // --- ADDED: renderLoading function ---
  const renderLoading = () => (
    <div className="flex items-center justify-center h-[calc(100vh-200px)]">
      <FaSpinner className="animate-spin text-4xl text-gray-700" />
      <p className="ml-3 text-lg text-gray-600">Loading Applications...</p>
    </div>
  );

  useEffect(() => {
    fetchApplications();
  }, [jobId]);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const [jobRes, appsRes] = await Promise.all([
        api.get(`/jobs/${jobId}/with-interviewers`),
        api.get(`/auth/jobApplications/job/${jobId}`),
      ]);
      setApps(appsRes.data || []);
    } catch (e) {
      toast.error(e.response?.data?.message || e.message);
    } finally {
      setLoading(false);
    }
  };

  const remarksByAppId = useMemo(() => {
    const map = new Map();
    apps.forEach((app) => {
      map.set(app._id, app.remarks || []);
    });
    return map;
  }, [apps]);

  const loadApplicant = async (appId) => {
    try {
      const existingApp = apps.find((a) => a._id === appId);
      if (existingApp?.applicantProfile) {
        setSelected(existingApp);
        return;
      }
      const res = await api.get(`/auth/applicant/${appId}/details`);
      const fullAppData = res.data;

      if (!fullAppData.remarks && existingApp.remarks) {
        fullAppData.remarks = existingApp.remarks;
      }

      setSelected(fullAppData);
      setApps((prev) =>
        prev.map((a) => (a._id === appId ? fullAppData : a))
      );
    } catch (e) {
      toast.error(e.response?.data?.message || e.message);
    }
  };

  const openRemarksModal = async (app) => {
    setSelected(app);
    setShowRemarks(true);
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
  };

  const openAddRemarkModal = (app) => {
    setSelected(app);
    const appRemarks = remarksByAppId.get(app._id) || [];
    const existing = appRemarks.find(
      (r) => r.interviewer?._id === user._id || r.interviewer === user._id
    );
    setRemarks(existing ? [existing] : []);
    setShowRemarksForm(true);
  };

  const closeModals = () => {
    setShowRemarks(false);
    setShowRemarksForm(false);
    setShowOfferModal(false);
    setShowScheduleModal(false);
    setRemarks([]);
  };

  const handleScheduleSuccess = (updatedApp) => {
    setSelected(updatedApp);
    setApps((prev) =>
      prev.map((a) => (a._id === updatedApp._id ? updatedApp : a))
    );
  };

  const handleRemarkSuccess = (newRemark) => {
    setIsSubmittingRemark(false);
    setShowRemarksForm(false);
    toast.success("Remark submitted successfully!");

    const updateState = (prevData) => {
      if (!prevData) return null;
      const remarkIdentifier =
        newRemark._id || newRemark.interviewer?._id || newRemark.interviewer;
      const existingRemarkIndex = prevData.remarks?.findIndex(
        (r) =>
          (r._id && r._id === remarkIdentifier) ||
          (r.interviewer?._id === remarkIdentifier) ||
          (r.interviewer === remarkIdentifier)
      );
      let updatedRemarks;
      if (existingRemarkIndex > -1) {
        updatedRemarks = [...prevData.remarks];
        updatedRemarks[existingRemarkIndex] = newRemark;
      } else {
        updatedRemarks = [...(prevData.remarks || []), newRemark];
      }
      return { ...prevData, remarks: updatedRemarks };
    };

    setApps((prevApps) =>
      prevApps.map((app) => (app._id === selected._id ? updateState(app) : app))
    );
    setSelected(updateState);
  };

  const sortedAndFilteredApps = useMemo(() => {
    const filtered = apps.filter((a) => {
      if (!query) return true;
      const q = query.toLowerCase();
      return (
        (a.applicant?.name || "").toLowerCase().includes(q) ||
        (a.applicant?.email || "").toLowerCase().includes(q)
      );
    });

    const sorted = [...filtered];
    if (sortOrder === "high-to-low") {
      sorted.sort((a, b) => (b.matchingScore || 0) - (a.matchingScore || 0));
    } else {
      sorted.sort((a, b) => (a.matchingScore || 0) - (b.matchingScore || 0));
    }
    return sorted;
  }, [apps, query, sortOrder]);

  if (loading) {
    return (
      <div className="flex h-screen bg-gray-100">
        <Sidebar
          role={role}
          active={active}
          setActive={setActive}
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
        />
        <main className="flex-1 overflow-y-auto">
          <ProfileHeader
            title="Loading Applicants..."
            subtitle="Please wait..."
            showMenuButton={true}
            onMenuClick={() => setSidebarOpen(true)}
          />
          {renderLoading()}
        </main>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      <Sidebar
        role={role}
        active={active}
        setActive={setActive}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
      />

      {/* --- REMOVED FIXED HAMBURGER BUTTON --- */}

      <div className="flex-1 flex flex-col min-h-0">
        <ProfileHeader
          title="Recruiter Dashboard"
          subtitle="View Applicants"
          showMenuButton={true}
          onMenuClick={() => setSidebarOpen(true)}
        />
        
        {/* --- RESPONSIVE LAYOUT: flex-col on mobile, md:flex-row on desktop --- */}
        <div className="flex flex-col md:flex-row flex-1 min-h-0">
          
          {/* Left Panel */}
          {/* --- RESPONSIVE: Full width on mobile, scrolls separately --- */}
          <aside className="w-full md:w-1/3 lg:w-1/4 bg-white border-r border-gray-200 overflow-y-auto p-5 md:h-full">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-gray-800">Applicants</h2>
              <span className="text-sm text-gray-500">{apps.length} Total</span>
            </div>
            
            {/* --- RESPONSIVE FILTERS --- */}
            <div className="flex flex-col-1 sm:flex-row items-center gap-2 mb-4">
              <div className="relative w-full">
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search applicants..."
                  className="bg-gray-50 block w-full pl-9 pr-3 py-2 rounded-lg border border-gray-300 text-sm placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-[#111]"
                />
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              </div>
              <select
                id="sort-order"
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                className="w-full sm:w-auto text-sm border-gray-300 rounded-lg shadow-sm focus:ring-1 focus:ring-[#111] bg-gray-50 p-2"
              >
                <option value="high-to-low">High-Low</option>
                <option value="low-to-high">Low-High</option>
              </select>
            </div>
            
            {!apps.length ? (
              <p className="text-gray-500 text-center text-sm py-10">
                No applications yet.
              </p>
            ) : (
              <ul className="space-y-3">
                {sortedAndFilteredApps.map((a) => {
                  const pic =
                    a.applicantProfile?.profilePicture ||
                    a.applicant?.profilePicture;
                  return (
                    <li
                      key={a._id}
                      onClick={() => loadApplicant(a._id)}
                      className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer border transition shadow-md ${
                        selected?._id === a._id
                          ? "bg-red-50 border-[#E30613] shadow-md"
                          : "bg-white hover:bg-gray-50 hover:shadow-md border-gray-200"
                      }`}
                    >
                      {pic ? (
                        <img
                          src={fileUrl(pic)}
                          alt="avatar"
                          className="w-10 h-10 rounded-full object-cover border border-gray-300"
                          onError={(e) => {
                            e.currentTarget.src = defaultAvatar;
                          }}
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-sm font-semibold text-gray-600 flex-shrink-0">
                          {a.applicant?.name?.[0] || "?"}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-semibold truncate text-gray-800">
                            {a.applicant?.name}
                          </p>
                          <span
                            className={`text-xs font-bold text-white px-2 py-0.5 rounded-full ${
                              a.matchingScore > 75
                                ? "bg-green-600"
                                : "bg-[#111111]"
                            }`}
                          >
                            {a.matchingScore ?? "-"}%
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 truncate">
                          {a.applicant?.email}
                        </p>
                        <div className="mt-1">
                          <StatusBadge status={a.currentStatus?.code} />
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </aside>

          {/* Right Panel */}
          {/* --- RESPONSIVE: Full width on mobile, scrolls separately --- */}
          <main className="flex-1 p-4 md:p-6 overflow-y-auto bg-gray-50 md:h-full">
            {!selected ? (
              <div className="text-gray-500 text-center mt-10 md:mt-32 italic">
                Select an applicant to view details 📄
              </div>
            ) : (
              <div className="rounded-2xl p-4 sm:p-6 md:p-8 bg-white shadow-xl border border-gray-100 space-y-6 animate-fadeInUp">
                <div className="flex flex-col sm:flex-row justify-between items-center border-b border-gray-200 pb-5">
                  <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 text-center sm:text-left">
                    {selected.applicantProfile?.profilePicture ? (
                      <img
                        src={fileUrl(selected.applicantProfile.profilePicture)}
                        alt="Profile"
                        className="w-24 h-24 sm:w-40 sm:h-40 rounded-full border-2 border-gray-300 object-cover"
                        onError={(e) => {
                          e.currentTarget.src = defaultAvatar;
                        }}
                      />
                    ) : (
                      <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center text-2xl font-bold text-gray-600">
                        {selected.applicantProfile?.name?.[0] || "?"}
                      </div>
                    )}
                    <div>
                      <h2 className="text-2xl font-bold text-gray-800">
                        {selected.applicantProfile?.name ||
                          selected.applicant?.name}
                      </h2>
                      <p className="text-sm text-gray-600">
                        {selected.applicantProfile?.email ||
                          selected.applicant?.email}
                      </p>
                      {selected.applicantProfile?.contactNumber && (
                        <p className="text-sm text-gray-500">
                          {selected.applicantProfile.contactNumber}
                        </p>
                      )}
                      <div className="mt-2">
                        <StatusBadge status={selected.currentStatus?.code} />
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-center mt-4 sm:mt-0">
                    <h3 className="font-semibold text-gray-600 mb-1">
                      Match Score
                    </h3>
                    <ScoreCircle score={selected.matchingScore ?? 0} />
                  </div>
                </div>

                <div className="flex flex-wrap gap-3">
                  {selected.resumePath ? (
                    <a
                      href={fileUrl(selected.resumePath)}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-1.5 text-sm bg-[#111111] text-white rounded-full hover:bg-[#6B6F73] transition font-medium shadow-md"
                    >
                      <FileText size={16} /> View Resume
                    </a>
                  ) : (
                    <span className="inline-flex items-center gap-2 px-4 py-1.5 text-sm bg-gray-300 text-gray-600 rounded-full cursor-not-allowed">
                      <FileText size={16} /> No Resume
                    </span>
                  )}
                  <button
                    onClick={() => setShowChat(true)}
                    className="inline-flex items-center gap-2 px-4 py-1.5 text-sm bg-[#111111] text-white rounded-full hover:bg-[#6B6F73] transition font-medium shadow-md"
                  >
                    <MessageSquare size={16} /> Chat
                  </button>
                  <button
                    onClick={() => openRemarksModal(selected)}
                    className="inline-flex items-center gap-2 px-4 py-1.5 text-sm bg-[#111111] text-white rounded-full hover:bg-[#6B6F73] transition font-medium shadow-md"
                  >
                    <StickyNote size={16} /> Remarks
                  </button>

                  <Menu as="div" className="relative inline-block text-left">
                    <Menu.Button className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#BFBFBF] text-black border border-gray-300 rounded-full hover:bg-gray-200 transition font-medium">
                      Status <ChevronDown className="h-4 w-4" />
                    </Menu.Button>
                    <Menu.Items className="absolute right-0 mt-2 w-56 bg-white border rounded-lg shadow-xl z-10">
                      {[
                        { code: "shortlisted", label: "Shortlist" },
                        { code: "first-interview", label: "1st Interview" },
                        { code: "second-interview", label: "2nd Interview" },
                        { code: "offer", label: "Send Offer" },
                        { code: "offer-accepted", label: "Offer Accepted" },
                        { code: "offer-rejected", label: "Offer Rejected" },
                        { code: "medical", label: "Medical" },
                        { code: "onboarding", label: "Onboarding" },
                        { code: "hired", label: "Hired" },
                        { code: "rejected", label: "Reject" },
                      ].map((action) => (
                        <Menu.Item key={action.code}>
                          {({ active }) => (
                            <button
                              onClick={async () => {
                                if (action.code.includes("interview")) {
                                  setInterviewType(action.code);
                                  setShowScheduleModal(true);
                                  return;
                                }
                                if (action.code === "offer") {
                                  setShowOfferModal(true);
                                  return;
                                }

                                const originalSelected = selected;
                                const originalApps = apps;

                                const newStatus = {
                                  code: action.code,
                                  note: `Recruiter marked as ${action.label}`,
                                  at: new Date(),
                                  by: user._id,
                                };

                                const optimisticallyUpdatedApp = {
                                  ...selected,
                                  currentStatus: newStatus,
                                  history: [
                                    ...(selected.history || []),
                                    newStatus,
                                  ],
                                };

                                setSelected(optimisticallyUpdatedApp);
                                setApps(
                                  (prev) =>
                                    prev.map((a) =>
                                      a._id === selected._id
                                        ? optimisticallyUpdatedApp
                                        : a
                                    )
                                );
                                toast.success(`Status updated: ${action.label}`);

                                try {
                                  await api.patch(
                                    `/auth/updateStatus/${selected._id}/status`,
                                    {
                                      code: action.code,
                                      note: `Recruiter marked as ${action.label}`,
                                    }
                                  );
                                } catch (e) {
                                  toast.error(
                                    e.response?.data?.message ||
                                      `Failed to update status.`
                                  );
                                  setSelected(originalSelected);
                                  setApps(originalApps);
                                }
                              }}
                              className={`block w-full text-left px-4 py-2 text-sm ${
                                active
                                  ? "bg-gray-100 text-gray-900"
                                  : "text-gray-700"
                              } ${
                                action.code === "rejected"
                                  ? "font-medium text-[#E30613]"
                                  : ""
                              } ${
                                action.code === "offer"
                                  ? "font-medium text-[#E30613]"
                                  : ""
                              } ${
                                action.code === "hired"
                                  ? "font-medium text-green-600"
                                  : ""
                              }`}
                            >
                              {action.label}
                            </button>
                          )}
                        </Menu.Item>
                      ))}
                    </Menu.Items>
                  </Menu>
                </div>
                <ProfileSections selected={selected} />
              </div>
            )}
          </main>
        </div>
      </div>

      {/* Chat Section */}
      {showChat && selected && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-50 transition-all duration-300"
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
                  <h3 className="text-xl font-semibold">
                    Chat with {selected.applicantProfile?.name || "Applicant"} 💬
                  </h3>
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
              <RecruiterChat applicationId={selected._id} />
            </div>
          </div>
        </div>
      )}

      {/* View Remarks Modal */}
      {showRemarks && selected && (
        <Modal
          onClose={closeModals}
          title="Interview Remarks Overview"
        >
          {remarksLoading ? (
            <div className="flex justify-center items-center h-48">
              <FaSpinner className="animate-spin text-4xl text-gray-700" />
            </div>
          ) : remarks.length === 0 ? (
            <p className="text-gray-500 text-center py-10">
              No remarks have been added yet.
            </p>
          ) : (
            <div className="space-y-6">
              {remarks.map((r, index) => (
                <RemarksCard key={index} remark={r} />
              ))}
            </div>
          )}
          <div className="mt-10 border-t pt-6 text-center">
            <button
              onClick={() => {
                closeModals();
                setTimeout(() => openAddRemarkModal(selected), 100);
              }}
              className="inline-flex items-center text-sm gap-2 px-4 py-1.5 bg-[#111] text-white rounded-full shadow-md hover:bg-red-700 transition"
            >
              Add / Edit Your Remark
            </button>
          </div>
        </Modal>
      )}

      {/* Add/Edit Remark Modal */}
      {showRemarksForm && selected && (
        <>
          <Modal
            onClose={closeModals}
            title={`Add/Edit Your Remark for ${selected.applicant?.name}`}
            showFooter={true}
            submitLoading={isSubmittingRemark}
          >
            <RemarksForm
              appId={selected._id}
              onClose={closeModals}
              onSuccess={handleRemarkSuccess}
              userRole={role}
              existingRemarks={remarks.find(
                (r) =>
                  r.interviewer?._id === user._id || r.interviewer === user._id
              )}
            />
          </Modal>
        </>
      )}

      {/* Offer Modal */}
      {showOfferModal && selected && (
        <OfferModal
          app={selected}
          onClose={() => setShowOfferModal(false)}
          onSuccess={(updatedApp) => {
            setSelected(updatedApp);
            setApps((prev) =>
              prev.map((a) => (a._id === updatedApp._id ? updatedApp : a))
            );
            setShowOfferModal(false);
            toast.success("Offer sent successfully!");
          }}
        />
      )}

      {/* --- NEW: Interview Schedule Modal --- */}
      {showScheduleModal && selected && (
        <InterviewScheduleModal
          app={selected}
          interviewType={interviewType}
          onClose={closeModals}
          onSuccess={(updatedApp) => {
            handleScheduleSuccess(updatedApp);
            closeModals(); // Close modal on success
          }}
        />
      )}
    </div>
  );
}