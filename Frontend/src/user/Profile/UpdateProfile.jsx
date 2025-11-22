import React, { useEffect, useState, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import {
  User,
  Briefcase,
  GraduationCap,
  Award,
  Settings,
  Star,
  Check,
  Loader2,
  Upload,
  FileText,
  DollarSign,
  ShieldCheck,
  Flag,
  GitMerge,
  Eye,
  Edit,
  ChevronRight,
} from "lucide-react";
import { FaBars, FaSpinner } from 'react-icons/fa';
import api, { fileUrl } from "../../api";
import Sidebar from "../../components/Sidebar";
import ProfileHeader from "../../components/ProfileHeader";
import { toast } from "react-hot-toast";
import Footer from "../../components/Footer";

// --- Config ---
const COLORS = ["#111111", "#e5e7eb"]; // Brand dark for done, gray for pending

// --- Reusable Form Components ---
const FormInput = (props) => (
  <input {...props} className="mt-1 block w-full p-2 border border-gray-300 rounded-lg shadow-sm bg-gray-50 focus:ring-1 focus:ring-[#111] focus:outline-none transition" />
);
const FormSelect = ({ children, ...props }) => (
  <select {...props} className="mt-1 block w-full p-2 border border-gray-300 rounded-lg shadow-sm bg-gray-50 focus:ring-1 focus:ring-[#111] focus:outline-none transition">
    {children}
  </select>
);
const FormTextArea = (props) => (
  <textarea {...props} className="mt-1 block w-full p-2 border border-gray-300 rounded-lg shadow-sm bg-gray-50 focus:ring-1 focus:ring-[#111] focus:outline-none transition" />
);
const FormCheckbox = ({ label, ...props }) => (
  <label className="flex items-center gap-2 text-sm text-gray-700">
    <input type="checkbox" {...props} className="h-4 w-4 rounded text-[#E30613] focus:ring-[#111] border-gray-300" />
    {label}
  </label>
);
const FormLabel = ({ children, ...props }) => (
  <label className="block" {...props}>
    <span className="text-sm font-medium text-gray-700">{children}</span>
  </label>
);
// --- End Form Components ---

// --- Helper: Get Icon for Step ---
const getStepIcon = (stepName) => {
  switch (stepName) {
    case "Profile Picture": return <User size={18} />;
    case "Personal Info": return <User size={18} />;
    case "Internal Applicant Details": return <Settings size={18} />;
    case "Job Application": return <Briefcase size={18} />;
    case "Education": return <GraduationCap size={18} />;
    case "Experience": return <Briefcase size={18} />;
    case "Achievements": return <Award size={18} />;
    case "Motivation": return <Flag size={18} />;
    case "Skills": return <Star size={18} />;
    case "Salary & Benefits": return <DollarSign size={18} />;
    case "Compliance": return <ShieldCheck size={18} />;
    case "Diversity": return <GitMerge size={18} />;
    case "Declarations": return <Check size={18} />;
    case "Resume": return <FileText size={18} />;
    default: return <Check size={18} />;
  }
};

// --- Vertical Stepper Navigation Component ---
const StepperNav = ({ steps, completedSteps, activeIndex, setActiveIndex, progress, profile, onRefresh }) => {
  const navigate = useNavigate();
  const [role, setRole] = useState("user");
  
  useEffect(() => {
    const storedUser = localStorage.getItem("loggedInUser");
    if (storedUser) {
      setRole(JSON.parse(storedUser)?.role || "user");
    }
  }, []);

  const [uploadingPic, setUploadingPic] = useState(false);

  const handlePictureUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const fd = new FormData();
    fd.append("profilePicture", file);
    setUploadingPic(true);
    try {
      await api.put("/profile/profilePicture", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.success("Profile picture updated!");
      onRefresh(); // Refresh the entire profile
    } catch (err) {
      console.error("Avatar upload failed:", err);
      toast.error(err?.response?.data?.message || "Failed to upload picture");
    } finally {
      setUploadingPic(false);
    }
  };
  
  return (
  <div className="bg-white rounded-xl shadow-lg p-5 sticky top-6">
    {/* Avatar Card */}
    <div className="p-4 text-center border-b border-gray-200">
      <div className="relative w-24 h-24 mx-auto">
        <img
          src={
            profile.profilePicture
              ? fileUrl(profile.profilePicture)
              : `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.name || "U")}&background=random&color=fff`
          }
          alt="avatar"
          className="w-24 h-24 rounded-full object-cover mx-auto border-4 border-gray-200 shadow-md"
        />
        <label
          htmlFor="profile-pic-upload"
          className="absolute -bottom-1 -right-1 w-8 h-8 bg-[#111111] text-white rounded-full flex items-center justify-center cursor-pointer hover:bg-[#E30613] transition"
          title="Upload new photo"
        >
          {uploadingPic ? <Loader2 size={14} className="animate-spin" /> : <Edit size={14} />}
          <input
            type="file"
            accept="image/*"
            id="profile-pic-upload"
            className="sr-only"
            disabled={uploadingPic}
            onChange={handlePictureUpload}
          />
        </label>
      </div>
      <div className="text-2xl font-semibold mt-3 text-gray-900">{profile.name || "Your name"}</div>
      <div className="text-sm text-gray-500">Email: {profile.email || "User Email"}</div>
      <div className="text-sm text-gray-500">User ID: {profile.userId || "User ID"}</div>
    </div>
    
    {/* Profile Completion */}
    <div className="py-4 border-b border-gray-200">
      <h3 className="text-base font-semibold mb-2 text-center text-red-500">Profile Completion</h3>
      <div className="w-40 h-40 mx-auto relative">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={progress.data}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={65}
              paddingAngle={3}
              dataKey="value"
              startAngle={90}
              endAngle={450}
            >
              <Cell fill={COLORS[0]} stroke={COLORS[0]} />
              <Cell fill={COLORS[1]} stroke={COLORS[1]} />
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-3xl font-bold text-red-500">
          {progress.percent}%
        </div>
      </div>
    </div>
    
    <nav className="mt-4 space-y-1 max-h-64 overflow-y-auto pr-2">
      {steps.map((name, idx) => (
        <button
          key={name}
          onClick={() => setActiveIndex(idx)}
          className={`flex items-center w-full p-3 rounded-lg text-left transition-all duration-200 group ${
            activeIndex === idx ? "bg-gray-100" : "hover:bg-gray-50"
          }`}
        >
          <div className={`mr-3 p-1.5 rounded-full ${
            activeIndex === idx ? "bg-[#E30613] text-white" : (completedSteps.includes(name) ? "bg-gray-200 text-gray-700" : "bg-gray-200 text-gray-400")
          }`}>
            {getStepIcon(name)}
          </div>
          <span className={`flex-1 text-sm font-medium ${
            activeIndex === idx ? "text-gray-900" : "text-gray-600"
          }`}>
            {name}
          </span>
          {completedSteps.includes(name) && activeIndex !== idx && (
            <Check size={16} className="ml-auto text-green-500" />
          )}
          {activeIndex === idx && (
            <ChevronRight size={16} className="ml-auto text-[#E30613]" />
          )}
        </button>
      ))}
    </nav>

    <button
      onClick={() => navigate(role === "user" ? "/me/profile" : "/my/profile")}
      className="mt-6 w-full flex items-center justify-center gap-2 px-4 py-2 bg-[#BFBFBF] text-black font-medium rounded-full transition hover:bg-[#6B6F73]"
    >
      <Eye size={16} /> View My Profile
    </button>
  </div>
);
};


export default function UpdateProfile() {
  const navigate = useNavigate();
  const location = useLocation();
  const initialState = location.state || {};
  
  const [profile, setProfile] = useState(initialState.profile || null);
  const [steps, setSteps] = useState(initialState.steps || []);
  const [completedSteps, setCompletedSteps] = useState(initialState.completedSteps || []);
  const [activeIndex, setActiveIndex] = useState(0); 
  const [refreshKey, setRefreshKey] = useState(0); 
  
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeItem, setActiveItem] = useState("Profile");
  const [role, setRole] = useState("user"); 
  
  const [loading, setLoading] = useState(!profile);

  useEffect(() => {
    const storedUser = localStorage.getItem("loggedInUser");
    if (storedUser) {
      const parsed = JSON.parse(storedUser);
      setRole(parsed?.role || "user");
    }

    const hydrated = !!initialState.profile;
    (async () => {
      try {
        if (!hydrated) setLoading(true);
        const res = await api.get("/profile/getProfile");
        const data = {
          profile: res.data.profile || {},
          steps: res.data.steps || [],
          completedSteps: res.data.completedSteps || [],
        };

        setProfile(data.profile);
        setSteps(data.steps);
        setCompletedSteps(data.completedSteps);
        if (!hydrated) setActiveIndex(0);
        
        localStorage.setItem("userProfile", JSON.stringify(data));
      } catch (err) {
        console.error("Failed to load profile:", err);
        toast.error("Failed to load profile. Please try again.");
      } finally {
        setLoading(false);
      }
    })();
  }, [refreshKey, initialState.profile]);

  const refreshProfile = () => setRefreshKey((k) => k + 1);

  const progress = useMemo(() => {
    const totalSteps = steps.length;
    const doneCount = completedSteps.length;
    const percent = totalSteps ? Math.round((doneCount / totalSteps) * 100) : 0;
    const data = [
      { name: "Completed", value: doneCount || 0 },
      { name: "Pending", value: (totalSteps - doneCount) || 1 },
    ];
    return { totalSteps, doneCount, percent, data };
  }, [steps, completedSteps]);


  if (loading) {
    return (
      <div className="flex h-screen bg-gray-100">
         <Sidebar
            role={role}
            active={activeItem}
            setActive={setActiveItem}
            sidebarOpen={sidebarOpen}
            setSidebarOpen={setSidebarOpen}
          />
        <main className="flex-1 overflow-y-auto">
          <ProfileHeader title="Update My Profile" subtitle="Manage your personal and professional details" />
          <div className="flex h-screen items-center justify-center text-gray-600 -mt-20">
            <FaSpinner className="animate-spin text-4xl text-gray-700" />
            <span className="ml-3 text-lg">Loading profile...</span>
          </div>

        </main>
      </div>
    );
  }

  if (!profile) {
     return (
      <div className="flex h-screen bg-gray-100">
         <Sidebar
            role={role}
            active={activeItem}
            setActive={setActiveItem}
            sidebarOpen={sidebarOpen}
            setSidebarOpen={setSidebarOpen}
          />
        <main className="flex-1 overflow-y-auto">
          <ProfileHeader title="Update My Profile" subtitle="Manage your personal and professional details" />
          <div className="p-8 text-center text-red-500">
            Could not load profile data. Please try logging out and back in.
          </div>

          
        </main>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-100">
        <Sidebar
          role={role}
          active={activeItem}
          setActive={setActiveItem}
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
        />
    
        <main className="flex-1 overflow-y-auto">
          <ProfileHeader
            title="Update My Profile"
            subtitle="Update your personal and professional details"
            showMenuButton={true} // --- HAMBURGER FIX ---
            onMenuClick={() => setSidebarOpen(true)} // --- HAMBURGER FIX ---
          />

          <div className="p-4 md:p-6 max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              
              <div className="lg:col-span-1 space-y-6">
                <StepperNav
                  steps={steps}
                  completedSteps={completedSteps}
                  activeIndex={activeIndex}
                  setActiveIndex={setActiveIndex}
                  progress={progress}
                  profile={profile}
                  onRefresh={refreshProfile}
                />
              </div>

              <div className="lg:col-span-3 space-y-6">
                <div className="bg-white rounded-xl shadow-lg p-6 md:p-8">
                  {steps.length > 0 ? (
                    <ActiveStepForm
                      key={activeIndex} 
                      stepIndex={activeIndex}
                      stepName={steps[activeIndex]}
                      currentProfile={profile}
                      onSaved={refreshProfile}
                      onSaveNext={() => {
                        if (activeIndex < steps.length - 1) setActiveIndex((i) => i + 1);
                        refreshProfile();
                      }}
                      steps={steps} // --- THIS IS THE FIX ---
                    />
                  ) : (
                    <p>Loading form steps...</p>
                  )}
                </div>
              </div>

            </div>
          </div>

          <Footer />
        </main>
      </div>
  );
}

// --- Helper: Formats YYYY-MM-DD for date inputs ---
function dateOnly(val) {
  if (!val) return "";
  const d = new Date(val);
  if (Number.isNaN(d.getTime())) return "";
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mm}-${dd}`;
}

// --- Helper: Creates initial form state from profile data ---
function createInitialForm(stepName, profile = {}) {
  switch (stepName) {
    case "Profile Picture":
      return {}; // Handled by file state
    case "Personal Info":
      return {
        name: profile.name || "",
        fathersName: profile.fathersName || "",
        gender: profile.gender || "",
        dob: profile.dob ? dateOnly(profile.dob) : "",
        placeOfBirth: profile.placeOfBirth || "",
        nationality: profile.nationality || "",
        cnicNumber: profile.cnicNumber || "",
        cnicIssueDate: profile.cnicIssueDate ? dateOnly(profile.cnicIssueDate) : "",
        cnicExpiryDate: profile.cnicExpiryDate ? dateOnly(profile.cnicExpiryDate) : "",
        passportNumber: profile.passportNumber || "",
        passportIssueDate: profile.passportIssueDate ? dateOnly(profile.passportIssueDate) : "",
        passportExpiryDate: profile.passportExpiryDate ? dateOnly(profile.passportExpiryDate) : "",
        maritalStatus: profile.maritalStatus || "",
        currentAddress: profile.currentAddress || "",
        permanentAddress: profile.permanentAddress || "",
        contactNumber: profile.contactNumber || "",
        alternateContact: profile.alternateContact || "",
        emergencyContact: profile.emergencyContact || {},
      };
    
    case "Internal Applicant Details":
      return {
        employeeId: profile.employeeId || "",
        designation: profile.designation || "",
        department: profile.department || "",
        location: profile.location || "",
        dateOfJoining: profile.dateOfJoining ? dateOnly(profile.dateOfJoining) : "",
        reportingManager: profile.reportingManager || "",
        currentSalary: profile.currentSalary || "",
        reasonForApplying: profile.reasonForApplying || "",
        hodClearance: !!profile.hodClearance,
      };

    case "Job Application":
      return {
        positionApplied: profile.positionApplied || "",
        applicationType: profile.applicationType || "",
        areaOfInterest: profile.areaOfInterest || "",
        preferredLocations: (profile.preferredLocations || []).join(", "),
        availability: profile.availability || "",
        willingToTravel: !!profile.willingToTravel,
        willingToRelocate: !!profile.willingToRelocate,
      };

    case "Education":
      return {
        education: (profile.education && profile.education.length > 0) ? (profile.education.map((e) => ({
          highestQualification: e.highestQualification || "",
          institution: e.institution || "",
          major: e.major || "",
          graduationYear: e.graduationYear || "",
          cgpa: e.cgpa || "",
          certifications: Array.isArray(e.certifications) ? e.certifications.join(", ") : (e.certifications || ""),
          achievements: Array.isArray(e.achievements) ? e.achievements.join(", ") : (e.achievements || ""),
        }))) : [{ highestQualification: "", institution: "", major: "", graduationYear: "" }],
      };

    case "Experience":
      return {
        experienceDetails: (profile.experienceDetails && profile.experienceDetails.length > 0) ? (profile.experienceDetails.map((ex) => ({
          organization: ex.organization || "",
          jobTitle: ex.jobTitle || "",
          from: ex.from ? dateOnly(ex.from) : "",
          to: ex.to ? dateOnly(ex.to) : "",
          responsibilities: ex.responsibilities || "",
          achievements: ex.achievements || "",
          awards: ex.awards || "",
          lastSalary: ex.lastSalary || "",
          reasonForLeaving: ex.reasonForLeaving || "",
        }))) : [{ organization: "", jobTitle: "", from: "", to: "", reasonForLeaving: "" }],
      };

    case "Achievements":
      return {
        achievements: (profile.achievements || []).join(", "),
        majorProjects: (profile.majorProjects || []).join(", "),
        leadershipRoles: (profile.leadershipRoles || []).join(", "),
      };

    case "Motivation":
      return {
        reasonToJoin: profile.motivation?.reasonToJoin || "",
        industryAttraction: profile.motivation?.industryAttraction || "",
        fiveYearPlan: profile.motivation?.fiveYearPlan || "",
        uniqueValue: profile.motivation?.uniqueValue || "",
        preferredCareerPath: profile.motivation?.preferredCareerPath || "",
      };

    case "Skills":
      return {
        technicalSkills: (profile.technicalSkills || []).join(", "),
        digitalSkills: (profile.digitalSkills || []).join(", "),
        languages: (profile.languages || []).join(", "),
        softSkills: (profile.softSkills || []).join(", "),
        industryCompetencies: (profile.industryCompetencies || []).join(", "),
      };

    case "Salary & Benefits":
      return {
        currentSalary: profile.currentSalary || "",
        expectedSalary: profile.expectedSalary || "",
        expectedBenefits: (profile.expectedBenefits || []).join(", "),
      };

    case "Compliance":
      return {
        businessWithCompany: profile.conflicts?.businessWithCompany?.hasConflict || false,
        businessWithCompanyDetails: profile.conflicts?.businessWithCompany?.details || "",
        relativesEmployed: profile.conflicts?.relativesEmployed?.hasConflict || false,
        relativesEmployedDetails: profile.conflicts?.relativesEmployed?.details || "",
        previouslyWorked: profile.conflicts?.previouslyWorked?.hasConflict || false,
        previouslyWorkedDetails: profile.conflicts?.previouslyWorked?.details || "",
        legalCases: profile.conflicts?.legalCases?.hasConflict || false,
        legalCasesDetails: profile.conflicts?.legalCases?.details || "",
      };

    case "Diversity":
      return {
        disability: profile.diversity?.disability || false,
        veteran: profile.diversity?.veteran || false,
        references: (profile.diversity?.references || []).join(", "),
      };

    case "Declarations":
      return {
        infoAccurate: profile.declarations?.infoAccurate || false,
        authorizeVerification: profile.declarations?.authorizeVerification || false,
        noConflict: profile.declarations?.noConflict || false,
        consentData: profile.declarations?.consentData || false,
        understandSubmission: profile.declarations?.understandSubmission || false,
      };

    case "Resume":
    default:
      return {};
  }
}


// --- Active Step Form Component (with fixes and styling) ---
function ActiveStepForm({ stepIndex, stepName, currentProfile, onSaved, onSaveNext, steps }) { // --- FIX: Added 'steps' prop
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [local, setLocal] = useState(() => createInitialForm(stepName, currentProfile));
  
  const [resumeFile, setResumeFile] = useState(null);
  const [profilePicFile, setProfilePicFile] = useState(null);

  function updateField(name, value) {
    setLocal((s) => ({ ...s, [name]: value }));
  }

  function updateNested(objName, field, value) {
    setLocal((s) => ({ ...s, [objName]: { ...(s[objName] || {}), [field]: value } }));
  }

  // Education/Experience helpers
  function addEdu() {
    setLocal((s) => ({ ...s, education: [...(s.education || []), { highestQualification: "", institution: "", major: "", graduationYear: "" }] }));
  }
  function removeEdu(i) {
    setLocal((s) => ({ ...s, education: s.education.filter((_, idx) => idx !== i) }));
  }
  function updateEdu(i, field, value) {
    setLocal((s) => {
      const ed = [...(s.education || [])];
      ed[i] = { ...ed[i], [field]: value };
      return { ...s, education: ed };
    });
  }
  function addExp() {
    setLocal((s) => ({ ...s, experienceDetails: [...(s.experienceDetails || []), { organization: "", jobTitle: "", from: "", to: "", reasonForLeaving: "" }] }));
  }
  function removeExp(i) {
    setLocal((s) => ({ ...s, experienceDetails: s.experienceDetails.filter((_, idx) => idx !== i) }));
  }
  function updateExp(i, field, value) {
    setLocal((s) => {
      const ex = [...(s.experienceDetails || [])];
      ex[i] = { ...ex[i], [field]: value };
      return { ...s, experienceDetails: ex };
    });
  }
  const csvToArray = (str) => (str ? str.split(",").map((t) => t.trim()).filter(Boolean) : []);

  // Basic per-step validation
  function validateStep() {
    const e = {};
    if (stepName === "Profile Picture") {
      if (!profilePicFile && !currentProfile?.profilePicture) {
        e.profilePicture = "Please upload a profile picture";
      }
    }
    if (stepName === "Personal Info") {
      if (!local.name) e.name = "Full name required";
      if (!local.cnicNumber) e.cnicNumber = "CNIC required";
      if (!local.contactNumber) e.contactNumber = "Contact number required";
      if (!local.currentAddress) e.currentAddress = "Current address required";
    }
    if (stepName === "Declarations") {
      if (!local.infoAccurate) {
        e.declarations = "You must confirm that information provided is accurate";
      }
    }
    if (stepName === "Resume") {
      if (!resumeFile && !currentProfile?.resume) {
        e.resume = "Please upload your resume";
      }
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  // Build API payload
  function buildPayloadForStep() {
    // This is the complete function from your file
    switch (stepName) {
      case "Personal Info":
        return {
          name: local.name,
          fathersName: local.fathersName,
          gender: local.gender,
          dob: local.dob,
          placeOfBirth: local.placeOfBirth,
          nationality: local.nationality,
          cnicNumber: local.cnicNumber,
          cnicIssueDate: local.cnicIssueDate,
          cnicExpiryDate: local.cnicExpiryDate,
          passportNumber: local.passportNumber,
          passportIssueDate: local.passportIssueDate,
          passportExpiryDate: local.passportExpiryDate,
          maritalStatus: local.maritalStatus,
          currentAddress: local.currentAddress,
          permanentAddress: local.permanentAddress,
          contactNumber: local.contactNumber,
          alternateContact: local.alternateContact,
          emergencyContact: local.emergencyContact,
        };
      case "Internal Applicant Details":
        return {
          employeeId: local.employeeId,
          designation: local.designation,
          department: local.department,
          location: local.location,
          dateOfJoining: local.dateOfJoining,
          reportingManager: local.reportingManager,
          currentSalary: local.currentSalary ? Number(local.currentSalary) : undefined,
          reasonForApplying: local.reasonForApplying,
          hodClearance: !!local.hodClearance,
        };
      case "Job Application":
        return {
          positionApplied: local.positionApplied,
          applicationType: local.applicationType,
          areaOfInterest: local.areaOfInterest,
          preferredLocations: csvToArray(local.preferredLocations),
          availability: local.availability,
          willingToTravel: !!local.willingToTravel,
          willingToRelocate: !!local.willingToRelocate,
        };
      case "Education":
        return { education: local.education?.map((e) => ({
          highestQualification: e.highestQualification,
          institution: e.institution,
          major: e.major,
          graduationYear: e.graduationYear ? Number(e.graduationYear) : undefined,
          cgpa: e.cgpa,
          certifications: Array.isArray(e.certifications) ? e.certifications : csvToArray(e.certifications),
          achievements: Array.isArray(e.achievements) ? e.achievements : csvToArray(e.achievements),
        })) };
      case "Experience":
        return { experienceDetails: local.experienceDetails?.map((ex) => ({
          organization: ex.organization,
          jobTitle: ex.jobTitle,
          from: ex.from || undefined,
          to: ex.to || undefined,
          responsibilities: ex.responsibilities,
          achievements: ex.achievements,
          awards: ex.awards,
          lastSalary: ex.lastSalary ? Number(ex.lastSalary) : undefined,
          reasonForLeaving: ex.reasonForLeaving,
        })) };
      case "Achievements":
        return {
          achievements: csvToArray(local.achievements),
          majorProjects: csvToArray(local.majorProjects),
          leadershipRoles: csvToArray(local.leadershipRoles),
        };
      case "Motivation":
        return { motivation: {
          reasonToJoin: local.reasonToJoin,
          industryAttraction: local.industryAttraction,
          fiveYearPlan: local.fiveYearPlan,
          uniqueValue: local.uniqueValue,
          preferredCareerPath: local.preferredCareerPath,
        }};
      case "Skills":
        return {
          technicalSkills: csvToArray(local.technicalSkills),
          digitalSkills: csvToArray(local.digitalSkills),
          languages: csvToArray(local.languages),
          softSkills: csvToArray(local.softSkills),
          industryCompetencies: csvToArray(local.industryCompetencies),
        };
      case "Salary & Benefits":
        return {
          currentSalary: local.currentSalary ? Number(local.currentSalary) : undefined,
          expectedSalary: local.expectedSalary ? Number(local.expectedSalary) : undefined,
          expectedBenefits: csvToArray(local.expectedBenefits),
        };
      case "Compliance":
        return {
          conflicts: {
            businessWithCompany: { hasConflict: !!local.businessWithCompany, details: local.businessWithCompanyDetails || "" },
            relativesEmployed: { hasConflict: !!local.relativesEmployed, details: local.relativesEmployedDetails || "" },
            previouslyWorked: { hasConflict: !!local.previouslyWorked, details: local.previouslyWorkedDetails || "" },
            legalCases: { hasConflict: !!local.legalCases, details: local.legalCasesDetails || "" },
          }
        };
      case "Diversity":
        return {
          diversity: {
            disability: !!local.disability,
            veteran: !!local.veteran,
            references: csvToArray(local.references),
          }
        };
      case "Declarations":
        return {
          declarations: {
            infoAccurate: !!local.infoAccurate,
            authorizeVerification: !!local.authorizeVerification,
            noConflict: !!local.noConflict,
            consentData: !!local.consentData,
            understandSubmission: !!local.understandSubmission,
          }
        };
      default:
        return {};
    }
  }

  // --- Save Logic (FIXED) ---
  async function handleSave(e, andNext = false) {
    e?.preventDefault();
    if (!validateStep()) {
      toast.error("Please fill in all required fields.");
      return;
    }

    setLoading(true);
    try {
      if (stepName === "Resume") {
        if (!resumeFile) {
          if (andNext) onSaveNext();
          else toast.success("No file selected, no changes saved.");
          setLoading(false);
          return;
        }
        const fd = new FormData();
        fd.append("resume", resumeFile);
        await api.put("/profile/resume", fd, { headers: { "Content-Type": "multipart/form-data" } });

      } else if (stepName === "Profile Picture") {
        if (!profilePicFile) {
          if (andNext) onSaveNext();
          else toast.success("No file selected, no changes saved.");
          setLoading(false);
          return;
        }
        const fd = new FormData();
        fd.append("profilePicture", profilePicFile);
        await api.put("/profile/profilePicture", fd, { headers: { "Content-Type": "multipart/form-data" } });
      
      } else {
        const payload = buildPayloadForStep();
        await api.put(`/profile/step/${stepIndex + 1}`, payload);
      }

      setErrors({});
      toast.success("Saved successfully!");
      if (andNext) {
        onSaveNext();
      } else {
        onSaved(); // Refresh data in place
      }
    } catch (err) {
      console.error("Save failed:", err);
      toast.error(err?.response?.data?.message || "Failed to save");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="flex items-start justify-between">
        <h2 className="text-2xl font-bold text-gray-900">{stepName}</h2>
        {/* --- THIS IS THE FIX --- */}
        <div className="text-sm text-gray-500 font-medium">Step {stepIndex + 1} of {steps.length || 14}</div>
      </div>

      <form className="mt-6 space-y-4" onSubmit={(e) => handleSave(e, true)}>
        
        {stepName === "Profile Picture" && (
          <div className="space-y-3">
            <FormLabel>Upload Profile Picture (PNG, JPG)</FormLabel>
            <FormInput
              type="file"
              accept="image/png,image/jpeg"
              onChange={(e) => setProfilePicFile(e.target.files?.[0] || null)}
            />
            {profilePicFile && (
              <p className="text-sm text-gray-500 mt-2">Selected: {profilePicFile.name}</p>
            )}
            {errors.profilePicture && <div className="text-xs text-red-500 mt-1">{errors.profilePicture}</div>}
          </div>
        )}

        {stepName === "Personal Info" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormLabel>Full name
              <FormInput value={local.name || ""} onChange={(e) => updateField("name", e.target.value)} />
              {errors.name && <div className="text-xs text-red-500">{errors.name}</div>}
            </FormLabel>
            <FormLabel>Father's Name
              <FormInput value={local.fathersName || ""} onChange={(e) => updateField("fathersName", e.target.value)} />
            </FormLabel>
            <FormLabel>Gender
              <FormSelect value={local.gender || ""} onChange={(e) => updateField("gender", e.target.value)}>
                <option value="">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </FormSelect>
            </FormLabel>
            <FormLabel>Date of Birth
              <FormInput type="date" value={local.dob || ""} onChange={(e) => updateField("dob", e.target.value)} />
            </FormLabel>
            <FormLabel>Place of Birth
              <FormInput value={local.placeOfBirth || ""} onChange={(e) => updateField("placeOfBirth", e.target.value)} />
            </FormLabel>
            <FormLabel>Nationality
              <FormInput value={local.nationality || ""} onChange={(e) => updateField("nationality", e.target.value)} />
            </FormLabel>
            <FormLabel>CNIC Number
              <FormInput value={local.cnicNumber || ""} onChange={(e) => updateField("cnicNumber", e.target.value)} />
              {errors.cnicNumber && <div className="text-xs text-red-500">{errors.cnicNumber}</div>}
            </FormLabel>
            <FormLabel>CNIC Issue Date
              <FormInput type="date" value={local.cnicIssueDate || ""} onChange={(e) => updateField("cnicIssueDate", e.target.value)} />
            </FormLabel>
            <FormLabel>CNIC Expiry Date
              <FormInput type="date" value={local.cnicExpiryDate || ""} onChange={(e) => updateField("cnicExpiryDate", e.target.value)} />
            </FormLabel>
            <FormLabel>Passport Number
              <FormInput value={local.passportNumber || ""} onChange={(e) => updateField("passportNumber", e.target.value)} />
            </FormLabel>
            <FormLabel>Passport Issue Date
              <FormInput type="date" value={local.passportIssueDate || ""} onChange={(e) => updateField("passportIssueDate", e.target.value)} />
            </FormLabel>
            <FormLabel>Passport Expiry Date
              <FormInput type="date" value={local.passportExpiryDate || ""} onChange={(e) => updateField("passportExpiryDate", e.target.value)} />
            </FormLabel>
            <FormLabel>Marital Status
              <FormSelect value={local.maritalStatus || ""} onChange={(e) => updateField("maritalStatus", e.target.value)}>
                <option value="">Select Marital Status</option>
                <option value="Single">Single</option>
                <option value="Married">Married</option>
                <option value="Other">Other</option>
              </FormSelect>
            </FormLabel>
            <FormLabel>Contact Number
              <FormInput value={local.contactNumber || ""} onChange={(e) => updateField("contactNumber", e.target.value)} />
              {errors.contactNumber && <div className="text-xs text-red-500">{errors.contactNumber}</div>}
            </FormLabel>
             <FormLabel>Alternate Contact
              <FormInput value={local.alternateContact || ""} onChange={(e) => updateField("alternateContact", e.target.value)} />
            </FormLabel>
            <div className="md:col-span-2">
              <FormLabel>Current Address
                <FormInput value={local.currentAddress || ""} onChange={(e) => updateField("currentAddress", e.target.value)} />
                {errors.currentAddress && <div className="text-xs text-red-500">{errors.currentAddress}</div>}
              </FormLabel>
            </div>
             <div className="md:col-span-2">
              <FormLabel>Permanent Address
                <FormInput value={local.permanentAddress || ""} onChange={(e) => updateField("permanentAddress", e.target.value)} />
              </FormLabel>
            </div>
            <div className="md:col-span-2 p-3 border rounded-lg bg-gray-50">
              <FormLabel>Emergency Contact</FormLabel>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mt-1">
                <FormInput placeholder="Name" value={local.emergencyContact?.emergencyContactName || ""} onChange={(e) => updateNested("emergencyContact", "emergencyContactName", e.target.value)} />
                <FormInput placeholder="Relation" value={local.emergencyContact?.relation || ""} onChange={(e) => updateNested("emergencyContact", "relation", e.target.value)} />
                <FormInput placeholder="Number" value={local.emergencyContact?.number || ""} onChange={(e) => updateNested("emergencyContact", "number", e.target.value)} />
              </div>
            </div>
        </div>
        )}

        {stepName === "Internal Applicant Details" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormLabel>Employee ID
              <FormInput value={local.employeeId || ""} onChange={(e) => updateField("employeeId", e.target.value)} />
              {errors.employeeId && <div className="text-xs text-red-500">{errors.employeeId}</div>}
            </FormLabel>
            <FormLabel>Designation
              <FormInput value={local.designation || ""} onChange={(e) => updateField("designation", e.target.value)} />
            </FormLabel>
            <FormLabel>Department
              <FormInput value={local.department || ""} onChange={(e) => updateField("department", e.target.value)} />
            </FormLabel>
             <FormLabel>Location
              <FormInput value={local.location || ""} onChange={(e) => updateField("location", e.target.value)} />
            </FormLabel>
            <FormLabel>Date of Joining
              <FormInput type="date" value={local.dateOfJoining || ""} onChange={(e) => updateField("dateOfJoining", e.target.value)} />
            </FormLabel>
            <FormLabel>Reporting Manager
              <FormInput value={local.reportingManager || ""} onChange={(e) => updateField("reportingManager", e.target.value)} />
            </FormLabel>
            <FormLabel>Current Salary
              <FormInput type="number" value={local.currentSalary || ""} onChange={(e) => updateField("currentSalary", e.target.value)} />
            </FormLabel>
            <div className="md:col-span-2">
              <FormLabel>Reason for Applying
                <FormTextArea value={local.reasonForApplying || ""} onChange={(e) => updateField("reasonForApplying", e.target.value)} rows={3} />
              </FormLabel>
            </div>
            <div className="md:col-span-2">
              <FormCheckbox label="HOD Clearance Obtained" checked={!!local.hodClearance} onChange={(e) => updateField("hodClearance", e.target.checked)} />
            </div>
          </div>
        )}

        {stepName === "Job Application" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormLabel>Position Applied For
              <FormInput value={local.positionApplied || ""} onChange={(e) => updateField("positionApplied", e.target.value)} />
              {errors.positionApplied && <div className="text-xs text-red-500">{errors.positionApplied}</div>}
            </FormLabel>
            <FormLabel>Application Type
              <FormSelect value={local.applicationType || ""} onChange={(e) => updateField("applicationType", e.target.value)}>
                <option value="">Select application type</option>
                <option value="Experienced">Experienced</option>
                <option value="Trainee">Trainee</option>
                <option value="MTO">MTO</option>
              </FormSelect>
            </FormLabel>
            <FormLabel>Area of Interest
              <FormInput value={local.areaOfInterest || ""} onChange={(e) => updateField("areaOfInterest", e.target.value)} />
            </FormLabel>
            <FormLabel>Preferred Locations (comma separated)
              <FormInput value={local.preferredLocations || ""} onChange={(e) => updateField("preferredLocations", e.target.value)} />
            </FormLabel>
            <FormLabel>Availability (e.g., "Immediately", "1 Month Notice")
              <FormInput value={local.availability || ""} onChange={(e) => updateField("availability", e.target.value)} />
            </FormLabel>
            <div className="md:col-span-2 flex items-center gap-6 pt-2">
              <FormCheckbox label="Willing to Travel" checked={!!local.willingToTravel} onChange={(e) => updateField("willingToTravel", e.target.checked)} />
              <FormCheckbox label="Willing to Relocate" checked={!!local.willingToRelocate} onChange={(e) => updateField("willingToRelocate", e.target.checked)} />
            </div>
          </div>
        )}

        {stepName === "Education" && (
          <div>
            {(local.education || []).map((ed, i) => (
              <div key={i} className="border rounded-lg p-4 mb-3 space-y-3 relative bg-gray-50">
                <div className="flex justify-between items-center mb-2">
                  <div className="font-medium text-gray-800">Education #{i + 1}</div>
                  <button type="button" onClick={() => removeEdu(i)} className="text-sm font-medium text-[#E30613] hover:text-red-700">Remove</button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <FormLabel>Qualification
                    <FormInput placeholder="e.g., BSCS" value={ed.highestQualification || ""} onChange={(e) => updateEdu(i, "highestQualification", e.target.value)} />
                  </FormLabel>
                  <FormLabel>Institution
                    <FormInput placeholder="e.g., FAST NUCES" value={ed.institution || ""} onChange={(e) => updateEdu(i, "institution", e.target.value)} />
                  </FormLabel>
                  <FormLabel>Major
                    <FormInput placeholder="e.g., Computer Science" value={ed.major || ""} onChange={(e) => updateEdu(i, "major", e.target.value)} />
                  </FormLabel>
                  <FormLabel>Graduation Year
                    <FormInput type="number" placeholder="e.g., 2024" value={ed.graduationYear || ""} onChange={(e) => updateEdu(i, "graduationYear", e.target.value)} />
                  </FormLabel>
                  <FormLabel>CGPA (Optional)
                    <FormInput placeholder="e.g., 3.5" value={ed.cgpa || ""} onChange={(e) => updateEdu(i, "cgpa", e.target.value)} />
                  </FormLabel>
                  <div className="md:col-span-3">
                    <FormLabel>Certifications (comma separated)
                      <FormInput value={ed.certifications || ""} onChange={(e) => updateEdu(i, "certifications", e.target.value)} />
                    </FormLabel>
                  </div>
                  <div className="md:col-span-3">
                    <FormLabel>Achievements (comma separated)
                      <FormInput value={ed.achievements || ""} onChange={(e) => updateEdu(i, "achievements", e.target.value)} />
                    </FormLabel>
                  </div>
                </div>
                {errors[`education_${i}`] && <div className="text-xs text-red-500 mt-2">{errors[`education_${i}`]}</div>}
              </div>
            ))}
            <button type="button" onClick={addEdu} className="text-sm font-medium text-[#111111] hover:text-[#E30613]">+ Add Education</button>
            {errors.education && <div className="text-xs text-red-500 mt-1">{errors.education}</div>}
          </div>
        )}

        {stepName === "Experience" && (
          <div>
            {(local.experienceDetails || []).map((ex, i) => (
              <div key={i} className="border rounded-lg p-4 mb-3 space-y-3 relative bg-gray-50">
                <div className="flex justify-between items-center mb-2">
                  <div className="font-medium text-gray-800">Experience #{i + 1}</div>
                  <button type="button" onClick={() => removeExp(i)} className="text-sm font-medium text-[#E30613] hover:text-red-700">Remove</button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <FormLabel>Organization
                    <FormInput value={ex.organization || ""} onChange={(e) => updateExp(i, "organization", e.target.value)} />
                  </FormLabel>
                  <FormLabel>Job Title
                    <FormInput value={ex.jobTitle || ""} onChange={(e) => updateExp(i, "jobTitle", e.target.value)} />
                  </FormLabel>
                  <FormLabel>From Date
                    <FormInput type="date" value={ex.from || ""} onChange={(e) => updateExp(i, "from", e.target.value)} />
                  </FormLabel>
                  <FormLabel>To Date
                    <FormInput type="date" value={ex.to || ""} onChange={(e) => updateExp(i, "to", e.target.value)} />
                  </FormLabel>
                  <div className="md:col-span-2">
                    <FormLabel>Responsibilities
                      <FormTextArea value={ex.responsibilities || ""} onChange={(e) => updateExp(i, "responsibilities", e.target.value)} rows={3} />
                    </FormLabel>
                  </div>
                  <div className="md:col-span-2">
                    <FormLabel>Achievements
                      <FormTextArea value={ex.achievements || ""} onChange={(e) => updateExp(i, "achievements", e.target.value)} rows={2} />
                    </FormLabel>
                  </div>
                  <div className="md:col-span-2">
                    <FormLabel>Awards
                      <FormInput value={ex.awards || ""} onChange={(e) => updateExp(i, "awards", e.target.value)} />
                    </FormLabel>
                  </div>
                  <FormLabel>Last Salary
                    <FormInput type="number" value={ex.lastSalary || ""} onChange={(e) => updateExp(i, "lastSalary", e.target.value)} />
                  </FormLabel>
                  <FormLabel>Reason for Leaving
                    <FormInput value={ex.reasonForLeaving || ""} onChange={(e) => updateExp(i, "reasonForLeaving", e.target.value)} />
                  </FormLabel>
                </div>
                {errors[`experience_${i}`] && <div className="text-xs text-red-500 mt-2">{errors[`experience_${i}`]}</div>}
              </div>
            ))}
            <button type="button" onClick={addExp} className="text-sm font-medium text-[#111111] hover:text-[#E30613]">+ Add Experience</button>
            {errors.experienceDetails && <div className="text-xs text-red-500 mt-1">{errors.experienceDetails}</div>}
          </div>
        )}

        {stepName === "Achievements" && (
          <div className="space-y-3">
            <FormLabel>Achievements (comma separated)
              <FormTextArea rows={3} value={local.achievements || ""} onChange={(e) => updateField("achievements", e.target.value)} />
            </FormLabel>
            <FormLabel>Major Projects (comma separated)
              <FormTextArea rows={3} value={local.majorProjects || ""} onChange={(e) => updateField("majorProjects", e.target.value)} />
            </FormLabel>
            <FormLabel>Leadership Roles (comma separated)
              <FormTextArea rows={3} value={local.leadershipRoles || ""} onChange={(e) => updateField("leadershipRoles", e.target.value)} />
            </FormLabel>
          </div>
        )}

        {stepName === "Motivation" && (
          <div className="space-y-3">
            <FormLabel>Why do you want to join?
              <FormTextArea rows={3} value={local.reasonToJoin || ""} onChange={(e) => updateField("reasonToJoin", e.target.value)} />
              {errors.motivation && <div className="text-xs text-red-500">{errors.motivation}</div>}
            </FormLabel>
            <FormLabel>What attracts you to this industry?
              <FormTextArea rows={3} value={local.industryAttraction || ""} onChange={(e) => updateField("industryAttraction", e.target.value)} />
            </FormLabel>
            <FormLabel>What is your five-year plan?
              <FormTextArea rows={3} value={local.fiveYearPlan || ""} onChange={(e) => updateField("fiveYearPlan", e.target.value)} />
            </FormLabel>
            <FormLabel>What unique value do you bring?
              <FormTextArea rows={3} value={local.uniqueValue || ""} onChange={(e) => updateField("uniqueValue", e.target.value)} />
            </FormLabel>
            <FormLabel>Preferred Career Path
              <FormInput value={local.preferredCareerPath || ""} onChange={(e) => updateField("preferredCareerPath", e.target.value)} />
            </FormLabel>
          </div>
        )}

        {stepName === "Skills" && (
          <div className="space-y-3">
            <FormLabel>Technical Skills (comma separated)
              <FormInput value={local.technicalSkills || ""} onChange={(e) => updateField("technicalSkills", e.target.value)} placeholder="e.g., React, Node.js, Python" />
            </FormLabel>
            <FormLabel>Digital Skills (comma separated)
              <FormInput value={local.digitalSkills || ""} onChange={(e) => updateField("digitalSkills", e.target.value)} placeholder="e.g., MS Excel, Power BI" />
            </FormLabel>
            <FormLabel>Soft Skills (comma separated)
              <FormInput value={local.softSkills || ""} onChange={(e) => updateField("softSkills", e.target.value)} placeholder="e.g., Communication, Teamwork" />
            </FormLabel>
            <FormLabel>Languages (comma separated)
              <FormInput value={local.languages || ""} onChange={(e) => updateField("languages", e.target.value)} placeholder="e.g., English, Urdu" />
            </FormLabel>
            <FormLabel>Industry Competencies (comma separated)
              <FormInput value={local.industryCompetencies || ""} onChange={(e) => updateField("industryCompetencies", e.target.value)} />
            </FormLabel>
            {errors.skills && <div className="text-xs text-red-500">{errors.skills}</div>}
          </div>
        )}

        {stepName === "Salary & Benefits" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormLabel>Current Salary (Per Month)
              <FormInput type="number" value={local.currentSalary || ""} onChange={(e) => updateField("currentSalary", e.target.value)} />
            </FormLabel>
            <FormLabel>Expected Salary (Per Month)
              <FormInput type="number" value={local.expectedSalary || ""} onChange={(e) => updateField("expectedSalary", e.target.value)} />
              {errors.expectedSalary && <div className="text-xs text-red-500">{errors.expectedSalary}</div>}
            </FormLabel>
            <div className="md:col-span-2">
              <FormLabel>Expected Benefits (comma separated)
                <FormInput value={local.expectedBenefits || ""} onChange={(e) => updateField("expectedBenefits", e.target.value)} />
              </FormLabel>
            </div>
          </div>
        )}

        {stepName === "Compliance" && (
          <div className="space-y-4">
            <FormLabel>Do you have any business with our company?</FormLabel>
            <div className="flex gap-4">
              <FormCheckbox label="No" checked={!local.businessWithCompany} onChange={() => updateField("businessWithCompany", false)} />
              <FormCheckbox label="Yes" checked={!!local.businessWithCompany} onChange={() => updateField("businessWithCompany", true)} />
            </div>
            {local.businessWithCompany && (
              <FormTextArea placeholder="If yes, details" value={local.businessWithCompanyDetails || ""} onChange={(e) => updateField("businessWithCompanyDetails", e.target.value)} rows={2} />
            )}
            
            <FormLabel>Do you have relatives employed here?</FormLabel>
            <div className="flex gap-4">
              <FormCheckbox label="No" checked={!local.relativesEmployed} onChange={() => updateField("relativesEmployed", false)} />
              <FormCheckbox label="Yes" checked={!!local.relativesEmployed} onChange={() => updateField("relativesEmployed", true)} />
            </div>
            {local.relativesEmployed && (
              <FormTextArea placeholder="If yes, details" value={local.relativesEmployedDetails || ""} onChange={(e) => updateField("relativesEmployedDetails", e.target.value)} rows={2} />
            )}

            <FormLabel>Have you previously worked here?</FormLabel>
            <div className="flex gap-4">
              <FormCheckbox label="No" checked={!local.previouslyWorked} onChange={() => updateField("previouslyWorked", false)} />
              <FormCheckbox label="Yes" checked={!!local.previouslyWorked} onChange={() => updateField("previouslyWorked", true)} />
            </div>
            {local.previouslyWorked && (
              <FormTextArea placeholder="If yes, details" value={local.previouslyWorkedDetails || ""} onChange={(e) => updateField("previouslyWorkedDetails", e.target.value)} rows={2} />
            )}

            <FormLabel>Any legal cases pending?</FormLabel>
            <div className="flex gap-4">
              <FormCheckbox label="No" checked={!local.legalCases} onChange={() => updateField("legalCases", false)} />
              <FormCheckbox label="Yes" checked={!!local.legalCases} onChange={() => updateField("legalCases", true)} />
            </div>
            {local.legalCases && (
              <FormTextArea placeholder="If yes, details" value={local.legalCasesDetails || ""} onChange={(e) => updateField("legalCasesDetails", e.target.value)} rows={2} />
            )}
          </div>
        )}

        {stepName === "Diversity" && (
          <div className="space-y-4">
            <FormCheckbox label="I have a disability" checked={!!local.disability} onChange={(e) => updateField("disability", e.target.checked)} />
            <FormCheckbox label="I am a veteran" checked={!!local.veteran} onChange={(e) => updateField("veteran", e.target.checked)} />
            <FormLabel>References (comma separated)
              <FormTextArea rows={3} value={local.references || ""} onChange={(e) => updateField("references", e.target.value)} />
            </FormLabel>
          </div>
        )}

        {stepName === "Declarations" && (
          <div className="space-y-4">
            <FormCheckbox 
              label="I confirm the information provided is accurate."
              checked={!!local.infoAccurate} 
              onChange={(e) => updateField("infoAccurate", e.target.checked)} 
            />
            <FormCheckbox 
              label="I authorize verification of all statements."
              checked={!!local.authorizeVerification} 
              onChange={(e) => updateField("authorizeVerification", e.target.checked)} 
            />
            <FormCheckbox 
              label="I confirm I have no conflict of interest."
              checked={!!local.noConflict} 
              onChange={(e) => updateField("noConflict", e.target.checked)} 
            />
             <FormCheckbox 
              label="I consent to data processing."
              checked={!!local.consentData} 
              onChange={(e) => updateField("consentData", e.target.checked)} 
            />
             <FormCheckbox 
              label="I understand this is just an application."
              checked={!!local.understandSubmission} 
              onChange={(e) => updateField("understandSubmission", e.target.checked)} 
            />
            {errors.declarations && <div className="text-xs text-red-500 mt-2">{errors.declarations}</div>}
          </div>
        )}

        {stepName === "Resume" && (
          <div>
            <FormLabel>Upload New Resume (PDF, DOC, DOCX)</FormLabel>
            <div className="mb-2">
              {currentProfile?.resume ? (
                <a href={fileUrl(currentProfile.resume)} target="_blank" rel="noreferrer" className="text-sm font-medium text-blue-600 hover:underline">
                  View current resume
                </a>
              ) : (
                <div className="text-sm text-gray-500">No resume uploaded yet</div>
              )}
            </div>
            <FormInput type="file" accept=".pdf,.doc,.docx" onChange={(e) => setResumeFile(e.target.files?.[0] || null)} />
            {resumeFile && <p className="text-sm text-gray-500 mt-2">Selected: {resumeFile.name}</p>}
            {errors.resume && <div className="text-xs text-red-500 mt-2">{errors.resume}</div>}
          </div>
        )}
        
        {!stepName && (
          <p className="text-gray-500">Profile data loaded. Select a step to begin editing.</p>
        )}

        {/* --- Actions --- */}
        <div className="mt-8 pt-6 border-t border-gray-200 flex items-center gap-4">
          <button 
            type="button"
            onClick={(e) => handleSave(e, false)} 
            disabled={loading} 
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-[#111111] text-white rounded-full shadow-lg hover:bg-[#6B6F73] transition-all transform hover:-translate-y-0.5 disabled:opacity-50"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
            {loading ? "Saving..." : "Save"}
          </button>

          <button 
            type="submit"
            onClick={(e) => handleSave(e, true)} 
            disabled={loading} 
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-[#E30613] text-white rounded-full shadow-lg hover:bg-red-700 transition-all transform hover:-translate-y-0.5 disabled:opacity-50"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : "Save & Next"}
          </button>
        </div>
      </form>
    </div>
  );
}