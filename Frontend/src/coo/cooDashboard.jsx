import React, { useState, useEffect, useMemo } from "react";
import {
  FaBriefcase,
  FaClock,
  FaCheckCircle,
  FaSpinner,
  FaBullseye, // For Hiring Target
  FaUserCheck, // Added
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
  LineChart, // Added for new chart
  Line, // Added for new chart
} from "recharts";
import Sidebar from "../components/Sidebar";
import ProfileHeader from "../components/ProfileHeader";
import api from "../api";
import RequisitionPipeline from '../coo/RequisitionPipeline';
import JobPerformanceTable from '../coo/JobPerformanceTable';
import Footer from '../components/Footer';
import { Link, useNavigate } from 'react-router-dom'; // Added useNavigate

const formatMonthYear = (dateString) => {
  if (!dateString) return "N/A";
  return new Date(dateString).toLocaleDateString("en-US", { year: "numeric", month: "short" });
};

// Helper to calculate days between two dates
const daysBetween = (date1, date2) => {
  if (!date1 || !date2) return 0;
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  const diffTime = Math.abs(d2 - d1);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

const departmentList = [
  "All Departments", "Other", "Administration", "Administration Bus", "After Sales Bus", "After Sales Truck",
  "Assembly Shop", "Body Shop", "Brand Management", "Chassis & Deck Assembly", "Civil Projects",
  "Compliance & Risk Management", "Customer Relationship Management", "EDD", "Finance",
  "Health, Safety & Environment", "Human Resource", "Internal Audit", "M.I.S",
  "Maintenance & Utilities", "Management Group", "Marketing & Planning", "Paint Shop", "Production",
  "Protoshop", "QAHSE", "Sales & Marketing - BUS", "Sales & Marketing - Truck", "Sales Admin",
  "Secretarial", "Spare Parts", "Warehouse",
];

const COLORS = ["#6366F1", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#3B82F6"];
const PIE_COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#A3A8AD"];

// --- Reusable KPI Card (New Style - Responsive) ---
const KPICard = ({ title, value, icon, color }) => (
  <div className="bg-white rounded-lg md:rounded-xl shadow-md md:shadow-lg p-4 md:p-5 transition-all duration-300 hover:shadow-lg md:hover:shadow-2xl md:hover:-translate-y-1">
    <div className="flex justify-between items-start gap-3">
      <div className="flex flex-col min-w-0">
        <p className="text-xs md:text-sm font-medium text-gray-500 truncate">{title}</p>
        <p className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 mt-1">{value}</p>
      </div>
      <div className={`p-2 md:p-3 rounded-full flex-shrink-0 ${color}`}>
        {icon}
      </div>
    </div>
  </div>
);

// --- Reusable Chart Container ---
const ChartContainer = ({ title, subtitle, children }) => (
  <div className="bg-white p-4 md:p-6 rounded-lg md:rounded-xl shadow-md md:shadow-lg min-h-[350px] md:min-h-[420px]">
    <h2 className="text-base md:text-lg font-semibold text-gray-900">{title}</h2>
    <p className="text-xs md:text-sm text-gray-500 mb-3 md:mb-4">{subtitle}</p>
    {children}
  </div>
);

// --- Heatmap Cell Styling ---
const getHeatmapColor = (days) => {
  if (days === 0) return 'bg-gray-100 text-gray-500'; // N/A (no closed jobs)
  if (days <= 30) return 'bg-green-100 text-green-800'; // Good
  if (days <= 60) return 'bg-yellow-100 text-yellow-800'; // Average
  return 'bg-red-100 text-red-800'; // Bad
};

const CooDashboard = () => {
  const [activeTab, setActiveTab] = useState("Overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState("All Departments");
  
  // --- Date Filter State ---
  const [dateFilter, setDateFilter] = useState("All Time"); 
  const [hiringVelocityDateRange, setHiringVelocityDateRange] = useState('12m'); // Kept your original filter

  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [requisitions, setRequisitions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const user = JSON.parse(localStorage.getItem("loggedInUser"));
  const role = user?.role || "coo";
  const navigate = useNavigate();

  // --- Data Fetching (MODIFIED) ---
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
        const [jobsRes, appsRes, reqsRes] = await Promise.all([
          api.get("/auth/allJobs", { params: { status: 'All' } }), // Get All jobs
          api.get("/auth/allApplications"),
          api.get("/requisitions/listRequisitions"),
        ]);
        
        setJobs(jobsRes.data.jobs || []);
        setApplications(appsRes.data || []);
        setRequisitions(reqsRes.data.requisitions || []);
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
        setError(error.response?.data?.message || error.message);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, [navigate]);

  // --- Filtered Data Memos (MODIFIED to include dateFilter) ---
  const filteredData = useMemo(() => {
    const now = new Date();
    let dateLimit = new Date(0);
    if (dateFilter === "Last 30 Days") {
      dateLimit.setDate(now.getDate() - 30);
    } else if (dateFilter === "Last 90 Days") {
      dateLimit.setDate(now.getDate() - 90);
    }

    const filterByDate = (item) => new Date(item.createdAt) >= dateLimit;

    // Filter all data based on global filters
    const filteredJobs = jobs.filter(j => 
      (selectedDepartment === "All Departments" || j.department === selectedDepartment) && filterByDate(j)
    );
    const filteredReqs = requisitions.filter(r => 
      (selectedDepartment === "All Departments" || r.department === selectedDepartment) && filterByDate(r)
    );
    const filteredApps = applications.filter(a => {
      const jobDept = a.job?.department; // Get dept from populated job
      const deptMatch = selectedDepartment === "All Departments" || jobDept === selectedDepartment;
      return deptMatch && filterByDate(a);
    });

    return { 
      jobs: filteredJobs, 
      applications: filteredApps, 
      requisitions: filteredReqs 
    };
  }, [selectedDepartment, dateFilter, jobs, applications, requisitions]);


  // --- kpiData Hook (UPDATED) ---
  const kpiData = useMemo(() => {
    const openJobs = filteredData.jobs.filter(j => j.status === 'Open').length;
    const closedJobsList = filteredData.jobs.filter(j => j.status === 'Closed');
    
    // --- Avg. Time to Fill (Fixed) ---
    let avgTimeToFill = 'N/A';
    if (closedJobsList.length > 0) {
      const totalDays = closedJobsList.reduce((sum, job) => {
        if (job.createdAt && job.closedAt) {
          return sum + daysBetween(job.createdAt, job.closedAt);
        }
        return sum;
      }, 0);
      
      const validJobsCount = closedJobsList.filter(j => j.createdAt && j.closedAt).length; 
      if (validJobsCount > 0) {
          const avgDays = Math.round(totalDays / validJobsCount);
          avgTimeToFill = `${avgDays} d`;
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
    
    // --- Hiring vs. Target ---
    const closedJobIds = new Set(jobs.filter(j => j.status === 'Closed').map(j => j._id.toString()));
    const totalRequisitions = filteredData.requisitions.length;
    const filledRequisitions = filteredData.requisitions.filter(r => r.job && closedJobIds.has(r.job._id.toString())).length;

    return { 
      openJobs, 
      closedJobs: closedJobsList.length, 
      avgTimeToFill, 
      offerAcceptanceRate,
      totalRequisitions, // For new card
      filledRequisitions // For new card
    };
  }, [filteredData, jobs]); // Added full 'jobs' list as dependency

  // --- Open Jobs by Dept Pie Chart (Your existing logic) ---
  const jobsByDeptData = useMemo(() => {
      const deptCounts = filteredData.jobs.filter(job => job.status === 'Open').reduce((acc, job) => {
            acc[job.department] = (acc[job.department] || 0) + 1;
            return acc;
        }, {});
      return Object.entries(deptCounts).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [filteredData.jobs]);

  // --- Hiring Velocity Chart (Your existing logic) ---
  const hiringVelocityData = useMemo(() => {
    const monthsShort = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const now = new Date();
    const range = parseInt(hiringVelocityDateRange); 

    let monthLabels = [];
    for (let i = range - 1; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        monthLabels.push({
            name: monthsShort[d.getMonth()],
            year: d.getFullYear(),
            month: d.getMonth(),
            opened: 0,
            closed: 0,
        });
    }
    
    const velocityFilteredJobs = jobs.filter(j => 
      (selectedDepartment === "All Departments" || j.department === selectedDepartment)
    );

    velocityFilteredJobs.forEach(job => {
        const openedDate = new Date(job.createdAt);
        const closedDate = job.closedAt ? new Date(job.closedAt) : null;
        
        const openMonthBucket = monthLabels.find(m => m.year === openedDate.getFullYear() && m.month === openedDate.getMonth());
        if(openMonthBucket) openMonthBucket.opened += 1;

        if (closedDate) {
            const closeMonthBucket = monthLabels.find(m => m.year === closedDate.getFullYear() && m.month === closedDate.getMonth());
            if(closeMonthBucket) closeMonthBucket.closed += 1;
        }
    });

    return monthLabels;
  }, [selectedDepartment, jobs, hiringVelocityDateRange]);

  // --- 2. NEW: Department Hiring Efficiency (Heatmap) ---
  const deptEfficiencyData = useMemo(() => {
    const efficiency = {}; 
    const deptJobs = jobs.filter(j => 
      (selectedDepartment === "All Departments" || j.department === selectedDepartment)
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
        return {
          name: deptName,
          avgDays,
        };
      })
      .sort((a, b) => a.avgDays - b.avgDays);
  }, [selectedDepartment, jobs]);

  // --- 3. NEW: Attrition vs. Hiring Trend (Dual-Axis Chart) ---
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
      .map(month => ({
        name: month,
        ...trends[month],
      }))
      .sort((a, b) => a.date - b.date);
  }, [filteredData.jobs, filteredData.requisitions]);

  // --- 4. NEW: Talent Availability Risk Map ---
  const riskMapData = useMemo(() => {
    const today = new Date();
    return jobs
      .filter(j => 
        j.status === 'Open' &&
        (selectedDepartment === "All Departments" || j.department === selectedDepartment)
      )
      .map(job => ({
        ...job,
        daysOpen: daysBetween(job.createdAt, today)
      }))
      .filter(job => job.daysOpen > 60)
      .sort((a, b) => b.daysOpen - a.daysOpen);
  }, [selectedDepartment, jobs]);
  
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
        active="Dashboard" 
        setActive={() => {}} 
        sidebarOpen={sidebarOpen} 
        setSidebarOpen={setSidebarOpen} 
      />

      <div className="flex-1 flex flex-col overflow-hidden"> 
        <ProfileHeader 
          title="COO Dashboard" 
          subtitle="Strategic Hiring & Operations Overview"
          showMenuButton={true} // --- HAMBURGER FIX ---
          onMenuClick={() => setSidebarOpen(true)} // --- HAMBURGER FIX --- 
        />
        
        <main className="flex-1 overflow-y-auto p-3 md:p-4 lg:p-6">
          {/* --- MODIFIED: Added Date Filter (Responsive) --- */}
          <div className="mb-4 md:mb-6 p-3 md:p-5 bg-white rounded-lg md:rounded-xl shadow-md md:shadow-lg flex flex-col gap-3 md:gap-4">
            <div className="flex flex-col-1 md:flex-row gap-3 md:gap-4 w-full">
              <div className="flex-1 min-w-0">
                <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase">
                  Department
                </label>
                <select 
                  id="departmentFilter" 
                  value={selectedDepartment} 
                  onChange={(e) => setSelectedDepartment(e.target.value)} 
                  className="w-full p-2 md:p-2.5 text-sm md:text-base border border-gray-300 rounded-full shadow-sm bg-gray-50 focus:ring-1 focus:ring-[#111] focus:outline-none"
                >
                  {departmentList.map(dep => <option key={dep} value={dep}>{dep}</option>)}
                </select>
              </div>
              {/* --- NEW DATE FILTER (Responsive) --- */}
              <div className="flex-1 min-w-0">
                <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase">
                  Date Range (Created)
                </label>
                <select
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="w-full p-2 md:p-2.5 text-sm md:text-base border border-gray-300 rounded-full shadow-sm bg-gray-50 focus:ring-1 focus:ring-[#111]  focus:outline-none"
                >
                  <option value="All Time">All Time</option>
                  <option value="Last 30 Days">Last 30 Days</option>
                  <option value="Last 90 Days">Last 90 Days</option>
                </select>
              </div>
            </div>
          </div>

          {/* --- Tab Structure (Responsive) --- */}
          <div className="flex gap-1 md:gap-0 border-b border-gray-200 mb-4 md:mb-6 overflow-x-auto">
            {["Overview", "Job Performance", "Requisition Pipeline"].map(tab => (
              <button 
                key={tab} 
                onClick={() => setActiveTab(tab)} 
                className={`px-2 md:px-4 py-2 text-xs md:text-sm font-medium whitespace-nowrap transition-colors ${activeTab === tab ? 'border-b-2 border-red-600 text-red-600' : 'text-gray-500 hover:text-gray-700'}`}
              >
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
              {/* --- THIS IS THE UPDATED "OVERVIEW" TAB --- */}
              {activeTab === 'Overview' && (
                <div className="space-y-4 md:space-y-6">
                  
                  {/* --- 1. MODIFIED KPI Cards (Responsive Grid) --- */}
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2 md:gap-4 lg:gap-6">
                    <KPICard title="Open Positions" value={kpiData.openJobs} icon={<FaBriefcase className="text-gray-600 text-lg md:text-xl" />} color="bg-gray-100" />
                    <KPICard title="Closed Positions" value={kpiData.closedJobs} icon={<FaCheckCircle className="text-gray-600 text-lg md:text-xl" />} color="bg-gray-100" />
                    <KPICard title="Avg. Time to Fill" value={kpiData.avgTimeToFill} icon={<FaClock className="text-gray-600 text-lg md:text-xl" />} color="bg-gray-100" />
                    <KPICard title="Offer Acceptance" value={kpiData.offerAcceptanceRate} icon={<FaUserCheck className="text-gray-600 text-lg md:text-xl" />} color="bg-gray-100" />
                    <KPICard 
                      title="Hiring Target (Filled)" 
                      value={`${kpiData.filledRequisitions} / ${kpiData.totalRequisitions}`} 
                      icon={<FaBullseye className="text-gray-600 text-lg md:text-xl" />}
                      color="bg-gray-100"
                    />
                  </div>
                  
                  {/* --- 2. YOUR ORIGINAL CHARTS + NEW CHARTS (Responsive Grid) --- */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
                    {/* Your Original Pie Chart */}
                    <ChartContainer title="Open Jobs by Department" subtitle="Current open positions by department.">
                      <ResponsiveContainer width="100%" height={320}>
                        <PieChart>
                          <Pie data={jobsByDeptData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={{ fontSize: 12 }}>
                            {jobsByDeptData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                          <Legend wrapperStyle={{ fontSize: 12 }} />
                        </PieChart>
                      </ResponsiveContainer>
                    </ChartContainer>

                    {/* Your Original Hiring Velocity Chart */}
                    <ChartContainer title="Hiring Velocity" subtitle="Jobs opened vs. closed per month.">
                      <div className="flex justify-end items-center mb-2 md:mb-4 -mt-10 md:-mt-12">
                        <div className="flex items-center gap-1 md:gap-2">
                          {['3m', '6m', '12m'].map(range => (
                            <button key={range} onClick={() => setHiringVelocityDateRange(range)} className={`px-2 md:px-3 py-1 text-xs font-medium rounded-full ${hiringVelocityDateRange === range ? 'bg-red-600 text-white' : 'bg-gray-200 text-gray-700'}`}>
                              {range.replace('m', 'M')}
                            </button>
                          ))}
                        </div>
                      </div>
                      <ResponsiveContainer width="100%" height={320}>
                        <BarChart data={hiringVelocityData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                          <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                          <Tooltip />
                          <Legend wrapperStyle={{ fontSize: 12 }} />
                          <Bar dataKey="opened" fill="#8884d8" name="Opened" />
                          <Bar dataKey="closed" fill="#82ca9d" name="Closed" />
                        </BarChart>
                      </ResponsiveContainer>
                    </ChartContainer>

                    {/* --- NEW: Attrition vs. Hiring Trend --- */}
                    <ChartContainer title="Attrition vs. Hiring Trend" subtitle="Replacement Requisitions vs. Closed Jobs">
                      <ResponsiveContainer width="100%" height={320}>
                        <LineChart data={attritionHiringData} >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" tick={{ fontSize: 12 }} angle={-45} textAnchor="end" />
                          <YAxis yAxisId="left" orientation="left" stroke="#FA8072" tick={{ fontSize: 12 }} allowDecimals={false} />
                          <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" tick={{ fontSize: 12 }} allowDecimals={false} />
                          <Tooltip />
                          <Legend wrapperStyle={{ fontSize: 12 }} />
                          <Line yAxisId="left" type="monotone" dataKey="Attrition" stroke="#FA8072" strokeWidth={2} activeDot={{ r: 6 }} />
                          <Line yAxisId="right" type="monotone" dataKey="Hired" stroke="#82ca9d" strokeWidth={2} activeDot={{ r: 6 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </ChartContainer>

                    {/* --- NEW: Talent Availability Risk Map --- */}
                    <ChartContainer title="Talent Availability Risk Map" subtitle="Critical positions open over 60 days">
                      <div className="space-y-2 md:space-y-3 max-h-[280px] overflow-y-auto pr-2">
                        {riskMapData.length > 0 ? riskMapData.map(job => (
                          <div key={job._id} className="p-2 md:p-3 bg-red-50 border border-red-200 rounded-lg">
                            <div className="flex justify-between items-start gap-2">
                              <span className="font-semibold text-red-800 text-sm md:text-base truncate">{job.title}</span>
                              <span className="font-bold text-red-600 text-xs md:text-sm flex-shrink-0">{job.daysOpen}d</span>
                            </div>
                            <span className="text-xs md:text-sm text-gray-500">{job.department}</span>
                          </div>
                        )) : (
                          <div className="flex flex-col items-center justify-center h-[280px] text-center">
                            <FaCheckCircle className="text-4xl md:text-5xl text-green-500 mb-2" />
                            <p className="font-semibold text-gray-700 text-sm md:text-base">No Critical Risks</p>
                            <p className="text-xs md:text-sm text-gray-500">All positions under 60 days.</p>
                          </div>
                        )}
                      </div>
                    </ChartContainer>
                  </div>
                  
                  {/* --- NEW: Department Hiring Efficiency (Heatmap - Responsive) --- */}
                  <div className="bg-white p-4 md:p-6 rounded-lg md:rounded-xl shadow-md md:shadow-lg">
                    <h2 className="text-base md:text-lg font-semibold text-gray-900">Department Hiring Efficiency Index</h2>
                    <p className="text-xs md:text-sm text-gray-500 mb-3 md:mb-4">Average time-to-fill (in days) for closed jobs.</p>
                    <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 md:gap-4">
                      {deptEfficiencyData.length > 0 ? deptEfficiencyData.map(dept => (
                        <div key={dept.name} className={`p-2 md:p-4 rounded-lg text-center text-sm md:text-base ${getHeatmapColor(dept.avgDays)}`}>
                          <p className="font-semibold truncate">{dept.name}</p>
                          <p className="text-lg md:text-2xl font-bold">{dept.avgDays > 0 ? `${dept.avgDays}d` : 'N/A'}</p>
                        </div>
                      )) : (
                        <p className="text-xs md:text-sm text-gray-500 text-center py-4 col-span-full">No closed jobs in this filter to calculate efficiency.</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
              
              {activeTab === 'Job Performance' && ( <div className="bg-white rounded-lg md:rounded-xl shadow-md md:shadow-lg overflow-hidden"><JobPerformanceTable jobs={filteredData.jobs} applications={filteredData.applications} /></div>)}
              {activeTab === 'Requisition Pipeline' && ( <div className="bg-white p-4 md:p-6 rounded-lg md:rounded-xl shadow-md md:shadow-lg"><RequisitionPipeline requisitions={filteredData.requisitions} /></div>)}
            </div>
          )}
        </main>
        <Footer />
      </div>
    </div>
  );
};

export default CooDashboard;