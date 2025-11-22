import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import {
  User,
  Briefcase,
  GraduationCap,
  Award,
  Settings,
  Star,
  Download,
  Edit,
  Lock
} from "lucide-react";
import { FaBars, FaSpinner } from "react-icons/fa";
import api, { fileUrl } from "../../api"; // Import fileUrl
import Sidebar from "../../components/Sidebar";
import ProfileHeader from "../../components/ProfileHeader";
import { toast } from "react-hot-toast"; // Added toast
import Footer from "../../components/Footer";

// --- CONFIG & HELPERS ---
const COLORS = ["#111111", "#e5e7eb"]; // Brand dark for done, gray for pending

// --- THIS IS THE FIX ---
const formatDate = (dateString, options = {}) => {
  if (!dateString) return "N/A";
  const defaultOptions = {
    year: "numeric",
    month: "short",
    day: "numeric",
  };
  return new Date(dateString).toLocaleDateString("en-US", { ...defaultOptions, ...options });
};
// --- END FIX ---

// --- Reusable Card Components (Moved outside) ---
const ProfileCard = ({ title, icon, children, full }) => (
  <section
    className={`bg-white rounded-xl shadow-lg p-6 ${
      full ? "col-span-1 md:col-span-2" : ""
    }`}
  >
    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-gray-800">
      {icon}
      {title}
    </h3>
    <div className="text-sm text-gray-700 space-y-3">{children}</div>
  </section>
);

const InfoList = ({ data }) => (
  <ul className="space-y-2 text-sm text-gray-700">
    {Object.entries(data).map(([k, v]) => (
      <li key={k} className="flex justify-between">
        <span className="font-medium text-gray-500">{k}:</span>
        <span className="text-gray-900 font-medium text-right">{v || "-"}</span>
      </li>
    ))}
  </ul>
);

// --- NEW: Reusable Timeline Component ---
const TimelineItem = ({ title, subtitle, date, description, isLast }) => (
  <div className="relative pb-8">
    {!isLast && (
      <span className="absolute top-1 left-[11px] w-0.5 h-full bg-gray-200" aria-hidden="true" />
    )}
    <div className="relative flex items-start space-x-4">
      <div>
        <span className="h-6 w-6 rounded-full bg-[#111111] flex items-center justify-center ring-8 ring-white">
          <Briefcase className="h-3 w-3 text-white" />
        </span>
      </div>
      <div className="min-w-0 flex-1">
        <h4 className="font-semibold text-gray-800">{title || "-"}</h4>
        <p className="text-sm text-gray-600">{subtitle || "-"}</p>
        <p className="text-sm text-gray-500">{date || "-"}</p>
        <p className="text-sm text-gray-700 mt-2">{description || "-"}</p>
      </div>
    </div>
  </div>
);

const EducationTimelineItem = ({ title, subtitle, date, description, isLast }) => (
  <div className="relative pb-8">
    {!isLast && (
      <span className="absolute top-1 left-[11px] w-0.5 h-full bg-gray-200" aria-hidden="true" />
    )}
    <div className="relative flex items-start space-x-4">
      <div>
        <span className="h-6 w-6 rounded-full bg-[#6B6F73] flex items-center justify-center ring-8 ring-white">
          <GraduationCap className="h-3 w-3 text-white" />
        </span>
      </div>
      <div className="min-w-0 flex-1">
        <h4 className="font-semibold text-gray-800">{title || "-"}</h4>
        <p className="text-sm text-gray-600">{subtitle || "-"}</p>
        <p className="text-sm text-gray-500">{date || "-"}</p>
        <p className="text-sm text-gray-700 mt-2">{description || "-"}</p>
      </div>
    </div>
  </div>
);

// --- NEW: Reusable Skill Tag Component ---
const SkillTag = ({ children }) => (
  <span className="inline-block bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-xs font-medium">
    {children}
  </span>
);


