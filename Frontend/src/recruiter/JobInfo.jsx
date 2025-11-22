import { useEffect, useState, useMemo } from "react";
import { useParams } from "react-router-dom";
import api from "../api";
import StatusBadge from "../components/StatusBadge";
import Sidebar from "../components/Sidebar";
import ProfileHeader from "../components/ProfileHeader";
import {
  Tag,
  ClipboardList,
  Loader2,
  Building,
  MapPin,
  Calendar,
  User,
  Shield,
  CheckCircle,
  FileText,
  DollarSign,
  Briefcase,
  Award,
  BarChart2,
  Cpu,
  Archive, // <-- Added
  Landmark,
  Blocks
} from "lucide-react";
import { FaSpinner, FaBars } from "react-icons/fa";
import Footer from "../components/Footer";

// Helper function to format approval status
const formatApprovalStatus = (status) => {
  if (!status) return "Pending";
  switch (status) {
    case "approved":
      return "Approved";
    case "rejected":
      return "Rejected";
    case "pending":
    default:
      return "Pending";
  }
};

export default function JobInfo() {
  const { jobId } = useParams();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);

  const user = JSON.parse(localStorage.getItem("loggedInUser"));
  const role = user?.role || "recruiter";

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [active, setActive] = useState("My Posted Jobs");

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        // Fetch specific job by ID using the dedicated endpoint
        const res = await api.get(`/auth/allJobs/${jobId}`);
        setJob(res.data || null);
      } catch (e) {
        alert(e.response?.data?.message || e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [jobId]);

  const renderLoading = () => (
    <div className="flex items-center justify-center h-[calc(100vh-200px)]">
      <FaSpinner className="animate-spin text-4xl text-gray-700" />
      <p className="ml-3 text-lg text-gray-600">Loading Job Info...</p>
    </div>
  );

  if (loading) {
    return (
      <div className="flex h-screen bg-[#F5F5F5]">
        <Sidebar
          role={role}
          active={active}
          setActive={setActive}
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
        />
        <main className="flex-1 flex flex-col">
          <ProfileHeader
            title="Loading..."
            subtitle="Please wait while we fetch the job details"
            showMenuButton={true}
            onMenuClick={() => setSidebarOpen(true)}
          />
          <div className="p-8 flex-1 overflow-auto">{renderLoading()}</div>
        </main>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="flex h-screen bg-[#F5F5F5]">
        <Sidebar
          role={role}
          active={active}
          setActive={setActive}
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
        />
        <main className="flex-1 flex flex-col">
          <ProfileHeader
            title="Error"
            subtitle="Could not find the requested job"
            showMenuButton={true}
            onMenuClick={() => setSidebarOpen(true)}
          />
          <div className="p-8 flex-1 overflow-auto max-w-5xl mx-auto w-full">
            <p className="p-6 text-red-500">Job not found</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#F5F5F5]">
      <Sidebar
        role={role}
        active={active}
        setActive={setActive}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
      />

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-auto">
        <ProfileHeader
          title="Recruiter Dashboard"
          subtitle="Here’s your posted job details"
          showMenuButton={true}
          onMenuClick={() => setSidebarOpen(true)}
        />

        <div className="p-4 md:p-8 flex-1 overflow-auto max-w-6xl mx-auto w-full">
          <div className="bg-white shadow-lg rounded-2xl p-6 md:p-8 border border-gray-200">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
                {job.title}
              </h1>

              <p className="mt-2 md:mt-0 text-sm text-gray-500 font-semibold">
                Posted on {new Date(job.createdAt).toLocaleDateString()}
              </p>
            </div>
            <div className="mt-2 flex flex-wrap gap-3 text-sm text-gray-500">
              <div className="flex items-center gap-1">
                <Tag className="w-4 h-4 text-red-500" />
                <span>Job ID:</span>
                <span className="font-medium text-gray-700">{job.jobId}</span>
              </div>
              <div className="flex items-center gap-1">
                <ClipboardList className="w-4 h-4 text-red-500" />
                <span>Req No:</span>
                <span className="font-medium text-gray-700">{job.reqId}</span>
              </div>
            </div>

            {/* === UPDATED: Meta Info Grid === */}
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-gray-700">
              <InfoCard title="Department" icon={Building}>
                {job.department}
              </InfoCard>
              <InfoCard title="Designation" icon={Briefcase}>
                {job.designation}
              </InfoCard>
              <InfoCard title="Location" icon={MapPin}>
                {job.location}
              </InfoCard>
              <InfoCard title="Job Type" icon={ClipboardList}>
                {job.type}
              </InfoCard>
              <InfoCard title="Experience" icon={BarChart2}>
                {job.experienceRequired}
              </InfoCard>
              <InfoCard title="Qualification" icon={Award}>
                {job.qualificationRequired}
              </InfoCard>
              <InfoCard title="Salary Range" icon={Landmark}>
                {job.salaryRange.min} - {job.salaryRange.max}{" "}
                {job.salaryRange.currency}
              </InfoCard>
              <InfoCard title="Deadline" icon={Calendar}>
                {new Date(job.deadline).toLocaleDateString()}
              </InfoCard>
            </div>

            {/* === NEW: Job Status & Admin === */}
            <div className="mt-8">
              <h3 className="text-xl font-semibold text-gray-800">
                Job Status & Admin
              </h3>
              <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-gray-700">
                <InfoCard title="Job Status" icon={Archive}>
                  <StatusBadge status={job.status || "Draft"} />
                </InfoCard>
                <InfoCard title="Published" icon={CheckCircle}>
                  {job.isPublished ? "Yes" : "No"}
                </InfoCard>
                <InfoCard title="Budget" icon={Blocks}>
                  {job.budget}
                </InfoCard>
                <InfoCard title="Created By" icon={User}>
                  {job.createdBy?.name || "N/A"}
                </InfoCard>
                <InfoCard title="Approval Status" icon={Shield}>
                  {formatApprovalStatus(job.approval?.status)}
                </InfoCard>
                {job.closedAt && (
                  <InfoCard title="Closed At" icon={Calendar}>
                    {new Date(job.closedAt).toLocaleDateString()}
                  </InfoCard>
                )}
              </div>
            </div>

            {/* === NEW: Skills Section === */}
            {job.requisition &&
              (job.requisition.technicalSkills?.length > 0 ||
                job.requisition.softSkills?.length > 0) && (
                <div className="mt-8">
                  <h3 className="text-xl font-semibold text-gray-800">
                    Required Skills
                  </h3>
                  <div className="p-4 rounded-xl bg-gray-50 shadow-sm mt-3">
                    <div className="flex flex-wrap gap-2">
                      {job.requisition.technicalSkills?.map((skill) => (
                        <span
                          key={skill}
                          className="text-sm bg-blue-100 text-blue-800 px-3 py-1 rounded-full font-medium"
                        >
                          {skill}
                        </span>
                      ))}
                      {job.requisition.softSkills?.map((skill) => (
                        <span
                          key={skill}
                          className="text-sm bg-gray-200 text-gray-800 px-3 py-1 rounded-full font-medium"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

            {/* Description */}
            <div className="mt-8">
              <h3 className="text-xl font-semibold text-gray-800">
                Job Description
              </h3>
              <p className="p-4 rounded-xl bg-gray-50 shadow-sm mt-3 whitespace-pre-wrap text-gray-700">
                {job.description}
              </p>
            </div>

            {/* Comments */}
            <div className="mt-5">
              <h3 className="text-xl font-semibold text-gray-800">Comments</h3>
              <p className="p-4 rounded-xl bg-gray-50 shadow-sm mt-3 whitespace-pre-wrap text-gray-700 italic">
                {job.comments || "No comments provided."}
              </p>
            </div>
          </div>
        </div>

        <Footer />
      </main>
    </div>
  );
}

// Helper component for info cards
const InfoCard = ({ title, icon: Icon, children }) => (
  <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 shadow-sm">
    <span className="block text-gray-500 font-medium text-xs uppercase tracking-wider">
      {title}
    </span>
    <span className="font-semibold text-gray-900 mt-1 flex items-center gap-2">
      <Icon className="w-4 h-4 text-red-500" />
      {children}
    </span>
  </div>
);