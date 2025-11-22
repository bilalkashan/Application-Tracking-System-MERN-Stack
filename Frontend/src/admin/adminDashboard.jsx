import React, { useState, useEffect, useMemo } from "react";
import {
  FaSpinner,
  FaClock,
  FaCheckCircle,
  FaBuilding,
  FaUserCheck,
  FaUserClock,
  FaUserTimes,
  FaSearch, // Added from your original file
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
import { useNavigate } from 'react-router-dom';
import api from "../api";
import RequisitionPipeline from '../coo/RequisitionPipeline';
import JobPerformanceTable from '../coo/JobPerformanceTable';
import Footer from '../components/Footer';

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
    {children}
  </div>
);

// --- Heatmap Cell Styling ---
const getHeatmapColor = (days) => {
  if (days === 0) return 'bg-gray-100 text-gray-500'; 
  if (days <= 30) return 'bg-green-100 text-green-800'; 
  if (days <= 60) return 'bg-yellow-100 text-yellow-800'; 
  return 'bg-red-100 text-red-800'; 
};

const AdminDashboard = () => {
  const [active, setActive] = useState("Dashboard"); 
  const [activeTab, setActiveTab] = useState("Overview"); 
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [requisitions, setRequisitions] = useState([]);
  const [users, setUsers] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [departmentFilter, setDepartmentFilter] = useState("All Departments");
  const [dateFilter, setDateFilter] = useState("All Time");
  const [searchTerm, setSearchTerm] = useState(""); 

  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("loggedInUser"));
  const role = user?.role || "admin";
  const token = localStorage.getItem("token");

  // --- Data Fetching ---
  useEffect(() => {
    const fetchDashboardData = async () => {
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
      } catch (err) {
        console.error("Fetch error:", err);
        setError(err.response?.data?.message || err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, [token, navigate]);

  // --- Recruiter ID-to-Name Map ---
  const recruiterNameMap = useMemo(() => {
    return users.reduce((acc, user) => {
      acc[user._id] = user.name;
      return acc;
    }, {});
  }, [users]);

  // --- Filtered Data Memos (FIXED) ---
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
      (departmentFilter === "All Departments" || j.department === departmentFilter) && filterByDate(j)
    );
    
    // Changed 'selectedDepartment' to 'departmentFilter'
    const filteredReqs = requisitions.filter(r => 
      (departmentFilter === "All Departments" || r.department === departmentFilter) && filterByDate(r)
    );

    const filteredApps = applications.filter(a => {
      const jobDept = a.job?.department;
      const deptMatch = departmentFilter === "All Departments" || jobDept === departmentFilter;
      return deptMatch && filterByDate(a);
    });

    return { 
      jobs: filteredJobs, 
      applications: filteredApps, 
      requisitions: filteredReqs 
    };
  }, [departmentFilter, dateFilter, jobs, applications, requisitions]);

  const kpiData = useMemo(() => {
    // We need data from both filtered and unfiltered lists
    const { requisitions, applications, jobs: filteredJobs } = filteredData;
    const closedJobIds = new Set(jobs.filter(j => j.status === 'Closed').map(j => j._id.toString()));

    // --- Calculations for SuperAdmin KPIs ---
    const totalVacancies = requisitions.filter(r => !r.job || !closedJobIds.has(r.job.toString())).length;
    
    // Use filtered applications for these KPIs
    const hired = applications.filter(a => ["hired", "onboarding", "onboarding-complete"].includes(a.currentStatus.code)).length;
    const inProgress = applications.filter(a => 
      ["applied", "shortlisted", "first-interview", "second-interview", "offer", "offer-accepted", "medical"]
      .includes(a.currentStatus.code)
    ).length;
    const rejected = applications.filter(a => ["rejected", "offer-rejected"].includes(a.currentStatus.code)).length;
    
    const totalOutcomes = hired + rejected;
    const dropoutRate = totalOutcomes > 0 ? `${Math.round((rejected / totalOutcomes) * 100)}%` : '0%';

    // --- Calculations for COO KPIs (that you are also using) ---
    const openJobs = filteredJobs.filter(j => j.status === 'Open').length;
    const closedJobsList = filteredJobs.filter(j => j.status === 'Closed');
    
    let avgTimeToFill = 'N/A';
    if (closedJobsList.length > 0) {
      const totalDays = closedJobsList.reduce((sum, job) => {
        if (job.createdAt && job.closedAt) return sum + daysBetween(job.createdAt, job.closedAt);
        return sum;
      }, 0);
      const validJobsCount = closedJobsList.filter(j => j.createdAt && j.closedAt).length;
      if (validJobsCount > 0) {
        avgTimeToFill = `${Math.round(totalDays / validJobsCount)} d`;
      }
    }
    
    // --- **FIXED**: Real logic for Offer Acceptance Rate ---
    let offerAcceptanceRate = 'N/A';
    
    // 1. Find all "Accepted" apps (includes hired)
    const acceptedOffers = filteredData.applications.filter(
      a => a.offer?.status === 'accepted' || 
           a.currentStatus.code === 'offer-accepted' ||
           a.currentStatus.code === 'hired'
    ).length;

    // 2. Find all "Rejected" apps
    const rejectedOffers = filteredData.applications.filter(
      a => a.offer?.status === 'rejected' || 
           a.currentStatus.code === 'offer-rejected'
    ).length;

    // 3. Calculate the rate
    const totalResponded = acceptedOffers + rejectedOffers;
    if (totalResponded > 0) {
      const rate = (acceptedOffers / totalResponded) * 100;
      offerAcceptanceRate = `${Math.round(rate)}%`;
    }

    // Use ALL applications for this metric, not just date-filtered ones
    const respondedOffers = applications.filter(a => a.offer?.status === 'accepted' || a.offer?.status === 'rejected');
    if (respondedOffers.length > 0) {
      offerAcceptanceRate = `${Math.round((acceptedOffers / respondedOffers.length) * 100)}%`;
    }

    // Return ALL metrics
    return { 
      totalVacancies, 
      hired, 
      inProgress, 
      dropoutRate, 
      avgTimeToFill, 
      offerAcceptanceRate,
      openJobs, 
      closedJobs: closedJobsList.length 
    };
  }, [filteredData, jobs, applications]); 
  
  // --- 2. Recruiter Performance Data ---
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
        stats[recruiterId].totalDays += daysBetween(job.createdAt, job.closedAt);
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
  }, [filteredData.jobs]);

  // --- 3. Gender & Diversity Data ---
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

  // --- 4. Offer Acceptance Trend ---
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
      .map(month => ({ name: month, ...trends[month] }))
      .sort((a, b) => a.date - b.date);
  }, [filteredData.applications]);

  // --- 5. Department Hiring Progress ---
  const deptHiringProgressData = useMemo(() => {
    const progress = {}; 
    const closedJobIds = new Set(jobs.filter(j => j.status === 'Closed').map(j => j._id.toString()));
    
    // Use full requisitions list, but filter by department
    const requisitionsToDisplay = requisitions.filter(r => 
      (departmentFilter === "All Departments" || r.department === departmentFilter)
    );

    requisitionsToDisplay.forEach(req => {
      const dept = req.department || "Unknown";
      if (!progress[dept]) {
        progress[dept] = { total: 0, filled: 0 };
      }
      progress[dept].total++;
      if (req.job && closedJobIds.has(req.job._id.toString())) {
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
  }, [departmentFilter, requisitions, jobs]);

  // --- 6. Attrition vs. Hiring Trend ---
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

  // --- 7. Department Hiring Efficiency (Heatmap) ---
  const deptEfficiencyData = useMemo(() => {
    const efficiency = {}; 
    const deptJobs = jobs.filter(j => 
      (departmentFilter === "All Departments" || j.department === departmentFilter)
    );

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
  }, [departmentFilter, jobs]);

  // --- 8. Talent Availability Risk Map ---
  const riskMapData = useMemo(() => {
    const today = new Date();
    return jobs
      .filter(j => 
        j.status === 'Open' &&
        (departmentFilter === "All Departments" || j.department === departmentFilter)
      )
      .map(job => ({
        ...job,
        daysOpen: daysBetween(job.createdAt, today)
      }))
      .filter(job => job.daysOpen > 60)
      .sort((a, b) => b.daysOpen - a.daysOpen);
  }, [departmentFilter, jobs]);
  
  // --- 9. Filtered Applications (for Applications Tab) ---
  const filteredApplications = useMemo(() => {
    return applications.filter(
      (app) =>
        (app.applicant?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (app.job?.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (app.currentStatus?.code || '').toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [applications, searchTerm]);
  
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

      <main className="flex-1 overflow-auto">
        {active === 'Dashboard' && <ProfileHeader title="Admin Dashboard" subtitle="Complete strategic and operational overview."           showMenuButton={true} // --- HAMBURGER FIX ---
          onMenuClick={() => setSidebarOpen(true)}  />}
        {active === 'Applications' && <ProfileHeader title="All Applications" subtitle="Review and manage all applications." />}
        {active === 'Job Performance' && <ProfileHeader title="Job Performance" subtitle="Analyze performance by job." />}
        {active === 'Requisition Pipeline' && <ProfileHeader title="Requisition Pipeline" subtitle="Track all requisitions." />}
        {active === 'Hiring Funnel' && <ProfileHeader title="Hiring Funnel" subtitle="Analyze candidate funnel." />}
        {active === 'Manage Users' && <ProfileHeader title="User Management" subtitle="Edit roles and permissions." />}
        {active === 'Profile' && <ProfileHeader title="Your Profile" subtitle="Manage your admin profile." />}
        
        <div className="p-4 md:p-6">
          
          {loading ? (
            renderLoading()
          ) : error ? (
            renderError()
          ) : (
            <>
              {/* --- Filters --- */}
              {['Dashboard', 'Job Performance', 'Requisition Pipeline', 'Hiring Funnel'].includes(active) && (
                <div className="mb-6 p-5 bg-white rounded-xl shadow-lg flex flex-col-1 md:flex-row gap-4 items-center">
                  <div className="flex-1 w-full">
                    <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase">
                      Department
                    </label>
                    <select 
                      value={departmentFilter}
                      onChange={(e) => setDepartmentFilter(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-full shadow-sm bg-gray-50 focus:ring-1 focus:ring-[#111] focus:outline-none"
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
                      className="w-full p-2 border border-gray-300 rounded-full shadow-sm bg-gray-50 focus:ring-1 focus:ring-[#111] focus:outline-none"
                    >
                      <option value="All Time">All Time</option>
                      <option value="Last 30 Days">Last 30 Days</option>
                      <option value="Last 90 Days">Last 90 Days</option>
                    </select>
                  </div>
                </div>
              )}

              {active === 'Dashboard' && (
                <div className="space-y-6">
                  {/* --- Tab buttons for the dashboard --- */}
                  <div className="flex border-b border-gray-200">
                    {["Overview", "Job Performance", "Requisition Pipeline"].map(tab => (
                      <button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-2 text-sm font-medium ${activeTab === tab ? 'border-b-2 border-red-600 text-red-600' : 'text-gray-500 hover:text-gray-700'}`}>
                        {tab}
                      </button>
                    ))}
                  </div>

                  {activeTab === 'Overview' && (
                    <div className="space-y-6">
                      {/* --- 1. KPI Cards --- */}
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
                        <KPICard title="Total Vacancies" value={kpiData.totalVacancies} icon={<FaBuilding />} color="bg-blue-100 text-blue-600" />
                        <KPICard title="Total Hires" value={kpiData.hired} icon={<FaUserCheck />} color="bg-green-100 text-green-600" />
                        <KPICard title="In Progress" value={kpiData.inProgress} icon={<FaUserClock />} color="bg-yellow-100 text-yellow-600" />
                        <KPICard title="Avg. Time-to-Fill" value={kpiData.avgTimeToFill} icon={<FaClock />} color="bg-gray-100 text-gray-600" />
                        <KPICard title="Offer Acceptance" value={kpiData.offerAcceptanceRate} icon={<FaCheckCircle />} color="bg-indigo-100 text-indigo-600" />
                        <KPICard title="Dropout Rate" value={kpiData.dropoutRate} icon={<FaUserTimes />} color="bg-red-100 text-red-600" />
                      </div>
                      
                      {/* --- 2. Chart Grid (Row 1) --- */}
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2">
                          <ChartContainer title="Recruiter Performance" subtitle="Key metrics per recruiter (filtered)">
                            <ResponsiveContainer width="100%" height={320}>
                              <BarChart data={recruiterPerformanceData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis 
                                  dataKey="name"
                                />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Bar dataKey="Time-to-Fill (Days)" fill="#8884d8" radius={[6, 6, 0, 0]} />
                                <Bar dataKey="Closure Rate (%)" fill="#82ca9d" radius={[6, 6, 0, 0]} />
                              </BarChart>
                            </ResponsiveContainer>
                          </ChartContainer>
                        </div>
                        <div className="lg:col-span-1">
                          <ChartContainer title="Gender & Diversity" subtitle="Based on requisitions (filtered)">
                            <ResponsiveContainer width="100%" height={320}>
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
                            </ResponsiveContainer>
                          </ChartContainer>
                        </div>
                      </div>
                      
                      {/* --- 3. Chart Grid (Row 2) --- */}
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2">
                          <ChartContainer title="Attrition vs. Hiring Trend" subtitle="Replacement Requisitions vs. Closed Jobs (filtered)">
                            <ResponsiveContainer width="100%" height={310}>
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
                            </ResponsiveContainer>
                          </ChartContainer>
                        </div>
                        <div className="lg:col-span-1">
                          <ChartContainer title="Talent Availability Risk Map" subtitle="Critical positions open over 60 days (filtered)">
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
                        <h2 className="text-lg font-semibold text-gray-900">Department Hiring Efficiency Index</h2>
                        <p className="text-sm text-gray-500 mb-4">Average time-to-fill (in days) for closed jobs.</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                          {deptEfficiencyData.length > 0 ? deptEfficiencyData.map(dept => (
                            <div key={dept.name} className={`p-4 rounded-lg text-center ${getHeatmapColor(dept.avgDays)}`}>
                              <p className="font-semibold">{dept.name}</p>
                              <p className="text-2xl font-bold">{dept.avgDays > 0 ? `${dept.avgDays} days` : 'N/A'}</p>
                            </div>
                          )) : (
                            <p className="text-sm text-gray-500 text-center py-4 col-span-full">No closed jobs in this filter to calculate efficiency.</p>
                          )}
                        </div>
                      </div>
                      
                      {/* --- 5. Full-Width Progress Bars (Row 4) --- */}
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

                  {/* --- OTHER TABS (Now linked to internal tab state) --- */}
                  {activeTab === 'Job Performance' && ( <div className="bg-white rounded-xl shadow overflow-hidden"><JobPerformanceTable jobs={filteredData.jobs} applications={filteredData.applications} /></div>)}
                  {activeTab === 'Requisition Pipeline' && ( <div className="bg-white p-6 rounded-xl shadow"><RequisitionPipeline requisitions={filteredData.requisitions} /></div>)}
                </div>
              )}
              
              {/* --- Re-added "Applications" tab from your original file --- */}
              {active === "Applications" && (
                <div className="bg-white p-6 rounded-lg shadow mt-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold">All Applications</h2>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Search by name, position, or status..."
                        className="border rounded-md p-2 pl-10 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                      <FaSearch className="absolute left-3 top-2.5 text-gray-400" />
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Position</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {filteredApplications.map(app => (
                          <tr key={app._id} className="hover:bg-gray-50">
                            <td className="px-6 py-4">{app.applicant?.name || 'N/A'}</td>
                            <td className="px-6 py-4">{app.job?.title || 'N/A'}</td>
                            <td className="px-6 py-4">{app.currentStatus?.code || 'N/A'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

            </>
          )}
        </div>
      <Footer />
      </main>
    </div>
  );
};

export default AdminDashboard;