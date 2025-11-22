import { useEffect, useState, useMemo, useRef } from "react"; // Added useMemo and useRef
import { useParams, useNavigate } from "react-router-dom";
import api, { fileUrl } from "../api"; // Assuming fileUrl is in api
import { toast } from "react-hot-toast"; // Assuming react-hot-toast
import Sidebar from "../components/Sidebar";
import ProfileHeader from "../components/ProfileHeader";
import {
  User,
  Briefcase,
  GraduationCap,
  Award,
  Settings,
  Star,
  UploadCloud,
  Loader2, // Added for loading state
} from "lucide-react";

export default function ApplyJob() {
  const navigate = useNavigate();
  const { jobId } = useParams();
  const [job, setJob] = useState(null);
  const [file, setFile] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [active, setActive] = useState("Jobs Board");
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false); // Added for submit button
  const [source, setSource] = useState("");

  // --- NEW: State for profile completeness ---
  const [profilePercentage, setProfilePercentage] = useState(0);

  const user = JSON.parse(localStorage.getItem("loggedInUser"));
  const role = user?.role || "user";

  // Fetch Job Details
  useEffect(() => {
    (async () => {
      try {
        const res = await api.get(`/auth/allJobs/${jobId}`);
        setJob(res.data);
      } catch (err) {
        toast.error(err.response?.data?.message || err.message);
      }
    })();
  }, [jobId]);

  // Fetch Profile
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const res = await api.get("/profile/getProfile");
        const profileData = res.data.profile || {};
        const steps = res.data.steps || [];
        const completedSteps = res.data.completedSteps || [];

        setProfile(profileData);

        // Compute completion percentage the same way as ViewProfile
        const percentage = steps.length
          ? Math.round((completedSteps.length / steps.length) * 100)
          : res.data.completenessPercentage || 0;

        setProfilePercentage(percentage);

        // Cache user profile for the profile editor (same as ViewProfile)
        try {
          localStorage.setItem(
            "userProfile",
            JSON.stringify({ profile: profileData, steps, completedSteps })
          );
        } catch (e) {
          // ignore localStorage errors
        }
      } catch (err) {
        console.error("Failed to load profile:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Submit Application
  const submit = async (e) => {
    e.preventDefault();
    
    // --- NEW: Profile Completeness Check ---
    if (profilePercentage < 85) {
      toast.error("Your profile must be at least 85% complete to apply. Please update your profile.");
      return; // Stop the submission
    }
    // --- END CHECK ---

    if (!file) return toast.error("Please choose a resume file");

    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) return toast.error("File too large. Max 5MB.");

    if (!source) return toast.error("Please select a source");

    const fd = new FormData();
    fd.append("resume", file);
    fd.append("source", source);

    setSubmitLoading(true); // Use separate loading state
    try {
      await api.post(`/auth/job/${jobId}/applyToJob`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.success("Application submitted!");
      setTimeout(() => {
        setFile(null);
        navigate("/me/applications");
      }, 1200);
    } catch (e) {
      toast.error(e.response?.data?.message || e.message);
    } finally {
      setSubmitLoading(false); // Use separate loading state
    }
  };

  const education = profile?.education || [];
  const experienceDetails = profile?.experienceDetails || [];
  const technicalSkills = profile?.technicalSkills || [];
  const digitalSkills = profile?.digitalSkills || [];
  const languages = profile?.languages || [];
  const softSkills = profile?.softSkills || [];
  const achievements = profile?.achievements || [];
  const majorProjects = profile?.majorProjects || [];
  const leadershipRoles = profile?.leadershipRoles || [];

  // Helper function to get image URL
  const getProfileImageUrl = () => {
    if (profile?.profilePicture) {
      // Use fileUrl (assuming it's correctly imported from your api.js)
      return fileUrl(profile.profilePicture);
    }
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(
      profile?.name || "User"
    )}&background=random&color=fff`;
  };

  return (
    <div className="flex h-screen bg-[#F5F5F5]">
      <Sidebar
        role={role}
        active={active}
        setActive={setActive}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
      />

      {/* Main Section */}
      <main className="flex-1 flex flex-col overflow-auto">
        <ProfileHeader
          title="Apply for Job"
          subtitle={`Submit your resume for ${job?.title || "the selected position"}`}
          showMenuButton={true} // For mobile
          onMenuClick={() => setSidebarOpen(true)} // For mobile
        />

        <div className="p-4 md:p-8 max-w-7xl mx-auto w-full">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-6">
            Applying for: {job?.title || "Loading..."} Position
          </h1>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* LEFT - Profile Summary */}
            <aside className="md:col-span-1">
              <div className="bg-white rounded-2xl shadow-lg p-6 text-center hover:shadow-xl transition">
                <div className="w-32 h-32 mx-auto rounded-full overflow-hidden border-4 border-[#BFBFBF]">
                  <img
                    src={getProfileImageUrl()}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                </div>

                <h2 className="text-lg font-semibold text-gray-900 mt-4">
                  {profile?.name || "Your Name"}
                </h2>
                <p className="text-sm text-gray-500">
                  {profile?.designation || "Applicant"}
                </p>
                
                {/* --- Profile Completion Progress Bar --- */}
                <div className="w-full bg-gray-200 rounded-full h-2.5 my-4">
                  <div
                    className="bg-[#111] h-2.5 rounded-full"
                    style={{ width: `${profilePercentage}%` }}
                  ></div>
                </div>
                <p className="text-sm font-semibold text-[#111]">
                  {profilePercentage}% Complete
                </p>

                <button
                  onClick={() => {
                    const cached = localStorage.getItem("userProfile");
                    const state = cached ? JSON.parse(cached) : {};
                    navigate("/profile/stepper", { state });
                  }}
                  className="w-full mt-4 px-4 py-2 bg-[#BFBFBF] text-[#161a1d] hover:bg-[#e5383b] hover:text-[#F5F5F5] rounded-full font-medium transition"
                >
                  Edit Profile
                </button>

                <div className="text-sm text-gray-600 mt-4 text-left space-y-1">
                  <p>
                    <b>Contact:</b> {profile?.contactNumber || "—"}
                  </p>
                  <p>
                    <b>Email:</b> {profile?.email || "—"}
                  </p>
                  <p>
                    <b>User ID:</b> {profile?.userId || "—"}
                  </p>
                </div>
              </div>
            </aside>

            {/* RIGHT - Job Apply Section */}
            <section className="md:col-span-2">
              <div className="bg-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition mb-8">
                <p className="text-sm text-gray-600">
                  • {job?.department || "Department"} •{" "}
                  {job?.location || "Location"}
                </p>

                <div className="mt-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800">
                      Upload Resume
                    </h3>
                    <p className="text-sm text-gray-500">
                      Please attach your latest resume (PDF, DOC, or DOCX)
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-2 px-4 py-2 bg-indigo-50 border border-indigo-200 rounded-md cursor-pointer hover:bg-indigo-100 transition">
                      <UploadCloud className="w-5 h-5" />
                      <span className="text-sm font-medium">Choose File</span>
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx"
                        className="hidden"
                        onChange={(e) => {
                          const f = e.target.files?.[0] || null;
                          if (f && f.size > 5 * 1024 * 1024)
                            return toast.error("File too large. Max 5MB.");
                          setFile(f);
                        }}
                      />
                    </label>
                    <div className="text-sm text-gray-700 truncate max-w-[200px]">
                      {file ? (
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{file.name}</span>
                          <button
                            onClick={() => setFile(null)}
                            className="text-xs text-red-500"
                          >
                            Remove
                          </button>
                        </div>
                      ) : (
                        <span className="italic text-gray-500">
                          No file selected
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <select
                    value={source} // Bind the value
                    onChange={(e) => setSource(e.target.value)}
                    className="border border-gray-300 rounded-full p-2 mr-4 focus:outline-none focus:ring-1 focus:ring-[#111] w-full sm:w-auto"
                  >
                    <option value="">Where did you hear about us?</option>
                    <option value="LinkedIn">LinkedIn</option>
                    <option value="Job Portal">Job Portal</option>
                    <option value="Referral">Referral</option>
                    <option value="Walk-in">Walk-in</option>
                    <option value="Other">Other</option>
                  </select>
                  <button
                    onClick={submit}
                    disabled={submitLoading || loading}
                    className="w-full mt-4 sm:mt-0 sm:w-auto px-6 py-2 hover:bg-[#BFBFBF] hover:text-[#161a1d] bg-[#e5383b] text-[#F5F5F5] font-medium rounded-full shadow-md hover:shadow-lg transition disabled:opacity-60 flex items-center justify-center gap-2"
                  >
                    {submitLoading ? (
                      <Loader2 className="animate-spin" size={20} />
                    ) : (
                      "Submit Application"
                    )}
                  </button>
                </div>
              </div>

              {/* Profile Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <ProfileCard title="Personal Info" icon={<User />}>
                  <InfoList
                    data={{
                      Name: profile?.name,
                      "Father's Name": profile?.fathersName,
                      Gender: profile?.gender,
                      "Date of Birth": profile?.dob ? new Date(profile.dob).toLocaleDateString() : "-",
                      Nationality: profile?.nationality,
                      CNIC: profile?.cnicNumber,
                      Contact: profile?.contactNumber,
                      Address: profile?.currentAddress,
                    }}
                  />
                </ProfileCard>

                <ProfileCard title="Internal Applicant" icon={<Settings />}>
                  <InfoList
                    data={{
                      "Employee ID": profile?.employeeId,
                      Designation: profile?.designation,
                      Department: profile?.department,
                      Location: profile?.location,
                      "Date of Joining": profile?.dateOfJoining ? new Date(profile.dateOfJoining).toLocaleDateString() : "-",
                    }}
                  />
                </ProfileCard>
              </div>
            </section>
          </div>

          {/* Experience */}
          <ProfileCard title="Experience" icon={<Briefcase />} full>
            {experienceDetails.length ? (
              <Timeline data={experienceDetails} type="experience" />
            ) : (
              <p className="text-gray-500">No experience data available</p>
            )}
          </ProfileCard>

          {/* Education */}
          <ProfileCard title="Education" icon={<GraduationCap />} full>
            {education.length ? (
              <Timeline data={education} type="education" />
            ) : (
              <p className="text-gray-500">No education data available</p>
            )}
          </ProfileCard>

          {/* Skills & Achievements */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
            <ProfileCard title="Skills" icon={<Star />}>
              <p>
                <b>Technical:</b> {technicalSkills.join(", ") || "-"}
              </p>
              <p>
                <b>Digital:</b> {digitalSkills.join(", ") || "-"}
              </p>
              <p>
                <b>Languages:</b> {languages.join(", ") || "-"}
              </p>
              <p>
                <b>Soft Skills:</b> {softSkills.join(", ") || "-"}
              </p>
            </ProfileCard>

            <ProfileCard title="Achievements" icon={<Award />}>
              <p>
                <b>Achievements:</b> {achievements.join(", ") || "-"}
              </p>
              <p>
                <b>Projects:</b> {majorProjects.join(", ") || "-"}
              </p>
              <p>
                <b>Leadership:</b> {leadershipRoles.join(", ") || "-"}
              </p>
            </ProfileCard>
          </div>
        </div>
      </main>
    </div>
  );
}

// Reusable Components
const ProfileCard = ({ title, icon, children, full }) => (
  <section
    className={`bg-white rounded-2xl shadow-md hover:shadow-xl transition p-6 ${
      full ? "col-span-1 md:col-span-2 mt-8" : ""
    }`}
  >
    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-[#e5383b]">
      {icon}
      {title}
    </h3>
    <div className="text-sm text-gray-700 space-y-2">{children}</div>
  </section>
);

const InfoList = ({ data }) => (
  <ul className="space-y-1 text-sm text-gray-700">
    {Object.entries(data).map(([k, v]) => (
      <li key={k}>
        <span className="font-medium text-gray-800">{k}:</span> {v || "-"}
      </li>
    ))}
  </ul>
);

const Timeline = ({ data, type }) => (
  <div className="relative border-l-2 border-indigo-200 ml-2">
    {data.map((item, i) => (
      <div key={i} className="mb-4 ml-4 relative">
        <span className="absolute -left-3 top-2 w-5 h-5 bg-indigo-500 rounded-full"></span>
        <div className="bg-gray-50 p-4 rounded-xl shadow-sm">
          {type === "experience" ? (
            <>
              <h4 className="font-semibold text-gray-800">
                {item.jobTitle || "-"}
              </h4>
              <p className="text-sm text-gray-600">{item.organization}</p>
              <p className="text-sm">
                <b>From:</b> {item.from ? new Date(item.from).toLocaleDateString() : "-"} | <b>To:</b> {item.to ? new Date(item.to).toLocaleDateString() : "-"}
              </p>
              <p className="text-sm">{item.responsibilities || "-"}</p>
            </>
          ) : (
            <>
              <h4 className="font-semibold text-gray-800">
                {item.highestQualification || "-"}
              </h4>
              <p className="text-sm text-gray-600">{item.institution}</p>
              <p className="text-sm">
                <b>Major:</b> {item.major || "-"} | <b>Year:</b>{" "}
                {item.graduationYear || "-"}
              </p>
              <p className="text-sm">
                <b>CGPA:</b> {item.cgpa || "-"}
              </p>
            </>
          )}
        </div>
      </div>
    ))}
  </div>
);