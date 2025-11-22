import React, { useState, useEffect, useMemo } from "react";
import {
  FaClipboardList,
  FaCheckCircle,
  FaUpload,
  FaEdit,
  FaSync,
  FaClock,
  FaAward,
  FaSpinner,
  FaSearch,
} from "react-icons/fa";
import Sidebar from "../components/Sidebar";
import ProfileHeader from "../components/ProfileHeader";
import Footer from "../components/Footer";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  LineChart,
  Line,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { useNavigate } from "react-router-dom";
import api from "../api"; // Import your api instance
import { toast } from 'react-hot-toast';
import StatusBadge from "../components/StatusBadge";

const PIE_COLORS = ["#e5383b", "#111111", "#6B6F73", "#BFBFBF", "#999DA2"];

const formatDate = (dateString) => {
  if (!dateString) return "N/A";
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const formatMonthYear = (dateString) => {
  if (!dateString) return "N/A";
  return new Date(dateString).toLocaleDateString("en-US", { year: "numeric", month: "short" });
};

// --- NEW: Date & Time Formatter ---
const formatDateTime = (dateString) => {
  if (!dateString) return { date: "Not Scheduled", time: "" };
  
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return { date: "Invalid Date", time: "" };

  const d = date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
  const t = date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
  return { date: d, time: t };
};

// Reusable KPI Card (Themed)
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

// Reusable Chart Container (Themed)
const ChartContainer = ({ title, subtitle, children }) => (
  <div className="bg-white p-6 rounded-xl shadow-lg min-h-[420px]">
    <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
    <p className="text-sm text-gray-500 mb-4">{subtitle}</p>
    {children}
  </div>
);

// --- MAIN COMPONENT ---
const UserDashboard = () => {
  const [active, setActive] = useState("Dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // --- Real Data State ---
  const [applications, setApplications] = useState([]);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem("loggedInUser"));
  const role = user?.role || "user";
  const token = localStorage.getItem("token");

  // --- Data Fetching ---
  useEffect(() => {
    if (!token) {
      toast.error("Please log in.");
      navigate("/login");
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [appsResponse, profileResponse] = await Promise.all([
          api.get("/auth/myApplications"),
          api.get("/profile/getProfile")
        ]);

        setApplications(appsResponse.data || []);
        setProfile(profileResponse.data.profile || null);

      } catch (err) {
        console.error("Fetch error:", err);
        const errorMsg = err.response?.data?.message || "Failed to load dashboard data.";
        setError(errorMsg);
        toast.error(errorMsg);
        if (err.response?.status === 401) {
            localStorage.clear();
            navigate("/login");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [token, navigate]);

  // --- Calculations for Charts & KPIs ---
  const statusCounts = useMemo(() => {
    const counts = { pending: 0, progress: 0, successful: 0, rejected: 0 };
    applications.forEach(app => {
      const status = app.currentStatus.code;
      if (['applied'].includes(status)) {
        counts.pending++;
      } else if (['shortlisted', 'first-interview', 'second-interview', 'offer', 'medical'].includes(status)) {
        counts.progress++;
      } else if (['offer-accepted', 'hired', 'onboarding', 'onboarding-complete'].includes(status)) {
        counts.successful++;
      } else if (['rejected', 'offer-rejected'].includes(status)) {
        counts.rejected++;
      }
    });
    return counts;
  }, [applications]);

  const upcomingInterviews = useMemo(() => {
    return applications.filter(app => 
      ['first-interview', 'second-interview'].includes(app.currentStatus.code)
    );
  }, [applications]);

  const applicationsByDept = useMemo(() => {
    const depts = {};
    applications.forEach(app => {
      const dept = app.job?.department || "Unknown";
      if (!depts[dept]) {
        depts[dept] = 0;
      }
      depts[dept]++;
    });
    return Object.keys(depts).map(name => ({ name, value: depts[name] }));
  }, [applications]);

  const chartData = useMemo(() => [
    { name: "Pending", count: statusCounts.pending, fill: "#F59E0B" },
    { name: "In Progress", count: statusCounts.progress, fill: "#3B82F6" },
    { name: "Successful", count: statusCounts.successful, fill: "#10B981" },
    { name: "Rejected", count: statusCounts.rejected, fill: "#E30613" },
  ], [statusCounts]);

  const applicationsTimeline = useMemo(() => {
    const timeline = {};
    applications.forEach(app => {
      const month = formatMonthYear(app.createdAt);
      if (!timeline[month]) timeline[month] = 0;
      timeline[month]++;
    });

    return Object.keys(timeline)
      .map(month => ({ month, date: new Date(month) }))
      .sort((a, b) => a.date - b.date)
      .map(item => ({ name: item.month, Applications: timeline[item.month] }));
  }, [applications]);

  const filteredApplications = applications.filter((a) =>
    (a.job?.title || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

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
        <ProfileHeader 
          title="User Dashboard" 
          subtitle={`Welcome back, ${profile?.name || user.name}!`} 
          showMenuButton={true} // --- HAMBURGER FIX ---
          onMenuClick={() => setSidebarOpen(true)} // --- HAMBURGER FIX --- 
        />

        <div className="p-4 md:p-6 space-y-6">
          {loading ? (
            renderLoading()
          ) : error ? (
            renderError()
          ) : (
            <>
              {/* ---
                DASHBOARD TAB
              --- */}
              {active === "Dashboard" && (
                <div className="space-y-6">
                  {/* --- KPI Cards (THEMED) --- */}
                  <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    <KPICard title="Total Applications" value={applications.length} icon={<FaClipboardList className="text-gray-700" />} color="bg-gray-200" />
                    <KPICard title="Pending Review" value={statusCounts.pending} icon={<FaClock className="text-yellow-600" />} color="bg-yellow-100" />
                    <KPICard title="In Progress" value={statusCounts.progress} icon={<FaSync className="text-blue-600" />} color="bg-blue-100" />
                    <KPICard title="Finished" value={statusCounts.successful + statusCounts.rejected} icon={<FaAward className="text-green-600" />} color="bg-green-100" />
                  </div>

                  {/* --- Action Buttons (THEMED) --- */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <button
                      className="flex items-center justify-center gap-2 p-3 bg-[#6B6F73] text-white rounded-full shadow-lg hover:bg-[#111111] transition-all transform hover:-translate-y-0.5"
                      onClick={() => navigate('/profile/stepper', { state: { profile } })}
                    >
                      <FaEdit /> Update Profile
                    </button>
                    <button
                      className="flex items-center justify-center gap-2 p-3 bg-[#e5383b] text-white rounded-full shadow-lg hover:bg-red-700 transition-all transform hover:-translate-y-0.5"
                      onClick={() => navigate("/jobsBoard")}
                    >
                     <FaSearch /> Find New Jobs
                    </button>
                    <button
                      onClick={() => setActive("My Applications")}
                      className="flex items-center justify-center gap-2 p-3 bg-[#0b090a] text-white rounded-full shadow-lg hover:bg-[#6B6F73] transition-all transform hover:-translate-y-0.5"
                    >
                      <FaUpload /> Track My Applications
                    </button>
                  </div>

                  {/* --- Chart Grid (Row 1) --- */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <ChartContainer title="Application Status Overview" subtitle="Summary of all your application statuses.">
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart
                          data={chartData}
                          margin={{ top: 5, right: 10, left: -20, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis allowDecimals={false} />
                          <Tooltip />
                          <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                            {chartData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.fill} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </ChartContainer>
                    
                    <ChartContainer title="Applications Over Time" subtitle="Your application submissions per month.">
                      <ResponsiveContainer width="100%" height={300}>
                        <LineChart
                          data={applicationsTimeline}
                          margin={{ top: 5, right: 20, left: -10, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis allowDecimals={false} />
                          <Tooltip />
                          <Legend />
                          <Line type="monotone" dataKey="Applications" stroke="#111111" strokeWidth={2} activeDot={{ r: 8 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </ChartContainer>
                  </div>
                  
                  {/* --- Chart Grid (Row 2) --- */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <ChartContainer title="Applications by Department" subtitle="A breakdown of where you've applied.">
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={applicationsByDept}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            innerRadius={70}
                            outerRadius={110}
                            paddingAngle={3}
                          >
                            {applicationsByDept.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </ChartContainer>

                    {/* --- UPDATED: Upcoming Interviews --- */}
                    <ChartContainer title="Upcoming Interviews" subtitle="Your next steps in the hiring process.">
                      <div className="space-y-3 max-h-[320px] overflow-y-auto pr-2">
                        {upcomingInterviews.length > 0 ? upcomingInterviews.map(app => {
                          // Find the corresponding interview schedule
                          const interview = app.job?.interviewers?.find(i => i.type === app.currentStatus.code);
                          const interviewDateTime = formatDateTime(interview?.date);
                          
                          return (
                            <div 
                              key={app._id}
                              className="p-4 bg-gray-50 border border-gray-200 rounded-lg flex justify-between items-center cursor-pointer hover:bg-gray-100 transition-all"
                              onClick={() => navigate(`/me/applications/${app._id}`)}
                            >
                              <div>
                                <p className="font-semibold text-gray-800">{app.job?.title}</p>
                                <p className="text-sm text-gray-500">{app.job?.department}</p>
                                <div className="mt-2">
                                  <StatusBadge status={app.currentStatus.code} />
                                </div>
                              </div>
                              <div className="text-right flex-shrink-0 ml-4">
                                <p className="text-sm font-semibold text-gray-900">
                                  {interviewDateTime.date}
                                </p>
                                <p className="text-sm text-gray-600">
                                  {interviewDateTime.time}
                                </p>
                              </div>
                            </div>
                          )
                        }) : (
                          <div className="flex flex-col items-center justify-center h-[300px] text-center">
                            <FaCheckCircle className="text-5xl text-green-500 mb-2" />
                            <p className="font-semibold text-gray-700">No Pending Interviews</p>
                            <p className="text-sm text-gray-500">You're all caught up!</p>
                          </div>
                        )}
                      </div>
                    </ChartContainer>
                  </div>
                </div>
              )}

              {/* ---
                MY APPLICATIONS TAB
              --- */}
              {active === "My Applications" && (
                <div className="bg-white p-6 rounded-xl shadow-lg mt-6">
                  <div className="flex flex-col md:flex-row items-center justify-between mb-4 gap-4">
                    <h2 className="text-xl font-semibold text-[#1E1E1E]">
                      My Applications
                    </h2>
                    <div className="relative w-full md:w-auto">
                      <input
                        type="text"
                        placeholder="Search by job title..."
                        className="w-full md:w-64 border rounded-lg p-2 pl-10 focus:outline-none focus:ring-2 focus:ring-[#E30613] bg-gray-50"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                      <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="min-w-full table-auto">
                      <thead className="bg-gray-50">
                        <tr className="text-left text-xs font-medium text-gray-500 uppercase">
                          <th className="px-4 py-3">Job Title</th>
                          <th className="px-4 py-3">Department</th>
                          <th className="px-4 py-3">Applied On</th>
                          <th className="px-4 py-3">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {filteredApplications.length > 0 ? filteredApplications.map((app) => (
                          <tr 
                            key={app._id} 
                            className="border-b hover:bg-gray-50 cursor-pointer"
                            onClick={() => navigate(`/me/applications/${app._id}`)}
                          >
                            <td className="px-4 py-4 font-medium text-gray-800">{app.job?.title || 'N/A'}</td>
                            <td className="px-4 py-4 text-gray-600">{app.job?.department || 'N/A'}</td>
                            <td className="px-4 py-4 text-gray-600">{formatDate(app.createdAt)}</td>
                            <td className="px-4 py-4">
                              <StatusBadge status={app.currentStatus?.code} />
                            </td>
                          </tr>
                        )) : (
                          <tr>
                            <td colSpan="4" className="text-center p-8 text-gray-500">
                              {searchTerm ? "No applications match your search." : "You have not applied to any jobs yet."}
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* ---
                PROFILE TAB
              --- */}
              {active === "Profile" && (
                <div className="bg-white p-6 rounded-xl shadow-lg mt-6">
                  <h2 className="text-xl font-semibold mb-4 text-gray-800">
                    Profile Management
                  </h2>
                  <p className="text-gray-600 mb-6">Keep your profile up-to-date to increase your chances of getting shortlisted.</p>
                  <button
                    className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#111111] text-white rounded-full shadow-lg hover:bg-[#E30613] transition-all"
                    onClick={() => navigate('/profile/stepper', { state: { profile } })}
                  >
                    <FaEdit /> Go to Profile Editor
                  </button>
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

export default UserDashboard;