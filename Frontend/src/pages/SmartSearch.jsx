import React, { useState, useEffect, useMemo, useRef, createContext, useContext, useCallback } from "react";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import api, { fileUrl } from "../api";
import Sidebar from "../components/Sidebar";
import ProfileHeader from "../components/ProfileHeader";
import Footer from "../components/Footer";

const Icons = {
  Moon: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" className="text-gray-800" viewBox="0 0 16 16"><path d="M6 .278a.77.77 0 0 1 .08.858 7.2 7.2 0 0 0-.878 3.46c0 4.021 3.278 7.277 7.318 7.277q.792-.001 1.533-.16a.79.79 0 0 1 .81.316.73.73 0 0 1-.031.893A8.35 8.35 0 0 1 8.344 16C3.734 16 0 12.286 0 7.71 0 4.266 2.114 1.312 5.124.06A.75.75 0 0 1 6 .278"/></svg>,
  Sun: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" className="text-yellow-400" viewBox="0 0 16 16"><path d="M8 11a3 3 0 1 1 0-6 3 3 0 0 1 0 6m0 1a4 4 0 1 0 0-8 4 4 0 0 0 0 8M8 0a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-1 0v-2A.5.5 0 0 1 .5 0M8 13a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-1 0v-2A.5.5 0 0 1 .5 13m-5-6a.5.5 0 0 1 .5-.5h2a.5.5 0 0 1 0 1h-2a.5.5 0 0 1-.5-.5M13 8a.5.5 0 0 1 .5-.5h2a.5.5 0 0 1 0 1h-2a.5.5 0 0 1-.5-.5m-8.5-5.5a.5.5 0 0 1 .354-.146l1.414 1.414a.5.5 0 0 1-.707.707L2.146 2.854A.5.5 0 0 1 2.5 2.5m10.607 10.607a.5.5 0 0 1 .354-.146l1.414 1.414a.5.5 0 0 1-.707.707L13.146 13.854a.5.5 0 0 1 0-.707m-8.5 0a.5.5 0 0 1 .707 0L6.854 13.146a.5.5 0 0 1-.707.707L4.732 12.439a.5.5 0 0 1 .01-1.045l.003-.001M11.5 2.5a.5.5 0 0 1 .707 0L13.854 4.146a.5.5 0 0 1-.707.707L11.732 3.439a.5.5 0 0 1 .01-1.045l.003-.001z"/></svg>,
  Bars: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16"><path fillRule="evenodd" d="M2.5 12a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5m0-4a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5m0-4a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5"/></svg>,
  Search: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16"><path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001q.044.06.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1 1 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0"/></svg>,
  FileAlt: () => <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16"><path d="M14 4.5V14a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V2a2 2 0 0 1 2-2h5.5zm-3 0A1.5 1.5 0 0 1 9.5 3V1H4a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V4.5z"/></svg>,
  User: () => <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16"><path d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6m2-3a2 2 0 1 1-4 0 2 2 0 0 1 4 0m4 8c0 1-1 1-1 1H3s-1 0-1-1 1-4 6-4 6 3 6 4m-1-.004c-.001-.246-.154-.986-.832-1.664C11.516 10.68 10.289 10 8 10s-3.516.68-4.168 1.332C3.154 11.013 3.001 11.758 3 12z"/></svg>,
  Logout: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16"><path fillRule="evenodd" d="M10 12.5a.5.5 0 0 1-.5.5h-8a.5.5 0 0 1-.5-.5v-9a.5.5 0 0 1 .5-.5h8a.5.5 0 0 1 .5.5v2a.5.5 0 0 0 1 0v-2A1.5 1.5 0 0 0 9.5 2h-8A1.5 1.5 0 0 0 0 3.5v9A1.5 1.5 0 0 0 1.5 14h8a1.5 1.5 0 0 0 1.5-1.5v-2a.5.5 0 0 0-1 0v2z"/><path fillRule="evenodd" d="M15.854 8.354a.5.5 0 0 0 0-.708l-3-3a.5.5 0 0 0-.708.708L14.293 7.5H5.5a.5.5 0 0 0 0 1h8.793l-2.147 2.146a.5.5 0 0 0 .708.708l3 3a.5.5 0 0 0 .708 0z"/></svg>,
};

