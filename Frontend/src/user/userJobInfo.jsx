import { useEffect, useState } from "react";
import { useParams, useLocation } from "react-router-dom";
import api from "../api";
import Sidebar from "../components/Sidebar";
import ProfileHeader from "../components/ProfileHeader";
import {
  Briefcase,
  MapPin,
  Calendar,
  Building2,
  UserCheck,
  FileText,
  ClipboardList,
  Award, // <-- ADDED
  BarChart2, // <-- ADDED
  Cpu, // <-- ADDED
} from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function UserJobInfo() {
  const { jobId } = useParams();
  const location = useLocation();
  const initialState = location.state || {};
  const [job, setJob] = useState(initialState.job || null);
  const [loading, setLoading] = useState(!initialState.job);
  const navigate = useNavigate();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [active, setActive] = useState("Jobs Board");

  const user = JSON.parse(localStorage.getItem("loggedInUser"));
  const role = user?.role || "user";

  useEffect(() => {
    const hydrated = Boolean(initialState.job);
    (async () => {
      try {
        if (!hydrated) setLoading(true);
        // This endpoint already populates the full requisition
        const res = await api.get(`/auth/allJobs`);
        const found = (res.data?.jobs || []).find((j) => j._id === jobId);
        setJob(found || null);
      } catch (e) {
        alert(e.response?.data?.message || e.message);
      } finally {
        if (!hydrated) setLoading(false);
      }
    })();
  }, [jobId]);

  if (loading) return <p className="p-6 text-gray-600">Loading job info...</p>;
  if (!job) return <p className="p-6 text-red-500">Job info not found</p>;

  return (
    <div className="flex h-screen bg-[#F5F5F5]">
      <Sidebar
        role={role}
        active={active}
        setActive={setActive}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
      />

      <main className="flex-1 flex flex-col">
        <ProfileHeader
          title="Job Info"
          subtitle={
            job ? `Details for ${job.title}` : "Job details and application info"
          }
        />
        <div className="p-8 flex-1 overflow-auto max-w-5xl mx-auto w-full">
          <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
            <div className="md:flex md:items-center md:justify-between border-b pb-6 mb-6 gap-6">
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 rounded-lg bg-indigo-50 flex items-center justify-center text-black-600">
                  <Briefcase className="w-6 h-6" />
                </div>
                <div>
                  <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900">
                    {job.title}
                  </h1>
                  <div className="mt-1 text-sm text-gray-500 flex items-center gap-3">
                    <span className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-gray-400" />{" "}
                      {job.department}
                    </span>
                    <span className="hidden md:inline">•</span>
                    <span className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-gray-400" />{" "}
                      {job.location}
                    </span>
                    <span className="hidden md:inline">•</span>
                    <span className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-400" />{" "}
                      {new Date(job.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-4 md:mt-0 flex items-center gap-3">
                <button
                  onClick={() => navigate(`/jobs/${job._id}/apply`)}
                  className="px-5 py-2 rounded-full font-semibold shadow hover:bg-[#BFBFBF] shadow-md hover:text-[#161a1d] bg-[#e5383b] text-[#F5F5F5] transition"
                >
                  Apply Now
                </button>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mb-6">
              <span className="px-3 py-1 bg-green-50 text-green-700 rounded-full text-sm font-medium">
                {job.type || "Full time"}
              </span>
              {job.deadline && (
                <span className="px-3 py-1 bg-yellow-50 text-yellow-800 rounded-full text-sm font-medium">
                  Apply before {new Date(job.deadline).toLocaleDateString()}
                </span>
              )}
              <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                Job ID: {job.jobId || "N/A"}
              </span>
            </div>

            <div className="md:grid md:grid-cols-3 md:gap-6">
              <div className="md:col-span-2">
                <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-black-600" /> Job
                  Description
                </h3>
                <div className="prose max-w-none text-gray-700 mb-6">
                  <p>{job.description}</p>
                </div>

                {/* === NEW SKILLS SECTION START === */}
                {job.requisition &&
                  (job.requisition.technicalSkills?.length > 0 ||
                    job.requisition.softSkills?.length > 0) && (
                    <div className="mt-6 mb-6">
                      <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                        <Cpu className="w-5 h-5 text-black-600" /> Skills
                        Required
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {job.requisition.technicalSkills?.map((skill) => (
                          <span
                            key={skill}
                            className="text-sm bg-blue-100 text-blue-800 px-3 py-1 rounded-full font-medium"
                          >
                            {skill}
                          </span>
                        ))}
                        {job.requisition.softSkills?.map((skill) => (
                          <span
                            key={skill}
                            className="text-sm bg-gray-100 text-gray-800 px-3 py-1 rounded-full font-medium"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                {/* === NEW SKILLS SECTION END === */}

                {job.comments && (
                  <div className="mt-4">
                    <h4 className="text-md font-semibold text-gray-800 mb-2">
                      Additional Comments
                    </h4>
                    <div className="p-4 rounded-lg bg-gray-50 border border-gray-100 text-gray-700 italic">
                      {job.comments}
                    </div>
                  </div>
                )}
              </div>

              <aside className="mt-6 md:mt-0">
                <div className="bg-white border rounded-xl p-4 shadow-sm">
                  <h4 className="text-sm font-medium text-gray-800 mb-2">
                    Quick Info
                  </h4>
                  <ul className="text-sm text-gray-600 space-y-2">
                    <li className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-black-400" />{" "}
                      <span className="font-medium text-gray-800">
                        Department:
                      </span>{" "}
                      <span className="ml-auto">{job.department}</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <UserCheck className="w-4 h-4 text-black-400" />{" "}
                      <span className="font-medium text-gray-800">
                        Designation:
                      </span>{" "}
                      <span className="ml-auto">{job.designation}</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-black-400" />{" "}
                      <span className="font-medium text-gray-800">
                        Location:
                      </span>{" "}
                      <span className="ml-auto">{job.location}</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <ClipboardList className="w-4 h-4 text-black-400" />{" "}
                      <span className="font-medium text-gray-800">Type:</span>{" "}
                      <span className="ml-auto">{job.type}</span>
                    </li>
                    {job.deadline && (
                      <li className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-black-400" />{" "}
                        <span className="font-medium text-gray-800">
                          Deadline:
                        </span>{" "}
                        <span className="ml-auto">
                          {new Date(job.deadline).toLocaleDateString()}
                        </span>
                      </li>
                    )}
                    {/* === NEWLY ADDED FIELDS START === */}
                    <li className="flex items-start gap-2 pt-2 border-t mt-2">
                      <BarChart2 className="w-4 h-4 text-black-400 mt-0.5" />{" "}
                      <span className="font-medium text-gray-800">
                        Experience:
                      </span>{" "}
                      <span className="ml-auto text-right">
                        {job.experienceRequired}
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Award className="w-4 h-4 text-black-400 mt-0.5" />{" "}
                      <span className="font-medium text-gray-800">
                        Qualification:
                      </span>{" "}
                      <span className="ml-auto text-right">
                        {job.qualificationRequired}
                      </span>
                    </li>
                    {/* === NEWLY ADDED FIELDS END === */}
                  </ul>
                </div>
              </aside>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}