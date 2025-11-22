import React, { useState, useEffect, useMemo } from "react";
import {
  FaBriefcase,
  FaClock,
  FaCheckCircle,
  FaBars,
  FaUsers,
  FaFileAlt,
  FaSpinner,
  FaBullseye, // For Hiring Target
  FaExclamationTriangle, // For Risk Map
  FaSyncAlt, // For Attrition
  FaCalendarAlt, // Added
  FaFilter, // Added
  FaUserCheck, // Added
  FaUserClock, // Added
  FaBuilding,
  FaUserTimes
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
import RequisitionPipeline from '../coo/RequisitionPipeline';
import JobPerformanceTable from '../coo/JobPerformanceTable';
import { Link, useNavigate } from 'react-router-dom';

const formatMonthYear = (dateString) => {
  if (!dateString) return "N/A";
  return new Date(dateString).toLocaleDateString("en-US", { year: "numeric", month: "short" });
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
const PIE_COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#A3A8AD"];

// --- Reusable KPI Card (New Style) ---
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
    {/* --- CHART FIX: Set a defined height for ResponsiveContainer to work --- */}
    <div className="h-[320px]">
      <ResponsiveContainer width="100%" height="100%">
        {children}
      </ResponsiveContainer>
    </div>
  </div>
);

const SuperAdminDashboard = () => {
  const [activeTab, setActiveTab] = useState("Overview");
  const [sidebarOpen, setSidebarOpen] = useState(false); // Set to false for mobile
  const [selectedDepartment, setSelectedDepartment] = useState("All Departments");
  const [dateFilter, setDateFilter] = useState("All Time");
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [requisitions, setRequisitions] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [active, setActive] = useState("Dashboard"); // Added active state for sidebar

  const user = JSON.parse(localStorage.getItem("loggedInUser"));
  const role = user?.role || "hr";
  const navigate = useNavigate();

  // --- Data Fetching ---
  useEffect(() => {
    const fetchDashboardData = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("You are not logged in. Redirecting...");
        setLoading(false);
        setTimeout(() => navigate("/login"), 2000);
        return;
      }

      setLoading(true);
      try {
        const [jobsRes, appsRes, reqsRes, usersRes] = await Promise.all([
          api.get("/auth/allJobs", { params: { status: 'All' } }),
          api.get("/auth/allApplications"),
          api.get("/requisitions/listRequisitions"),
          api.get("/auth/listUsers")
        ]);
        
        setJobs(jobsRes.data.jobs || []);
        setApplications(appsRes.data || []);
        setRequisitions(reqsRes.data.requisitions || []);
        setUsers(usersRes.data.users || []);
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
        setError(error.response?.data?.message || error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [navigate]);

  // --- Recruiter ID-to-Name Map ---
  const recruiterNameMap = useMemo(() => {
    return users.reduce((acc, user) => {
      acc[user._id] = user.name;
      return acc;
    }, {});
  }, [users]);

  // --- Filtered Data Memos ---
  const filteredData = useMemo(() => {
    const now = new Date();
    let dateLimit = new Date(0);
    if (dateFilter === "Last 30 Days") {
      dateLimit.setDate(now.getDate() - 30);
    } else if (dateFilter === "Last 90 Days") {
      dateLimit.setDate(now.getDate() - 90);
    }

    const filterByDate = (item) => new Date(item.createdAt) >= dateLimit;

    const filteredJobs = jobs.filter(j => 
      (selectedDepartment === "All Departments" || j.department === selectedDepartment) && filterByDate(j)
    );
    const filteredReqs = requisitions.filter(r => 
      (selectedDepartment === "All Departments" || r.department === selectedDepartment) && filterByDate(r)
    );
    const filteredApps = applications.filter(a => {
      const jobDept = a.job?.department; 
      const deptMatch = selectedDepartment === "All Departments" || jobDept === selectedDepartment;
      return deptMatch && filterByDate(a);
    });

    return { 
      jobs: filteredJobs, 
      applications: filteredApps, 
      requisitions: filteredReqs 
    };
  }, [selectedDepartment, dateFilter, jobs, applications, requisitions]);

  // --- 1. NEW: KPI Card Data ---
  const kpiData = useMemo(() => {
    const { requisitions, applications } = filteredData;
    
    const closedJobIds = new Set(jobs.filter(j => j.status === 'Closed').map(j => j._id.toString()));
    const totalVacancies = requisitions.filter(r => !r.job || !closedJobIds.has(r.job.toString())).length;

    const hired = applications.filter(a => ["hired", "onboarding", "onboarding-complete"].includes(a.currentStatus.code)).length;
    
    const inProgress = applications.filter(a => 
      ["applied", "shortlisted", "first-interview", "second-interview", "offer", "offer-accepted", "medical"]
      .includes(a.currentStatus.code)
    ).length;

    const rejected = applications.filter(a => ["rejected", "offer-rejected"].includes(a.currentStatus.code)).length;
    
    const totalOutcomes = hired + rejected;
    const dropoutRate = totalOutcomes > 0 ? `${Math.round((rejected / totalOutcomes) * 100)}%` : '0%';

    return { totalVacancies, hired, inProgress, dropoutRate };
  }, [filteredData, jobs]); // Added full 'jobs' dependency

  // --- 2. NEW: Recruiter Performance Data ---
  const recruiterPerformanceData = useMemo(() => {
    const stats = {}; 

    filteredData.jobs.forEach(job => {
      const recruiterId = job.createdBy?._id; 
      const recruiterName = job.createdBy?.name;
      if (!recruiterId) return;

      if (!stats[recruiterId]) {
        stats[recruiterId] = { 
          totalJobs: 0, 
          closedJobs: 0, 
          totalDays: 0,
          name: recruiterName || `User (${recruiterId.slice(-4)})`
        };
      }
      stats[recruiterId].totalJobs++;

      if (job.status === 'Closed' && job.createdAt && job.closedAt) {
        stats[recruiterId].closedJobs++;
        const created = new Date(job.createdAt);
        const closed = new Date(job.closedAt);
        const diffTime = Math.abs(closed - created);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        stats[recruiterId].totalDays += diffDays;
      }
    });

    return Object.keys(stats).map(recruiterId => {
      const { totalJobs, closedJobs, totalDays, name } = stats[recruiterId];
      const timeToFill = closedJobs > 0 ? Math.round(totalDays / closedJobs) : 0;
      const closureRate = totalJobs > 0 ? Math.round((closedJobs / totalJobs) * 100) : 0;
      
      return {
        name: name,
        "Time-to-Fill (Days)": timeToFill,
        "Closure Rate (%)": closureRate,
      };
    });
  }, [filteredData.jobs]); // Removed recruiterNameMap dependency, it's not needed here

  // --- 3. NEW: Gender & Diversity Data (from Requisitions) ---
  const diversityData = useMemo(() => {
    const counts = { Male: 0, Female: 0, Other: 0 };
    filteredData.requisitions.forEach(req => {
      if (req.gender === 'Male') counts.Male++;
      else if (req.gender === 'Female') counts.Female++;
      else if (req.gender) counts.Other++;
    });
    return [
      { name: "Male", value: counts.Male },
      { name: "Female", value: counts.Female },
      { name: "Other", value: counts.Other },
    ].filter(entry => entry.value > 0);
  }, [filteredData.requisitions]);

  // --- 4. NEW: Offer Acceptance vs. Rejection Trend ---
  const offerTrendData = useMemo(() => {
    const trends = {};
    
    filteredData.applications
      .filter(a => a.offer?.respondedAt)
      .forEach(app => {
        const monthYear = formatMonthYear(app.offer.respondedAt);
        if (!trends[monthYear]) {
          trends[monthYear] = { Accepted: 0, Rejected: 0, date: new Date(app.offer.respondedAt) };
        }
        if (app.offer.status === 'accepted') trends[monthYear].Accepted++;
        if (app.offer.status === 'rejected') trends[monthYear].Rejected++;
      });
      
    return Object.keys(trends)
      .map(month => ({
        name: month,
        ...trends[month],
      }))
      .sort((a, b) => a.date - b.date);
  }, [filteredData.applications]);

  // --- 5. NEW: Department Hiring Progress Data (FIXED) ---
  const deptHiringProgressData = useMemo(() => {
    const progress = {}; 
    const closedJobIds = new Set(jobs.filter(j => j.status === 'Closed').map(j => j._id.toString()));

    const requisitionsToDisplay = requisitions.filter(r => 
      (selectedDepartment === "All Departments" || r.department === selectedDepartment)
    );

    requisitionsToDisplay.forEach(req => {
      const dept = req.department || "Unknown";
      if (!progress[dept]) {
        progress[dept] = { total: 0, filled: 0 };
      }
      progress[dept].total++;
      
      if (req.job && closedJobIds.has(req.job.toString())) { // Use req.job (just ID)
        progress[dept].filled++;
      }
    });
    
    return Object.keys(progress)
      .map(deptName => ({
        name: deptName,
        ...progress[deptName],
        percent: progress[deptName].total > 0 ? (progress[deptName].filled / progress[deptName].total) * 100 : 0
      }))
      .sort((a, b) => b.total - a.total);
  }, [selectedDepartment, requisitions, jobs]);
  
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
      
      <div className="flex-1 flex flex-col overflow-hidden"> 
        <ProfileHeader
          title="HR Dashboard"
          subtitle="Complete hiring and operations overview."
          showMenuButton={true} // --- HAMBURGER FIX ---
          onMenuClick={() => setSidebarOpen(true)} // --- HAMBURGER FIX ---
        />
        
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* --- RESPONSIVE FILTERS --- */}
            <div className="mb-6 p-5 bg-white rounded-xl shadow-lg flex flex-col-1 md:flex-row gap-4 items-center">
              <div className="flex-1 w-full">
                <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase">
                  Department
                </label>
                <select 
                  id="departmentFilter" 
                  value={selectedDepartment} 
                  onChange={(e) => setSelectedDepartment(e.target.value)} 
                  className="w-full p-2 border border-gray-300 rounded-full shadow-sm bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  {departmentList.map(dep => <option key={dep} value={dep}>{dep}</option>)}
                </select>
              </div>
              <div className="flex-1 w-full">
                <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase">
                  Date Range (Created)
                </label>
                <select
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-full shadow-sm bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="All Time">All Time</option>
                  <option value="Last 30 Days">Last 30 Days</option>
                  <option value="Last 90 Days">Last 90 Days</option>
                </select>
              </div>
            </div>

            {/* --- RESPONSIVE TABS --- */}
            <div className="flex flex-wrap border-b border-gray-200 mb-6">
              {["Overview", "Job Performance", "Requisition Pipeline"].map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-2 text-sm font-medium ${activeTab === tab ? 'border-b-2 border-red-600 text-red-600' : 'text-gray-500 hover:text-gray-700'}`}>
                  {tab}
                </button>
              ))}
            </div>
            
            {loading ? (
              renderLoading()
            ) : error ? (
              renderError()
            ) : (
              <div>
                {/* --- Overview Tab --- */}
                {activeTab === 'Overview' && (
                  <div className="space-y-6">
                    
                    {/* --- RESPONSIVE KPI Cards --- */}
                    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                      <KPICard title="Total Vacancies" value={kpiData.totalVacancies} icon={<FaBuilding />} color="bg-blue-100 text-blue-600" />
                      <KPICard title="Candidates in Progress" value={kpiData.inProgress} icon={<FaUserClock />} color="bg-yellow-100 text-yellow-600" />
                      <KPICard title="Total Hires" value={kpiData.hired} icon={<FaUserCheck />} color="bg-green-100 text-green-600" />
                      <KPICard title="Dropout Rate" value={kpiData.dropoutRate} icon={<FaUserTimes />} color="bg-red-100 text-red-600" />
                    </div>
                    
                    {/* --- RESPONSIVE Chart Grid --- */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      <div className="lg:col-span-2">
                        <ChartContainer title="Recruiter Performance" subtitle="Key metrics per recruiter (filtered)">
                            <BarChart data={recruiterPerformanceData} margin={{ left: 10, right: 10 }}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="name" />
                              <YAxis />
                              <Tooltip />
                              <Legend />
                              <Bar dataKey="Time-to-Fill (Days)" fill="#8884d8" radius={[6, 6, 0, 0]} />
                              <Bar dataKey="Closure Rate (%)" fill="#82ca9d" radius={[6, 6, 0, 0]} />
                            </BarChart>
                        </ChartContainer>
                      </div>
                      
                      <div className="lg:col-span-1">
                        <ChartContainer title="Gender & Diversity" subtitle="Based on requisitions (filtered)">
                            <PieChart>
                              <Pie
                                data={diversityData}
                                dataKey="value"
                                nameKey="name"
                                cx="50%"
                                cy="50%"
                                innerRadius={70}
                                outerRadius={110}
                                paddingAngle={3}
                              >
                                {diversityData.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                                ))}
                              </Pie>
                              <Tooltip />
                              <Legend />
                            </PieChart>
                        </ChartContainer>
                      </div>
                    </div>
                    
                    {/* --- Full Width Chart --- */}
                    <ChartContainer title="Offer Acceptance vs. Rejection" subtitle="Trend of candidate offer responses over time (filtered)">
                        <LineChart data={offerTrendData} margin={{ left: 10, right: 20 }}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis allowDecimals={false} />
                          <Tooltip />
                          <Legend />
                          <Line type="monotone" dataKey="Accepted" stroke="#10B981" strokeWidth={2} activeDot={{ r: 8 }} />
                          <Line type="monotone" dataKey="Rejected" stroke="#EF4444" strokeWidth={2} activeDot={{ r: 8 }} />
                        </LineChart>
                    </ChartContainer>
                    
                    {/* --- Full-Width Progress Bars --- */}
                    <div className="bg-white p-6 rounded-xl shadow-lg">
                      <h2 className="text-lg font-semibold text-gray-900">Department Hiring Progress</h2>
                      <p className="text-sm text-gray-500 mb-4">Requisitions filled vs. total requisitions (filtered).</p>
                      <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                        {deptHiringProgressData.length > 0 ? deptHiringProgressData.map(dept => (
                          <div key={dept.name}>
                            <div className="flex justify-between mb-1">
                              <span className="text-base font-medium text-gray-700">{dept.name}</span>
                              <span className="text-sm font-medium text-gray-700">{dept.filled} / {dept.total} Hired</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-4">
                              <div 
                                className="bg-gradient-to-r from-blue-500 to-indigo-600 h-4 rounded-full text-xs font-medium text-white text-center flex items-center justify-center"
                                style={{ width: `${dept.percent}%` }}
                              >
                                {dept.percent > 15 ? `${Math.round(dept.percent)}%` : ''}
                              </div>
                            </div>
                          </div>
                        )) : (
                          <p className="text-sm text-gray-500 text-center py-4">No requisition data for this filter.</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
                
                {/* --- Other Tabs (will render inside the responsive main tag) --- */}
                {activeTab === 'Job Performance' && ( <div className="bg-white rounded-xl shadow overflow-hidden"><JobPerformanceTable jobs={filteredData.jobs} applications={filteredData.applications} /></div>)}
                {activeTab === 'Requisition Pipeline' && ( <div className="bg-white p-6 rounded-xl shadow"><RequisitionPipeline requisitions={filteredData.requisitions} /></div>)}
                {/* {activeTab === 'Hiring Funnel' && ( <div className="bg-white p-6 rounded-xl shadow"><HiringFunnel applications={filteredData.applications} /></div>)} */}
              </div>
            )}
          </div>
        </main>
        <Footer />
      </div>
    </div>
  );
};

export default SuperAdminDashboard;