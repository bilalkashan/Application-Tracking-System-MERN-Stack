import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog } from "@headlessui/react";
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
  Trash2,
  CheckCircle2,
  AlertCircle,
  XCircle,
  ClipboardList,
  Tag,
} from "lucide-react";
import { FaSpinner, FaBars } from "react-icons/fa";
import api, { fileUrl } from "../api";
import Sidebar from "../components/Sidebar";
import ProfileHeader from "../components/ProfileHeader";
import StatusBadge from "../components/StatusBadge";
import Footer from "../components/Footer";


export default function MyJobs() {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]); // --- NEW: To store all apps
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmJobId, setConfirmJobId] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");

  const [sidebarOpen, setSidebarOpen] = useState(false); // Set to false for mobile
  const [active, setActive] = useState("My Posted Jobs");

  const user = JSON.parse(localStorage.getItem("loggedInUser"));
  const role = user?.role || "recruiter";

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError(null);
      try {
        // --- FIX: Fetch both jobs and applications ---
        const [jobsRes, appsRes] = await Promise.all([
          api.get("/auth/mineJobList"),
          api.get("/auth/allApplications"),
        ]);

        setJobs(jobsRes.data || []);
        setApplications(appsRes.data || []); // Store all applications
      } catch (e) {
        console.error(e);
        const errorMsg =
          e.response?.data?.message || "Failed to fetch data. Is the server running?";
        setError(errorMsg);
        toast.error(errorMsg);
      } finally {
        setLoading(false);
      }
    })();
  }, []); // Dependencies are correct

  // --- NEW: Calculate correct stats on the frontend ---
  const jobsWithCorrectStats = useMemo(() => {
    return jobs.map((job) => {
      // 1. Get all applications for *this* job
      const appsForThisJob = applications.filter(
        (app) => app.job?._id === job._id
      );

      // 2. Calculate stats
      const total = appsForThisJob.length;

      const shortlisted = appsForThisJob.filter(
        (app) =>
          !["applied", "rejected", "offer-rejected"].includes(
            app.currentStatus.code
          )
      ).length;

      const rejected = appsForThisJob.filter((app) =>
        ["rejected", "offer-rejected"].includes(app.currentStatus.code)
      ).length;

      // 3. Return the job object with *overridden* stats
      return {
        ...job,
        stats: {
          total,
          shortlisted,
          rejected,
        },
      };
    });
  }, [jobs, applications]);

  const handleJobDelete = (jobId) => {
    setConfirmJobId(jobId);
    setConfirmOpen(true);
  };

  const performDelete = async () => {
    if (!confirmJobId) return setConfirmOpen(false);
    setDeleting(true);
    try {
      await api.delete(`/auth/deleteJob/job/${confirmJobId}`);
      setJobs((prev) => prev.filter((job) => job._id !== confirmJobId));
      toast.success("Job deleted successfully!");
      setConfirmOpen(false);
      setConfirmJobId(null);
    } catch (e) {
      toast.error(e.response?.data?.message || "Failed to delete job");
    } finally {
      setDeleting(false);
    }
  };

  const filteredJobs = useMemo(() => {
    return jobsWithCorrectStats.filter((job) => {
      const lowerSearch = search.toLowerCase();
      const matchesSearch =
        job.title.toLowerCase().includes(lowerSearch) ||
        job.jobId?.toLowerCase().includes(lowerSearch) ||
        job.jobId?.toLowerCase().includes(`mmcl-job-${lowerSearch}`) ||
        job.jobId?.slice(-5).includes(search);

      const matchesFilter =
        filter === "All" ||
        (filter === "Published" && job.isPublished) ||
        (filter === "Pending" &&
          (job.status === "Draft" || job.approval?.status === "pending")) ||
        (filter === "Rejected" && job.approval?.status === "rejected") ||
        (filter === "Open" && job.status === "Open") ||
        (filter === "Closed" && job.status === "Closed");

      return matchesSearch && matchesFilter;
    });
  }, [jobsWithCorrectStats, search, filter]);

  // --- Render Functions for Loading/Error ---
  const renderLoading = () => (
    <div className="flex items-center justify-center h-[calc(100vh-200px)]">
      <FaSpinner className="animate-spin text-4xl text-gray-700" />
      <p className="ml-3 text-lg text-gray-600">Loading Your Jobs...</p>
    </div>
  );

  const renderError = () => (
    <div
      className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg m-8"
      role="alert"
    >
      <strong className="font-bold">Error: </strong>
      <span className="block sm:inline">{error}</span>
    </div>
  );

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar
        role={role}
        active={active}
        setActive={setActive}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
      />
      
      <main className="flex-1 flex flex-col overflow-hidden">
        <ProfileHeader
          title="My Posted Jobs"
          subtitle="View, manage, and track all job openings you've created."
          showMenuButton={true}
          onMenuClick={() => setSidebarOpen(true)} 
        />

        {/* --- RESPONSIVE FILTER BAR --- */}
        <div className="p-4 md:p-6 border-b border-gray-200 bg-white">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex-1 w-full md:max-w-xl">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search job titles or Job ID (e.g., Job-00001)..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full px-2 py-1.5 border border-gray-300 rounded-full shadow-sm pl-10 bg-gray-50 focus:ring-1 focus:ring-[#111] focus:outline-none"
                />
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              </div>
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto">
              <Filter className="w-5 h-5 text-gray-500" />
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="px-2 py-1.5 border border-gray-300 rounded-full shadow-sm bg-gray-50 text-sm focus:ring-1 focus:ring-[#111] focus:outline-none w-full md:w-auto"
              >
                <option>All</option>
                <option>Open</option>
                <option>Closed</option>
                <option>Pending</option>
                <option>Rejected</option>
              </select>
            </div>
          </div>
        </div>

        {/* Job Cards */}
        <div className="flex-1 overflow-auto p-4 md:p-6">
          {loading ? (
            renderLoading()
          ) : error ? (
            renderError()
          ) : filteredJobs.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-lg text-center py-16 text-gray-500 border border-gray-100 max-w-7xl mx-auto">
              <Briefcase className="mx-auto w-10 h-10 mb-3 text-gray-400" />
              <h3 className="text-xl font-semibold text-gray-800">
                No jobs found.
              </h3>
              <p className="text-sm mt-1">
                Try adjusting your search or filters.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-7xl mx-auto">
              {filteredJobs.map((job) => (
                <div
                  key={job._id}
                  className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all border-t-4 border-[#111] flex flex-col justify-between"
                >
                  {/* Header */}
                  <div>
                    <div className="flex items-start justify-between mb-3">
                      <div className="min-w-0">
                        <h3 className="text-2xl font-bold text-gray-900">
                          {job.title}
                        </h3>
                        <p className="text-sm text-gray-600 flex items-center gap-2 mt-1">
                          <MapPin className="w-4 h-4 text-gray-400" />
                          {job.location} • {job.type}
                        </p>
                      </div>
                      <StatusBadge
                        status={job.approval?.status || job.status}
                      />
                    </div>

                    {/* Info Row */}
                    <div className="flex flex-wrap gap-2 text-sm text-gray-600 mt-2">
                      <span className="flex items-center gap-1.5 bg-gray-100 text-gray-700 px-3 py-1 rounded-full font-medium">
                        <ClipboardList className="w-4 h-4" />
                        Req No: {job.reqId}
                      </span>
                      <span className="flex items-center gap-1.5 bg-gray-100 text-gray-700 px-3 py-1 rounded-full font-medium">
                        <Tag className="w-4 h-4" />
                        Job ID: {job.jobId}
                      </span>
                    </div>

                    <p className="mt-4 text-sm text-gray-700">
                      <span className="font-medium">Department:</span>{" "}
                      {job.department} |{" "}
                      <span className="font-medium">Designation:</span>{" "}
                      {job.designation}
                    </p>

                    <p className="mt-3 text-gray-600 text-sm line-clamp-2">
                      {job.description}
                    </p>
                  </div>

                  {/* Stats */}
                  <div className="mt-5 grid grid-cols-3 gap-3 text-center border-t pt-4">
                    <div className="bg-gray-100 rounded-xl py-3 shadow-sm">
                      <Users className="mx-auto w-5 h-5 text-gray-600" />
                      <p className="text-lg font-semibold text-gray-800">
                        {job.stats?.total || 0}
                      </p>
                      <p className="text-xs text-gray-500">Applications</p>
                    </div>

                    <div className="bg-green-50 rounded-xl py-3 shadow-sm">
                      <CheckCircle2 className="mx-auto w-5 h-5 text-green-600" />
                      <p className="text-lg font-semibold text-green-700">
                        {job.stats?.shortlisted || 0}
                      </p>
                      <p className="text-xs text-gray-500">Shortlisted</p>
                    </div>

                    <div className="bg-red-50 rounded-xl py-3 shadow-sm">
                      <XCircle className="mx-auto w-5 h-5 text-red-600" />
                      <p className="text-lg font-semibold text-red-700">
                        {job.stats?.rejected || 0}
                      </p>
                      <p className="text-xs text-gray-500">Rejected</p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="mt-6 flex flex-col sm:flex-row gap-3">
                    <button
                      onClick={() =>
                        navigate(`/recruiter/job/${job._id}/applications`)
                      }
                      className="flex-1 flex items-center justify-center gap-2 bg-[#E30613] text-white px-4 py-2 rounded-full shadow-md transition font-medium hover:bg-red-700"
                    >
                      <Eye className="w-4 h-4" /> Applications
                    </button>

                    <button
                      onClick={() => navigate(`/recruiter/job-info/${job._id}`)}
                      className="flex-1 flex items-center justify-center gap-2 bg-[#111111] text-white px-4 py-2 rounded-full shadow-md transition font-medium hover:bg-[#6B6F73]"
                    >
                      <FileText className="w-4 h-4" /> Job Info
                    </button>

                    <button
                      onClick={() =>
                        navigate(`/recruiter/job/${job._id}/interviewers`)
                      }
                      className="flex-1 flex items-center justify-center gap-2 bg-[#111111] text-white px-4 py-2 rounded-full shadow-md transition font-medium hover:bg-[#6B6F73]"
                    >
                      <Users className="w-4 h-4" /> Interviewers
                    </button>

                    <button
                      onClick={() => handleJobDelete(job._id)}
                      className="flex-1 flex items-center justify-center gap-2 bg-red-100 text-red-700 px-4 py-2 rounded-full shadow-md transition font-medium hover:bg-red-200"
                    >
                      <Trash2 className="w-4 h-4" /> Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <Footer />

      </main>

      {/* Confirm Delete Dialog */}
      <Dialog
        open={confirmOpen}
        onClose={() => !deleting && setConfirmOpen(false)}
        className="relative z-50"
      >
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm"
          aria-hidden="true"
        />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 border-t-4 border-[#E30613]">
            <div className="flex items-center gap-3 mb-3">
              <AlertCircle className="w-6 h-6 text-red-600" />
              <Dialog.Title className="text-lg font-semibold text-gray-800">
                Confirm Delete
              </Dialog.Title>
            </div>
            <p className="text-sm text-gray-600">
              Deleting this job will remove it and all related applications.
              This action cannot be undone.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setConfirmOpen(false)}
                disabled={deleting}
                className="px-4 py-2 rounded-full bg-gray-200 text-gray-800 hover:bg-gray-300 transition font-medium"
              >
                Cancel
              </button>
              <button
                onClick={performDelete}
                disabled={deleting}
                className="flex items-center justify-center gap-2 px-4 py-2 rounded-full bg-red-600 text-white hover:bg-red-700 transition font-medium"
              >
                {deleting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "Delete"
                )}
              </button>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>
    </div>
  );
}