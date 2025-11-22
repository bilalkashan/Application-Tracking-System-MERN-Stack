import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import api, { fileUrl } from '../api';
import Sidebar from '../components/Sidebar';
import ProfileHeader from '../components/ProfileHeader';
import Footer from '../components/Footer';
import { Loader2, Upload, CheckCircle, FileDown, AlertTriangle, XCircle, X } from 'lucide-react';
import { REQUIRED_DOCUMENTS } from '../constants';
import { FaBars, FaSpinner , FaSearch, FaDownload, FaBriefcase, FaMapMarkerAlt, FaCalendarAlt, FaClipboardList,FaLayerGroup   } from "react-icons/fa";


const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";

const FileUploadRow = ({ app, docName, onUploadSuccess }) => {
    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const fileInputRef = useRef(null);

    const uploadedDoc = app.onboardingDocuments?.find(doc => doc.documentType === docName);

    const handleFileChange = (e) => {
        setFile(e.target.files[0]);
    };

    const handleUpload = async () => {
        if (!file) {
            toast.error("Please select a file first.");
            return;
        }
        setLoading(true);
        
        const formData = new FormData();
        formData.append("document", file);
        formData.append("documentType", docName);

        try {
            const res = await api.post(`/applications/${app._id}/submit-document`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            toast.success(`${docName} uploaded successfully!`);
            onUploadSuccess(res.data); // Pass the updated application back
            setFile(null); 
            if(fileInputRef.current) fileInputRef.current.value = ""; 
        } catch (error) {
            toast.error(error.response?.data?.message || "File upload failed.");
        } finally {
            setLoading(false);
        }
    };

    // --- THEME: Updated Status Colors ---
    let statusColor = "text-yellow-600";
    let statusIcon = <AlertTriangle size={14} />;
    let statusText = "Pending Review";
    let linkColor = "text-blue-600";

    if (!uploadedDoc) {
        statusText = "Not Uploaded";
        statusColor = "text-gray-400";
        statusIcon = <XCircle size={14}/>;
        linkColor = "text-gray-400";
    } else if (uploadedDoc.status === 'approved') {
        statusColor = "text-green-600";
        statusIcon = <CheckCircle size={14} />;
        statusText = "Approved";
    } else if (uploadedDoc.status === 'rejected') {
        statusColor = "text-red-600"; // Use brand red for rejection
        statusIcon = <XCircle size={14} />;
        statusText = "Rejected";
    }

    return (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-gray-50 rounded-lg border gap-3">
            <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-800">{docName}</p>
                {/* Status Display */}
                <div className={`text-xs flex items-center gap-1 mt-1 ${statusColor}`}>
                    {statusIcon} <span>{statusText}</span>
                </div>
                {uploadedDoc && (
                    <a
                        href={fileUrl(uploadedDoc.filePath)}
                        target="_blank"
                        rel="noreferrer"
                        className={`text-xs ${linkColor} hover:underline truncate`}
                        title={uploadedDoc.fileName}
                    >
                        {uploadedDoc.fileName || 'View Uploaded File'}
                    </a>
                )}
                {/* Rejection Comment */}
                {uploadedDoc?.status === 'rejected' && (
                    <p className="text-xs text-red-600 mt-1">Comment: {uploadedDoc.rejectionComment}</p>
                )}
            </div>
            
            {/* Action Buttons */}
            <div className="flex items-center gap-2 mt-2 sm:mt-0 flex-wrap">
                <input 
                    type="file" 
                    ref={fileInputRef}
                    onChange={handleFileChange} 
                    className="text-xs file:mr-2 file:py-1.5 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200"
                />
                <button 
                    onClick={handleUpload} 
                    disabled={loading || !file}
                    // --- THEME: Updated Button Style ---
                    className={`inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-medium text-white rounded-full transition shadow-sm ${
                        uploadedDoc ? 'bg-[#111111] hover:bg-[#6B6F73]' : 'bg-[#E30613] hover:bg-red-700'
                    } disabled:bg-gray-300`}
                >
                    {loading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                    {uploadedDoc ? 'Replace' : 'Upload'}
                </button>
            </div>
        </div>
    );
};

export default function OnboardingPage() {
    const [hiredApp, setHiredApp] = useState(null);
    const [loading, setLoading] = useState(true);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [error, setError] = useState(null);
    const [active, setActive] = useState("Submit Documents"); // Added active state

    const { appId } = useParams(); 
    const user = JSON.parse(localStorage.getItem("loggedInUser"));
    const role = user?.role || "user";
    const navigate = useNavigate(); // Added navigate

    const fetchApplicationDetails = async () => {
      if (!appId) {
        setError("No application ID provided.");
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const res = await api.get(`/applications/myOnboarding/${appId}`);
        setHiredApp(res.data);
      } catch (error) {
        console.error("Failed to load application data:", error);
        setError(error.response?.data?.message || "Failed to load application data.");
        toast.error(error.response?.data?.message || "Failed to load application data.");
      } finally {
        setLoading(false);
      }
    };

    useEffect(() => {
      fetchApplicationDetails();
    }, [appId]);

    const handleUploadSuccess = (updatedApp) => {
      setHiredApp(updatedApp);
    };

    const renderContent = () => {
      if (loading) {
        return (
          <div className="flex justify-center items-center h-64 text-gray-600">
            <FaSpinner className="animate-spin text-4xl text-gray-700" />
            <p className="ml-3 text-lg">Loading your onboarding portal...</p>
          </div>
        );
      }

      if (error || !hiredApp) {
        return (
          <div className="bg-white p-8 rounded-xl shadow-lg text-center">
            <AlertTriangle className="h-12 w-12 mx-auto text-red-500" />
            <h3 className="text-xl font-semibold text-gray-800 mt-4">
              Onboarding Not Found
            </h3>
            <p className="text-gray-500 mt-2">
              {error || "Could not find an active onboarding task for this application."}
            </p>
          </div>
        );
      }

      return (
            <div className="bg-white p-6 md:p-8 rounded-xl shadow-lg border-t-4 border-[#E30613]">
                <h3 className="text-2xl font-bold text-gray-900">
                    Upload Required Documents
                </h3>
                <p className="mt-1 text-gray-600">
                    Please upload the following documents for the position of
                    <strong className="text-gray-800"> {hiredApp.job?.title}</strong>. 
                    Your employment form has been submitted separately.
                </p>

                <div className="mt-8 space-y-3">
                    {/* The rest of the required documents */}
                    {REQUIRED_DOCUMENTS.map(docName => (
                        <FileUploadRow
                            key={docName}
                            app={hiredApp}
                            docName={docName}
                            onUploadSuccess={handleUploadSuccess}
                        />
                    ))}
                </div>
            </div>
        );
    };

    return (
        <div className="flex h-screen bg-gray-100"> {/* THEME: Changed background */}
            <Sidebar
                role={role}
                active={active} 
                setActive={setActive}
                sidebarOpen={sidebarOpen}
                setSidebarOpen={setSidebarOpen}
            />

            <main className="flex-1 overflow-auto">
                 <ProfileHeader
                    title="Upload Onboarding Documents"
                    subtitle={`For position: ${hiredApp?.job?.title || 'Loading...'}`}
                    showMenuButton={true}
                    onMenuClick={() => setSidebarOpen(true)}
                 />
                <div className="p-4 md:p-6 max-w-4xl mx-auto">
                    {renderContent()}
                </div>
            <Footer />
            </main>
        </div>
    );
}