// 2. ErrorBoundary
class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { hasError: false, error: null }; }
  static getDerivedStateFromError(error) { return { hasError: true, error }; }
  componentDidCatch(error, errorInfo) { console.error("ErrorBoundary caught:", error, errorInfo); }
  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 text-center text-red-600 bg-red-100 rounded-lg">
          <h2 className="font-bold">Something went wrong.</h2>
        </div>
      );
    }
    return this.props.children;
  }
}

// --- Profile Modal Components ---
const dateOnly = (val) => {
  if (!val) return "-";
  const d = new Date(val);
  if (isNaN(d.getTime())) return "-";
  return d.toLocaleDateString('en-CA'); // YYYY-MM-DD format
};

const ProfileCard = ({ title, children }) => (
  <section className="bg-white border border-gray-200 rounded-lg sm:rounded-xl p-4 sm:p-5 md:p-6 shadow-sm hover:shadow-md transition-shadow">
    <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 text-gray-800">{title}</h3>
    <div className="text-xs sm:text-sm text-gray-700 space-y-1.5">{children}</div>
  </section>
);

const InfoList = ({ data }) => (
  <ul className="space-y-1.5 sm:space-y-2">
    {Object.entries(data).map(([k, v]) => (
      <li key={k} className="flex justify-between items-start gap-3 sm:gap-4">
        <span className="font-medium text-gray-500 whitespace-nowrap text-xs sm:text-sm">{k}:</span>
        <span className="font-semibold text-gray-900 text-right text-xs sm:text-sm truncate">{String(v) || "-"}</span>
      </li>
    ))}
  </ul>
);

const ProfileSections = ({ profile }) => (
  <div className="space-y-4 sm:space-y-5 md:space-y-6">
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5 lg:gap-6">
      <ProfileCard title="Personal Info">
        <InfoList
          data={{
            "Full Name": profile.name,
            "Father's Name": profile.fathersName,
            "Gender": profile.gender,
            "Date of Birth": dateOnly(profile.dob),
            "Nationality": profile.nationality,
            "CNIC": profile.cnicNumber,
            "Contact": profile.contactNumber,
            "Address": profile.currentAddress,
          }}
        />
      </ProfileCard>

      <ProfileCard title="Application Details">
        <InfoList
          data={{
            "Position Applied": profile.positionApplied,
            "Application Type": profile.applicationType,
            "Area of Interest": profile.areaOfInterest,
            "Preferred Locations": profile.preferredLocations?.join(", "),
            "Expected Salary": profile.expectedSalary ? `PKR ${Number(profile.expectedSalary).toLocaleString()}` : "-",
          }}
        />
      </ProfileCard>
    </div>

    {profile.experienceDetails?.length > 0 && (
      <ProfileCard title="Experience">
        {profile.experienceDetails.map((ex, i) => (
          <div key={i} className="py-2 sm:py-2.5 border-b border-gray-200 last:border-b-0">
            <h4 className="font-semibold text-sm sm:text-base">{ex.jobTitle} at {ex.organization}</h4>
            <p className="text-xs sm:text-sm text-gray-500">{dateOnly(ex.from)} - {dateOnly(ex.to)}</p>
            <p className="mt-1 text-sm">{ex.responsibilities}</p>
          </div>
        ))}
      </ProfileCard>
    )}

    {profile.education?.length > 0 && (
      <ProfileCard title="Education">
        {profile.education.map((ed, i) => (
          <div key={i} className="py-2 sm:py-2.5 border-b border-gray-200 last:border-b-0">
            <h4 className="font-semibold text-sm sm:text-base">{ed.highestQualification} in {ed.major}</h4>
            <p className="text-xs sm:text-sm text-gray-500">{ed.institution} ({ed.graduationYear})</p>
            <p className="text-sm">CGPA: {ed.cgpa}</p>
          </div>
        ))}
      </ProfileCard>
    )}

    <ProfileCard title="Skills">
      <InfoList
        data={{
          "Technical Skills": profile.technicalSkills?.join(", ") || "-",
          "Soft Skills": profile.softSkills?.join(", ") || "-",
          "Languages": profile.languages?.join(", ") || "-",
        }}
      />
    </ProfileCard>
  </div>
);

