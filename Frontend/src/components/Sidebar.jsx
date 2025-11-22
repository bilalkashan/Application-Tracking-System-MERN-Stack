import React, { useState, useEffect } from "react";
import {
  FaUser,
  FaUsers,
  FaClipboardList,
  FaChartLine,
  FaSignOutAlt,
  FaCheckCircle
} from "react-icons/fa";
import { IoNotifications } from "react-icons/io5";
import { IoIosCreate } from "react-icons/io";
import { RiPassPendingFill } from "react-icons/ri";
import { SiToggltrack } from "react-icons/si";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { HiMiniLockOpen } from "react-icons/hi2";
import { IoLockClosed } from "react-icons/io5";
import logo from "../assets/MM Logo white.png";
import { UploadCloud } from "lucide-react";
import { RiUserSearchFill } from "react-icons/ri";

const sidebarItems = {
  admin: [
    { name: "Dashboard", path: "/adminDashboard" },
    { name: "Profile", path: "/my/profile" },
    { name: "Notifications", path: "/my/notifications" },
    { name: "Manage Users", path: "/users" },
    { name: "Open Jobs", path: "/open-jobs" },
    { name: "Closed Jobs", path: "/closed-jobs" },
    { name: "Requisition Form", path: "/my/requisitionForm" },
    { name: "Applications Tracker", path: "/admin/applications" },
    { name: "Jobs Approval", path: "/admin/jobs/approvals" },
  ],
  recruiter: [
    { name: "Dashboard", path: "/recruiterDashboard" },
    { name: "Profile", path: "/my/profile" },
    { name: "Notifications", path: "/my/notifications" },
    { name: "Smart Search", path: "/recruiter/smart-search" },
    { name: "Create Job", path: "/recruiter/jobs/create" },
    { name: "My Posted Jobs", path: "/recruiter/jobs" },
    { name: "Open Jobs", path: "/open-jobs" },
    { name: "Closed Jobs", path: "/closed-jobs" },
    { name: "Requisition Form", path: "/my/requisitionForm" },
    { name: "Onboarding Review", path: "/recruiter/onboarding-review" },
  ],
  sub_recruiter: [
    { name: "Dashboard", path: "/subRecruiterDashboard" },
    { name: "Profile", path: "/my/profile" },
    { name: "Notifications", path: "/my/notifications" },
    // { name: "Requisition Form", path: "/my/requisitionForm" },
  ],
  user: [
    { name: "Dashboard", path: "/userDashboard" },
    { name: "Profile", path: "/me/profile" },
    { name: "Notifications", path: "/my/notifications" },
    { name: "Jobs Board", path: "/jobsBoard" },
    { name: "Track Applications", path: "/me/applications" },
    { name: "Submit Documents", path: "/me/submit-documents" }, // <-- ADDED STATICALLY
  ],
  hod: [
    { name: "Dashboard", path: "/hodDashboard" },
    { name: "Profile", path: "/my/profile" },
    { name: "Notifications", path: "/my/notifications" },
    { name: "Requisition Approvals", path: "/hod/requisitionForm" },
    { name: "Offer Approvals", path: "/offer-approvals" },
  ],
  coo: [
    { name: "Dashboard", path: "/cooDashboard" },
    { name: "Profile", path: "/my/profile" },
    { name: "Notifications", path: "/my/notifications" },
    { name: "Open Jobs", path: "/open-jobs" },
    { name: "Closed Jobs", path: "/closed-jobs" },
    { name: "Requisition Approvals", path: "/coo/requisitionForm" },
    { name: "Offer Approvals", path: "/offer-approvals" },
  ],
  hr: [
    { name: "Dashboard", path: "/superAdminDashboard" },
    { name: "Profile", path: "/my/profile" },
    { name: "Notifications", path: "/my/notifications" },
    { name: "Manage Users", path: "/users" },
    { name: "Open Jobs", path: "/open-jobs" },
    { name: "Closed Jobs", path: "/closed-jobs" },
    { name: "Requisition Approvals", path: "/superAdmin/requisitionForm" },
  ],
  interviewer: [
    { name: "Dashboard", path: "/interviewerDashboard" },
    { name: "Profile", path: "/my/profile" },
    { name: "Notifications", path: "/my/notifications" },
    // { name: "Remarks", path: "/interviewer/jobs" },
  ],
};

