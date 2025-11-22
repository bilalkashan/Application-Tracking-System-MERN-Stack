import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Briefcase,
  MapPin,
  Clock,
  Building2,
  Info,
  Search,
  Award,
  BarChart2,
  Cpu, // <-- ADDED for Skills
} from "lucide-react";
import { FaSpinner, FaBars, FaSearch } from "react-icons/fa";
import api from "../api";
import Sidebar from "../components/Sidebar";
import ProfileHeader from "../components/ProfileHeader";
import { toast } from "react-hot-toast";
import Footer from "../components/Footer";

export default function JobsBoard() {
  const [jobs, setJobs] = useState([]);
  const [myApplications, setMyApplications] = useState([]);
  const [q, setQ] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [active, setActive] = useState("Jobs Board");
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();

  let role = "user";
  try {
    const stored = localStorage.getItem("loggedInUser");
    if (stored) {
      const user = JSON.parse(stored);
      role = user?.role || "user";
    }
  } catch (err) {
    console.error("Error parsing loggedInUser:", err);
  }

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [jobsRes, appsRes] = await Promise.all([
          api.get("/auth/public"),
          api.get("/auth/myApplications"),
        ]);

        setJobs(jobsRes.data || []);
        setMyApplications(appsRes.data || []);
      } catch (err) {
        console.error(err);
        toast.error(err.response?.data?.message || err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const appliedJobIds = useMemo(() => {
    return new Set(myApplications.map((app) => app.job?._id));
  }, [myApplications]);

  const filtered = useMemo(() => {
    return jobs
      .filter((j) => !appliedJobIds.has(j._id))
      .filter((j) =>
        (j.title + (j.department || "") + (j.location || ""))
          .toLowerCase()
          .includes(q.toLowerCase())
      );
  }, [jobs, appliedJobIds, q]);

  const truncateWords = (text, wordLimit) => {
    if (!text) return "";
    const words = text.split(" ");
    return words.length > wordLimit
      ? words.slice(0, wordLimit).join(" ") + "..."
      : text;
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar
        role={role}
        active={active}
        setActive={setActive}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
      />

      <main className="flex-1 overflow-y-auto">
        <ProfileHeader
          title="Jobs Board"
          subtitle="Find the opportunity that fits your passion and skills."
          showMenuButton={true}
          onMenuClick={() => setSidebarOpen(true)}
        />

        <div className="p-4 md:p-6 max-w-7xl mx-auto">
          <div className="bg-white rounded-xl shadow-lg p-5 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Open Positions
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                  Showing {filtered.length} available jobs.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="relative">
                  <input
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="Search by title, department, or location"
                    className="pl-10 pr-4 py-2 rounded-full border border-gray-300 bg-gray-50 text-sm w-full md:w-72 focus:outline-none focus:ring-1 focus:ring-[#111]"
                  />
                  <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                </div>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center items-center h-64 text-gray-600">
              <FaSpinner className="animate-spin text-4xl text-gray-700" />
              <p className="ml-3 text-lg">Loading jobs...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-10 text-center bg-white rounded-xl shadow-lg text-gray-500">
              <h3 className="text-xl font-semibold text-gray-800">
                No New Jobs Found
              </h3>
              <p className="mt-2">
                It looks like you've already applied for all available positions
                that match your search.
              </p>
            </div>
          ) : (
            <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
              {filtered.map((j) => (
                <div
                  key={j._id}
                  className="bg-white rounded-xl shadow-lg hover:shadow-xl transition transform hover:-translate-y-1 overflow-hidden flex flex-col justify-between border-t-4 border-[#E30613]"
                >
                  <div className="p-6">
                    <h3 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                      <Briefcase className="w-5 h-5 text-[#e5383b]" />
                      {j.title}
                    </h3>

                    <p className="text-sm text-gray-500 mt-1 flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-gray-400" />
                      {j.department} • {j.designation}
                    </p>

                    <div className="flex flex-wrap gap-2 mt-4 text-xs text-gray-600">
                      <span className="flex items-center gap-1.5 bg-gray-100 text-gray-700 px-3 py-1 rounded-full font-medium">
                        <MapPin className="w-3.5 h-3.5" />
                        {j.location}
                      </span>
                      <span className="flex items-center gap-1.5 bg-gray-100 text-gray-700 px-3 py-1 rounded-full font-medium">
                        {j.type}
                      </span>
                      <span className="flex items-center gap-1.5 bg-gray-100 text-gray-700 px-3 py-1 rounded-full font-medium">
                        <Clock className="w-3.5 h-3.5" />
                        Apply before{" "}
                        {new Date(j.deadline).toLocaleDateString("en-GB")}
                      </span>
                    </div>

                    <div className="mt-4 space-y-2">
                      <p className="text-sm text-gray-500 flex items-center gap-2">
                        <BarChart2 className="w-4 h-4 text-gray-400" />
                        <strong>Experience:</strong> {j.experienceRequired}
                      </p>
                      <p className="text-sm text-gray-500 flex items-center gap-2">
                        <Award className="w-4 h-4 text-gray-400" />
                        <strong>Qualification:</strong> {j.qualificationRequired}
                      </p>
                    </div>

                    {/* === NEW SKILLS SECTION START === */}
                    {j.requisition &&
                      (j.requisition.technicalSkills?.length > 0 ||
                        j.requisition.softSkills?.length > 0) && (
                        <div className="mt-4">
                          <h4 className="text-sm text-gray-500 flex items-center gap-2 font-medium mb-2">
                            <Cpu className="w-4 h-4 text-gray-400" />
                            <strong>Skills Required</strong>
                          </h4>
                          <div className="flex flex-wrap gap-1.5">
                            {j.requisition.technicalSkills?.map((skill) => (
                              <span
                                key={skill}
                                className="text-xs bg-blue-100 text-blue-800 px-2.5 py-0.5 rounded-full font-medium"
                              >
                                {skill}
                              </span>
                            ))}
                            {j.requisition.softSkills?.map((skill) => (
                              <span
                                key={skill}
                                className="text-xs bg-gray-100 text-gray-800 px-2.5 py-0.5 rounded-full font-medium"
                              >
                                {skill}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    {/* === NEW SKILLS SECTION END === */}

                    <p className="mt-4 text-sm text-gray-600 line-clamp-3">
                      {j.description}
                    </p>

                    {j.comments && (
                      <p className="mt-2 text-sm text-gray-500 italic">
                        • {truncateWords(j.comments, 15)}
                      </p>
                    )}
                  </div>

                  <div className="flex gap-3 mt-4 p-6 bg-gray-50 border-t border-gray-100">
                    <button
                      onClick={() =>
                        navigate(`/user/job-info/${j._id}`, {
                          state: { job: j },
                        })
                      }
                      className="flex-1 px-4 py-2.5 bg-[#111111] text-white hover:bg-[#6B6F73] text-sm font-semibold rounded-full shadow-md transition flex items-center justify-center gap-2"
                    >
                      <Info className="w-4 h-4" />
                      Job Info
                    </button>
                    <button
                      onClick={() => navigate(`/jobs/${j._id}/apply`)}
                      className="flex-1 px-4 py-2.5 bg-[#e5383b] text-white hover:bg-red-700 text-sm font-semibold rounded-full shadow-md transition flex items-center justify-center gap-2"
                    >
                      Apply Now
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <Footer />
      </main>
    </div>
  );
}