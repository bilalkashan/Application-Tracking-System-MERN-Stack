import React, { useState, useEffect, useMemo, useRef, createContext, useContext } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import Sidebar from "../components/Sidebar";
import { Eye, Search } from "lucide-react";
import { Dialog } from "@headlessui/react";
import ProfileHeader from "../components/ProfileHeader";
import { toast } from "react-hot-toast";
import { FaSpinner, FaBars } from "react-icons/fa"; // Added FaBars
import Footer from "../components/Footer";

// --- Reusable InfoBlock Component ---
const InfoBlock = ({ label, value, children }) => (
  <div>
    <h4 className="text-xs text-gray-400 uppercase tracking-wide">{label}</h4>
    <p className="text-base text-gray-800 font-medium">{value || children || "-"}</p>
  </div>
);

// --- Reusable CommentCard Component ---
const CommentCard = ({ title, approver, date, comments }) => (
  <div className="bg-gray-50 border rounded-xl p-4 shadow-sm hover:shadow-md transition">
    <div>
      <div className="text-sm font-semibold text-gray-800">{title}</div>
      <div className="text-xs text-gray-500">
        {approver || "-"}
        {date && <span> • {new Date(date).toISOString().split("T")[0]}</span>}
      </div>
    </div>
    <div className="mt-3 text-sm text-gray-700 bg-white p-3 rounded border">
      {comments ? (
        <blockquote className="italic">"{comments}"</blockquote>
      ) : (
        <span className="text-gray-400">No comments provided.</span>
      )}
    </div>
  </div>
);