const icons = {
  Dashboard: <FaChartLine />,
  "Manage Users": <FaUsers />,
  Applications: <FaClipboardList />,
  "Track Applications": <SiToggltrack />,
  "Applications Tracker": <SiToggltrack />,
  "Jobs Approval": <RiPassPendingFill />,
  "Offer Approvals": <FaCheckCircle />,
  "Requisition Form": <RiPassPendingFill />,
  "Requisition Approvals": <RiPassPendingFill />,
  "Requisition Approval": <RiPassPendingFill />,
  Profile: <FaUser />,
  "Jobs Board": <FaClipboardList />,
  "My Posted Jobs": <FaClipboardList />,
  "Create Job": <IoIosCreate />,
  Notifications: <IoNotifications />,
  Remarks: <FaClipboardList />,
  "Open Jobs": <HiMiniLockOpen />,
  "Closed Jobs": <IoLockClosed />,
  "Onboarding Review": <UploadCloud />,
  "Submit Documents": <UploadCloud />, // <-- Icon for the static link
  "Smart Search": <RiUserSearchFill />
};

const Sidebar = ({ role, active, setActive, sidebarOpen, setSidebarOpen }) => {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [indicators, setIndicators] = useState({});
  
  // Removed the dynamic link state

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("loggedInUser"));
    if (user) setName(user.name);
    const onIndicator = (e) => {
      const { key } = e.detail || {};
      if (!key) return;
      setIndicators((prev) => ({ ...prev, [key]: true }));
    };
    const onClear = (e) => {
      const { key } = e.detail || {};
      if (!key) return;
      setIndicators((prev) => {
        const copy = { ...prev };
        delete copy[key];
        return copy;
      });
    };
    window.addEventListener('app:indicator', onIndicator);
    window.addEventListener('app:indicator:clear', onClear);
    return () => {
      window.removeEventListener('app:indicator', onIndicator);
      window.removeEventListener('app:indicator:clear', onClear);
    };
  }, []); 

  const handleLogout = () => {
    toast.success("Logged out successfully!", { duration: 2000 });
    localStorage.clear();
    navigate("/login");
  };

  return (
    <aside
      className={`fixed md:sticky top-0 left-0 h-screen w-64 bg-[#0b090a] text-gray-200 flex flex-col shadow-xl transition-transform duration-300 z-50 ${
        sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
      }`}
    >
      {/* === Logo Header === */}
      <div className="flex flex-col items-center p-6 justify-center border-gray-800">
        {/* <img src={logo} alt="Master Motor" className="w-40" /> */}
        <h1 className="text-[#e5383b] text-2xl md:text-3xl lg:text-3xl font-bold mb-4">
            TalentStream
        </h1>
        <div className="w-full flex items-center mt-5">
          <h1
            className={`text-xl font-bold items-center justify-center flex flex-1 text-center`}
          >
            {name}
          </h1>
        </div>
        <button
          className={`absolute top-4 font-bold right-4 md:hidden hover:bg-[#BFBFBF] hover:text-[#111] p-2 rounded-full transition`}
          onClick={() => setSidebarOpen(false)}
        >
          ✕
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto px-4 space-y-1">
        {/* Render all items statically. This is now much simpler. */}
        {sidebarItems[role].map((item) => (
          <button
            key={item.name}
            onClick={() => {
              setActive(item.name);
              navigate(item.path);
              setSidebarOpen(false);
            }}
            className={`flex items-center w-full px-3 py-2.5 rounded-md text-md font-medium transition-all duration-200 relative
              ${
                active === item.name
                  ? "text-white bg-[#1A1A1A] before:absolute before:left-0 before:top-0 before:h-full before:w-1 before:bg-[#E30613]"
                  : "text-gray-400 hover:text-white hover:bg-[#1C1C1C]"
              }`}
          >
            <span
              className={`mr-3 text-base ${
                active === item.name ? "text-[#E30613]" : "text-gray-400"
              }`}
            >
              {icons[item.name]}
            </span>
            {item.name}
            {item.name === 'Notifications' && indicators['sidebar:notifications'] && (
              <span className="absolute -top-1 -right-3 w-3 h-3 bg-red-600 rounded-full" />
            )}
          </button>
        ))}
        {/* Removed the separate dynamic link logic */}
      </nav>

      {/* === Divider Line === */}
      <div className="border-gray-800" />
      
      {/* === Logout === */}
      <div className="p-4">
        <button
          onClick={handleLogout}
          className="flex items-center justify-start w-full px-3 py-2.5 text-red-500 rounded-lg hover:bg-[#E30613]/10 transition-colors"
        >
          <FaSignOutAlt className="mr-3" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;