export default function ViewProfile() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [steps, setSteps] = useState([]);
  const [completedSteps, setCompletedSteps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [active, setActive] = useState("Profile");

  let role = "user";
  try {
    const storedUser = localStorage.getItem("loggedInUser");
    if (storedUser) {
      const parsed = JSON.parse(storedUser);
      role = parsed?.role || "user";
    }
  } catch (err) {
    console.error("Error parsing loggedInUser:", err);
  }

  useEffect(() => {
    const loadProfile = async () => {
      setLoading(true);
      try {
        const res = await api.get("/profile/getProfile");
        const data = {
          profile: res.data.profile || {},
          steps: res.data.steps || [],
          completedSteps: res.data.completedSteps || [],
        };

        setProfile(data.profile);
        setSteps(data.steps);
        setCompletedSteps(data.completedSteps);
        localStorage.setItem("userProfile", JSON.stringify(data));
      } catch (err) {
        console.error("Failed to load profile:", err);
        toast.error("Failed to load profile.");
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, []);

  // --- Profile Data Memos ---
  const {
    education = [],
    experienceDetails = [],
    technicalSkills = [],
    digitalSkills = [],
    languages = [],
    softSkills = [],
    achievements = [],
    majorProjects = [],
    leadershipRoles = [],
  } = profile || {};

  const progress = useMemo(() => (
    steps.length ? Math.round((completedSteps.length / steps.length) * 100) : 0
  ), [steps, completedSteps]);

  const progressData = useMemo(() => [
    { name: "Completed", value: completedSteps.length || 0 },
    { name: "Remaining", value: (steps.length - completedSteps.length) || 1 },
  ], [steps, completedSteps]);


  if (loading) {
    return (
      <div className="flex h-screen bg-gray-100">
         <Sidebar
            role={role}
            active={active}
            setActive={setActive}
            sidebarOpen={sidebarOpen}
            setSidebarOpen={setSidebarOpen}
          />
        <div className="flex-1 flex items-center justify-center text-gray-600">
          <FaSpinner className="animate-spin text-4xl text-gray-700" />
          <span className="ml-3 text-lg">Loading profile...</span>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex h-screen bg-gray-100">
        <Sidebar
            role={role}
            active={active}
            setActive={setActive}
            sidebarOpen={sidebarOpen}
            setSidebarOpen={setSidebarOpen}
          />
        <div className="flex-1 flex items-center justify-center text-gray-600">
          No profile found. Please create one.
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar
        role={role}
        active={active}
        setActive={setActive}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
      />

      <div className="flex-1 overflow-y-auto">
        <ProfileHeader
          title="My Profile"
          subtitle="Manage your personal and professional details"
          showMenuButton={true} // --- HAMBURGER FIX ---
          onMenuClick={() => setSidebarOpen(true)} // --- HAMBURGER FIX ---
        />

        <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
          
          {/* <div className="bg-white rounded-xl shadow-lg px-6 py-5 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <img
                src={
                  profile?.profilePicture
                    ? fileUrl(profile.profilePicture)
                    : `https://ui-avatars.com/api/?name=${encodeURIComponent(
                        profile?.name || "U"
                      )}&background=random&color=fff`
                }
                alt="avatar"
                className="w-24 h-24 rounded-full border-4 border-gray-200 shadow-md object-cover"
              />
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  {profile?.name || "Your Name"}
                </h1>
                <p className="text-gray-500">
                  User ID: {profile?.userId || "N/A"}
                </p>
                <p className="text-gray-500">
                  {profile?.designation || "No designation set"}
                </p>
              </div>
            </div>

            <div className="flex flex-col-1 items-center gap-4 flex-wrap justify-center md:justify-end">
              <div className="flex items-center">
                <div className="w-20 h-20 relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={progressData}
                        cx="50%"
                        cy="50%"
                        innerRadius={25}
                        outerRadius={35}
                        paddingAngle={3}
                        dataKey="value"
                        startAngle={90}
                        endAngle={450}
                      >
                        {progressData.map((entry, index) => (
                          <Cell key={index} fill={COLORS[index]} stroke={COLORS[index]} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-lg font-bold text-red-500">
                    {progress}%
                  </span>
                </div>
                <span className="text-sm font-medium text-red-500">
                  Profile Complete
                </span>
              </div>

              <button
                onClick={() => navigate("/profile/stepper", { state: { profile, steps, completedSteps } })}
                className="flex items-center justify-center gap-2 px-5 py-1.5 bg-[#111111] text-white rounded-full shadow-lg hover:bg-[#6B6F73] transition-all transform hover:-translate-y-0.5"
              >
                <Edit size={16} /> Update Profile
              </button>

              {profile?.resume && (
                <button
                  onClick={() => window.open(fileUrl(profile.resume), "_blank")}
                  className="flex items-center justify-center gap-2 px-5 py-1.5 bg-[#6B6F73] text-white rounded-full shadow-lg hover:bg-[#111111] transition-all transform hover:-translate-y-0.5"
                >
                  <Download size={16} /> View Resume
                </button>
              )}
            </div>
          </div> */}

          <div className="bg-white rounded-xl shadow-lg px-6 py-5 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <img
                src={
                  profile?.profilePicture
                    ? fileUrl(profile.profilePicture)
                    : `https://ui-avatars.com/api/?name=${encodeURIComponent(
                        profile?.name || "U"
                      )}&background=random&color=fff`
                }
                alt="avatar"
                className="w-24 h-24 rounded-full border-4 border-gray-200 shadow-md object-cover"
              />
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  {profile?.name || "Your Name"}
                </h1>
                <p className="text-gray-500">
                  User ID: {profile?.userId || "N/A"}
                </p>
                <p className="text-gray-500">
                  {profile?.designation || "No designation set"}
                </p>
              </div>
            </div>

            {/* --- UPDATED THIS SECTION --- */}
            <div className="flex flex-row items-center gap-4 flex-wrap justify-center md:justify-end">
              
              {/* --- FIX: "Profile Complete" is now below the chart --- */}
              <div className="flex flex-col items-center">
                <div className="w-20 h-20 relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={progressData}
                        cx="50%"
                        cy="50%"
                        innerRadius={25}
                        outerRadius={35}
                        paddingAngle={3}
                        dataKey="value"
                        startAngle={90}
                        endAngle={450}
                      >
                        {progressData.map((entry, index) => (
                          <Cell key={index} fill={COLORS[index]} stroke={COLORS[index]} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-lg font-bold text-red-500">
                    {progress}%
                  </span>
                </div>
                <span className="text-sm font-medium text-red-500 mt-1"> {/* Moved text here */}
                  Profile Complete
                </span>
              </div>

              <button
                onClick={() => navigate("/profile/stepper", { state: { profile, steps, completedSteps } })}
                className="flex items-center justify-center gap-2 px-5 py-1.5 bg-[#111111] text-white rounded-full shadow-lg hover:bg-[#6B6F73] transition-all transform hover:-translate-y-0.5"
              >
                <Edit size={16} /> Update Profile
              </button>

              {/* --- ADDED: New "Update Password" Button --- */}
              <button
                onClick={() => navigate("/my/update-password")}
                className="flex items-center justify-center gap-2 px-5 py-1.5 bg-[#111111] text-white rounded-full shadow-lg hover:bg-[#6B6F73] transition-all transform hover:-translate-y-0.5"
              >
                <Lock size={16} /> Update Password
              </button>

              {profile?.resume && (
                <button
                  onClick={() => window.open(fileUrl(profile.resume), "_blank")}
                  className="flex items-center justify-center gap-2 px-5 py-1.5 bg-[#6B6F73] text-white rounded-full shadow-lg hover:bg-[#111111] transition-all transform hover:-translate-y-0.5"
                >
                  <Download size={16} /> View Resume
                </button>
              )}
            </div>
            {/* --- END OF UPDATES --- */}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 ">
            <div className="md:col-span-1 ">
              <ProfileCard title="Personal Info" icon={<User className="text-gray-500" />}>
                <InfoList
                  data={{
                    Name: profile?.name,
                    "Father's Name": profile?.fathersName,
                    Email: profile?.email,
                    Contact: profile?.contactNumber,
                    Gender: profile?.gender,
                    "Date of Birth": profile?.dob ? formatDate(profile.dob) : "-",
                    CNIC: profile?.cnicNumber,
                    Address: profile?.currentAddress,
                  }}
                />
              </ProfileCard>
            </div>
            
            <div className="md:col-span-2 space-y-6">
              <ProfileCard title="Skills" icon={<Star className="text-gray-500" />}>
                <div className="space-y-3">
                  <div>
                    <h4 className="font-semibold text-gray-600 mb-1">Technical Skills</h4>
                    <div className="flex flex-wrap gap-2">
                      {technicalSkills.length > 0 ? technicalSkills.map((s, i) => <SkillTag key={i}>{s}</SkillTag>) : <p className="text-gray-500">-</p>}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-600 mb-1">Digital Skills</h4>
                    <div className="flex flex-wrap gap-2">
                      {digitalSkills.length > 0 ? digitalSkills.map((s, i) => <SkillTag key={i}>{s}</SkillTag>) : <p className="text-gray-500">-</p>}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-600 mb-1">Soft Skills</h4>
                    <div className="flex flex-wrap gap-2">
                      {softSkills.length > 0 ? softSkills.map((s, i) => <SkillTag key={i}>{s}</SkillTag>) : <p className="text-gray-500">-</p>}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-600 mb-1">Languages</h4>
                    <div className="flex flex-wrap gap-2">
                      {languages.length > 0 ? languages.map((s, i) => <SkillTag key={i}>{s}</SkillTag>) : <p className="text-gray-500">-</p>}
                    </div>
                  </div>
                </div>
              </ProfileCard>
            </div>
          </div>
          
          <ProfileCard title="Experience" icon={<Briefcase className="text-gray-500" />} full>
            {experienceDetails.length > 0 ? (
              <div className="relative border-l-2 border-gray-200 ml-2">
                {experienceDetails.map((ex, i) => (
                  <TimelineItem
                    key={i}
                    isLast={i === experienceDetails.length - 1}
                    title={ex.jobTitle}
                    subtitle={ex.organization}
                    date={`From: ${ex.from || "-"} | To: ${ex.to || "-"}`}
                    description={ex.responsibilities}
                  />
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No experience data available</p>
            )}
          </ProfileCard>

          <ProfileCard title="Education" icon={<GraduationCap className="text-gray-500" />} full>
            {education.length > 0 ? (
              <div className="relative border-l-2 border-gray-200 ml-2">
                {education.map((ed, i) => (
                  <EducationTimelineItem
                    key={i}
                    isLast={i === education.length - 1}
                    title={ed.highestQualification}
                    subtitle={ed.institution}
                    date={`Year: ${ed.graduationYear || "-"} | CGPA: ${ed.cgpa || "-"}`}
                    description={`Major in ${ed.major || "-"}`}
                  />
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No education data available</p>
            )}
          </ProfileCard>

          <ProfileCard title="Accomplishments" icon={<Award className="text-gray-500" />} full>
            <div>
              <h4 className="font-semibold text-gray-600 mb-1">Achievements</h4>
              <p className="text-gray-700">{achievements.join(", ") || "-"}</p>
            </div>
            <div className="mt-3">
              <h4 className="font-semibold text-gray-600 mb-1">Major Projects</h4>
              <p className="text-gray-700">{majorProjects.join(", ") || "-"}</p>
            </div>
            <div className="mt-3">
              <h4 className="font-semibold text-gray-600 mb-1">Leadership Roles</h4>
              <p className="text-gray-700">{leadershipRoles.join(", ") || "-"}</p>
            </div>
          </ProfileCard>

        </div>

        <Footer />
      </div>
    </div>
  );
}