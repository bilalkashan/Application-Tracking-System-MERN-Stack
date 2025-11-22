import React, { useState, useEffect, useMemo, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import api, { fileUrl } from "../api";
import Sidebar from "../components/Sidebar";
import ProfileHeader from "../components/ProfileHeader";
import {
  Loader2, CheckCircle, XCircle, AlertTriangle,
  Check, UserCheck, X, ChevronLeft, User, Mail, FileCheck, Download, Eye
} from "lucide-react";
import { FaSpinner, FaBars } from "react-icons/fa";
import { REQUIRED_DOCUMENTS } from "../constants"; // Assuming you have this constant file
import Footer from "../components/Footer";

// --- Reusable Themed DocumentReviewRow ---
const DocumentReviewRow = ({ app, doc, onReviewSuccess }) => {
  const [loading, setLoading] = useState(false);

  const handleReview = async (status) => {
    let comment = '';
    if (status === 'rejected') {
      comment = prompt(`Please provide a reason for rejecting "${doc.documentType}":`);
      if (comment === null) return;
      if (!comment) {
        toast.error("A comment is required to reject a document.");
        return;
      }
    }

    setLoading(true);
    try {
      const res = await api.patch(`/applications/${app._id}/review-document`, {
        documentType: doc.documentType,
        status,
        comment
      });
      onReviewSuccess(res.data);
      toast.success(`Document ${status}.`);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to review document.");
    } finally {
      setLoading(false);
    }
  };

  let statusColor = "text-yellow-600";
  let statusIcon = <AlertTriangle size={14} />;
  let statusText = "Pending";

  if (!doc.filePath) {
    statusText = "Not Uploaded";
    statusColor = "text-gray-400";
    statusIcon = <XCircle size={14} />;
  } else if (doc.status === 'approved') {
    statusColor = "text-green-600";
    statusIcon = <CheckCircle size={14} />;
    statusText = "Approved";
  } else if (doc.status === 'rejected') {
    statusColor = "text-red-600";
    statusIcon = <XCircle size={14} />;
    statusText = "Rejected";
  }

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-gray-50 rounded-lg border gap-3">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-800">{doc.documentType}</p>
        <div className={`text-xs flex items-center gap-1 mt-1 ${statusColor}`}>
          {statusIcon} <span>{statusText}</span>
        </div>
        {doc.filePath && (
          <a
            href={fileUrl(doc.filePath)}
            target="_blank"
            rel="noreferrer"
            className="text-xs text-blue-600 hover:underline truncate"
            title={doc.fileName}
          >
            {doc.fileName || 'View Uploaded File'}
          </a>
        )}
        {doc.status === 'rejected' && (
          <p className="text-xs text-red-600 mt-1">Comment: {doc.rejectionComment}</p>
        )}
      </div>
      <div className="flex items-center gap-2 flex-shrink-0 self-end sm:self-center">
        {loading ? (
          <Loader2 size={16} className="animate-spin text-gray-400" />
        ) : (
          doc.filePath && (
            <>
              {doc.status !== 'approved' && (
                <button
                  onClick={() => handleReview('approved')}
                  className="p-2 text-green-600 hover:bg-green-100 rounded-full transition"
                  title="Approve"
                >
                  <Check size={18} />
                </button>
              )}
              {doc.status !== 'rejected' && (
                <button
                  onClick={() => handleReview('rejected')}
                  className="p-2 text-red-600 hover:bg-red-100 rounded-full transition" // THEME
                  title="Reject"
                >
                  <X size={18} />
                </button>
              )}
            </>
          )
        )}
      </div>
    </div>
  );
};

