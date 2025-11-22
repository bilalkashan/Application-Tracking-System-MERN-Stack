import React, { useState, useEffect, useMemo, useRef, createContext, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import {
  Briefcase,
  MapPin,
  FileText,
  Users,
  MessageSquare,
  GraduationCap,
  Calendar,
  AlertCircle,
  Building2,
} from "lucide-react";

import { FaSpinner, FaBars } from "react-icons/fa";
import api, { fileUrl } from "../api";
import Sidebar from "../components/Sidebar";
import ProfileHeader from "../components/ProfileHeader";
import Footer from "../components/Footer";

export default function InterviewerDashboard() {
  const [jobs, setJobs] = useState([]);
  const [allApplications, setAllApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [active, setActive] = useState("Dashboard"); // <-- Set "Remarks" as active
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("loggedInUser")) || {};
  const userId = user?._id || user?.id || null;
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchJobs = async () => {
      setLoading(true);
      setError(null);
      try {
        const [jobsRes, appsRes] = await Promise.all([
          api.get("/jobs/interviewer/jobs"),
          api.get("/auth/allApplications"), // This endpoint now populates job.interviewers
        ]);
        setJobs(jobsRes.data || []);
        setAllApplications(appsRes.data || []);
      } catch (err) {
        console.error(err);
        setError("Failed to load assigned jobs.");
        toast.error("Failed to load assigned jobs");
      } finally {
        setLoading(false);
      }
    };
    fetchJobs();
  }, []);

  // --- JOB & KPI CALCULATION (Unchanged) ---
  const jobsWithCorrectCounts = useMemo(() => {
    if (!userId) return [];

    return jobs.map((job) => {
      // 1. Find all applications for this specific job
      const appsForThisJob = allApplications.filter((app) => {
        const appJobId = app?.job?._id || app?.job;
        return appJobId && String(appJobId) === String(job._id);
      });

      // 2. This is the "Total" for the job card stat
      const totalApplicantsForJob = appsForThisJob.length;

      // 3. Find remarks *by me* for this job's applications
      const remarkedApplicants = appsForThisJob.filter((app) =>
        (app.remarks || []).some(
          (remark) => String(remark?.interviewer) === String(userId)
        )
      ).length;
      
      const assignedToMe = totalApplicantsForJob;

      return {
        ...job,
        totalApplicants: totalApplicantsForJob, // Total for this job (e.g., "10")
        remarkedApplicants, // Remarks by me for this job (e.g., "2")
        assignedToMe, // Total applicants for this job (for the KPI sum)
      };
    });
  }, [jobs, allApplications, userId]);

  // --- KPI CARD LOGIC (Unchanged) ---
  const totals = useMemo(() => {
    const totalAssignedToMe = jobsWithCorrectCounts.reduce(
      (sum, j) => sum + (j.assignedToMe || 0),
      0
    );
    const totalRemarksAddedByMe = jobsWithCorrectCounts.reduce(
      (sum, j) => sum + (j.remarkedApplicants || 0),
      0
    );
    return {
      totalAssignedToMe, // Total applicants across all my assigned jobs
      totalRemarksAddedByMe, // Total remarks *I* have added
      remainingRemarks: totalAssignedToMe - totalRemarksAddedByMe, // Total I still need to review
      totalJobs: jobsWithCorrectCounts.length,
    };
  }, [jobsWithCorrectCounts]);
  // --- END OF LOGIC ---

  const renderLoading = () => (
    <div className="flex items-center justify-center h-[calc(100vh-200px)]">
      <FaSpinner className="animate-spin text-4xl text-gray-700" />
      <p className="ml-3 text-lg text-gray-600">Loading Jobs...</p>
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
        role={user?.role}
        active={active}
        setActive={setActive}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
      />

      <main className="flex-1 flex flex-col overflow-auto">
        <ProfileHeader
          title="Interviewer Dashboard"
          subtitle="Jobs you’ve been assigned to evaluate candidates"
          showMenuButton={true}
          onMenuClick={() => setSidebarOpen(true)}
        />

        <div className="p-4 md:p-6 flex-1 overflow-auto">
          <div className="max-w-7xl mx-auto">
            {loading ? (
              renderLoading()
            ) : error ? (
              renderError()
            ) : (
              <>
                {jobsWithCorrectCounts.length > 0 && (
                  <div className="mb-6 grid grid-cols-1 sm:grid-cols-3 gap-6">
                    {/* --- KPI CARDs (Unchanged) --- */}
                    <div className="bg-white p-4 rounded-lg shadow flex items-center justify-between transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
                      <div>
                        <p className="text-sm text-gray-500">
                          Total Applicants
                        </p>
                        <p className="text-2xl font-semibold text-[#111111]">
                          {totals.totalAssignedToMe}
                        </p>
                      </div>
                      <Users className="w-6 h-6 text-gray-400" />
                    </div>

                    <div className="bg-white p-4 rounded-lg shadow flex items-center justify-between transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
                      <div>
                        <p className="text-sm text-gray-500">
                          Remaining Remarks
                        </p>
                        <p className="text-2xl font-semibold text-[#111111]">
                          {totals.remainingRemarks}
                        </p>
                      </div>
                      <MessageSquare className="w-6 h-6 text-gray-400" />
                    </div>

                    <div className="bg-white p-4 rounded-lg shadow flex items-center justify-between transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
                      <div>
                        <p className="text-sm text-gray-500">Jobs Assigned</p>
                        <p className="text-2xl font-semibold text-[#111111]">
                          {totals.totalJobs}
                        </p>
                      </div>
                      <FileText className="w-6 h-6 text-gray-400" />
                    </div>
                  </div>
                )}
                {jobsWithCorrectCounts.length === 0 ? (
                  <div className="bg-white p-10 text-center rounded-2xl shadow-lg text-gray-500">
                    <AlertCircle
                      size={48}
                      className="mx-auto text-gray-400 mb-4"
                    />
                    <h3 className="text-xl font-semibold text-gray-800">
                      No Interview Assignments
                    </h3>
                    <p className="mt-2">
                      You have not been assigned to any interviews yet. Check
                      back later.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 ">
                    {jobsWithCorrectCounts.map((job) => (
                      <div
                        key={job._id}
                        className="bg-white p-6 rounded-xl border border-gray-200 shadow-lg hover:shadow-2xl transition-all flex flex-col justify-between cursor-pointer duration-300 hover:-translate-y-1"
                        onClick={() =>
                          navigate(`/interviewer/job/${job._id}/applications`)
                        }
                      >
                        <div>
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-semibold text-[#111111] text-lg">
                                {job.title}
                              </h3>
                              <p className="text-sm text-gray-500 flex items-center gap-2 mt-1">
                                <Building2 className="w-4 h-4 text-gray-400" />
                                {job.department}
                              </p>
                            </div>
                            <FileText className="text-gray-400 w-6 h-6 group-hover:text-[#E30613]" />
                          </div>

                          {/* --- Tags --- */}
                          <div className="flex flex-wrap gap-2 mt-4 text-xs text-gray-600">
                            <span className="flex items-center gap-1.5 bg-gray-100 text-gray-700 px-3 py-1 rounded-full font-medium">
                              <MapPin className="w-3.5 h-3.5" />
                              {job.location}
                            </span>
                            <span className="flex items-center gap-1.5 bg-gray-100 text-gray-700 px-3 py-1 rounded-full font-medium">
                              {job.type}
                            </span>
                            <span className="flex items-center gap-1.5 bg-gray-100 text-gray-700 px-3 py-1 rounded-full font-medium">
                              {job.designation}
                            </span>
                          </div>

                          {/* --- NEW: More Details --- */}
                          <div className="flex flex-col gap-2 mt-4 text-sm text-gray-600">
                            <span className="flex items-center gap-2">
                              <Briefcase className="w-4 h-4 text-gray-400 flex-shrink-0" />
                              <span>{job.experienceRequired}</span>
                            </span>
                            <span className="flex items-center gap-2">
                              <GraduationCap className="w-4 h-4 text-gray-400 flex-shrink-0" />
                              <span>{job.qualificationRequired}</span>
                            </span>
                            <span className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" />
                              <span>
                                Deadline:{" "}
                                {new Date(job.deadline).toLocaleDateString(
                                  "en-US",
                                  {
                                    year: "numeric",
                                    month: "short",
                                    day: "numeric",
                                  }
                                )}
                              </span>
                            </span>
                          </div>
                          {/* --- END: More Details --- */}

                          {/* --- UPDATED: Job Card Stats --- */}
                          <div className="mt-4 space-y-2 border-t pt-4">
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Users className="w-4 h-4 text-gray-500" />
                              <span>
                                Total Applicants:{" "}
                                <strong className="text-[#111111] font-semibold">
                                  {job.totalApplicants}
                                </strong>
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <MessageSquare className="w-4 h-4 text-gray-500" />
                              <span>
                                My Remarks:{" "}
                                <strong
                                  className={`font-semibold ${
                                    job.remarkedApplicants ===
                                      job.totalApplicants &&
                                    job.totalApplicants > 0
                                      ? "text-green-600"
                                      : "text-[#111111]"
                                  }`}
                                >
                                  {job.remarkedApplicants}
                                </strong>
                              </span>
                            </div>
                          </div>
                          {/* --- END: Job Card Stats --- */}

                        </div>

                        <div className="mt-6">
                          <button
                            // onClick is now on the parent div
                            className="w-full py-1.5 rounded-full bg-[#E30613] text-white font-semibold transition-all duration-200 hover:bg-red-700 shadow-md"
                          >
                            View Applications
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      <Footer />
      </main>
    </div>
  );
}