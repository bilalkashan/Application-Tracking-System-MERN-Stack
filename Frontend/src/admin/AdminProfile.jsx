import React, { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import api, { fileUrl } from "../api";
import { toast } from "react-hot-toast";
import { FaSpinner, FaBars } from "react-icons/fa";
import ProfileHeader from "../components/ProfileHeader";
import defaultAvatar from "../assets/MMC-Logo.png";
import { useNavigate, useLocation } from "react-router-dom"; // Import useNavigate

// ... (departmentList, designationList, locationList, InfoPill component remain the same)
// Predefined departments list
const departmentList = [
  "Other", "Administration", "Administration Bus", "After Sales Bus", "After Sales Truck",
  "Assembly Shop", "Body Shop", "Brand Management", "Chassis & Deck Assembly", "Civil Projects",
  "Compliance & Risk Management", "Customer Relationship Management", "EDD", "Finance",
  "Health, Safety & Environment", "Human Resource", "Internal Audit", "M.I.S",
  "Maintenance & Utilities", "Management Group", "Marketing & Planning", "Paint Shop", "Production",
  "Protoshop", "QAHSE", "Sales & Marketing - BUS", "Sales & Marketing - Truck", "Sales Admin",
  "Secretarial", "Spare Parts", "Warehouse",
];

// Predefined designation list
const designationList = [
  "Other", "Assistant General Manager", "Assistant Manager", "Associate Manager", "Chief Executive Officer",
  "Chief Operating Officer", "Deputy General Manager", "Deputy Manager", "Director Marketing",
  "Director Sales & Marketing", "Executive", "General Manager", "Graduate Trainee Officer",
  "Head of Department", "Junior Manager", "Junior Technical Assistant", "Management Trainee Officer",
  "Manager", "Officer", "Security Incharge", "Senior Executive", "Senior General Manager",
  "Senior Manager", "Senior Officer", "Trainee Engineer",
];

const locationList = [
  "Master House", "Korangi", "Port Qasim", "Lahore Multan Road", "Peshawar",
  "Rawalpindi", "Faisalabad", "Multan", "Islamabad", "SITE Showroom"
];

// Small presentational component used in the layout
function InfoPill({ label, value }) {
  return (
    <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-md">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-sm font-semibold text-gray-800 mt-1">{value}</p>
    </div>
  );
}


export default function AdminProfile() {
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState({ name: "", department: "", designation: "", joinedAt: "", summary: "", contactNumber: "", location: "", employeeId: "" });
  const [loading, setLoading] = useState(true); 
  const [submitLoading, setSubmitLoading] = useState(false);
  const [error, setError] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false); 
  const [active, setActive] = useState("Profile");
  const [modalOpen, setModalOpen] = useState(false);
  const user = JSON.parse(localStorage.getItem("loggedInUser"));
  const role = user?.role;
  const navigate = useNavigate(); // --- ADD THIS ---

  // ... (fetchProfile, useEffect, handleSubmit, handleFileChange, renderLoading, renderError remain the same)
  // Fetch profile
  const fetchProfile = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get("/profile/getAdminProfile");
      setProfile(res.data.profile);
      setForm({
        name: res.data.profile?.name || "",
        department: res.data.profile?.department || "",
        designation: res.data.profile?.designation || "",
        joinedAt: res.data.profile?.joinedAt ? new Date(res.data.profile.joinedAt).toISOString().slice(0, 10) : "",
        summary: res.data.profile?.summary || "",
        contactNumber: res.data.profile?.contactNumber || "",
        location: res.data.profile?.location || "",
        employeeId: res.data.profile?.employeeId || "",
      });
    } catch (err) {
      console.error("fetchProfile error:", err);
      setError("Failed to load profile. Please try again.");
      toast.error("Failed to load profile.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitLoading(true); // Use separate loading state

    try {
      const formData = new FormData();
      formData.append("name", form.name);
      formData.append("department", form.department);
      formData.append("designation", form.designation);
      formData.append("joinedAt", form.joinedAt || "");
      formData.append("summary", form.summary || "");
      formData.append("contactNumber", form.contactNumber || "");
      formData.append("location", form.location || "");
      formData.append("employeeId", form.employeeId || "");

      if (form.profilePictureFile) {
        formData.append("profilePicture", form.profilePictureFile);
      }

      const res = await api.put("/profile/update", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      toast.success("Profile updated!");
      setProfile(res.data.profile);
      // Update form state with new data, including clearing the file
      setForm({
        name: res.data.profile?.name || "",
        department: res.data.profile?.department || "",
        designation: res.data.profile?.designation || "",
        joinedAt: res.data.profile?.joinedAt ? new Date(res.data.profile.joinedAt).toISOString().slice(0, 10) : "",
        summary: res.data.profile?.summary || "",
        contactNumber: res.data.profile?.contactNumber || "",
        location: res.data.profile?.location || "",
        employeeId: res.data.profile?.employeeId || "",
        profilePictureFile: null, // Clear the file input
      });
      setModalOpen(false);
    } catch (err) {
      console.error("update error:", err);
      toast.error(err.response?.data?.message || "Update failed");
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setForm({ ...form, profilePictureFile: file });
    }
  };

  const renderLoading = () => (
    <div className="flex items-center justify-center h-[calc(100vh-200px)]">
      <FaSpinner className="animate-spin text-4xl text-gray-700" />
      <p className="ml-3 text-lg text-gray-600">Loading Profile...</p>
    </div>
  );
  
  const renderError = () => (
    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg m-6" role="alert">
      <strong className="font-bold">Error: </strong>
      <span className="block sm:inline">{error}</span>
    </div>
  );


  return (
    <div className="flex h-screen bg-[#F5F5F5]">
      <Sidebar
        role={role}
        active={active}
        setActive={setActive}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
      />

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-auto">
        <ProfileHeader
          title="My Profile"
          subtitle="Manage your personal and professional details"
          showMenuButton={true}
          onMenuClick={() => setSidebarOpen(true)}
        />

        <div className="p-4 md:p-8 max-w-5xl mx-auto w-full">
          {loading ? (
            renderLoading()
          ) : error ? (
            renderError()
          ) : (
            <div className="bg-white rounded-3xl shadow-xl p-6 md:p-8 grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
              {/* Left - Avatar */}
              <div className="flex flex-col items-center md:items-start md:col-span-1">
                <div className="relative w-36 h-36">
                  <img
                    src={profile?.profilePicture ? fileUrl(profile.profilePicture) : defaultAvatar}
                    alt="Profile"
                    className="w-36 h-36 rounded-full border-4 border-white shadow-md object-cover"
                  />
                  <div className="absolute -bottom-2 right-0 bg-white rounded-full p-1 shadow-md">
                    {/* Placeholder for status icon or similar */}
                  </div>
                </div>

                <h3 className="mt-4 text-2xl font-bold text-gray-900 text-center md:text-left">
                  {profile?.name || 'N/A'}
                </h3>
                <p className="text-sm text-gray-500">{user?.email}</p>

                {/* --- BUTTON CONTAINER UPDATED --- */}
                <div className="mt-4 w-full md:w-auto flex flex-col gap-2">
                  <button
                    onClick={() => setModalOpen(true)}
                    className="w-full md:w-auto inline-flex items-center justify-center gap-2 px-5 py-1 rounded-full bg-[#111] text-white hover:brightness-90 hover:bg-[#BFBFBF] hover:text-black shadow-sm transition-all"
                  >
                    Update Profile
                  </button>

                  <button
                    onClick={() => navigate('/my/update-password')} // --- ADD THIS ONCLICK ---
                    className="w-full md:w-auto inline-flex items-center justify-center gap-2 px-5 py-1 rounded-full bg-[#111] text-white hover:brightness-90 hover:bg-[#BFBFBF] hover:text-black shadow-sm transition-all"
                  >
                    Update Password
                  </button>
                </div>
              </div>

              {/* ... (Middle - Key Info remains the same) ... */}
              <div className="md:col-span-2 grid grid-cols-1 gap-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Department</p>
                    <p className="text-lg font-semibold text-gray-800">
                      {profile?.department || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Designation</p>
                    <p className="text-lg font-semibold text-gray-800">
                      {profile?.designation || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Joined</p>
                    <p className="text-lg font-semibold text-gray-800">
                      {profile?.joinedAt ? new Date(profile.joinedAt).toLocaleDateString() : '-'}
                    </p>
                  </div>
                </div>

                <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 shadow-md">
                  <h4 className="text-sm text-gray-600 mb-2">About</h4>
                  <p className="text-sm text-gray-700">
                    {profile?.summary || 'No profile summary provided.'}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <InfoPill label="Phone" value={profile?.contactNumber || '-'} />
                  <InfoPill label="Location" value={profile?.location || '-'} />
                  <InfoPill label="Employee ID" value={profile?.employeeId || '-'} />
                </div>
              </div>
            </div>
          )}
        </div>


      </main>

      {/* ... (Modal remains the same) ... */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl overflow-hidden relative">
            {/* Header */}
            <div className="p-5 bg-[#BFBFBF] text-black flex items-center justify-between border-b-2 border-[#1A1A1A]">
              <div className="flex items-center gap-4">
                <div className="w-1.5 h-8 rounded-full bg-[#E30613]" />
                <div>
                  <h3 className="text-xl font-semibold">Update Profile</h3>
                  <p className="text-sm opacity-90">Keep your profile up to date</p>
                </div>
              </div>
              <div>
                <button
                  onClick={() => setModalOpen(false)}
                  className="bg-transparent hover:bg-black/30 font-semibold hover:text-white rounded-full p-2 text-black transition"
                  aria-label="Close update profile"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* --- RESPONSIVE FORM --- */}
            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto" style={{ maxHeight: "calc(90vh - 100px)" }}>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left: Avatar + joined */}
                <div className="lg:col-span-1 flex flex-col items-center gap-4">
                  <div className="w-36 h-36 rounded-full overflow-hidden shadow-lg border-4 border-white">
                    <img
                      src={
                        form.profilePictureFile
                          ? URL.createObjectURL(form.profilePictureFile)
                          : profile?.profilePicture
                          ? fileUrl(profile.profilePicture)
                          : defaultAvatar
                      }
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <label className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#BFBFBF] border rounded-full shadow-md cursor-pointer text-sm">
                    <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                    <span className="text-black font-semibold ">Change photo</span>
                  </label>

                  <div className="w-full">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Joined</label>
                    <input
                      type="date"
                      value={form.joinedAt}
                      onChange={(e) => setForm({ ...form, joinedAt: e.target.value })}
                      className="border border-gray-300 p-3 w-full rounded-xl focus:ring-1 focus:ring-black"
                    />
                  </div>
                </div>

                {/* Right: Inputs */}
                <div className="lg:col-span-2 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name</label>
                      <input
                        type="text"
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        className="border border-gray-300 p-3 w-full rounded-xl focus:ring-1 focus:ring-black "
                        placeholder="Enter your name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Department</label>
                      <select
                        value={form.department}
                        onChange={(e) => setForm({ ...form, department: e.target.value })}
                        className="border border-gray-300 p-3 w-full rounded-xl focus:ring-1 focus:ring-black"
                      >
                        <option value="">Select department</option>
                        {departmentList.map((d) => (
                          <option key={d} value={d}>{d}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Designation</label>
                      <select
                        value={form.designation}
                        onChange={(e) => setForm({ ...form, designation: e.target.value })}
                        className="border border-gray-300 p-3 w-full rounded-xl focus:ring-1 focus:ring-black"
                      >
                        <option value="">Select designation</option>
                        {designationList.map((d) => (
                          <option key={d} value={d}>{d}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Phone</label>
                      <input
                        type="tel"
                        value={form.contactNumber}
                        onChange={(e) => setForm({ ...form, contactNumber: e.target.value })}
                        className="border border-gray-300 p-3 w-full rounded-xl focus:ring-1 focus:ring-black"
                        placeholder="e.g. +92 300 0000000"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Location</label>
                      <select
                        value={form.location}
                        onChange={(e) => setForm({ ...form, location: e.target.value })}
                        className="border border-gray-300 p-3 w-full rounded-xl focus:ring-1 focus:ring-black"
                      >
                        <option value="">Select Location</option>
                        {locationList.map((loc) => <option key={loc}>{loc}</option>)}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Employee ID</label>
                      <input
                        type="text"
                        value={form.employeeId}
                        onChange={(e) => setForm({ ...form, employeeId: e.target.value })}
                        className="border border-gray-300 p-3 w-full rounded-xl focus:ring-1 focus:ring-black"
                        placeholder="Employee ID"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">About</label>
                    <textarea
                      value={form.summary}
                      onChange={(e) => setForm({ ...form, summary: e.target.value })}
                      rows={4}
                      className="border border-gray-300 p-3 w-full rounded-xl focus:ring-1 focus:ring-black"
                      placeholder="Write a short bio or profile summary"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-3 mt-2">
                    <button
                      type="button"
                      onClick={() => setModalOpen(false)}
                      className="px-6 py-2 rounded-full border border-gray-200 hover:bg-gray-100 transition font-semibold"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="inline-flex items-center gap-2 px-6 py-2 rounded-full bg-[#111] text-white shadow-lg hover:opacity-95 transition font-semibold"
                      disabled={submitLoading}
                    >
                      {submitLoading ? (
                        <>
                          <FaSpinner className="animate-spin" />
                          Saving...
                        </>
                      ) : (
                        'Save Changes'
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}