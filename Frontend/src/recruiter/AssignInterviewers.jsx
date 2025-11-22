import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom"; // Added useNavigate
import { toast } from "react-hot-toast";
import api from "../api";
import Sidebar from "../components/Sidebar";
import ProfileHeader from "../components/ProfileHeader";
import { Loader2, Plus, Mail, Calendar, User, Trash2 } from "lucide-react";
import { FaSpinner, FaBars } from "react-icons/fa"; // Added FaBars
import Footer from "../components/Footer";

// --- Reusable Themed Form Components ---
const FormInput = ({ label, ...props }) => (
    <div>
        <label className="block text-xs font-medium text-gray-600 mb-1 uppercase">{label}</label>
        <input 
            {...props}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg shadow-sm bg-gray-50 focus:ring-1 focus:ring-[#111] focus:outline-none transition"
        />
    </div>
);

const FormSelect = ({ label, children, ...props }) => (
    <div>
        <label className="block text-xs font-medium text-gray-600 mb-1 uppercase">{label}</label>
        <select 
            {...props}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg shadow-sm bg-gray-50 focus:ring-1 focus:ring-[#111] focus:outline-none transition"
        >
            {children}
        </select>
    </div>
);
// --- End Form Components ---

export default function AssignInterviewers() {
  const { jobId } = useParams();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAssigning, setIsAssigning] = useState(false); // --- NEW: for button loader
  const [form, setForm] = useState({
    name: "",
    email: "",
    type: "first-interview",
    date: "",
  });
  const user = JSON.parse(localStorage.getItem("loggedInUser")) || {};
  const navigate = useNavigate(); // --- NEW: Added navigate
  const role = user?.role || "recruiter";

  // --- NEW: Sidebar State ---
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [active, setActive] = useState("My Posted Jobs");

  // Load Job + Assigned Interviewers
  useEffect(() => {
    (async () => {
      try {
        const res = await api.get(`/jobs/${jobId}/with-interviewers`);
        setJob(res.data);
      } catch (e) {
        toast.error("Failed to load job details");
      } finally {
        setLoading(false);
      }
    })();
  }, [jobId]);

  // ✅ Assign Interviewer
  const assign = async () => {
    if (!form.name || !form.email || !form.date) {
      return toast.error("Please fill out name, email, and date.");
    }
    
    setIsAssigning(true); // --- NEW
    try {
      const payload = { ...form };
      if (!payload.date) delete payload.date;

      const assignRes = await api.post(`/jobs/${jobId}/assign-interviewer`, payload);
      toast.success("Interviewer successfully assigned");

      setForm({ name: "", email: "", type: "first-interview", date: "" });
      setJob(assignRes.data.job); // Use the job from the response
    } catch (e) {
      toast.error(e.response?.data?.message || "Error assigning interviewer");
    } finally {
      setIsAssigning(false); // --- NEW
    }
  };

  // ✅ Remove Interviewer
  const removeInterviewer = async (id) => {
    try {
      await api.post(`/jobs/${jobId}/remove-interviewer`, { interviewerId: id });
      toast.success("Interviewer removed successfully");
      const res = await api.get(`/jobs/${jobId}/with-interviewers`);
      setJob(res.data);
    } catch (e) {
      toast.error(e.response?.data?.message || "Failed to remove interviewer");
    }
  };

  if (loading)
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
            title="Assign Interviewers"
            subtitle="Loading..."
          />
          <div className="flex items-center justify-center h-64">
            <FaSpinner className="animate-spin text-4xl text-gray-700" />
          </div>

        </main>
        
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
      
      <button
        className="fixed top-4 left-4 z-40 md:hidden bg-[#999DA2] text-white p-2 rounded-md shadow-md"
        onClick={() => setSidebarOpen(true)}
      >
        <FaBars />
      </button>

      <main className="flex-1 overflow-auto">
        <ProfileHeader
          title="Assign Interviewers"
          subtitle={job?.title || job?.position || ""}
        />

        <div className="p-4 md:p-6 max-w-4xl mx-auto">
          {/* --- Add Interviewer Form (Themed) --- */}
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
            <h3 className="text-xl font-semibold mb-5 text-gray-900">
              Add New Interviewer
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormInput
                label="Name"
                placeholder="Enter name"
                value={form.name}
                onChange={(e) =>
                  setForm({ ...form, name: e.target.value })
                }
                required
              />

              <FormInput
                label="Email"
                placeholder="Enter email"
                value={form.email}
                onChange={(e) =>
                  setForm({ ...form, email: e.target.value })
                }
                required
              />

              <FormSelect
                label="Interview Type"
                value={form.type}
                onChange={(e) =>
                  setForm({ ...form, type: e.target.value })
                }
                required
              >
                <option value="first-interview">First Interview</option>
                <option value="second-interview">Second Interview</option>
              </FormSelect>

              <FormInput
                label="Scheduled Date & Time"
                type="datetime-local"
                value={form.date}
                onChange={(e) =>
                  setForm({ ...form, date: e.target.value })
                }
                required
              />
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={assign}
                disabled={isAssigning}
                className="flex items-center justify-center gap-2 px-5 py-1.5 bg-[#111] text-white rounded-full shadow-md hover:bg-red-700 transition font-semibold disabled:bg-gray-400"
              >
                {isAssigning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                {isAssigning ? "Assigning..." : "Add Interviewer"}
              </button>
            </div>
          </div>

          {/* --- List of Assigned Interviewers (Themed) --- */}
          <div className="mt-8 bg-white rounded-xl shadow-lg p-6 border border-gray-100">
            <h3 className="text-xl font-semibold mb-4 text-gray-900">
              Assigned Interviewers ({job?.interviewers?.length || 0})
            </h3>

            {(!job?.interviewers || job.interviewers.length === 0) ? (
              <p className="text-gray-500 text-center py-4">
                No interviewers assigned yet.
              </p>
            ) : (
              <ul className="divide-y divide-gray-200">
                {job.interviewers.map((i) => (
                  <li
                    key={i._id}
                    className="py-4 flex flex-col md:flex-row justify-between md:items-center gap-3"
                  >
                    <div className="space-y-1">
                      <p className="font-medium text-gray-800 flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-500" /> {i.name}
                      </p>
                      <p className="text-sm text-gray-600 flex items-center gap-2">
                        <Mail className="w-4 h-4 text-gray-500" /> {i.email}
                      </p>
                      <p className="text-sm text-gray-500 flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-500" />{" "}
                        <span className="font-medium text-gray-700">{i.type.replace("-", " ")}</span>
                        <span>•</span>
                        {i.date
                          ? new Date(i.date).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })
                          : "No schedule"}
                      </p>
                    </div>
                    <button
                      onClick={() => removeInterviewer(i._id)}
                      className="flex-shrink-0 flex items-center justify-center gap-2 bg-red-100 text-red-700 px-4 py-2 rounded-full hover:bg-red-200 transition font-medium text-sm"
                    >
                      <Trash2 className="w-4 h-4" /> Remove
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <Footer />
      </main>
    </div>
  );
}