// --- Reusable Themed CandidateDetailView ---
const CandidateDetailView = ({ app, onReviewSuccess, onCompleteOnboarding, onBack }) => {
  const submittedDocs = app.onboardingDocuments || [];
  const [pdfLoading, setPdfLoading] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);

  const totalDocsRequired = REQUIRED_DOCUMENTS.length;
  const approvedDocsCount = submittedDocs.filter(d => d.status === 'approved').length;
  const allUploadedDocsApproved = approvedDocsCount === totalDocsRequired;

  const canCompleteOnboarding = allUploadedDocsApproved && !!app.employmentFormData;

  const handleDownloadPdf = async () => {
    setPdfLoading(true);
    try {
      const response = await api.get(`/applications/${app._id}/download-employment-form-pdf`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      const filename = `EmploymentForm_${app.applicant.name.replace(/\s+/g, '_')}_${app._id}.pdf`;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to download PDF.");
      console.error("PDF Download error:", error);
    } finally {
      setPdfLoading(false);
    }
  };

  const handlePreviewPdf = async () => {
    setPreviewLoading(true);
    try {
      const response = await api.get(`/applications/${app._id}/preview-employment-form-pdf`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      window.open(url);
    } catch (error) {
      try {
        const errText = await error.response.data.text();
        const errJson = JSON.parse(errText);
        toast.error(errJson.message || "Failed to generate preview.");
      } catch (parseError) {
        toast.error("Failed to generate preview PDF.");
      }
      console.error("PDF Preview error:", error);
    } finally {
      setPreviewLoading(false);
    }
  };

  return (
    <div className="bg-white p-4 sm:p-6 md:p-8 rounded-xl shadow-lg border max-w-4xl mx-auto animate-fade-in">
      {/* Back Button */}
      <button
        onClick={onBack}
        className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 font-medium mb-6"
      >
        <ChevronLeft size={18} />
        Back to Candidate List
      </button>

      {/* --- RESPONSIVE: Candidate Header --- */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-gray-300 pb-4 mb-6">
        <div>
          <h3 className="text-3xl font-bold text-gray-900">{app.applicant.name}</h3>
          <p className="text-sm text-gray-500 flex items-center gap-2 mt-2">
            <Mail size={14} /> {app.applicant.email}
          </p>
          <p className="text-sm text-gray-600 font-medium mt-1">
            For: {app.job?.title || 'N/A'}
          </p>
        </div>
        <div className="text-left sm:text-right mt-3 sm:mt-0 space-y-1.5 flex-shrink-0">
          <span className={`block w-full text-center px-3 py-1 text-xs font-medium rounded-full ${
            app.employmentFormData ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
          }`}>
            Employment Form: {app.employmentFormData ? 'Submitted' : 'Pending'}
          </span>
          <span className={`block w-full text-center px-3 py-1 text-xs font-medium rounded-full ${
            allUploadedDocsApproved ? 'bg-green-100 text-green-800' : (approvedDocsCount > 0 ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800')
          }`}>
            Other Documents: {approvedDocsCount} / {totalDocsRequired} Approved
          </span>
        </div>
      </div>

      {/* Employment Form Section */}
      <div className="p-4 bg-gray-50 rounded-lg border mb-6">
        <h4 className="text-lg font-semibold text-gray-800 mb-3">Employment Form</h4>
        {app.employmentFormData ? (
          <div className="flex flex-col sm:flex-row flex-wrap gap-3">
            <button
              onClick={handleDownloadPdf}
              disabled={pdfLoading || previewLoading}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm bg-[#111111] text-white rounded-full hover:bg-[#6B6F73] transition disabled:bg-gray-400 shadow-sm"
            >
              {pdfLoading ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
              {pdfLoading ? 'Generating...' : 'Download Filled Form'}
            </button>
            <button
              onClick={handlePreviewPdf}
              disabled={previewLoading || pdfLoading}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm bg-gray-500 text-white rounded-full hover:bg-gray-600 transition disabled:bg-gray-300 shadow-sm"
            >
              {previewLoading ? <Loader2 size={16} className="animate-spin" /> : <Eye size={16} />}
              {previewLoading ? 'Generating...' : 'Preview'}
            </button>
          </div>
        ) : (
          <div className="text-sm text-yellow-800 bg-yellow-50 border border-yellow-200 p-3 rounded-md flex items-center gap-2">
            <AlertTriangle size={16} />
            <span>The candidate has not submitted the online employment form yet.</span>
          </div>
        )}
      </div>
      
      {/* Uploaded Documents Section */}
      <h4 className="text-xl font-semibold mb-4 text-gray-800">Uploaded Documents</h4>
      <div className="space-y-3">
        {REQUIRED_DOCUMENTS.map(docName => (
          <DocumentReviewRow
            key={docName}
            app={app}
            doc={submittedDocs.find(d => d.documentType === docName) || { documentType: docName, status: 'pending', filePath: null, fileName: null }}
            onReviewSuccess={onReviewSuccess}
          />
        ))}
      </div>

      {/* Final Action Button */}
      <div className="mt-10 border-t border-gray-200 pt-6 text-right">
        <button
          onClick={() => onCompleteOnboarding(app)}
          disabled={!canCompleteOnboarding}
          className="inline-flex items-center gap-2 px-6 py-3 text-base bg-[#E30613] text-white rounded-full shadow-md hover:bg-red-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
          title={!canCompleteOnboarding ? "Employment form must be submitted and all other documents approved" : "Complete Onboarding Process"}
        >
          <UserCheck size={20} />
          Complete Onboarding
        </button>
      </div>
    </div>
  );
};

// --- Reusable Themed CandidateSummaryRow ---
const CandidateSummaryRow = ({ app, onReviewClick }) => {
  const submittedDocs = app.onboardingDocuments || [];
  const hasFormData = !!app.employmentFormData;
  const totalDocsRequired = REQUIRED_DOCUMENTS.length;
  const approvedDocsCount = submittedDocs.filter(d => d.status === 'approved').length;
  const hasRejected = submittedDocs.some(d => d.status === 'rejected');
  const allUploadedApproved = approvedDocsCount === totalDocsRequired;

  let statusText = `Form: ${hasFormData ? '✅' : '⏳'} | Docs: ${approvedDocsCount}/${totalDocsRequired}`;
  let statusColor = "bg-gray-100 text-gray-800"; // Default pending

  if (hasRejected) {
    statusText = "Rejected Items";
    statusColor = "bg-red-100 text-red-800";
  } else if (hasFormData && allUploadedApproved) {
    statusText = "Ready to Complete";
    statusColor = "bg-green-100 text-green-800";
  } else if (hasFormData || approvedDocsCount > 0) {
    const formStatus = hasFormData ? 'Form Submitted' : 'Form Pending';
    const docStatus = `${approvedDocsCount}/${totalDocsRequired} Docs Approved`;
    statusText = `In Progress (${formStatus}, ${docStatus})`;
    statusColor = "bg-yellow-100 text-yellow-800";
  }

  return (
    <div className="bg-white p-4 rounded-xl shadow-lg border border-gray-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 transition hover:shadow-xl hover:border-gray-300">
      {/* Candidate Info */}
      <div className="flex-1 min-w-0">
        <h4 className="text-lg font-semibold text-[#111111] truncate">{app.applicant.name}</h4>
        <p className="text-sm text-gray-500 flex items-center gap-2 truncate">
          <Mail size={14} /> {app.applicant.email}
        </p>
      </div>
      {/* Status Badge */}
      <div className="flex-shrink-0 text-left sm:text-right w-full sm:w-auto mt-2 sm:mt-0">
        <span className={`inline-block px-3 py-1 text-xs font-medium rounded-full ${statusColor}`}>
          {statusText}
        </span>
      </div>
        {/* Review Button */}
      <div className="flex-shrink-0 w-full sm:w-auto mt-2 sm:mt-0">
        <button
          onClick={onReviewClick}
          className="w-full sm:w-auto inline-flex justify-center items-center gap-2 px-5 py-2.5 text-sm font-semibold bg-[#E30613] text-white rounded-full shadow-md hover:bg-red-700 transition"
        >
          <FileCheck size={16} />
          Review Documents
        </button>
      </div>
    </div>
  );
};

export default function OnboardingReviewPage() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedAppId, setSelectedAppId] = useState(null);

  const user = JSON.parse(localStorage.getItem("loggedInUser"));
  const role = user?.role || "hr";
  const navigate = useNavigate();

  // Fetch candidate list on mount
  const fetchCandidates = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get("/applications/onboarding/list");
      setApplications(res.data || []);
    } catch (error) {
      const errorMsg = error.response?.data?.message || "Failed to load candidates.";
      setError(errorMsg);
      console.error("Fetch candidates error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCandidates();
  }, []);

  // Callback when a document review is successful
  const handleReviewSuccess = (updatedApp) => {
    setApplications(prevApps =>
      prevApps.map(app => app._id === updatedApp._id ? updatedApp : app)
    );
     if (selectedAppId === updatedApp._id) {
       setSelectedAppId(null); 
       setTimeout(() => setSelectedAppId(updatedApp._id), 0); 
     }
  };

  // Callback when onboarding is completed
  const handleCompleteOnboarding = async (app) => {
    if (!window.confirm(`Are you sure you want to mark onboarding as complete for ${app.applicant.name}?`)) return;

    try {
      const res = await api.patch(`/applications/${app._id}/complete-onboarding`);
      setApplications(prevApps =>
        prevApps.map(a => a._id === res.data._id ? res.data : a)
      );
      setSelectedAppId(null); 
      toast.success("Onboarding Marked as Complete!");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to complete onboarding.");
      console.error("Complete onboarding error:", error);
    }
  };

  const selectedApp = useMemo(() =>
    applications.find(a => a._id === selectedAppId)
  , [applications, selectedAppId]);

  const [jobsWithPendingCandidates, completedApps] = useMemo(() => {
    const pending = applications.filter(a => a.currentStatus.code !== 'onboarding-complete');
    const completed = applications.filter(a => a.currentStatus.code === 'onboarding-complete');

    const jobsMap = pending.reduce((acc, app) => {
      const jobId = app.job?._id || 'unknown_job';
      const jobTitle = app.job?.title || "Unknown Job";
      if (!acc[jobId]) {
        acc[jobId] = { _id: jobId, title: jobTitle, candidates: [] };
      }
      acc[jobId].candidates.push(app);
      return acc;
    }, {});

    return [Object.values(jobsMap), completed];
  }, [applications]);
  
  const renderLoading = () => (
    <div className="flex items-center justify-center h-[calc(100vh-200px)]">
      <FaSpinner className="animate-spin text-4xl text-gray-700" />
      <p className="ml-3 text-lg text-gray-600">Loading Candidates...</p>
    </div>
  );
  
  const renderError = () => (
    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg m-6" role="alert">
    <strong className="font-bold">Error: </strong>
    <span className="block sm:inline">{error}</span>
    </div>
  );

  const renderContent = () => {
    if (loading) {
      return renderLoading();
    }

    if (error) {
      return renderError();
    }

    if (selectedApp) {
      return (
        <CandidateDetailView
          app={selectedApp}
          onReviewSuccess={handleReviewSuccess}
          onCompleteOnboarding={handleCompleteOnboarding}
          onBack={() => setSelectedAppId(null)}
        />
      );
    }

    const totalPending = jobsWithPendingCandidates.reduce((sum, job) => sum + job.candidates.length, 0);
    if (totalPending === 0 && completedApps.length === 0) {
      return (
        <div className="bg-white p-8 rounded-xl shadow-lg text-center">
          <CheckCircle className="h-12 w-12 mx-auto text-green-500" />
          <h3 className="text-xl font-semibold text-gray-800 mt-4">All Clear!</h3>
          <p className="text-gray-500 mt-2">No candidates are currently in the onboarding process.</p>
        </div>
      );
    }

    return (
      <>
        <section>
          <h2 className="text-3xl font-bold text-[#E30613] mb-6 border-b border-gray-300 pb-3">
            Action Required ({totalPending})
          </h2>
          {jobsWithPendingCandidates.length === 0 ? (
            <p className="text-gray-500 italic">No candidates currently pending review.</p>
          ) : (
            <div className="space-y-8">
              {jobsWithPendingCandidates.map(job => (
                <div key={job._id} className="p-4 sm:p-5 bg-white rounded-xl shadow-lg border">
                  <h3 className="text-xl font-bold text-gray-800 mb-4 border-b border-gray-200 pb-2">
                    Job: {job.title}
                  </h3>
                  <div className="space-y-4">
                    {job.candidates.map(app => (
                      <CandidateSummaryRow
                        key={app._id}
                        app={app}
                        onReviewClick={() => setSelectedAppId(app._id)}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="mt-12">
          <h2 className="text-3xl font-bold text-gray-800 mb-6 border-b border-gray-300 pb-3">
            Onboarding Completed ({completedApps.length})
          </h2>
          {completedApps.length === 0 ? (
            <p className="text-gray-500 italic">No candidates have completed onboarding yet.</p>
          ) : (
            <div className="space-y-3">
              {completedApps.map(app => (
                <div key={app._id} className="bg-white p-4 rounded-lg shadow-sm border border-green-300 opacity-90 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <div>
                    <h4 className="text-lg font-semibold text-green-800">{app.applicant.name}</h4>
                    <p className="text-sm text-gray-600">{app.job?.title || 'N/A'}</p>
                  </div>
                  <span className="px-3 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800 flex items-center gap-1.5 self-start sm:self-center">
                    <CheckCircle size={14}/> Completed
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>
      </>
    );
  };

  return (
    <div className="flex h-screen bg-gray-100"> 
      <Sidebar
        role={role}
        active="Onboarding Review"
        setActive={() => {}}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
      />
      
      {/* --- REMOVED FIXED HAMBURGER BUTTON --- */}

      <main className="flex-1 flex flex-col overflow-auto">
         <ProfileHeader
            title={selectedApp ? `Reviewing: ${selectedApp.applicant.name}` : "Onboarding Document Review"}
            subtitle={selectedApp ? `For position: ${selectedApp.job.title || 'N/A'}` : "Review candidate forms and uploaded documents."}
            showMenuButton={true} // --- HAMBURGER FIX ---
            onMenuClick={() => setSidebarOpen(true)} // --- HAMBURGER FIX ---
         />

        <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-8 w-full">
          {renderContent()}
        </div>

        <Footer />
      </main>
    </div>
  );
}