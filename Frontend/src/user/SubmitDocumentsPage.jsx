import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom'; 
import { toast } from 'react-hot-toast';
import api from '../api';
import Sidebar from '../components/Sidebar';
import ProfileHeader from '../components/ProfileHeader';
import { Loader2, UploadCloud, FileText, Edit, CheckCircle, AlertTriangle } from 'lucide-react';
import Footer from '../components/Footer';

import { FaBars, FaSpinner } from "react-icons/fa"; 

const REQUIRED_DOCUMENTS = [
  "CNIC (Front)",
  "CNIC (Back)",
  "Passport Size Photo",
  "Educational Certificates",
  "Experience Letters",
];

const isReadyForOnboarding = (code) => {
  return ['hired', 'onboarding', 'onboarding-complete'].includes(code);
};

const EmploymentFormTask = ({ app }) => {
  const isSubmitted = !!app.employmentFormData;
  
  return (
    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-full ${isSubmitted ? 'bg-green-100' : 'bg-yellow-100'}`}>
          {isSubmitted ? <CheckCircle className="w-5 h-5 text-green-600" /> : <AlertTriangle className="w-5 h-5 text-yellow-600" />}
        </div>
        <div>
          <h4 className="font-semibold text-gray-800">Task 1: Employment Form</h4>
          <p className={`text-sm ${isSubmitted ? 'text-green-600' : 'text-yellow-600'}`}>
            Status: {isSubmitted ? 'Submitted' : 'Pending'}
          </p>
        </div>
      </div>
      <Link
        to={`/me/applications/${app._id}/employment-form`}
        className={`inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-full shadow-md transition ${
          isSubmitted 
          ? 'bg-[#111111] text-white hover:bg-[#6B6F73]' // Dark button for "Edit"
          : 'bg-[#E30613] text-white hover:bg-red-700' // Red button for "Fill"
        }`}
      >
        {isSubmitted ? <Edit size={16} /> : <FileText size={16} />}
        {isSubmitted ? 'View/Edit Form' : 'Fill Form'}
      </Link>
    </div>
  );
};

const DocumentUploadTask = ({ app }) => {
  const totalDocsRequired = REQUIRED_DOCUMENTS.length;
  const approvedDocsCount = useMemo(() => {
    return app.onboardingDocuments.filter(doc => doc.status === 'approved').length;
  }, [app.onboardingDocuments]);
  
  const progressPercent = (approvedDocsCount / totalDocsRequired) * 100;
  const isComplete = approvedDocsCount === totalDocsRequired;

  return (
    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-full ${isComplete ? 'bg-green-100' : 'bg-gray-100'}`}>
          {isComplete ? <CheckCircle className="w-5 h-5 text-green-600" /> : <UploadCloud className="w-5 h-5 text-gray-600" />}
        </div>
        <div className="flex-1">
          <h4 className="font-semibold text-gray-800">Task 2: Upload Documents</h4>
          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
            <div 
              className="bg-[#111111] h-2.5 rounded-full transition-all" 
              style={{ width: `${progressPercent}%` }}
            ></div>
          </div>
          <p className="text-xs text-gray-600 mt-1">
            {approvedDocsCount} of {totalDocsRequired} documents approved.
          </p>
        </div>
      </div>
      <Link
        to={`/me/applications/${app._id}/onboarding`}
        className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-semibold bg-[#111111] text-white rounded-full shadow-md hover:bg-[#6B6F73] transition"
      >
        <UploadCloud size={16} />
        Upload/Review
      </Link>
    </div>
  );
};

// Main Component
export default function SubmitDocumentsPage() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [active, setActive] = useState("Submit Documents");
  
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("loggedInUser"));
  const role = user?.role || "user";
  const token = localStorage.getItem("token"); 

  // Filter logic remains the same
  const onboardingApps = useMemo(() => {
    return applications.filter(app => isReadyForOnboarding(app.currentStatus?.code));
  }, [applications]);

  useEffect(() => {
    if (!token) {
      toast.error("Please log in to view this page.");
      navigate("/login");
      return;
    }

    const fetchMyApplications = async () => {
      setLoading(true);
      try {
        const res = await api.get("/auth/myApplications"); 
        setApplications(res.data || []);
      } catch (error) {
        toast.error("Failed to load your applications.");
      } finally {
        setLoading(false);
      }
    };
    fetchMyApplications();
  }, [token, navigate]);

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
          title="Submit Onboarding Documents"
          subtitle="Complete your employment form and upload required documents."
          showMenuButton={true} // --- HAMBURGER FIX ---
          onMenuClick={() => setSidebarOpen(true)} // --- HAMBURGER FIX ---
        />

        <div className="p-4 md:p-6 max-w-7xl mx-auto"> {/* THEME: Changed to 7xl for grid */}
          {loading ? (
            <div className="flex justify-center items-center h-64 text-gray-600">
              <FaSpinner className="animate-spin text-4xl text-gray-700" />
              <p className="ml-3 text-lg">Loading Tasks...</p>
            </div>
          ) : onboardingApps.length === 0 ? (
            <div className="bg-white p-8 rounded-xl shadow-lg text-center max-w-4xl mx-auto"> {/* Centered */}
              <FileText className="h-12 w-12 mx-auto text-gray-400" />
              <h3 className="text-xl font-semibold text-gray-800 mt-4">No Onboarding Tasks Found</h3>
              <p className="text-gray-500 mt-2">You do not have any pending onboarding tasks.</p>
            </div>
          ) : (
            // --- THIS IS THE FIX: Changed from space-y-6 to a grid ---
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {onboardingApps.map((app) => (
                <div
                  key={app._id}
                  className="bg-white p-6 rounded-xl shadow-lg border-t-4 border-[#E30613] flex flex-col" // Added flex-col
                >
                  <div className="flex flex-col sm:flex-row justify-between items-start">
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900">
                        {app.job?.title || "Job Title Missing"}
                      </h3>
                      <p className="text-md text-gray-500 mt-1">
                        {app.job?.department} | {app.job?.location}
                      </p>
                    </div>
                    {app.currentStatus.code === 'onboarding-complete' && (
                       <span className="mt-2 sm:mt-0 px-3 py-1 text-sm font-medium rounded-full bg-green-100 text-green-800 flex items-center gap-1.5 flex-shrink-0">
                         <CheckCircle size={14}/> Completed
                       </span>
                    )}
                  </div>
                  
                  <div className="mt-6 space-y-4 flex-1 flex flex-col justify-end"> 
                    <EmploymentFormTask app={app} />
                    {app.employmentFormData && (
                      <DocumentUploadTask app={app} />
                    )}
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