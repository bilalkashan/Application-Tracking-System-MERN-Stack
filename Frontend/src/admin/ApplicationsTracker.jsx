import React, { useState, useEffect, useMemo } from 'react';
import { toast } from 'react-hot-toast';
import api from '../api';
import Sidebar from '../components/Sidebar';
import ProfileHeader from '../components/ProfileHeader';
import StatusBadge from "../components/StatusBadge";
import Timeline from "../components/Timeline";
import { Dialog } from '@headlessui/react';
import { FaSearch, FaBars, FaFilter, FaThList, FaThLarge, FaBriefcase, FaArrowLeft, FaSpinner } from 'react-icons/fa';
import { Loader2, X, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Footer from '../components/Footer';

const formatDate = (dateString, options = {}) => {
  if (!dateString) return "N/A";
  const defaultOptions = {
    year: "numeric",
    month: "short",
    day: "numeric",
  };
  return new Date(dateString).toLocaleDateString("en-US", { ...defaultOptions, ...options });
};

const formatStatus = (status) => {
  if (!status) return "N/A";
  return status
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

// --- Static Lists for Filters (Unchanged) ---
const departmentList = [
  "All Departments", "Other", "Administration", "Administration Bus", "After Sales Bus", "After Sales Truck",
  "Assembly Shop", "Body Shop", "Brand Management", "Chassis & Deck Assembly", "Civil Projects",
  "Compliance & Risk Management", "Customer Relationship Management", "EDD", "Finance",
  "Health, Safety & Environment", "Human Resource", "Internal Audit", "M.I.S",
  "Maintenance & Utilities", "Management Group", "Marketing & Planning", "Paint Shop", "Production",
  "Protoshop", "QAHSE", "Sales & Marketing - BUS", "Sales & Marketing - Truck", "Sales Admin",
  "Secretarial", "Spare Parts", "Warehouse",
];

const appStatusList = [
  "All Statuses", "applied", "shortlisted", "first-interview", "second-interview", 
  "offer", "offer-accepted", "hired", "onboarding", "onboarding-complete", "rejected", "offer-rejected"
];

// --- Job Pipeline Card Component ---
const JobPipelineCard = ({ job, appCount, onClick }) => (
  <div 
    onClick={onClick}
    className="bg-white p-5 rounded-xl shadow-lg transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 cursor-pointer"
  >
    <div className="flex justify-between items-start">
      <div className="p-3 bg-indigo-100 rounded-full">
        <FaBriefcase className="text-2xl text-indigo-600" />
      </div>
      <span className="flex items-center gap-2 text-sm font-bold bg-gray-100 text-gray-700 px-3 py-1 rounded-full">
        <Users size={16} />
        {appCount} {appCount === 1 ? 'Applicant' : 'Applicants'}
      </span>
    </div>
    <div className="mt-4">
      <h3 className="text-lg font-semibold text-gray-900 truncate" title={job.title}>{job.title}</h3>
      <p className="text-sm text-gray-500">{job.department}</p>
      <div className="mt-3">
        <StatusBadge status={job.status} />
      </div>
    </div>
  </div>
);

export default function ApplicationsTracker() {
  const [apps, setApps] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [selectedApp, setSelectedApp] = useState(null);  
  const [selectedJob, setSelectedJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [active, setActive] = useState("Applications Tracker");
  const [searchTerm, setSearchTerm] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("All Departments");
  const [appStatusFilter, setAppStatusFilter] = useState("All Statuses");
  const [jobFilter, setJobFilter] = useState("All Jobs");

  const [viewMode, setViewMode] = useState("kanban"); 

  const user = JSON.parse(localStorage.getItem("loggedInUser"));
  const role = user?.role || "admin";
  const token = localStorage.getItem("token");
  const navigate = useNavigate();

  useEffect(() => {
    if (!token) {
        toast.error("Please log in to view this page.");
        navigate("/login");
        return;
    }
    
    (async () => {
      try {
        const [appsRes, jobsRes] = await Promise.all([
          api.get("/auth/allApplications"),
          api.get("/auth/allJobs", { params: { status: "All" } }) 
        ]);

        setApps(appsRes.data || []);
        setJobs(jobsRes.data.jobs || []); 
      } catch (e) {
        console.error(e);
        toast.error(e.response?.data?.message || e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [token, navigate]);

  // --- Filter Logic ---
  const filteredApplications = useMemo(() => {
    return apps.filter(app => {
      if (selectedJob) {
        if (app.job?._id !== selectedJob._id) return false;
      }
      
      // 2. Apply global filters
      const deptMatch = departmentFilter === "All Departments" || app.job?.department === departmentFilter;
      const statusMatch = appStatusFilter === "All Statuses" || app.currentStatus?.code === appStatusFilter;
      const jobMatch = jobFilter === "All Jobs" || app.job?._id === jobFilter; // Apply job filter
      const searchMatch = searchTerm === "" ||
        (app.applicant?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (app.job?.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (app.applicant?.email || '').toLowerCase().includes(searchTerm.toLowerCase());
      
      return deptMatch && statusMatch && jobMatch && searchMatch;
    });
  }, [apps, departmentFilter, appStatusFilter, jobFilter, searchTerm, selectedJob]); // Added selectedJob

  // --- Memo for filtered JOBS (for the grid) ---
  const filteredJobs = useMemo(() => {
    // We filter the jobs list based on filters AND if they have candidates
    const appCounts = apps.reduce((acc, app) => {
      const jobId = app.job?._id;
      if (jobId) {
        acc[jobId] = (acc[jobId] || 0) + 1;
      }
      return acc;
    }, {});

    return jobs
      .map(job => ({
        ...job,
        appCount: appCounts[job._id] || 0
      }))
      .filter(job => {
        const deptMatch = departmentFilter === "All Departments" || job.department === departmentFilter;
        
        // This logic ensures that if you filter by "Hired", only jobs with hired candidates show up
        let statusMatch = true;
        if (appStatusFilter !== "All Statuses") {
            // Check if this job has any applications matching the status
            const hasMatchingApp = apps.some(app => app.job?._id === job._id && app.currentStatus?.code === appStatusFilter);
            statusMatch = hasMatchingApp;
        }

        const searchMatch = searchTerm === "" ||
          (job.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
          (job.department || '').toLowerCase().includes(searchTerm.toLowerCase());
        
        return deptMatch && statusMatch && searchMatch;
      });
  }, [jobs, apps, departmentFilter, appStatusFilter, searchTerm]);

  // --- Kanban Logic ---
  const kanbanColumns = useMemo(() => {
    const columns = {
      new: { title: "New (Applied)", apps: [], color: "bg-blue-500" },
      screening: { title: "Screening (Shortlisted)", apps: [], color: "bg-yellow-500" },
      interview: { title: "Interview (1st/2nd)", apps: [], color: "bg-purple-500" },
      offer: { title: "Offer (Sent/Accepted)", apps: [], color: "bg-teal-500" },
      hired: { title: "Hired (Onboarding)", apps: [], color: "bg-green-500" },
    };

    if (appStatusFilter === "All Statuses" || appStatusFilter.includes("reject")) {
       columns.rejected = { title: "Rejected / Withdrawn", apps: [], color: "bg-red-500" };
    }

    for (const app of filteredApplications) {
      switch (app.currentStatus.code) {
        case 'applied':
          columns.new.apps.push(app);
          break;
        case 'shortlisted':
          columns.screening.apps.push(app);
          break;
        case 'first-interview':
        case 'second-interview':
          columns.interview.apps.push(app);
          break;
        case 'offer':
        case 'offer-accepted':
        case 'medical':
          columns.offer.apps.push(app);
          break;
        case 'hired':
        case 'onboarding':
        case 'onboarding-complete':
          columns.hired.apps.push(app);
          break;
        case 'rejected':
        case 'offer-rejected':
          if (columns.rejected) columns.rejected.apps.push(app);
          break;
        default:
          break;
      }
    }
    return columns;
  }, [filteredApplications, appStatusFilter]);


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
          title="Applications Tracker" 
          subtitle="Search and track all applications in the system" 
          showMenuButton={true} 
          onMenuClick={() => setSidebarOpen(true)} 
        />

        <div className="p-4 md:p-6 flex-1 flex flex-col overflow-auto">
          <div className="mb-6 p-5 bg-white rounded-xl shadow-lg">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase">
                  Department
                </label>
                <select 
                  value={departmentFilter} 
                  onChange={(e) => setDepartmentFilter(e.target.value)} 
                  className="w-full p-2 border border-gray-300 rounded-full shadow-sm bg-gray-50 focus:ring-1 focus:ring-[#111] focus:outline-none"
                >
                  <option value="All Departments">All Departments</option>
                  {departmentList.filter(d => d !== "All Departments").map(dep => <option key={dep} value={dep}>{dep}</option>)}
                </select>
              </div>

              {/* --- Job Filter --- */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase">
                  Job
                </label>
                <select 
                  value={jobFilter} 
                  onChange={(e) => setJobFilter(e.target.value)} 
                  className="w-full p-2 border border-gray-300 rounded-full shadow-sm bg-gray-50 focus:ring-1 focus:ring-[#111] focus:outline-none"
                >
                  <option value="All Jobs">All Jobs</option>
                  {jobs.map(job => (
                    <option key={job._id} value={job._id}>{job.title} ({job.department})</option>
                  ))}
                </select>
              </div>

              {/* Status Filter */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase">
                  Status
                </label>
                <select 
                  value={appStatusFilter} 
                  onChange={(e) => setAppStatusFilter(e.target.value)} 
                  className="w-full p-2 border border-gray-300 rounded-full shadow-sm bg-gray-50 focus:ring-1 focus:ring-[#111] focus:outline-none"
                >
                  {appStatusList.map(status => (
                    <option key={status} value={status}>{formatStatus(status)}</option>
                  ))}
                </select>
              </div>

              {/* Search Bar */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase">
                  Search
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Applicant name or email..."
                    className="w-full p-2 border border-gray-300 rounded-full shadow-sm pl-10 focus:ring-1 focus:ring-[#111] focus:outline-none"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                </div>
              </div>
            </div>
          </div>
          
          {/* --- View Toggle / Header --- */}
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-700">
              {selectedJob ? `Pipeline for: ${selectedJob.title}` : 'All Job Pipelines'}
            </h2>
            <div className="flex items-center gap-4">
              {selectedJob && (
                <button
                  onClick={() => setSelectedJob(null)}
                  className="flex items-center gap-2 px-3 py-1 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-200"
                >
                  <FaArrowLeft size={12} /> Back to All Jobs
                </button>
              )}
              {selectedJob && (
                <div className="flex gap-1 bg-gray-200 p-1 rounded-lg">
                  <button 
                    onClick={() => setViewMode('kanban')}
                    className={`flex items-center gap-2 px-3 py-1 rounded-md text-sm font-medium ${viewMode === 'kanban' ? 'bg-white shadow' : 'text-gray-600 hover:bg-gray-300'}`}
                  >
                    <FaThLarge /> Kanban
                  </button>
                  <button 
                    onClick={() => setViewMode('list')}
                    className={`flex items-center gap-2 px-3 py-1 rounded-md text-sm font-medium ${viewMode === 'list' ? 'bg-white shadow' : 'text-gray-600 hover:bg-gray-300'}`}
                  >
                    <FaThList /> List
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* --- Content Area --- */}
          {loading ? (
            <div className="flex items-center justify-center h-[calc(100vh-200px)]">
              <FaSpinner className="animate-spin text-4xl text-gray-700" />
              <p className="ml-3 text-lg text-gray-600">Loading...</p>
            </div>
          ) : !apps.length ? (
            <div className="p-6 text-center bg-white rounded-xl shadow text-gray-500">
              No applications found.
            </div>
          ) : (
            <div className="flex-1 overflow-auto">
              
              {!selectedJob && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {filteredJobs.length > 0 ? filteredJobs.map(job => (
                    <JobPipelineCard
                      key={job._id}
                      job={job}
                      appCount={job.appCount}
                      onClick={() => setSelectedJob(job)}
                    />
                  )) : (
                    <p className="text-gray-500 italic col-span-full text-center py-10">
                      No jobs match your current filters.
                    </p>
                  )}
                </div>
              )}

              {selectedJob && (
                <>
                  {viewMode === 'kanban' && (
                    <div className="flex gap-4 pb-4 overflow-x-auto min-h-[500px]">
                      {Object.values(kanbanColumns).map(col => (
                        <div key={col.title} className="w-80 flex-shrink-0 bg-gray-200 rounded-xl shadow-inner">
                          <div className={`flex justify-between items-center p-3 sticky top-0 ${col.color} text-white rounded-t-xl`}>
                            <h3 className="font-semibold">{col.title}</h3>
                            <span className="text-sm font-bold bg-white/20 px-2 py-0.5 rounded-full">{col.apps.length}</span>
                          </div>
                          <div className="p-3 space-y-3 overflow-y-auto max-h-[calc(100vh-450px)]">
                            {col.apps.length === 0 && (
                              <p className="text-sm text-gray-500 p-4 text-center italic">No applications</p>
                            )}
                            {col.apps.map(app => (
                              <div 
                                key={app._id}
                                onClick={() => setSelectedApp(app)} // --- FIX ---
                                className="bg-white p-4 rounded-lg shadow cursor-pointer hover:shadow-md transition hover:border-indigo-500 border border-transparent"
                              >
                                <div className="font-semibold text-gray-800">{app.applicant?.name}</div>
                                <div className="text-xs text-gray-500 mt-1">{app.applicant?.email}</div>
                                <div className="mt-3">
                                  <StatusBadge status={app.currentStatus?.code} />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {viewMode === 'list' && (
                    <div className="bg-white rounded-xl shadow-lg overflow-x-auto">
                      <table className="w-full text-sm table-auto">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="p-4 text-left text-xs font-medium text-gray-500 uppercase">Applicant</th>
                            <th className="p-4 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                            <th className="p-4 text-left text-xs font-medium text-gray-500 uppercase">Applied On</th>
                            <th className="p-4 text-left text-xs font-medium text-gray-500 uppercase">Track</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {filteredApplications.length > 0 ? filteredApplications.map((a) => (
                            <tr key={a._id} className="hover:bg-gray-50 transition">
                              <td className="p-4">
                                <div className="font-medium text-gray-900">{a.applicant?.name}</div>
                                <div className="text-gray-500 text-xs">{a.applicant?.email}</div>
                              </td>
                              <td className="p-4"><StatusBadge status={a.currentStatus?.code} /></td>
                              <td className="p-4 text-gray-600">{formatDate(a.createdAt)}</td>
                              <td className="p-4">
                                <button
                                  className="px-3 py-1 text-sm text-indigo-600 bg-indigo-50 border border-indigo-200 rounded-full hover:bg-indigo-100 font-medium transition"
                                  onClick={() => setSelectedApp(a)} 
                                >
                                  View Timeline
                                </button>
                              </td>
                            </tr>
                          )) : (
                            <tr>
                              <td colSpan="4" className="text-center p-8 text-gray-500">
                                No applications match your current filters.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* --- Timeline Modal --- */}
          <Dialog open={!!selectedApp} onClose={() => setSelectedApp(null)} className="relative z-50">
            <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
            <div className="fixed inset-0 flex items-center justify-center p-4">
              <Dialog.Panel className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl">
                <div className="flex justify-between items-center mb-4">
                  <Dialog.Title className="text-xl font-semibold text-gray-800">
                    Status Timeline — {selectedApp?.applicant?.name}
                  </Dialog.Title>
                  <button
                    className="p-2 text-gray-500 hover:bg-gray-100 rounded-full"
                    onClick={() => setSelectedApp(null)}
                  >
                    <X size={20} />
                  </button>
                </div>
                
                <div className="max-h-[60vh] overflow-y-auto p-1">
                    {selectedApp && <Timeline items={selectedApp.history} />}
                </div>
                
                <div className="mt-6 flex justify-end">
                    <button
                        className="px-5 py-2 text-sm font-medium bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition"
                        onClick={() => setSelectedApp(null)}
                    >
                        Close
                    </button>
                </div>
              </Dialog.Panel>
            </div>
          </Dialog>
        </div>

        <Footer />
      </main>
    </div>
  );
}