const ProfileModal = ({ profile, onClose }) => {
  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-3 sm:p-4 md:p-6 animate-fadeIn"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-gray-50 rounded-lg sm:rounded-2xl w-full max-w-2xl sm:max-w-3xl md:max-w-4xl shadow-lg sm:shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 bg-white border-b">
          <h3 className="text-base sm:text-lg font-semibold">Applicant Profile</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl sm:text-3xl leading-none transition">
            &times;
          </button>
        </div>
        <div className="p-4 sm:p-6 overflow-y-auto flex-1">
          {profile ? (
            <ProfileSections profile={profile} />
          ) : (
            <div className="flex justify-center items-center h-40 sm:h-48">
              <Loader2 className="animate-spin text-3xl sm:text-4xl text-gray-700" />
            </div>
          )}
        </div>
        <div className="flex justify-end gap-2 sm:gap-3 border-t bg-white px-4 sm:px-6 py-3 sm:py-4 rounded-b-lg sm:rounded-b-2xl">
          <button
            type="button"
            onClick={onClose}
            className="px-4 sm:px-5 py-1.5 sm:py-2 border rounded-full text-xs sm:text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 transition font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

const ApplicantCard = ({ applicant, onViewProfile }) => {
  const [avatarError, setAvatarError] = useState(false);
  
  const avatarUrl =
    applicant.profilePicture && !avatarError
      ? fileUrl(applicant.profilePicture)
      : `https://ui-avatars.com/api/?name=${encodeURIComponent(
          applicant.name || "A"
        )}&background=EBF4FF&color=2563EB`;
  
  const handleAvatarError = () => {
    setAvatarError(true);
  };
  
  const latestExperience = useMemo(() => {
    if (!applicant.experienceDetails || applicant.experienceDetails.length === 0) {
      return "No experience listed";
    }
    const sortedExp = [...applicant.experienceDetails].sort((a, b) => {
      const dateA = a.to ? new Date(a.to) : new Date();
      const dateB = b.to ? new Date(b.to) : new Date();
      return dateB - dateA;
    });
    return `${sortedExp[0].jobTitle} at ${sortedExp[0].organization}`;
  }, [applicant.experienceDetails]);

  return (
    <motion.div
      className="bg-white rounded-lg sm:rounded-xl shadow-md hover:shadow-xl transition-all duration-300 flex flex-col h-full"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
    >
      <div className="p-4 sm:p-5 md:p-6 flex-1 flex flex-col">
        <div className="flex items-start gap-3 sm:gap-4 mb-4">
          <img
            src={avatarUrl}
            alt={applicant.name}
            onError={handleAvatarError}
            className="w-12 sm:w-14 md:w-16 h-12 sm:h-14 md:h-16 rounded-full object-cover border-3 sm:border-4 border-gray-100 flex-shrink-0"
          />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-base sm:text-lg md:text-xl font-bold text-gray-900 truncate" title={applicant.name}>
                {applicant.name}
              </h3>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-800 flex-shrink-0">
                External
              </span>
            </div>
            <p className="text-xs sm:text-sm text-gray-500 truncate" title={applicant.email}>
              {applicant.email}
            </p>
          </div>
        </div>

        <div className="flex-1 space-y-2 sm:space-y-3 mb-4">
          <div className="flex items-start gap-2 sm:gap-3">
            <span className="text-blue-600 mt-0.5 flex-shrink-0 text-sm sm:text-base"><Icons.User /></span>
            <p className="text-xs sm:text-sm text-gray-600 line-clamp-2">
              <span className="font-semibold text-gray-800">Latest Role: </span>
              {latestExperience}
            </p>
          </div>
          <div className="flex items-start gap-2 sm:gap-3">
            <span className="text-blue-600 mt-0.5 flex-shrink-0 text-sm sm:text-base"><Icons.FileAlt /></span>
            <p className="text-xs sm:text-sm text-gray-600">
              <span className="font-semibold text-gray-800">Applications: </span>
              {applicant.applicationCount}
            </p>
          </div>
        </div>

        <div className="flex gap-2 mt-4">
          <a
            href={applicant.resume ? fileUrl(applicant.resume) : "#"}
            target={applicant.resume ? "_blank" : "_self"}
            rel="noreferrer"
            onClick={(e) => !applicant.resume && e.preventDefault()}
            className={`flex items-center justify-center gap-1 sm:gap-1.5 flex-1 px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm rounded-lg font-medium transition ${
              applicant.resume
                ? "bg-blue-100 text-blue-700 hover:bg-blue-200"
                : "bg-gray-100 text-gray-400 cursor-not-allowed"
            }`}
          >
            <Icons.FileAlt /> <span className="hidden sm:inline">Resume</span>
          </a>
          <button
            onClick={onViewProfile}
            className="flex items-center justify-center gap-1 sm:gap-1.5 flex-1 px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm rounded-lg font-medium bg-gray-700 text-white hover:bg-gray-900 transition"
          >
            <Icons.User /> <span className="hidden sm:inline">Profile</span>
          </button>
        </div>
      </div>
    </motion.div>
  );
};

const SkeletonCard = () => (
  <div className="bg-white rounded-lg sm:rounded-xl shadow-md p-4 sm:p-5 md:p-6 animate-pulse">
    <div className="flex items-center gap-3 sm:gap-4 mb-4">
      <div className="w-12 sm:w-14 md:w-16 h-12 sm:h-14 md:h-16 rounded-full bg-gray-200 flex-shrink-0"></div>
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
      </div>
    </div>
    <div className="space-y-2 sm:space-y-3 mb-4">
      <div className="h-3 bg-gray-200 rounded w-full"></div>
      <div className="h-3 bg-gray-200 rounded w-5/6"></div>
    </div>
    <div className="flex gap-2 mt-4">
      <div className="h-8 sm:h-9 bg-gray-200 rounded-lg flex-1"></div>
      <div className="h-8 sm:h-9 bg-gray-200 rounded-lg flex-1"></div>
    </div>
  </div>
);

const EmptyState = ({ query }) => (
  <div className="col-span-1 sm:col-span-2 lg:col-span-3 py-12 sm:py-16 md:py-20 flex flex-col items-center justify-center text-center px-4">
    <div className="bg-gray-100 p-4 sm:p-5 md:p-6 rounded-full mb-4 sm:mb-6">
      <Icons.Search className="w-10 sm:w-12 md:w-16 h-10 sm:h-12 md:h-16 text-gray-400" />
    </div>
    <h3 className="text-lg sm:text-xl md:text-2xl font-semibold text-gray-800 mb-2">
      {query ? "No External Applicants Found" : "Find External Talent"}
    </h3>
    <p className="text-sm sm:text-base text-gray-500 max-w-md">
      {query 
        ? "Try a different keyword or check your spelling. We show only external applicants, not internal MMCL staff." 
        : "Search above to find external applicants by skills, university, name, and more."
      }
    </p>
  </div>
);

const FilterInput = ({ label, value, onChange, name, placeholder }) => (
  <div className="w-full sm:flex-1 sm:min-w-[140px] md:min-w-[160px]">
    <label htmlFor={name} className="block text-xs sm:text-sm font-medium text-gray-600 mb-1.5">{label}</label>
    <input
      type="text"
      id={name}
      name={name}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className="w-full px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg border border-gray-300 bg-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#111] focus:border-transparent transition duration-200"
    />
  </div>
);

export default function SmartSearch() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState({
    university: "",
    major: "",
    skills: "",
    location: ""
  });
  
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState(null);
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [fullProfileLoading, setFullProfileLoading] = useState(false);
  const searchTimeoutRef = useRef(null);
  
  const user = JSON.parse(localStorage.getItem("loggedInUser"));
  const role = user?.role || "recruiter";
  const [active, setActive] = useState("Smart Search"); 

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = "/login";
  };
  
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleSearch = useCallback((page = 1) => {
    // Check if all fields are empty
    if (
      !query.trim() &&
      !filters.university.trim() &&
      !filters.major.trim() &&
      !filters.skills.trim() &&
      !filters.location.trim()
    ) {
      setResults([]);
      setPagination(null);
      return;
    }

    setLoading(true);
    
    // Build query string
    let queryString = `query=${encodeURIComponent(query)}&page=${page}`;
    if (filters.university) queryString += `&university=${encodeURIComponent(filters.university)}`;
    if (filters.major) queryString += `&major=${encodeURIComponent(filters.major)}`;
    if (filters.skills) queryString += `&skills=${encodeURIComponent(filters.skills)}`;
    if (filters.location) queryString += `&location=${encodeURIComponent(filters.location)}`;
    
    // Use the API route defined in your backend
    api.get(`/search/searchApplicants?${queryString}`)
      .then(res => {
        if (res.data?.applicants) {
          // Filter to show ONLY external users (non-MMCL emails)
          // Exclude all MMCL internal email domains
          const filteredApplicants = res.data.applicants.filter(applicant => {
            const email = applicant.email?.toLowerCase() || "";
            // Show only if email does NOT end with @mmcl.com.pk, @mmcl.com, or contain mmcl domain
            return !email.endsWith("@mmcl.com.pk") && 
                   !email.endsWith("@mmcl.com") &&
                   !email.includes("mmcl");
          });
          setResults(filteredApplicants);
          setPagination(res.data.pagination);
        } else {
          setResults([]);
        }
      })
      .catch(err => {
        console.error("Search error:", err);
        toast.error(err.response?.data?.message || err.message || "Search failed");
        setResults([]);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [query, filters]);

  // Live search effect - triggers on query or filter change
  useEffect(() => {
    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Check if at least one field has value
    const hasSearchCriteria =
      query.trim() ||
      filters.university.trim() ||
      filters.major.trim() ||
      filters.skills.trim() ||
      filters.location.trim();

    if (!hasSearchCriteria) {
      setResults([]);
      setPagination(null);
      return;
    }

    // Debounce search - wait 500ms after user stops typing
    searchTimeoutRef.current = setTimeout(() => {
      handleSearch(1);
    }, 500);

    // Cleanup on unmount
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [query, filters, handleSearch]);

  // Handle "View Full Profile" click
  const handleViewProfile = useCallback(async (profileStub) => {
    if (!profileStub?.user) {
      toast.error("Unable to load profile: Invalid user ID");
      return;
    }
    
    setFullProfileLoading(true);
    setSelectedProfile({ name: profileStub.name }); // Show modal with basic info
    try {
      // Fetch the *full* profile data
      const res = await api.get(`/search/profile/user/${profileStub.user}`);
      if (res.data?.profile) {
        setSelectedProfile(res.data.profile); // Replace stub with full profile
      } else {
        throw new Error("No profile data received");
      }
    } catch (err) {
      console.error("Profile fetch error:", err);
      toast.error(err.response?.data?.message || "Could not load full profile");
      setSelectedProfile(null); // Close modal on error
    } finally {
      setFullProfileLoading(false);
    }
  }, []);

  const handlePageChange = useCallback((newPage) => {
    if (newPage > 0 && newPage <= pagination.totalPages) {
      handleSearch(newPage);
      // Scroll to top of results
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [pagination?.totalPages, handleSearch]);

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-100 to-gray-200">
      <Sidebar
        role={role}
        active={active}
        setActive={setActive}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
      />
      
      <main className="flex-1 flex flex-col overflow-auto text-gray-800">
        <ProfileHeader
          title="Talent Pool"
          subtitle="Search the entire applicant database for keywords, skills, and more."
          showMenuButton={true}
          onMenuClick={() => setSidebarOpen(true)}
        />

        <div className="p-3 sm:p-4 md:p-5 lg:p-6 flex-1 overflow-y-auto">
          {/* Main Search Bar */}
          <div className="relative mb-4 sm:mb-5 md:mb-6">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name, role, or keywords..."
              className="w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-2.5 sm:py-3 md:py-3.5 rounded-lg sm:rounded-xl shadow-md md:shadow-lg border border-gray-200 bg-white text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-[#111] focus:border-transparent transition duration-200"
            />
            <span className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-gray-400 text-base sm:text-lg flex-shrink-0">
              <Icons.Search />
            </span>
          </div>

          {/* --- Filter Bar --- */}
          <motion.div
            className="flex flex-col gap-2 sm:gap-3 md:gap-4 mb-4 sm:mb-5 md:mb-6 p-3 sm:p-4 md:p-5 bg-white rounded-lg sm:rounded-xl shadow-md md:shadow-lg"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 md:gap-4">
              <FilterInput 
                label="University" 
                name="university"
                value={filters.university} 
                onChange={handleFilterChange} 
                placeholder="e.g., SZABIST" 
              />
              <FilterInput 
                label="Major / Field" 
                name="major"
                value={filters.major} 
                onChange={handleFilterChange} 
                placeholder="e.g., BBA" 
              />
              <FilterInput 
                label="Skills" 
                name="skills"
                value={filters.skills} 
                onChange={handleFilterChange} 
                placeholder="e.g., React, Node" 
              />
              <FilterInput 
                label="Location" 
                name="location"
                value={filters.location} 
                onChange={handleFilterChange} 
                placeholder="e.g., Karachi" 
              />
            </div>
          </motion.div>

          {/* Results Grid */}
          <ErrorBoundary>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-5 lg:gap-6">
              {loading && results.length === 0 ? (
                [...Array(6)].map((_, i) => <SkeletonCard key={i} />)
              ) : !loading && results.length === 0 ? (
                <EmptyState query={query} />
              ) : (
                results.map(app => (
                  <ApplicantCard 
                    key={app._id} 
                    applicant={app} 
                    onViewProfile={() => handleViewProfile(app)} 
                  />
                ))
              )}
            </div>

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <div className="flex items-center justify-center mt-6 sm:mt-8 md:mt-10">
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 p-2.5 sm:p-3 md:p-4 bg-white rounded-lg sm:rounded-xl shadow-md">
                  <button
                    onClick={() => handlePageChange(pagination.currentPage - 1)}
                    disabled={pagination.currentPage <= 1}
                    className="px-3 sm:px-4 md:px-5 py-2 sm:py-2.5 bg-white border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 font-medium text-xs sm:text-sm transition duration-200"
                  >
                    Previous
                  </button>
                  <span className="text-xs sm:text-sm text-gray-700 px-2 sm:px-4 py-2 sm:py-2.5 text-center whitespace-nowrap">
                    Page {pagination.currentPage} of {pagination.totalPages}
                  </span>
                  <button
                    onClick={() => handlePageChange(pagination.currentPage + 1)}
                    disabled={pagination.currentPage >= pagination.totalPages}
                    className="px-3 sm:px-4 md:px-5 py-2 sm:py-2.5 bg-white border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 font-medium text-xs sm:text-sm transition duration-200"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </ErrorBoundary>
        </div>
      <Footer />
      </main>

      {/* View Full Profile Modal */}
      {selectedProfile && (
        <ProfileModal
          profile={fullProfileLoading ? null : selectedProfile}
          onClose={() => setSelectedProfile(null)}
        />
      )}
    </div>
  );
}