export default function HodRequisitionApproval() {
  const [requisitions, setRequisitions] = useState([]);
  const [selectedReq, setSelectedReq] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [comments, setComments] = useState("");
  const [loading, setLoading] = useState(false); // For modal actions
  const [pageLoading, setPageLoading] = useState(true); // For page load
  const [activeTab, setActiveTab] = useState("all");
  const [query, setQuery] = useState(""); // For search bar
  const [error, setError] = useState(null);

  const [sidebarOpen, setSidebarOpen] = useState(false); // Set to false
  const [active, setActive] = useState("Requisition Approvals"); // Sidebar active state

  const user = JSON.parse(localStorage.getItem("loggedInUser"));
  const role = user?.role || "hod";
  const navigate = useNavigate();

  const fetchData = async (status = "pending") => {
    setPageLoading(true);
    setError(null);
    try {
      // API now fetches based on the active tab. When status === 'all', fetch without filter.
      let url = `/requisitions/listRequisitions`;
      if (status && status !== "all") url += `?approvalStatus=${status}`;
      const res = await api.get(url);
      setRequisitions(res.data.requisitions || []);
    } catch (err) {
      console.error("Failed to fetch requisitions", err);
      setError("Failed to fetch requisitions.");
      toast.error(err.response?.data?.message || "Failed to fetch requisitions");
    } finally {
      setPageLoading(false);
    }
  };

  useEffect(() => {
    fetchData(activeTab);
  }, [activeTab]);

  const viewRequisition = async (id) => {
    try {
      const res = await api.get(`/requisitions/viewRequisitionInfo/${id}`);
      const requisition = res.data.requisition;
      setSelectedReq(requisition);
      // Pre-fill comments if they exist
      setComments(requisition.approvals?.departmentHead?.approval?.comments || "");
      setShowModal(true);
    } catch (err) {
      console.error("Failed to load requisition info", err);
      toast.error("Failed to load requisition info.");
    }
  };

  const handleAction = async (id, status) => {
    if (status === 'rejected' && !comments.trim()) {
      return toast.error("Comments are required to reject a requisition.");
    }

    try {
      setLoading(true);
      await api.put(`/requisitions/hodApproval/${id}`, { status, comments });
      toast.success("Status updated");
      setComments("");
      setSelectedReq(null);
      setShowModal(false);
      fetchData(activeTab); // Refresh the list
    } catch (err) {
      console.error("Approval failed", err);
      toast.error(err?.response?.data?.message || "Action failed");
    } finally {
      setLoading(false);
    }
  };

  // Filter based on search query
  const filteredRequisitions = useMemo(() => {
    // First, filter by the active tab's approval status
    const byStatus = requisitions.filter((r) => {
      const status = r.approvals?.departmentHead?.approval?.status || "pending";
      if (activeTab === "pending") return status === "pending";
      if (activeTab === "approved") return status === "approved";
      if (activeTab === "rejected") return status === "rejected";
      return true;
    });

    if (!query.trim()) return byStatus;

    const q = query.trim().toLowerCase();
    return byStatus.filter((r) =>
      (r.reqId || "").toLowerCase().includes(q) ||
      (r.position || "").toLowerCase().includes(q)
    );
  }, [requisitions, query, activeTab]);
  
  // HOD approval status for selected requisition — used to control modal actions
  const hodApprovalStatus = selectedReq?.approvals?.departmentHead?.approval?.status;
  const isHodActionable = !hodApprovalStatus || hodApprovalStatus === "pending";

  // --- ADDED: Standardized Loading Spinner ---
  const renderLoading = () => (
    <div className="flex items-center justify-center h-[calc(100vh-300px)]">
      <FaSpinner className="animate-spin text-4xl text-gray-700" />
      <p className="ml-3 text-lg text-gray-600">Loading Requisitions...</p>
    </div>
  );

  const renderError = () => (
    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg m-8" role="alert">
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

      {/* Main */}
      <main className="flex-1 flex flex-col overflow-auto">
        <ProfileHeader
          title="Requisition Approvals"
          subtitle="Review and approve pending requisitions."
          showMenuButton={true} // --- HAMBURGER FIX ---
          onMenuClick={() => setSidebarOpen(true)} // --- HAMBURGER FIX ---
        />

        <div className="p-4 md:p-6 flex-1 overflow-auto">
          <div className="max-w-7xl mx-auto">
            {/* --- RESPONSIVE HEADER --- */}
            <div className="mb-6 mt-2 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">

              {/* --- RESPONSIVE Search Bar --- */}
              <div className="relative w-full md:w-80">
                <input
                  type="text"
                  placeholder="Search by Req No or Position..."
                  className="w-full px-4 py-2 pl-10 pr-4 rounded-full shadow-md border focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              </div>
            </div>

            {/* Tabs */}
            <div className="flex space-x-4 border-b mb-6">
              <button
                onClick={() => setActiveTab("all")}
                className={`px-4 py-2 font-medium ${
                  activeTab === "all"
                    ? "border-b-2 border-[#e5383b] text-[#e5383b]"
                    : "text-gray-600 hover:text-[#e5383b]"
                }`}
              >
                All
              </button>
              <button
                onClick={() => setActiveTab("pending")}
                className={`px-4 py-2 font-medium ${
                  activeTab === "pending"
                    ? "border-b-2 border-[#e5383b] text-[#e5383b]"
                    : "text-gray-600 hover:text-[#e5383b]"
                }`}
              >
                Pending
              </button>
              <button
                onClick={() => setActiveTab("approved")}
                className={`px-4 py-2 font-medium ${
                  activeTab === "approved"
                    ? "border-b-2 border-[#e5383b] text-[#e5383b]"
                    : "text-gray-600 hover:text-[#e5383b]"
                }`}
              >
                Approved
              </button>
              <button
                onClick={() => setActiveTab("rejected")}
                className={`px-4 py-2 font-medium ${
                  activeTab === "rejected"
                    ? "border-b-2 border-[#e5383b] text-[#e5383b]"
                    : "text-gray-600 hover:text-[#e5383b]"
                }`}
              >
                Rejected
              </button>
            </div>

            {/* Table */}
            {pageLoading ? (
              renderLoading()
            ) : error ? (
              renderError()
            ) : (
              <div className="bg-white rounded-xl shadow overflow-hidden">
                {/* --- RESPONSIVE TABLE --- */}
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[640px] border-collapse">
                    <thead className="bg-[#BFBFBF] text-black">
                      <tr>
                        <th className="p-3 text-left">Req No</th>
                        <th className="p-3 text-left">Position</th>
                        <th className="p-3 text-center">Department</th>
                        <th className="p-3 text-center">Status</th>
                        <th className="p-3 text-center">View</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredRequisitions.length === 0 ? (
                        <tr>
                          <td colSpan="5" className="text-center p-6 text-gray-500">
                            No requisitions found
                          </td>
                        </tr>
                      ) : (
                        filteredRequisitions
                          .map((r) => (
                            <tr key={r._id} className="border-t hover:bg-gray-50">
                              <td className="p-3">{r.reqId}</td>
                              <td className="p-3">{r.position}</td>
                              <td className="p-3 text-center">{r.department}</td>
                              <td className="p-3 text-center">
                                <span
                                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                                    r.approvals?.departmentHead?.approval?.status ===
                                    "approved"
                                      ? "bg-green-100 text-green-700"
                                      : r.approvals?.departmentHead?.approval
                                          ?.status === "rejected"
                                      ? "bg-red-100 text-red-700"
                                      : "bg-yellow-100 text-yellow-700"
                                  }`}
                                >
                                  {r.approvals?.departmentHead?.approval?.status ||
                                    "Pending"}
                                </span>
                              </td>
                              <td className="p-3 text-center">
                                <button
                                  onClick={() => viewRequisition(r._id)}
                                  className="text-indigo-600 hover:text-indigo-800"
                                >
                                  <Eye size={20} />
                                </button>
                              </td>
                            </tr>
                          ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>

        <Footer />
      </main>

      {/* Modal */}
      {showModal && selectedReq && (
        <Dialog
          open={showModal}
          onClose={() => setShowModal(false)}
          className="relative z-50"
        >
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm"
            aria-hidden="true"
          />
          <div className="fixed inset-0 flex items-center justify-center p-4">
            <Dialog.Panel className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full overflow-hidden flex flex-col max-h-[90vh] border border-gray-100">
              <div className="p-6 sm:p-8 overflow-y-auto">
                {/* --- RESPONSIVE MODAL HEADER --- */}
                <div className="flex flex-col sm:flex-row items-start justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                      {selectedReq.position}
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">
                      {selectedReq.department} • {selectedReq.location}
                    </p>
                  </div>
                  <div className="text-left sm:text-right mt-4 sm:mt-0 flex-shrink-0">
                    <p className="text-xs text-gray-400">Requested by</p>
                    <p className="text-lg font-medium text-gray-700">
                      {selectedReq.createdBy?.name || "-"}
                    </p>
                    <p className="text-sm font-medium text-gray-400">
                      Form No: {selectedReq.reqId}
                    </p>
                    <p className="text-sm font-medium text-gray-400">
                      {selectedReq.createdAt
                        ? new Date(selectedReq.createdAt)
                            .toISOString()
                            .split("T")[0]
                        : "-"}
                    </p>
                  </div>
                </div>

                {/* --- RESPONSIVE MODAL CONTENT --- */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-gray-700">
                  <div className="space-y-4">
                    <InfoBlock
                      label="Nature"
                      value={selectedReq.natureOfEmployment}
                    />
                    <InfoBlock label="Company" value={selectedReq.company} />
                    <InfoBlock label="Requisition Type">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-indigo-50 text-indigo-700">
                        {selectedReq.requisitionType}
                      </span>
                    </InfoBlock>
                    {selectedReq.requisitionType === "Replacement" && (
                      <div className="mt-3 p-4 bg-gray-50 rounded-xl border">
                        <h5 className="text-sm font-semibold text-indigo-700 mb-2">
                          Replacement Details
                        </h5>
                        {/* ... (replacement details) ... */}
                      </div>
                    )}
                  </div>
                  <div className="space-y-4">
                    <InfoBlock
                      label="Reports To"
                      value={`${
                        selectedReq.reportedTo?.name || "-"
                      } (${selectedReq.reportedTo?.desig || "-"})`}
                    />
                    <div className="grid grid-cols-3 gap-2">
                      <InfoBlock
                        label="Grade"
                        value={selectedReq.grade || "-"}
                      />
                      <InfoBlock
                        label="Salary"
                        value={selectedReq.salary || "-"}
                      />
                      <InfoBlock label="Age" value={selectedReq.age || "-"} />
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <InfoBlock
                        label="Desired Join Date"
                        value={
                          selectedReq.desiredDateJoin
                            ? new Date(
                                selectedReq.desiredDateJoin
                              ).toLocaleDateString("en-GB")
                            : "-"
                        }
                      />
                      <InfoBlock
                        label="Approved Position"
                        value={selectedReq.approvedPosition || "-"}
                      />
                      <InfoBlock
                        label="Gender"
                        value={selectedReq.gender || "-"}
                      />
                    </div>
                  </div>
                </div>

                <hr className="my-6 border-gray-200" />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-gray-700">
                  <div>
                    <h4 className="text-sm font-semibold text-gray-800 mb-2">
                      Job Description
                    </h4>
                    <p className="leading-relaxed whitespace-pre-wrap">
                      {selectedReq.description}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-gray-800 mb-2">
                      Qualifications & Experience
                    </h4>
                    <p>
                      <span className="text-gray-500">Academic:</span>{" "}
                      {selectedReq.academicQualification || "-"}
                    </p>
                    <p>
                      <span className="text-gray-500">Professional:</span>{" "}
                      {selectedReq.professionalQualification || "-"}
                    </p>
                    <p>
                      <span className="text-gray-500">Experience:</span>{" "}
                      {selectedReq.experience || "-"}
                    </p>
                    <p className="mt-2">
                      <span className="text-gray-500">Soft Skills:</span>{" "}
                      {(selectedReq.softSkills || []).join(", ") || "-"}
                    </p>
                    <p>
                      <span className="text-gray-500">Technical Skills:</span>{" "}
                      {(selectedReq.technicalSkills || []).join(", ") || "-"}
                    </p>
                  </div>
                </div>

                <hr className="my-6 border-gray-200" />

                <div className="space-y-6">
                  <div className="flex flex-col-1 sm:flex-row items-center flex-wrap gap-4 justify-center">
                    {["HOD", "HR", "COO"].map((role, idx) => {
                      const approval =
                        role === "HOD"
                          ? selectedReq.approvals?.departmentHead?.approval
                          : role === "HR"
                          ? selectedReq.approvals?.hr?.approval
                          : selectedReq.approvals?.coo?.approval;
                      const status = approval?.status || "pending";
                      const color =
                        status === "approved"
                          ? "bg-green-100 text-green-700 border-green-300"
                          : status === "rejected"
                          ? "bg-red-100 text-red-700 border-red-300"
                          : "bg-gray-100 text-gray-700 border-gray-300";
                      return (
                        <div
                          key={idx}
                          className={`px-4 py-2 rounded-full border text-sm font-medium ${color}`}
                        >
                          {role}:{" "}
                          {status?.charAt(0).toUpperCase() +
                            status?.slice(1) || "Pending"}
                        </div>
                      );
                    })}
                  </div>

                  <hr className="my-6 border-gray-200 mt-3"/>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <CommentCard
                      title="Head of Department"
                      approver={
                        selectedReq.approvals?.departmentHead?.approval
                          ?.reviewer?.name || selectedReq.assignedHod?.name
                      }
                      date={
                        selectedReq.approvals?.departmentHead?.approval
                          ?.reviewedAt
                      }
                      comments={
                        selectedReq.approvals?.departmentHead?.approval
                          ?.comments
                      }
                    />
                    <CommentCard
                      title="Human Resources"
                      approver={
                        selectedReq.approvals?.hr?.approval?.reviewer?.name ||
                        "HR"
                      }
                      date={
                        selectedReq.approvals?.hr?.approval?.reviewedAt
                      }
                      comments={
                        selectedReq.approvals?.hr?.approval?.comments
                      }
                    />
                    <CommentCard
                      title="Chief Operating Officer"
                      approver={
                        selectedReq.approvals?.coo?.approval?.reviewer?.name
                      }
                      date={
                        selectedReq.approvals?.coo?.approval?.reviewedAt
                      }
                      comments={
                        selectedReq.approvals?.coo?.approval?.comments
                      }
                    />
                  </div>
                </div>

                {isHodActionable ? (
                  <>
                    <hr className="my-6 border-gray-200" />
                    <textarea
                      placeholder="Comments (required for rejection)"
                      className="border p-2 w-full mt-3 rounded focus:ring-1 focus:ring-black shadow-md border-gray-300"
                      value={comments}
                      onChange={(e) => setComments(e.target.value)}
                    />
                  </>
                ) : (
                  <div className="p-4 mt-3 rounded-md bg-gray-50 border border-gray-200 text-sm text-gray-700">
                    This requisition has already been <strong className={hodApprovalStatus === 'approved' ? 'text-green-700' : 'text-red-700'}>{hodApprovalStatus}</strong>. No further comments or actions are allowed here.
                  </div>
                )}
                
              </div>
              <div className="mt-8 flex flex-col-1 sm:flex-row justify-end gap-3 p-6 bg-gray-100 border-t">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-[#111] text-white rounded-full hover:bg-[#BFBFBF] hover:text-black transition font-medium shadow-md w-full sm:w-auto"
                >
                  Close
                </button>
                
                {isHodActionable && (
                  <>
                    <button
                      onClick={() =>
                        handleAction(selectedReq._id, "rejected")
                      }
                      className="px-4 py-2 bg-red-600 text-white rounded-full hover:bg-red-700 transition font-medium shadow-md w-full sm:w-auto"
                      disabled={loading}
                    >
                      {loading ? "Saving..." : "Reject"}
                    </button>
                    <button
                      onClick={() =>
                        handleAction(selectedReq._id, "approved")
                      }
                      className="px-4 py-2 bg-green-600 text-white rounded-full hover:bg-green-700 transition font-medium shadow-md w-full sm:w-auto"
                      disabled={loading}
                    >
                      {loading ? "Saving..." : "Approve"}
                    </button>
                  </>
                )}
                
              </div>
            </Dialog.Panel>
          </div>
        </Dialog>
      )}
    </div>
  );
}