import React, { useState, useEffect, useMemo, useRef, createContext, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import "react-toastify/dist/ReactToastify.css";
import api, { fileUrl } from '../api';
import Sidebar from '../components/Sidebar';
import ProfileHeader from '../components/ProfileHeader';
import Footer from '../components/Footer';
import { Dialog } from '@headlessui/react';
import { Loader2, Check, X, Info, AlertTriangle, CheckCircle, TrendingUp, Clock, DollarSign, Users } from 'lucide-react';
import { FaSpinner, FaBars } from 'react-icons/fa';

const KPICard = ({ title, value, icon, bgColorClass = "bg-gray-100", textColorClass = "text-gray-800" }) => (
  <div className="p-6 bg-white rounded-xl shadow hover:shadow-lg transition transform hover:-translate-y-1">
    <div className="flex items-center gap-4">
      <div className={`p-3 rounded-full ${bgColorClass} ${textColorClass}`}>{icon}</div>
      <div>
        <p className="text-sm text-gray-500">{title}</p>
        <p className="text-2xl font-bold text-gray-800">{value}</p>
      </div>
    </div>
  </div>
);

// --- Reusable InfoBlock Component ---
const DetailField = ({ label, value, compact = false }) => (
  <div className={compact ? 'bg-white p-3 rounded-lg border border-gray-200' : ''}>
    <p className="text-gray-600 text-xs uppercase font-semibold">{label}</p>
    <p className="text-gray-900 font-semibold mt-1 text-sm">{value || '-'}</p>
  </div>
);

const OfferApprovalsPage = () => {
  const [pendingOffers, setPendingOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false); // Set to false for mobile
  
  const [selectedApp, setSelectedApp] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [comments, setComments] = useState("");
  const [actionType, setActionType] = useState(null); // 'approved' or 'rejected'
  const [isSubmitting, setIsSubmitting] = useState(false); // For modal spinner

  const user = JSON.parse(localStorage.getItem("loggedInUser"));
  const role = user?.role || "user";
  const navigate = useNavigate(); // Initialized navigate

  const [active, setActive] = useState("Offer Approvals"); // Added active state for sidebar

  const fetchPending = async () => {
    setLoading(true);
    try {
      const res = await api.get('/applications/offers/pending-approval');
      setPendingOffers(res.data || []);
    } catch (error) {
      toast.error("Failed to fetch pending offers.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPending();
  }, []);

  const openModal = (app, action) => {
    setSelectedApp(app);
    setActionType(action);
    setIsModalOpen(true);
    setComments(""); // Clear comments
  };
  
  const closeModal = () => {
    if (isSubmitting) return; // Prevent closing while submitting
    setIsModalOpen(false);
    setSelectedApp(null);
    setComments("");
  }

  const handleSubmit = async () => {
    if (!selectedApp || !actionType) return;

    if (actionType === 'rejected' && !comments.trim()) {
      toast.error("Rejection comments are required.");
      return;
    }

    setIsSubmitting(true);
    
    const isHod = selectedApp.offer.approvalStatus === 'pending_hod';
    const endpoint = isHod 
      ? `/applications/${selectedApp._id}/offer/hod-approve`
      : `/applications/${selectedApp._id}/offer/coo-approve`;

    try {
      await api.patch(endpoint, {
        status: actionType,
        comments: comments
      });
      toast.success(`Offer ${actionType} successfully.`);
      closeModal();
      fetchPending(); // Refresh list
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to submit review.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- ADDED: Standardized Loading Spinner ---
  const renderLoading = () => (
    <div className="flex flex-col items-center justify-center h-[calc(100vh-300px)]">
      <div className="animate-spin mb-4">
        <FaSpinner className="text-5xl text-gray-700" />
      </div>
      <p className="text-lg font-medium text-gray-700">Loading Pending Offers...</p>
      <p className="text-sm text-gray-500 mt-1">Please wait while we fetch your approval queue</p>
    </div>
  );
  
  const renderError = () => (
    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg m-6" role="alert">
      <strong className="font-bold">Error: </strong>
      <span className="block sm:inline">Failed to load offers.</span>
    </div>
  );

  // Calculate statistics
  const totalOffersAmount = useMemo(() => 
    pendingOffers.reduce((sum, app) => sum + (app.offer?.offeredSalary || 0), 0),
    [pendingOffers]
  );
  const averageOfferAmount = useMemo(() => 
    pendingOffers.length > 0 ? Math.round(totalOffersAmount / pendingOffers.length) : 0,
    [pendingOffers, totalOffersAmount]
  );

  const handleLogout = () => { 
    localStorage.clear();
    toast.success("Logged out successfully!");
    navigate("/login");
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-50 via-gray-50 to-gray-100">
      <Sidebar
        role={role}
        active={active}
        setActive={setActive}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
      />
      <main className="flex-1 flex flex-col overflow-auto">
        <ProfileHeader
          title="Offer Approvals"
          subtitle="Review and approve/reject pending job offers"
          showMenuButton={true}
          onMenuClick={() => setSidebarOpen(true)}
          onLogout={handleLogout} 
          onToggleDark={() => {}} 
        />
        
        <div className="p-4 md:p-8 max-w-7xl mx-auto w-full space-y-6">
          
          {/* KPI Cards Section */}
          {!loading && (
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <KPICard
                title="Pending Approvals"
                value={pendingOffers.length}
                icon={<Clock size={24} />}
                bgColorClass="bg-orange-100"
                textColorClass="text-orange-600"
              />
              <KPICard
                title="Candidates"
                value={pendingOffers.length}
                icon={<Users size={24} />}
                bgColorClass="bg-indigo-100"
                textColorClass="text-indigo-600"
              />
            </div>
          )}

          {/* Main Table Section */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            {/* Header */}
            <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-transparent">
              <h3 className="text-lg font-bold text-gray-900 flex items-center">
                Pending Your Approval
                <span className="ml-auto text-sm font-semibold px-3 py-1 bg-orange-100 text-orange-700 rounded-full">
                  {pendingOffers.length} offers
                </span>
              </h3>
            </div>

            <div className="overflow-x-auto">
              {loading ? (
                renderLoading()
              ) : pendingOffers.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-80 text-center">
                  <div className="bg-[#111] p-3 rounded-2xl mb-4">
                    <CheckCircle size={25} className="text-white mx-auto" />
                  </div>
                  <h4 className="text-xl font-bold text-gray-900">No Pending Offers</h4>
                  <p className="text-sm text-gray-600 max-w-xs">Your approval queue is all clear!</p>
                </div>
              ) : (
                <table className="w-full min-w-[768px] text-sm">
                  <thead>
                    <tr className="bg-[#BFBFBF] text-black border-b border-gray-100">
                      <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">Applicant</th>
                      <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">Job Title</th>
                      <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">Department</th>
                      <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">Recruiter</th>
                      <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">Offer Amount</th>
                      <th className="px-6 py-4 text-center text-xs font-bold uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {pendingOffers.map((app, idx) => (
                      <tr key={app._id} className="hover:bg-gray-50 transition duration-200">
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-700 font-bold text-sm">
                              {app.applicant?.name?.charAt(0) || 'A'}
                            </div>
                            <span className="font-semibold text-gray-900">{app.applicant?.name || '...'}</span>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <span className="text-gray-700 font-medium">{app.job?.title || '...'}</span>
                        </td>
                        <td className="px-6 py-5">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100">
                            {app.job?.department || '...'}
                          </span>
                        </td>
                        <td className="px-6 py-5">
                          <span className="text-gray-700">{app.offer?.sentBy?.name || '...'}</span>
                        </td>
                        <td className="px-6 py-5">
                          <span className="font-bold text-lg text-black-600">Rs. {app.offer?.offeredSalary?.toLocaleString() || '0'}</span>
                        </td>
                        <td className="px-6 py-5 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button 
                              onClick={() => openModal(app, 'approved')} 
                              className="p-2.5 text-green-600 bg-green-50 hover:bg-green-100 rounded-lg transition duration-200 border border-green-100 hover:border-green-300" 
                              title="Approve"
                            >
                              <Check size={18} />
                            </button>
                            <button 
                              onClick={() => openModal(app, 'rejected')} 
                              className="p-2.5 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition duration-200 border border-red-100 hover:border-red-300" 
                              title="Reject"
                            >
                              <X size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div> 
          </div>
        </div>
      <Footer />
      </main>

      <Dialog open={isModalOpen} onClose={closeModal} className="relative z-50">
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl overflow-hidden">
            {/* Header */}
            <div className={`p-5 flex items-center justify-between border-b-4 ${
              actionType === 'approved' 
                ? 'border-green-500 bg-green-50' 
                : 'border-red-500 bg-red-50'
            }`}>
              <Dialog.Title className={`flex items-center text-xl font-bold ${
                actionType === 'approved' ? 'text-green-800' : 'text-red-800'
              }`}>
                {actionType === 'approved' ? <Check className="mr-2" /> : <AlertTriangle className="mr-2" />}
                Confirm Offer {actionType === 'approved' ? 'Approval' : 'Rejection'}
              </Dialog.Title>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
            </div>
            
            {/* Scrollable Content */}
            <div className="max-h-[70vh] overflow-y-auto p-6 space-y-6">
              {/* Confirmation Message */}
              <div className={`p-4 rounded-xl border-l-4 flex gap-3 ${
                actionType === 'approved'
                  ? 'bg-green-50 border-green-400'
                  : 'bg-red-50 border-red-400'
              }`}>
                <Info className={actionType === 'approved' ? 'text-green-600' : 'text-red-600'} size={20} />
                <p className="text-sm text-gray-700">
                  You are about to <strong className={actionType === 'approved' ? 'text-green-700' : 'text-red-700'}>
                    {actionType}
                  </strong> this offer for <strong>{selectedApp?.applicant?.name}</strong>.
                </p>
              </div>

              {/* Candidate Info Card */}
              <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
                <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <Users size={18} className="text-indigo-600" />
                  Candidate Information
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600 text-xs uppercase font-semibold">Name</p>
                    <p className="text-gray-900 font-semibold mt-1">{selectedApp?.applicant?.name}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 text-xs uppercase font-semibold">Email</p>
                    <p className="text-gray-900 font-semibold mt-1 truncate">{selectedApp?.applicant?.email}</p>
                  </div>
                </div>
              </div>

              {/* Offer Details Card */}
              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <DollarSign size={18} className="text-green-600" />
                  Offer Details
                </h4>
                {/* --- RESPONSIVE: Details Grid --- */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  <DetailField label="Position" value={selectedApp?.offer?.designation} />
                  <DetailField label="Department" value={selectedApp?.offer?.department} />
                  <DetailField label="Grade" value={selectedApp?.offer?.grade || 'N/A'} />
                  <DetailField label="Location" value={selectedApp?.offer?.location} />
                  <DetailField label="Sent By" value={selectedApp?.offer?.sentBy?.name || 'N/A'} />
                </div>
              </div>

              {/* Compensation Details */}
              <div className="bg-green-50 rounded-xl p-6 border border-green-200">
                <h4 className="font-bold text-gray-900 mb-4">Compensation Package</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between bg-white rounded-lg p-3 border border-green-100">
                    <span className="text-gray-700 font-medium">Base Salary</span>
                    <span className="font-bold text-black text-lg">Rs. {selectedApp?.offer?.offeredSalary?.toLocaleString() || '0'}</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <DetailField label="Vehicle" value={selectedApp?.offer?.vehicleEntitlement || 'N/A'} compact />
                    <DetailField label="Mobile" value={selectedApp?.offer?.mobileAllowance || 'N/A'} compact />
                    <DetailField label="Fuel" value={`${selectedApp?.offer?.fuelAllowance?.toLocaleString() || '0'} Liters`} compact />
                    <DetailField label="System" value={selectedApp?.offer?.systemRequirement || 'N/A'} compact />
                  </div>
                </div>
              </div>

              {/* Comments Section */}
              <div className="space-y-2">
                <label htmlFor="comments" className="block text-sm font-bold text-gray-900 flex items-center gap-2">
                  <AlertTriangle size={16} className={actionType === 'rejected' ? 'text-red-600' : 'text-gray-400'} />
                  {actionType === 'rejected' ? 'Rejection Reason (Required)' : 'Additional Comments (Optional)'}
                </label>
                <textarea 
                  id="comments"
                  value={comments} 
                  onChange={e => setComments(e.target.value)} 
                  rows={3}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition text-gray-900 placeholder-gray-500"
                  placeholder={actionType === 'rejected' ? 'Please provide a reason for rejection...' : 'Add any additional comments...'}
                />
              </div>
            </div>

            {/* --- ACTION BUTTONS (Responsive & Themed) --- */}
            <div className="bg-gray-50 px-6 py-5 flex flex-col-reverse sm:flex-row justify-end gap-3 border-t border-gray-100">
              <button 
                onClick={closeModal} 
                disabled={isSubmitting}
                className="px-6 py-2.5 text-sm font-semibold text-[#111] bg-[#BFBFBF] border border-gray-300 rounded-full hover:bg-gray-300 transition w-full sm:w-auto"
              >
                Cancel
              </button>
              <button 
                onClick={handleSubmit} 
                disabled={isSubmitting} 
                className={`px-6 py-2.5 text-sm font-semibold text-white rounded-full flex items-center justify-center transition w-full sm:w-auto ${
                  actionType === 'approved' 
                    ? 'bg-green-600 hover:bg-green-700' 
                    : 'bg-red-600 hover:bg-red-700'
                } ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}`}
              >
                {isSubmitting && <Loader2 className="animate-spin mr-2" size={18} />}
                {isSubmitting ? 'Processing...' : `Submit ${actionType === 'approved' ? 'Approval' : 'Rejection'}`}
              </button>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>
      <ToastContainer />
    </div>
  );
};

export default OfferApprovalsPage;