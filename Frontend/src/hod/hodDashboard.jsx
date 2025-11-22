import React, { useState, useEffect, useMemo } from "react";
import {
  FaBars,
  FaBriefcase,
  FaUsers,
  FaFileAlt,
  FaSpinner,
  FaFileSignature,
  FaClock,
  FaCalendarAlt,
  FaFilter,
  FaCheckCircle,
  FaTasks,
  FaInfoCircle,
  FaBuilding,
  FaUserCheck,
  FaUserClock,
  FaUserTimes,
  FaVenusMars,
  FaExclamationTriangle, // For Risk Map
  FaSyncAlt, // For Attrition
  FaBullseye, // For Hiring Target
} from "react-icons/fa";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
  LineChart,
  Line,
} from "recharts";
import Sidebar from "../components/Sidebar";
import ProfileHeader from "../components/ProfileHeader";
import Footer from "../components/Footer";
import api from "../api";
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';

const formatMonthYear = (dateString) => {
  if (!dateString) return "N/A";
  return new Date(dateString).toLocaleDateString("en-US", { year: "numeric", month: "short" });
};

const daysBetween = (date1, date2) => {
  if (!date1 || !date2) return 0;
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  const diffTime = Math.abs(d2 - d1);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

// --- Config ---
const departmentList = [
  "All Departments", "Other", "Administration", "Administration Bus", "After Sales Bus", "After Sales Truck",
  "Assembly Shop", "Body Shop", "Brand Management", "Chassis & Deck Assembly", "Civil Projects",
  "Compliance & Risk Management", "Customer Relationship Management", "EDD", "Finance",
  "Health, Safety & Environment", "Human Resource", "Internal Audit", "M.I.S",
  "Maintenance & Utilities", "Management Group", "Marketing & Planning", "Paint Shop", "Production",
  "Protoshop", "QAHSE", "Sales & Marketing - BUS", "Sales & Marketing - Truck", "Sales Admin",
  "Secretarial", "Spare Parts", "Warehouse",
];
const PIE_COLORS = ["#F59E0B", "#10B981", "#EF4444"]; 

// --- Reusable KPI Card (New Style from Admin/COO) ---
const KPICard = ({ title, value, icon, color }) => (
  <div className="bg-white rounded-xl shadow-lg p-5 transition-all duration-300 hover:shadow-2xl hover:-translate-y-1">
    <div className="flex justify-between items-start">
      <div className="flex flex-col">
        <p className="text-sm font-medium text-gray-500">{title}</p>
        <p className="text-4xl font-bold text-gray-900 mt-1">{value}</p>
      </div>
      <div className={`p-3 rounded-full ${color}`}>
        {icon}
      </div>
    </div>
  </div>
);

// --- Reusable Chart Container ---
const ChartContainer = ({ title, subtitle, children }) => (
  <div className="bg-white p-6 rounded-xl shadow-lg min-h-[420px]">
    <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
    <p className="text-sm text-gray-500 mb-4">{subtitle}</p>
    <div className="h-[320px]">
      <ResponsiveContainer width="100%" height="100%">
        {children}
      </ResponsiveContainer>
    </div>
  </div>
);

// --- Heatmap Cell Styling ---
const getHeatmapColor = (days) => {
  if (days === 0) return 'bg-gray-100 text-gray-500';
  if (days <= 30) return 'bg-green-100 text-green-800'; 
  if (days <= 60) return 'bg-yellow-100 text-yellow-800'; 
  return 'bg-red-100 text-red-800'; 
};


const HodDashboard = () => {
  const [activeTab, setActiveTab] = useState("Overview"); 
  const [sidebarOpen, setSidebarOpen] = useState(false); 
  const [active, setActive] = useState("Dashboard");
  const [hodDepartment, setHodDepartment] = useState(null);
  const [dateFilter, setDateFilter] = useState("All Time");
  const [profile, setProfile] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [requisitions, setRequisitions] = useState([]);
  const [pendingOffers, setPendingOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const user = JSON.parse(localStorage.getItem("loggedInUser"));
  const role = user?.role || "hod";
  const token = localStorage.getItem("token");
  const navigate = useNavigate();

  // --- Data Fetching ---
  useEffect(() => {
    const fetchData = async () => {
      if (!token) {
        toast.error("You are not logged in. Redirecting...");
        setLoading(false);
        setTimeout(() => navigate("/login"), 2000);
        return;
      }
      setLoading(true);
      try {
        const [profileRes, reqsRes, offersRes, jobsRes, appsRes] = await Promise.all([
          api.get("/profile/getAdminProfile"),
          api.get("/requisitions/listRequisitions"),
          api.get("/applications/offers/pending-approval"),
          api.get("/auth/allJobs", { params: { status: 'All' } }),
          api.get("/auth/allApplications")
        ]);
        
        const hodProfile = profileRes.data.profile;
        const dept = hodProfile?.department;

        if (!dept) {
            throw new Error("HOD profile is not assigned to a department.");
        }
        
        setProfile(hodProfile);
        setHodDepartment(dept);
        
        setRequisitions(reqsRes.data.requisitions || []);
        setPendingOffers(offersRes.data || []);

        // Filter jobs and applications by the HOD's department
        setJobs(jobsRes.data.jobs.filter(j => j.department === dept) || []);
        setApplications(appsRes.data.filter(a => a.job?.department === dept) || []);

      } catch (err) {
        console.error("Fetch error:", err);
        setError(err.response?.data?.message || err.message);
        toast.error(`Failed to load dashboard data: ${err.response?.data?.message || err.message}`);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [token, navigate]);

  // --- Filtered Data Memos (Date Filter) ---
  const filteredData = useMemo(() => {
    const now = new Date();
    let dateLimit = new Date(0);
    if (dateFilter === "Last 30 Days") {
      dateLimit.setDate(now.getDate() - 30);
    } else if (dateFilter === "Last 90 Days") {
      dateLimit.setDate(now.getDate() - 90);
    }
    const filterByDate = (item) => new Date(item.createdAt) >= dateLimit;

    // Data is already pre-filtered by HOD's department
    const filteredJobs = jobs.filter(filterByDate);
    const filteredReqs = requisitions.filter(filterByDate);
    const filteredApps = applications.filter(filterByDate);

    return { 
      jobs: filteredJobs, 
      applications: filteredApps, 
      requisitions: filteredReqs 
    };
  }, [dateFilter, jobs, applications, requisitions]);


  // --- 1. KPI Card Data ---
  const kpiData = useMemo(() => {
    // Requisitions they need to approve
    const reqApprovals = requisitions.filter(r => r.approvals?.departmentHead?.approval?.status === 'pending').length;
    
    // Offers they need to approve
    const offerApprovals = pendingOffers.length;

    // Open jobs in their department
    const openJobs = jobs.filter(j => j.status === 'Open').length;

    // Total candidates in the pipeline for their open jobs
    const pipelineCandidates = applications.filter(a => 
      jobs.some(j => j._id === a.job?._id && j.status === 'Open') &&
      !['hired', 'rejected', 'offer-rejected', 'onboarding-complete'].includes(a.currentStatus.code)
    ).length;
    
    // Hiring Target (Filled)
    const closedJobIds = new Set(jobs.filter(j => j.status === 'Closed').map(j => j._id.toString()));
    const totalRequisitions = requisitions.length; // All reqs for their dept
    const filledRequisitions = requisitions.filter(r => r.job && closedJobIds.has(r.job._id.toString())).length;

    return { reqApprovals, offerApprovals, openJobs, pipelineCandidates, totalRequisitions, filledRequisitions };
  }, [requisitions, pendingOffers, jobs, applications]);

  // --- 2. Requisition Status Pie Chart (RE-ADDED) ---
  const requisitionStatusData = useMemo(() => {
    const stats = { Pending: 0, Approved: 0, Rejected: 0 };
    
    // Use filteredReqs to respect date filter
    filteredData.requisitions.forEach(req => {
      if (req.approvals?.coo?.approval?.status === 'approved') {
        stats.Approved++;
      } else if (
        req.approvals?.departmentHead?.approval?.status === 'rejected' ||
        req.approvals?.hr?.approval?.status === 'rejected' ||
        req.approvals?.coo?.approval?.status === 'rejected'
      ) {
        stats.Rejected++;
      } else {
        stats.Pending++;
      }
    });
    
    return [
      { name: "Pending", value: stats.Pending },
      { name: "Approved", value: stats.Approved },
      { name: "Rejected", value: stats.Rejected },
    ].filter(d => d.value > 0);
  }, [filteredData.requisitions]);

  // --- 3. Hiring Funnel Data (RE-ADDED) ---
  const hiringFunnelData = useMemo(() => {
    const pipeline = {
      Applied: 0,
      Screening: 0,
      Interview: 0,
      Offer: 0,
      Hired: 0,
    };
    // Use filteredApps to respect date filter
    filteredData.applications.forEach((app) => {
      switch (app.currentStatus.code) {
        case "hired":
        case "onboarding":
        case "onboarding-complete":
          pipeline.Hired++;
        case "offer":
        case "offer-accepted":
        case "medical":
          pipeline.Offer++;
        case "first-interview":
        case "second-interview":
          pipeline.Interview++;
        case "shortlisted":
          pipeline.Screening++;
        case "applied":
          pipeline.Applied++;
          break;
        default:
          break;
      }
    });
    return [
        { name: 'Applied', Candidates: pipeline.Applied },
        { name: 'Screening', Candidates: pipeline.Screening },
        { name: 'Interview', Candidates: pipeline.Interview },
        { name: 'Offer', Candidates: pipeline.Offer },
        { name: 'Hired', Candidates: pipeline.Hired }
    ];
  }, [filteredData.applications]);

  // --- 4. Attrition vs. Hiring Trend ---
  const attritionHiringData = useMemo(() => {
    const trends = {};
    const { jobs, requisitions } = filteredData; 

    jobs
      .filter(j => j.status === 'Closed' && j.closedAt)
      .forEach(job => {
        const monthYear = formatMonthYear(job.closedAt);
        if (!trends[monthYear]) {
          trends[monthYear] = { Hired: 0, Attrition: 0, date: new Date(job.closedAt) };
        }
        trends[monthYear].Hired++;
      });
      
    requisitions
      .filter(r => r.requisitionType === 'Replacement')
      .forEach(req => {
        const monthYear = formatMonthYear(req.createdAt);
        if (!trends[monthYear]) {
          trends[monthYear] = { Hired: 0, Attrition: 0, date: new Date(req.createdAt) };
        }
        trends[monthYear].Attrition++;
      });
      
    return Object.keys(trends)
      .map(month => ({ name: month, ...trends[month] }))
      .sort((a, b) => a.date - b.date);
  }, [filteredData.jobs, filteredData.requisitions]);

  // --- 5. Department Hiring Efficiency (Heatmap) ---
  const deptEfficiencyData = useMemo(() => {
    const efficiency = {}; 
    
    const deptJobs = jobs.filter(j => j.department === hodDepartment);

    deptJobs
      .filter(j => j.status === 'Closed' && j.createdAt && j.closedAt)
      .forEach(job => {
        const dept = job.department || "Unknown";
        if (!efficiency[dept]) {
          efficiency[dept] = { totalDays: 0, closedJobs: 0 };
        }
        efficiency[dept].closedJobs++;
        efficiency[dept].totalDays += daysBetween(job.createdAt, job.closedAt);
      });

    return Object.keys(efficiency)
      .map(deptName => {
        const { totalDays, closedJobs } = efficiency[deptName];
        const avgDays = closedJobs > 0 ? Math.round(totalDays / closedJobs) : 0;
        return { name: deptName, avgDays };
      })
      .sort((a, b) => a.avgDays - b.avgDays);
  }, [hodDepartment, jobs]);

  // --- 6. Talent Availability Risk Map ---
  const riskMapData = useMemo(() => {
    const today = new Date();
    return jobs
      .filter(j => j.status === 'Open') 
      .map(job => ({
        ...job,
        daysOpen: daysBetween(job.createdAt, today)
      }))
      .filter(job => job.daysOpen > 60)
      .sort((a, b) => b.daysOpen - a.daysOpen);
  }, [jobs]);
  
  // --- Loading / Error Renders ---
  const renderLoading = () => (
    <div className="flex items-center justify-center h-[calc(100vh-200px)]">
      <FaSpinner className="animate-spin text-4xl text-gray-700" />
      <p className="ml-3 text-lg text-gray-600">Loading Dashboard...</p>
    </div>
  );

  const renderError = () => (
    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg m-6" role="alert">
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
      
      <main className="flex-1 flex flex-col overflow-auto">
        <ProfileHeader
          title="HOD Dashboard"
          subtitle={profile ? `Overview for ${profile.department} Department` : "Welcome back!"}
          showMenuButton={true} 
          onMenuClick={() => setSidebarOpen(true)}
        />

        <div className="p-4 md:p-6 flex-1 overflow-auto">
          {loading ? (
            renderLoading()
          ) : error ? (
            renderError()
          ) : (
            <>
              {/* --- Filters Card --- */}
              <div className="mb-6 p-5 bg-white rounded-xl shadow-lg flex flex-col-1 md:flex-row gap-4 items-center">
                <div className="flex-1 w-full">
                  <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase">
                    Department
                  </label>
                  <input
                    type="text"
                    disabled
                    value={hodDepartment || "Loading..."}
                    className="w-full p-2 border border-gray-300 rounded-full shadow-sm bg-gray-200 text-gray-500 cursor-not-allowed"
                  />
                </div>
                <div className="flex-1 w-full">
                  <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase">
                    Date Range (Created)
                  </label>
                  <select
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-full shadow-sm bg-gray-50 focus:ring-1 focus:ring-[#111] focus:outline-none"
                  >
                    <option value="All Time">All Time</option>
                    <option value="Last 30 Days">Last 30 Days</option>
                    <option value="Last 90 Days">Last 90 Days</option>
                  </select>
                </div>
              </div>

              {/* --- Content based on Active Tab --- */}
              <div className="space-y-6">
                
                {/* --- 1. KPI Cards --- */}
                <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-6">
                  <KPICard title="Reqs to Approve" value={kpiData.reqApprovals} icon={<FaFileSignature />} color="bg-red-100 text-red-600" />
                  <KPICard title="Offers to Approve" value={kpiData.offerApprovals} icon={<FaUserCheck />} color="bg-red-100 text-red-600" />
                  <KPICard title="Dept. Open Jobs" value={kpiData.openJobs} icon={<FaBriefcase />} color="bg-blue-100 text-blue-600" />
                  <KPICard title="Dept. Pipeline" value={kpiData.pipelineCandidates} icon={<FaUsers />} color="bg-indigo-100 text-indigo-600" />
                  <KPICard 
                   title="Hiring Target (Filled)" 
                   value={`${kpiData.filledRequisitions} / ${kpiData.totalRequisitions}`} 
                   icon={<FaBullseye />}
                   color="bg-green-100 text-green-600"
                  />
                </div>
                
                {/* --- 2. Chart Grid (Row 1) --- */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* --- Requisition Status Pie Chart --- */}
                  <ChartContainer title="Department Requisition Status" subtitle="Status of all requisitions (filtered).">
                    <PieChart>
                      <Pie
                        data={requisitionStatusData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={70}
                        outerRadius={110}
                        paddingAngle={3}
                      >
                        {requisitionStatusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ChartContainer>

                  {/* --- Hiring Funnel Bar Chart --- */}
                  <ChartContainer title="Department Hiring Funnel" subtitle="Candidate pipeline for your department's jobs (filtered).">
                    <BarChart data={hiringFunnelData} layout="vertical" margin={{ left: 30 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" allowDecimals={false} />
                      <YAxis dataKey="name" type="category" width={80} />
                      <Tooltip />
                      <Bar dataKey="Candidates" fill="#8884d8" radius={[0, 6, 6, 0]} />
                    </BarChart>
                  </ChartContainer>
                </div>

                {/* --- 3. Chart Grid (Row 2) --- */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2">
                    <ChartContainer title="Attrition vs. Hiring Trend" subtitle="Replacement Requisitions vs. Closed Jobs (filtered)">
                      <LineChart data={attritionHiringData} margin={{ left: 10, right: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis yAxisId="left" orientation="left" stroke="#FA8072" allowDecimals={false} />
                        <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" allowDecimals={false} />
                        <Tooltip />
                        <Legend />
                        <Line yAxisId="left" type="monotone" dataKey="Attrition" stroke="#FA8072" strokeWidth={2} activeDot={{ r: 8 }} />
                        <Line yAxisId="right" type="monotone" dataKey="Hired" stroke="#82ca9d" strokeWidth={2} activeDot={{ r: 8 }} />
                      </LineChart>
                    </ChartContainer>
                  </div>
                  
                  <div className="lg:col-span-1">
                    <ChartContainer title="Talent Availability Risk Map" subtitle="Critical positions open over 60 days">
                      <div className="space-y-3 max-h-[320px] overflow-y-auto pr-2">
                        {riskMapData.length > 0 ? riskMapData.map(job => (
                          <div key={job._id} className="p-3 bg-red-50 border border-red-200 rounded-lg">
                            <div className="flex justify-between items-center">
                              <span className="font-semibold text-red-800">{job.title}</span>
                              <span className="font-bold text-red-600">{job.daysOpen} days</span>
                            </div>
                            <span className="text-sm text-gray-500">{job.department}</span>
                          </div>
                        )) : (
                          <div className="flex flex-col items-center justify-center h-[300px] text-center">
                            <FaCheckCircle className="text-5xl text-green-500 mb-2" />
                            <p className="font-semibold text-gray-700">No Critical Risks</p>
                            <p className="text-sm text-gray-500">All open positions are under 60 days.</p>
                          </div>
                        )}
                      </div>
                    </ChartContainer>
                  </div>
                </div>
                
                {/* --- 4. Full-Width Heatmap (Row 3) --- */}
                <div className="bg-white p-6 rounded-xl shadow-lg">
                  <h2 className="text-lg font-semibold text-gray-900">Department Hiring Efficiency</h2>
                  <p className="text-sm text-gray-500 mb-4">Average time-to-fill (in days) for your department's closed jobs.</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {deptEfficiencyData.length > 0 ? deptEfficiencyData.map(dept => (
                      <div key={dept.name} className={`p-4 rounded-lg text-center ${getHeatmapColor(dept.avgDays)}`}>
                        <p className="font-semibold">{dept.name}</p>
                        <p className="text-2xl font-bold">{dept.avgDays > 0 ? `${dept.avgDays} days` : 'N/A'}</p>
                      </div>
                    )) : (
                      <p className="text-sm text-gray-500 text-center py-4 col-span-full">No closed jobs to calculate efficiency.</p>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      <Footer />
      </main>
    </div>
  );
};

export default HodDashboard;