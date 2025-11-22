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
import { useNavigate } from "react-router-dom";
import api from "../api";
import { toast } from 'react-hot-toast';

const formatDate = (dateString, options = {}) => {
  if (!dateString) return "N/A";
  const defaultOptions = {
    year: "numeric",
    month: "short",
    day: "numeric",
  };
  return new Date(dateString).toLocaleDateString("en-US", { ...defaultOptions, ...options });
};

const formatMonthYear = (dateString) => {
  if (!dateString) return "N/A";
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
  });
};

const daysBetween = (date1, date2) => {
  if (!date1 || !date2) return 0;
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  const diffTime = Math.abs(d2 - d1);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

const PIE_COLORS = ["#E30613", "#111111", "#6B6F73", "#BFBFBF", "#999DA2"];

const departmentList = [
  "All Departments", "Other", "Administration", "Administration Bus", "After Sales Bus", "After Sales Truck",
  "Assembly Shop", "Body Shop", "Brand Management", "Chassis & Deck Assembly", "Civil Projects",
  "Compliance & Risk Management", "Customer Relationship Management", "EDD", "Finance",
  "Health, Safety & Environment", "Human Resource", "Internal Audit", "M.I.S",
  "Maintenance & Utilities", "Management Group", "Marketing & Planning", "Paint Shop", "Production",
  "Protoshop", "QAHSE", "Sales & Marketing - BUS", "Sales & Marketing - Truck", "Sales Admin",
  "Secretarial", "Spare Parts", "Warehouse",
];

// --- THEME: Reusable Themed KPI Card ---
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

// --- THEME: Reusable Themed Chart Container ---
const ChartContainer = ({ title, subtitle, children }) => (
  <div className="bg-white p-6 rounded-xl shadow-lg min-h-[420px]">
    <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
    <p className="text-sm text-gray-500 mb-4">{subtitle}</p>
    {children}
  </div>
);

const RecruiterDashboard = () => {
  const [active, setActive] = useState("Dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false); // Set to false for mobile
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [requisitions, setRequisitions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [departmentFilter, setDepartmentFilter] = useState("All Departments");
  const [dateFilter, setDateFilter] = useState("All Time");
  const navigate = useNavigate();

  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("loggedInUser"));
  const role = user?.role || "recruiter";

  useEffect(() => {
    const fetchData = async () => {
       if (!token) {
        setError("You are not logged in. Redirecting...");
        setLoading(false);
        setTimeout(() => navigate("/login"), 2000);
        return;
      }

      setLoading(true);
      try {
        const [jobsRes, appsRes, reqsRes] = await Promise.all([
          api.get("/auth/mineJobList"),    
          api.get("/auth/allApplications"),  
          api.get("/requisitions/listRequisitions")
        ]);

        setJobs(jobsRes.data || []);
        setApplications(appsRes.data || []);
        setRequisitions(reqsRes.data.requisitions || []);
      } catch (err) {
        console.error("Fetch error:", err);
        setError(err.response?.data?.message || err.message);
        toast.error("Failed to load dashboard data.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [token, navigate]);

  const myJobIds = useMemo(() => new Set(jobs.map(j => j._id)), [jobs]);

  const myApplications = useMemo(
    () => applications.filter(a => myJobIds.has(a.job?._id)),
    [applications, myJobIds]
  );

  const filteredJobs = useMemo(() => {
    const now = new Date();
    let dateLimit = new Date(0);
    if (dateFilter === "Last 30 Days") {
      dateLimit.setDate(now.getDate() - 30);
    } else if (dateFilter === "Last 90 Days") {
      dateLimit.setDate(now.getDate() - 90);
    }
    return jobs.filter(j => 
      (departmentFilter === "All Departments" || j.department === departmentFilter) &&
      (new Date(j.createdAt) >= dateLimit)
    );
  }, [jobs, departmentFilter, dateFilter]);

  const filteredApplications = useMemo(() => {
    const filteredJobIds = new Set(filteredJobs.map(j => j._id));
    return myApplications.filter(a => filteredJobIds.has(a.job?._id));
  }, [myApplications, filteredJobs]);

  const filteredRequisitions = useMemo(() => {
    return requisitions.filter(r => 
      (departmentFilter === "All Departments" || r.department === departmentFilter)
    );
  }, [requisitions, departmentFilter]);

  const kpiData = useMemo(() => {
    const openJobsList = filteredJobs.filter(j => j.status === "Open");
    const closedJobsList = filteredJobs.filter(j => j.status === "Closed");
    
    const openJobIds = new Set(openJobsList.map(j => j._id));
    const appsForOpenJobs = myApplications.filter(a => openJobIds.has(a.job?._id));
    const totalApplicantsInOpenJobs = appsForOpenJobs.length;
    
    let avgTimeInDays = 0;
    if (closedJobsList.length > 0) {
        const totalDays = closedJobsList.reduce((sum, job) => {
            if (job.createdAt && job.closedAt) {
                return sum + daysBetween(job.createdAt, job.closedAt);
            }
            return sum;
        }, 0);
        
        const validJobsCount = closedJobsList.filter(j => j.createdAt && j.closedAt).length;
        if (validJobsCount > 0) {
             avgTimeInDays = Math.round(totalDays / validJobsCount);
        }
    }
    
    const pendingReqs = filteredRequisitions.filter(
      (r) => !r.job && r.approvals?.coo?.approval?.status !== "approved"
    ).length;

    const pendingActions = filteredApplications.filter(
      a => ['applied', 'shortlisted'].includes(a.currentStatus.code)
    ).length;

    return { 
      openJobs: openJobsList.length, 
      closedJobs: closedJobsList.length,
      totalApplicantsInOpenJobs, 
      avgTimeInDays, 
      pendingReqs,
      pendingActions
    };
  }, [filteredJobs, filteredApplications, filteredRequisitions, myApplications]);

  const pipelineFunnelData = useMemo(() => {
    const pipeline = {
      Applications: 0,
      Screening: 0,
      Interview: 0,
      Offer: 0,
      Hired: 0,
      Rejected: 0,
    };
    filteredApplications.forEach((app) => {
      pipeline.Applications++;
      switch (app.currentStatus.code) {
        case "rejected":
        case "offer-rejected":
          pipeline.Rejected++;
          break;
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
          break;
        default:
          break;
      }
    });
    return [
        { name: 'Applications', value: pipeline.Applications },
        { name: 'Screening', value: pipeline.Screening },
        { name: 'Interview', value: pipeline.Interview },
        { name: 'Offer', value: pipeline.Offer },
        { name: 'Hired', value: pipeline.Hired },
        { name: 'Rejected', value: pipeline.Rejected }
    ];
  }, [filteredApplications]);

  const timeToFillData = useMemo(() => {
    const monthlyData = {};
    filteredApplications
      .filter((a) => a.currentStatus.code === "hired")
      .forEach((app) => {
        const created = new Date(app.createdAt);
        const hiredStatus = app.history.find(h => h.code === 'hired');
        const hiredDate = hiredStatus ? new Date(hiredStatus.at) : new Date(app.updatedAt); 
        
        const monthYear = formatMonthYear(hiredDate);
        const diffTime = Math.abs(hiredDate - created);
        const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (!monthlyData[monthYear]) {
          monthlyData[monthYear] = { totalDays: 0, hires: 0, dateObj: hiredDate };
        }
        monthlyData[monthYear].totalDays += days;
        monthlyData[monthYear].hires++;
      });
      
    return Object.keys(monthlyData)
      .map(month => ({
        name: month,
        date: monthlyData[month].dateObj,
        "Avg. Time-to-Fill": Math.round(monthlyData[month].totalDays / monthlyData[month].hires),
      }))
      .sort((a, b) => a.date - b.date);
  }, [filteredApplications]);

  const sourceOfHireData = useMemo(() => {
      const sources = {};
      filteredApplications
        .filter(a => a.currentStatus.code === 'hired')
        .forEach((app) => {
          const source = app.source || "Unknown"; 
          if (!sources[source]) {
            sources[source] = 0;
          }
          sources[source]++;
        });
    
      return Object.keys(sources).map(name => ({
        name: name,
        value: sources[name],
      }));
    }, [filteredApplications]);

  const jobsByDeptData = useMemo(() => {
    const deptStats = {};
    filteredJobs.forEach(job => {
      const dept = job.department || "Unknown";
      if (!deptStats[dept]) {
        deptStats[dept] = { Open: 0, Closed: 0 };
      }
      if (job.status === "Open") deptStats[dept].Open++;
      if (job.status === "Closed") deptStats[dept].Closed++;
    });
    return Object.keys(deptStats)
      .map(deptName => ({
        name: deptName,
        Open: deptStats[deptName].Open,
        Closed: deptStats[deptName].Closed,
      }))
      .filter(d => d.Open > 0 || d.Closed > 0);
  }, [filteredJobs]);

  const interviewScheduleData = useMemo(() => {
    const schedule = {};
    const today = new Date();
    const next7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      return formatDate(date, { month: 'short', day: 'numeric' });
    });
    next7Days.forEach(day => schedule[day] = 0);
    filteredJobs.forEach(job => {
      job.interviewers?.forEach(interview => {
        const interviewDate = new Date(interview.date);
        const dayKey = formatDate(interviewDate, { month: 'short', day: 'numeric' });
        if (schedule[dayKey] !== undefined) {
          schedule[dayKey]++;
        }
      });
    });
    return Object.keys(schedule).map(day => ({
      name: day,
      Interviews: schedule[day],
    }));
  }, [filteredJobs]);
  
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
        {/* --- UPDATED ProfileHeader --- */}
        <ProfileHeader 
          title="Recruiter Dashboard" 
          subtitle="Daily Operations & Candidate Pipeline"
          showMenuButton={true}
          onMenuClick={() => setSidebarOpen(true)}
        />

        {/* --- UPDATED PADDING --- */}
        <div className="p-4 md:p-6 space-y-6">
          {loading ? (
            renderLoading()
          ) : error ? (
            renderError()
          ) : (
            <>
              <div className="p-4 sm:p-5 bg-white rounded-xl shadow-lg flex flex-col-1 md:flex-row gap-4 items-center">
                <div className="flex-1 w-full">
                  <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase">
                    Department
                  </label>
                  <select
                    value={departmentFilter}
                    onChange={(e) => setDepartmentFilter(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-full shadow-sm bg-gray-50 focus:ring-1 focus:ring-[#111] focus:outline-none"
                  >
                    {departmentList.map(dept => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                </div>
                
                <div className="flex-1 w-full">
                  <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase">
                    Date Range
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

              {/* --- 6-Card KPI Layout (THEMED) --- */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-6 gap-6">
                <KPICard title="Open Jobs" value={kpiData.openJobs} icon={<FaBriefcase className="text-gray-700" />} color="bg-gray-200" />
                <KPICard title="Open Applicants" value={kpiData.totalApplicantsInOpenJobs} icon={<FaUsers className="text-gray-700" />} color="bg-gray-100" />
                <KPICard title="Pending Actions" value={kpiData.pendingActions} icon={<FaTasks className="text-gray-700" />} color="bg-gray-100" />
                <KPICard title="Avg. Time-to-Fill" value={kpiData.avgTimeInDays > 0 ? `${kpiData.avgTimeInDays} d` : 'N/A'} icon={<FaClock className="text-gray-700" />} color="bg-gray-100" />
                <KPICard title="Pending Reqs" value={kpiData.pendingReqs} icon={<FaFileSignature className="text-gray-700" />} color="bg-gray-100" />
                <KPICard title="Closed Jobs" value={kpiData.closedJobs} icon={<FaCheckCircle className="text-gray-700" />} color="bg-gray-100" />
              </div>

              {/* --- Chart Grid (Row 1) --- */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                <ChartContainer title="Candidate Pipeline Funnel" subtitle="Cumulative candidates at each stage.">
                  <ResponsiveContainer width="100%" height={320}>
                    <BarChart data={pipelineFunnelData} layout="vertical" margin={{ left: 30 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" allowDecimals={false} />
                      <YAxis dataKey="name" type="category" width={80} />
                      <Tooltip />
                      <Bar dataKey="value" name="Candidates" fill="#999DA2" radius={[0, 6, 6, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>

                <ChartContainer title="Source of Hire" subtitle="Breakdown of hired candidate sources.">
                  {(!sourceOfHireData.length || (sourceOfHireData.length === 1 && sourceOfHireData[0].name === "Unknown")) && (
                    <div className="flex items-center justify-center my-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <FaInfoCircle className="text-blue-600 mr-3 flex-shrink-0" />
                      <p className="text-xs text-blue-700">
                        No "Source of Hire" data to display. This chart will populate as you hire candidates.
                      </p>
                    </div>
                  )}
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={sourceOfHireData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={70}
                        outerRadius={110}
                        fill="#8884d8"
                        paddingAngle={3}
                      >
                        {sourceOfHireData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </div>

              {/* --- Full-Width Chart (Row 2) --- */}
              <ChartContainer title="Job Status by Department" subtitle="Open vs. Closed jobs for filtered departments.">
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart data={jobsByDeptData} margin={{ bottom: 80 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" angle={-45} textAnchor="end" interval={0} />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Legend verticalAlign="top" />
                    <Bar dataKey="Open" fill="#E30613" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="Closed" fill="#999DA2" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>

              {/* --- Chart Grid (Row 3) --- */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ChartContainer title="Average Time-to-Fill" subtitle="Average days from 'Applied' to 'Hired' per month.">
                  <ResponsiveContainer width="100%" height={320}>
                    <LineChart data={timeToFillData} margin={{ left: 10, right: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis allowDecimals={false} label={{ value: 'Days', angle: -90, position: 'insideLeft' }} />
                      <Tooltip />
                      <Legend verticalAlign="top" />
                      <Line
                        type="monotone"
                        dataKey="Avg. Time-to-Fill"
                        stroke="#111111"
                        strokeWidth={2}
                        activeDot={{ r: 8 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </ChartContainer>

                <ChartContainer title="Interview Schedule" subtitle="Total interviews scheduled for the next 7 days.">
                  <ResponsiveContainer width="100%" height={320}>
                    <BarChart data={interviewScheduleData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis allowDecimals={false} />
                      <Tooltip />
                      <Legend verticalAlign="top" />
                      <Bar dataKey="Interviews" fill="#E30613" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </div>
            </>
          )}
        </div>
      <Footer />
      </main>
    </div>
  );
};

export default RecruiterDashboard;