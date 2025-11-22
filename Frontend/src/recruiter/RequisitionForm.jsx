import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import Sidebar from "../components/Sidebar";
import {
  PlusCircle, Eye, Trash, Briefcase, Clock, CheckCircle, XCircle, Hourglass, Loader2,
} from "lucide-react";
import { FaBriefcase, FaSpinner, FaBars } from "react-icons/fa";
import { Dialog } from "@headlessui/react";
import { toast } from "react-hot-toast";
import ProfileHeader from "../components/ProfileHeader";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import StatusBadge from "../components/StatusBadge";
import Footer from "../components/Footer";

// --- Reusable KPICard Component (from COO Dashboard) ---
const KPICard = ({ title, value, icon, bgColorClass = "bg-indigo-100", textColorClass = "text-indigo-600" }) => (
  <div className="p-6 bg-white rounded-xl shadow hover:shadow-lg transition transform hover:-translate-y-1">
    <div className="flex items-center gap-4">
      <div className={`p-2 ${bgColorClass} ${textColorClass} rounded-full`}>{icon}</div>
      <div>
        <p className="text-sm text-gray-500">{title}</p>
        <p className="text-2xl font-bold text-gray-800">{value}</p>
      </div>
    </div>
  </div>
);

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
    <div className="mt-3 text-sm text-gray-700 bg-white p-2 rounded border">
      {comments ? (
        <blockquote className="italic">"{comments}"</blockquote>
      ) : (
        <span className="text-gray-400">No comments provided.</span>
      )}
    </div>
  </div>
);

export default function RequisitionForm() {
  const [requisitions, setRequisitions] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false); // Form submission loading
  const [pageLoading, setPageLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [selectedReq, setSelectedReq] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [tab, setTab] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [form, setForm] = useState({
    natureOfEmployment: "Permanent",
    position: "",
    department: "",
    requisitionType: "New",
    location: "",
    company: "",
    reportedTo: { name: "", desig: "" },
    grade: "",
    salary: "",
    age: "",
    gender: "",
    description: "",
    academicQualification: "",
    professionalQualification: "",
    experience: "",
    softSkills: [],
    technicalSkills: [],
    desiredDateJoin: "",
    approvedPosition: "",
    replacementDetail: { name: "", desig: "", grade: "", salary: "", age: "", leavingDate: "", reason: "" },
  });

  const locations = ["Master House", "Korangi", "Port Qasim", "Islamabad", "Lahore Multan Road", "Peshawar"];
  const departmentList = ["Other", "Administration", "Administration Bus", "After Sales Bus", "After Sales Truck", "Assembly Shop", "Body Shop", "Brand Management", "Chassis & Deck Assembly", "Civil Projects", "Compliance & Risk Management", "Customer Relationship Management", "EDD", "Finance", "Health, Safety & Environment", "Human Resource", "Internal Audit", "M.I.S", "Maintenance & Utilities", "Management Group", "Marketing & Planning", "Paint Shop", "Production", "Protoshop", "QAHSE", "Sales & Marketing - BUS", "Sales & Marketing - Truck", "Sales Admin", "Secretarial", "Spare Parts", "Warehouse"];

  const user = JSON.parse(localStorage.getItem("loggedInUser"));
  const role = user?.role;

  const [sidebarOpen, setSidebarOpen] = useState(false); // Set to false for mobile
  const [active, setActive] = useState("Requisition Form"); // Set active tab

  const fetchData = async () => {
    try {
      setPageLoading(true);
      const res = await api.get("/requisitions/listRequisitions");
      setRequisitions(res.data.requisitions || []);
    } catch (err) {
      console.error("Failed to fetch requisitions", err);
      toast.error(err.response?.data?.message || "Failed to fetch requisitions");
    } finally {
      setPageLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    try {
      const payload = { ...form };
      if (payload.requisitionType === "New") delete payload.replacementDetail;

      if (role === 'sub_recruiter') {
        console.log("Submitting as sub_recruiter for department:", payload.department);
      }

      await api.post("/requisitions/createRequisition", payload);
      toast.success("Requisition submitted successfully!");
      setLoading(false);
      setForm({
        natureOfEmployment: "Permanent", position: "", department: "", requisitionType: "New",
        location: "", company: "", reportedTo: { name: "", desig: "" }, grade: "",
        salary: "", age: "", gender: "", description: "", academicQualification: "",
        professionalQualification: "", experience: "", softSkills: [], technicalSkills: [],
        desiredDateJoin: "", approvedPosition: "",
        replacementDetail: { name: "", desig: "", grade: "", salary: "", age: "", leavingDate: "", reason: "" },
      });
      fetchData();
      setShowForm(false);
    } catch (err) {
      console.error("Requisition submit failed", err);
      const errorMsg = err?.response?.data?.message || "Failed to submit requisition";
      setMessage(errorMsg);
      toast.error(errorMsg);
      setLoading(false);
    }
  };

  const promptRequisitionDelete = (requisitionId) => {
    setConfirmDeleteId(requisitionId);
    setConfirmOpen(true);
  };

  const performDelete = async () => {
    if (!confirmDeleteId) return setConfirmOpen(false);
    setDeleting(true);
    try {
      await api.delete(`/requisitions/deleteRequisition/${confirmDeleteId}`);
      setRequisitions((prev) => prev.filter((r) => r._id !== confirmDeleteId));
      toast.success("Requisition deleted successfully!", { duration: 2000 });
      setConfirmOpen(false);
      setConfirmDeleteId(null);
    } catch (e) {
      console.error(e.response?.data?.message || e.message);
      toast.error(e?.response?.data?.message || "Requisition not deleted", { duration: 3000 });
    } finally {
      setDeleting(false);
    }
  };

  const viewRequisition = async (id) => {
    try {
      const res = await api.get(`/requisitions/viewRequisitionInfo/${id}`);
      const requisition = res.data?.requisition || res.data;
      setSelectedReq(requisition);
      setShowModal(true);
    } catch (err) {
      console.error('Failed to load requisition info', err);
      toast.error(err?.response?.data?.message || 'Failed to load requisition');
    }
  };

  const processedData = useMemo(() => {
    const filtered = requisitions.map(r => {
      const dep = r.approvals?.departmentHead?.approval?.status;
      const hr = r.approvals?.hr?.approval?.status;
      const coo = r.approvals?.coo?.approval?.status;
      const overall = (dep === 'rejected' || hr === 'rejected' || coo === 'rejected') ? 'Rejected' : (dep === 'approved' && hr === 'approved' && coo === 'approved') ? 'Approved' : 'Pending';
      
      const query = searchQuery.toLowerCase();
      const isSearched = !query ||
        r.reqId?.toLowerCase().includes(query) ||
        r.position?.toLowerCase().includes(query);
      
      const isTabMatch = (tab === 'All') || (overall === tab);

      return { ...r, _overallStatus: overall, _hidden: !isSearched || !isTabMatch };
    });

    const kpis = filtered.reduce(
      (acc, r) => {
        if (r._hidden) return acc;
        
        acc.total += 1;
        if (r._overallStatus === 'Rejected') acc.rejected += 1;
        else if (r._overallStatus === 'Approved') acc.approved += 1;
        else if (r._overallStatus === 'Pending') acc.pending += 1;
        
        if (r._overallStatus === 'Approved' && r.job) acc.jobCreated += 1;
        
        return acc;
      },
      { total: 0, approved: 0, pending: 0, rejected: 0, jobCreated: 0 }
    );

    return { kpis, visibleRequisitions: filtered.filter(r => !r._hidden) };
  }, [requisitions, searchQuery, tab]);
  
  // --- ADDED: Standardized Loading Spinner ---
  const renderLoading = () => (
    <div className="flex items-center justify-center h-[calc(100vh-200px)]">
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
    <>
      <div className="flex h-screen bg-[#F5F5F5] relative">
        <Sidebar
          role={role}
          active={active}
          setActive={setActive}
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
        />

        {/* Form submission loading overlay */}
        {loading && (
          <div className="fixed inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-[9999] pointer-events-auto">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-blue-300 border-t-blue-600 rounded-full animate-spin"></div>
              <div className="absolute inset-0 w-16 h-16 rounded-full bg-blue-500/10 animate-ping"></div>
            </div>
            <p className="mt-4 text-blue-700 font-semibold text-lg animate-pulse">
              Creating Requisition Form...
            </p>
          </div>
        )}

        <main className="flex-1 flex flex-col overflow-auto">
          <ProfileHeader
            title="Requisitions"
            subtitle="Create and manage requisition form."
            showMenuButton={true} // --- HAMBURGER FIX ---
            onMenuClick={() => setSidebarOpen(true)} // --- HAMBURGER FIX ---
          />

          <div className="p-4 md:p-6 flex-1 overflow-auto">
            {pageLoading ? (
              renderLoading() // --- USE LOADING SPINNER ---
            ) : (
              <div className="max-w-7xl mx-auto">
                {/* --- KPI Cards --- */}
                <div className="mb-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6">
                  <KPICard title="Total Requisitions" value={processedData.kpis.total} icon={<Briefcase size={20} />} />
                  <KPICard title="Pending Approval" value={processedData.kpis.pending} icon={<Hourglass size={20} />} bgColorClass="bg-yellow-100" textColorClass="text-yellow-600" />
                  <KPICard title="Approved" value={processedData.kpis.approved} icon={<CheckCircle size={20} />} bgColorClass="bg-green-100" textColorClass="text-green-600" />
                  <KPICard title="Jobs Created" value={processedData.kpis.jobCreated} icon={<Briefcase size={20} />} bgColorClass="bg-blue-100" textColorClass="text-blue-600" />
                  <KPICard title="Rejected" value={processedData.kpis.rejected} icon={<XCircle size={20} />} bgColorClass="bg-red-100" textColorClass="text-red-600" />
                </div>

                {/* --- RESPONSIVE: Search and Add Button --- */}
                <div className="mb-6 flex flex-col md:flex-row items-center justify-between gap-4">
                  <div className="relative w-full md:w-72">
                    <input
                      type="text"
                      placeholder="Search by Req No or Position..."
                      className="w-full px-4 py-2 pl-10 pr-4 rounded-full shadow-sm border border-gray-200"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <svg xmlns="http://www.w3.org/2000/svg" className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 105 11a6 6 0 0012 0z" />
                    </svg>
                  </div>
                  
                  {["sub_recruiter"].includes(role) && (
                    <button
                      onClick={() => setShowForm(!showForm)}
                      className="flex items-center justify-center w-full md:w-auto gap-2 px-5 py-2 rounded-full shadow-md bg-gradient-to-r from-gray-700 to-gray-500 text-white hover:opacity-95 transition"
                    >
                      <PlusCircle size={18} />
                      {showForm ? "Close Form" : "Add Requisition"}
                    </button>
                  )}
                </div>

                {/* Tabs */}
                <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex gap-2 flex-wrap">
                    {["All", "Approved", "Pending", "Rejected"].map((t) => (
                      <button
                        key={t}
                        onClick={() => setTab(t)}
                        className={`px-3 py-1 rounded-full text-sm font-medium ${
                          tab === t
                            ? "bg-[#e5383b] text-white"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                  <div className="text-sm text-gray-500">
                    Showing {processedData.visibleRequisitions.length} requisitions
                  </div>
                </div>

                {/* --- RESPONSIVE: Table view --- */}
                <div className="bg-white rounded-xl border shadow-lg overflow-hidden mb-8">
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[768px] table-auto">
                      <thead className="text-sm text-[#0b090a] bg-[#BFBFBF]">
                        <tr>
                          <th className="p-3 text-left">Req No</th>
                          <th className="p-3 text-left">Position</th>
                          <th className="p-3 text-left">Department</th>
                          <th className="p-3 text-center">Req Status</th>
                          <th className="p-3 text-left">Job ID</th>
                          <th className="p-3 text-center">Job Status</th>
                          <th className="p-3 text-center">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {processedData.visibleRequisitions.length === 0 ? (
                          <tr>
                            <td colSpan="7" className="p-6 text-center text-gray-500">
                              No requisitions match your filters.
                            </td>
                          </tr>
                        ) : (
                          processedData.visibleRequisitions.map((r) => (
                            <tr key={r._id} className="border-t hover:bg-gray-50">
                              <td className="p-3 font-semibold">{r.reqId}</td>
                              <td className="p-3">{r.position}</td>
                              <td className="p-3">{r.department}</td>
                              <td className="p-3 text-center">
                                {(() => {
                                  const overall = r._overallStatus;
                                  const color =
                                    overall === "Approved"
                                      ? "bg-green-100 text-green-700"
                                      : overall === "Rejected"
                                      ? "bg-red-100 text-red-700"
                                      : "bg-yellow-100 text-yellow-700";
                                  return (
                                    <span
                                      className={`px-3 py-1 rounded-full text-xs font-medium ${color}`}
                                    >
                                      {overall}
                                    </span>
                                  );
                                })()}
                              </td>
                              <td className="p-3 text-gray-600">
                                {r.job?.jobId || "N/A"}
                              </td>
                              <td className="p-3 text-center">
                                {r.job ? (
                                  <StatusBadge status={r.job.status} />
                                ) : (
                                  <span className="text-xs text-gray-500">
                                    N/A
                                  </span>
                                )}
                              </td>
                              <td className="p-3 text-center">
                                <div className="flex items-center justify-center gap-2">
                                  <button
                                    onClick={() => viewRequisition(r._id)}
                                    title="View"
                                    className="inline-flex items-center justify-center w-9 h-9 rounded-md bg-indigo-50 text-[#111111] hover:bg-indigo-600 hover:text-white transition-shadow shadow-sm"
                                  >
                                    <Eye size={18} />
                                  </button>
                                  {(role === "sub_recruiter" ||
                                    r.createdBy?._id === user._id) && (
                                    <button
                                      onClick={() =>
                                        promptRequisitionDelete(r._id)
                                      }
                                      title="Delete"
                                      className="inline-flex items-center justify-center w-9 h-9 rounded-md bg-red-50 text-red-600 hover:bg-red-600 hover:text-white transition-shadow shadow-sm"
                                    >
                                      <Trash size={16} />
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Add Requisition Form Modal */}
                <Dialog
                  open={showForm}
                  onClose={() => setShowForm(false)}
                  className="relative z-50"
                >
                  <div
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm"
                    aria-hidden="true"
                  />
                  <div className="fixed inset-0 flex items-center justify-center p-4">
                    <motion.div
                      initial={{ opacity: 0, y: 50 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 50 }}
                      transition={{ duration: 0.4, ease: "easeInOut" }}
                      className="bg-white/95 rounded-2xl shadow-2xl max-w-5xl w-full overflow-hidden"
                    >
                      {/* Header */}
                      <div className="p-5 bg-[#111111] text-white flex items-center justify-between border-b border-[#1A1A1A]">
                        <div className="flex items-center gap-4">
                          <div className="w-1.5 h-8 rounded-full bg-[#E30613]" />
                          <div>
                            <h2 className="text-2xl font-semibold flex items-center gap-2">
                              Create New Requisition
                            </h2>
                            <p className="text-sm opacity-80">
                              Fill the form to create a new requisition
                            </p>
                          </div>
                        </div>
                        <div>
                          <button
                            onClick={() => setShowForm(false)}
                            className="bg-transparent hover:bg-white/10 rounded-full p-2 text-white"
                            aria-label="Close requisition form"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                      {/* Body */}
                      <div className="px-4 sm:px-8 py-4 overflow-y-auto max-h-[75vh] space-y-8">
                        <form
                          id="requisition-form"
                          onSubmit={handleSubmit}
                          className="space-y-5"
                        >
                          {/* --- RESPONSIVE FORM SECTIONS --- */}
                          <div className="bg-[#BFBFBF] p-4 sm:p-6 rounded-2xl border shadow-md">
                            <h3 className="text-lg font-semibold text-[#111111] mb-4">
                              Job Information
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <input type="text" placeholder="Position" className="border border-gray-200 p-2 rounded-xl shadow-md focus:ring-1 focus:ring-[#111] bg-white" value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value })} required />
                              <select className="border border-gray-200 p-2 rounded-xl shadow-md focus:ring-1 focus:ring-[#111] bg-white" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} required>
                                <option value="">Select Department</option>
                                {departmentList.map((d) => (<option key={d} value={d}>{d}</option>))}
                              </select>
                              <select className="border border-gray-200 p-2 rounded-xl shadow-md focus:ring-1 focus:ring-[#111] bg-white" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} required>
                                <option value="">Select Location</option>
                                {locations.map((l) => (<option key={l} value={l}>{l}</option>))}
                              </select>
                              <input type="text" placeholder="Company" className="border border-gray-200 p-2 rounded-xl shadow-md focus:ring-1 focus:ring-[#111] bg-white" value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} required />
                            </div>
                          </div>
                          
                          <div className="bg-[#BFBFBF] p-4 sm:p-6 rounded-2xl border shadow-md">
                            <h3 className="text-lg font-semibold text-[#111111] mb-4">Requisition Type</h3>
                            <select className="border border-gray-200 p-2 rounded-xl shadow-md focus:ring-1 focus:ring-[#111] bg-white max-w-sm" value={form.requisitionType} onChange={(e) => setForm({ ...form, requisitionType: e.target.value })} required>
                              <option value="New">New</option>
                              <option value="Replacement">Replacement</option>
                            </select>
                          </div>
                          
                          {form.requisitionType === "Replacement" && (
                           <div className="bg-[#BFBFBF] p-4 sm:p-6 rounded-2xl border shadow-md">
                             <h3 className="text-lg font-semibold text-[#111111] mb-4">Replacement Details</h3>
                             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                               <input type="text" placeholder="Name" className="border border-gray-200 p-2 rounded-xl shadow-md focus:ring-1 focus:ring-[#111] bg-white" value={form.replacementDetail.name} onChange={(e) => setForm({ ...form, replacementDetail: { ...form.replacementDetail, name: e.target.value } })}/>
                               <input type="text" placeholder="Designation" className="border border-gray-200 p-2 rounded-xl shadow-md focus:ring-1 focus:ring-[#111] bg-white" value={form.replacementDetail.desig} onChange={(e) => setForm({ ...form, replacementDetail: { ...form.replacementDetail, desig: e.target.value } })}/>
                               <input type="text" placeholder="Grade" className="border border-gray-200 p-2 rounded-xl shadow-md focus:ring-1 focus:ring-[#111] bg-white" value={form.replacementDetail.grade} onChange={(e) => setForm({ ...form, replacementDetail: { ...form.replacementDetail, grade: e.target.value } })}/>
                               <input type="number" placeholder="Salary" className="border border-gray-200 p-2 rounded-xl shadow-md focus:ring-1 focus:ring-[#111] bg-white" value={form.replacementDetail.salary} onChange={(e) => setForm({ ...form, replacementDetail: { ...form.replacementDetail, salary: e.target.value } })}/>
                               <input type="number" placeholder="Age" className="border border-gray-200 p-2 rounded-xl shadow-sm focus:ring-1 focus:ring-[#111] bg-white" value={form.replacementDetail.age} onChange={(e) => setForm({ ...form, replacementDetail: { ...form.replacementDetail, age: e.target.value } })}/>
                               <input type="date" className="border border-gray-200 p-2 rounded-xl shadow-md focus:ring-1 focus:ring-[#111] bg-white" value={form.replacementDetail.leavingDate} onChange={(e) => setForm({ ...form, replacementDetail: { ...form.replacementDetail, leavingDate: e.target.value } })}/>
                               <select className="input-field sm:col-span-2 p-2 rounded-xl shadow-md border" value={form.replacementDetail.reason} onChange={(e) => setForm({ ...form, replacementDetail: { ...form.replacementDetail, reason: e.target.value } })}>
                                 <option value="">Select Reason</option><option>Resigned</option><option>Terminated</option><option>Transfer</option><option>Retirement</option><option>ReDesignation</option><option>Promoted</option>
                               </select>
                             </div>
                           </div>
                          )}
                          
                          <div className="bg-[#BFBFBF] p-4 sm:p-6 rounded-2xl border shadow-md">
                            <h3 className="text-lg font-semibold text-[#111111] mb-4">Report To</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <input type="text" placeholder="Reports To (Name)" className="border border-gray-200 p-2 rounded-xl shadow-md focus:ring-1 focus:ring-[#111] bg-white" value={form.reportedTo.name} onChange={(e) => setForm({ ...form, reportedTo: { ...form.reportedTo, name: e.target.value } })}/>
                              <input type="text" placeholder="Reports To (Designation)" className="border border-gray-200 p-2 rounded-xl shadow-md focus:ring-1 focus:ring-[#111] bg-white" value={form.reportedTo.desig} onChange={(e) => setForm({ ...form, reportedTo: { ...form.reportedTo, desig: e.target.value } })}/>
                              <input type="text" placeholder="Grade" className="border border-gray-200 p-2 rounded-xl shadow-md focus:ring-1 focus:ring-[#111] bg-white" value={form.grade} onChange={(e) => setForm({ ...form, grade: e.target.value })}/>
                              <input type="number" placeholder="Salary" className="border border-gray-200 p-2 rounded-xl shadow-md focus:ring-1 focus:ring-[#111] bg-white" value={form.salary} onChange={(e) => setForm({ ...form, salary: e.target.value })}/>
                              <input type="number" placeholder="Age" className="border border-gray-200 p-2 rounded-xl shadow-md focus:ring-1 focus:ring-[#111] bg-white" value={form.age} onChange={(e) => setForm({ ...form, age: e.target.value })}/>
                              <select className="border border-gray-200 p-2 rounded-xl shadow-md focus:ring-1 focus:ring-[#111] bg-white" value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })}>
                                <option value="">Select Gender</option><option>Male</option><option>Female</option><option>Other</option>
                              </select>
                            </div>
                          </div>
                          
                          <div className="bg-[#BFBFBF] p-4 sm:p-6 rounded-2xl border shadow-md">
                            <h3 className="text-lg font-semibold text-[#111111] mb-4">Job Description</h3>
                            <textarea className="w-full h-28 p-2 rounded-xl border border-gray-200 shadow-md focus:ring-1 focus:ring-[#111] bg-white" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required />
                          </div>
                          
                          <div className="bg-[#BFBFBF] p-4 sm:p-6 rounded-2xl border shadow-md">
                            <h3 className="text-lg font-semibold text-[#111111] mb-4">Qualifications</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <input type="text" placeholder="Academic Qualification" className="border border-gray-200 p-2 rounded-xl shadow-md focus:ring-1 focus:ring-[#111] bg-white" value={form.academicQualification} onChange={(e) => setForm({ ...form, academicQualification: e.target.value })} required />
                              <input type="text" placeholder="Professional Qualification" className="border border-gray-200 p-2 rounded-xl shadow-md focus:ring-1 focus:ring-[#111] bg-white" value={form.professionalQualification} onChange={(e) => setForm({ ...form, professionalQualification: e.target.value })} required />
                              <input type="text" placeholder="Experience" className="sm:col-span-2 border border-gray-200 p-2 rounded-xl shadow-md focus:ring-1 focus:ring-[#111] bg-white" value={form.experience} onChange={(e) => setForm({ ...form, experience: e.target.value })} />
                            </div>
                          </div>
                          
                          <div className="bg-[#BFBFBF] p-4 sm:p-6 rounded-2xl border shadow-md">
                            <h3 className="text-lg font-semibold text-[#111111] mb-4">Skills</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <input type="text" placeholder="Soft Skills (comma separated)" className="border border-gray-200 p-2 rounded-xl shadow-md focus:ring-1 focus:ring-[#111] bg-white" value={form.softSkills.join(",")} onChange={(e) => setForm({ ...form, softSkills: e.target.value.split(",").map((s) => s.trim()) })} />
                              <input type="text" placeholder="Technical Skills (comma separated)" className="border border-gray-200 p-2 rounded-xl shadow-md focus:ring-1 focus:ring-[#111] bg-white" value={form.technicalSkills.join(",")} onChange={(e) => setForm({ ...form, technicalSkills: e.target.value.split(",").map((s) => s.trim()) })} />
                            </div>
                          </div>
                          
                          <div className="bg-[#BFBFBF] p-4 sm:p-6 rounded-2xl border shadow-md">
                              <h3 className="text-lg font-semibold text-[#111111] mb-4">Joining Details</h3>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                  <input type="date" className="border border-gray-200 p-2 rounded-xl shadow-md focus:ring-1 focus:ring-[#111] bg-white" value={form.desiredDateJoin} onChange={(e) => setForm({ ...form, desiredDateJoin: e.target.value })} />
                                  <select className="border border-gray-200 p-2 rounded-xl shadow-md focus:ring-1 focus:ring-[#111] bg-white" value={form.approvedPosition} onChange={(e) => setForm({ ...form, approvedPosition: e.target.value })} required>
                                      <option value="">Approved Position?</option><option value="Yes">Yes</option><option value="No">No</option>
                                  </select>
                              </div>
                          </div>
                        </form>
                      </div>
                      {/* Footer */}
                      <div className="flex items-center justify-between px-8 py-4 bg-[#F5F5F5]">
                        <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-[#111] text-white hover:text-black hover:bg-[#BFBFBF] transition rounded-full shadow-md border font-semibold">Cancel</button>
                        <button type="submit" form="requisition-form" className="px-5 py-2 rounded-full shadow-md border bg-[#dc2626] text-white font-semibold hover:bg-red-700 transition" disabled={loading}>
                          {loading ? "Submitting..." : "Submit Requisition"}
                        </button>
                      </div>
                    </motion.div>
                  </div>
                </Dialog>

                {/* Confirm Delete Dialog */}
                <Dialog
                  open={confirmOpen}
                  onClose={() => {
                    if (!deleting) {
                      setConfirmOpen(false);
                      setConfirmDeleteId(null);
                    }
                  }}
                  className="relative z-50"
                >
                  <div
                    className="fixed inset-0 bg-black/40"
                    aria-hidden="true"
                  />
                  <div className="fixed inset-0 flex items-center justify-center p-4">
                    <Dialog.Panel className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6">
                      <Dialog.Title className="text-lg font-semibold text-gray-800">
                        Confirm deletion
                      </Dialog.Title>
                      <p className="mt-2 text-sm text-gray-600">
                        This action will permanently delete the requisition. This
                        cannot be undone.
                      </p>
                      <div className="mt-6 flex items-center justify-end gap-2">
                        <button
                          onClick={() => {
                            setConfirmOpen(false);
                            setConfirmDeleteId(null);
                          }}
                          disabled={deleting}
                          className="px-4 py-2 rounded-full bg-gray-100 text-gray-700 hover:bg-gray-200 shadow-lg"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={performDelete}
                          disabled={deleting}
                          className="px-4 py-2 rounded-full bg-red-600 text-white hover:bg-red-700 shadow-md"
                        >
                          {deleting ? "Deleting..." : "Delete"}
                        </button>
                      </div>
                    </Dialog.Panel>
                  </div>
                </Dialog>

                {/* View Requisition Modal */}
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
                          {/* Header */}
                          <div className="flex flex-col sm:flex-row items-start justify-between mb-6">
                            <div>
                              <h2 className="text-2xl font-bold text-gray-900">
                                {selectedReq.position}
                              </h2>
                              <p className="text-sm text-gray-500 mt-1">
                                {selectedReq.department} • {selectedReq.location}
                              </p>
                            </div>
                            <div className="text-left sm:text-right mt-4 sm:mt-0">
                              <p className="text-xs text-gray-400">
                                Requested by
                              </p>
                              <p className="text-lg font-medium text-gray-700">
                                {selectedReq.createdBy?.name || "-"}
                              </p>
                              <p className="text-sm font-medium text-gray-400">
                                Form No: {selectedReq.reqId}
                              </p>
                              <p className="text-sm font-medium text-gray-400">
                                {selectedReq.createdAt
                                  ? new Date(
                                      selectedReq.createdAt
                                    ).toISOString()
                                      .split("T")[0]
                                  : "-"}
                              </p>
                            </div>
                          </div>

                          {/* Job Status Section */}
                          {selectedReq.job ? (
                            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-xl flex items-center justify-between">
                              <div className="flex items-center gap-4">
                                <FaBriefcase
                                  className="text-blue-600"
                                  size={20}
                                />
                                <div>
                                  <InfoBlock
                                    label="Job Status"
                                    value={selectedReq.job.jobId}
                                  />
                                </div>
                              </div>
                              <StatusBadge status={selectedReq.job.status} />
                            </div>
                          ) : (
                            <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-xl">
                              <InfoBlock
                                label="Job Status"
                                value="Not Yet Created"
                              />
                            </div>
                          )}

                          {/* Job Info */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-gray-700">
                            <div className="space-y-4">
                              <InfoBlock
                                label="Nature"
                                value={selectedReq.natureOfEmployment}
                              />
                              <InfoBlock
                                label="Company"
                                value={selectedReq.company}
                              />
                              <InfoBlock label="Requisition Type">
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-indigo-50 text-[#111111]">
                                  {selectedReq.requisitionType}
                                </span>
                              </InfoBlock>
                              {selectedReq.requisitionType === "Replacement" && (
                                <div className="mt-3 p-4 bg-gray-50 rounded-xl border">
                                  <h5 className="text-sm font-semibold text-[#111111] mb-2">
                                    Replacement Details
                                  </h5>
                                  <p>
                                    <span className="text-gray-500">Name:</span>{" "}
                                    {selectedReq.replacementDetail?.name || "-"}
                                  </p>
                                  <p>
                                    <span className="text-gray-500">Designation:</span>{" "}
                                    {selectedReq.replacementDetail?.desig || "-"}
                                  </p>
                                  <p>
                                    <span className="text-gray-500">Reason:</span>{" "}
                                    {selectedReq.replacementDetail?.reason || "-"}
                                  </p>
                                  <p>
                                    <span className="text-gray-500">Salary:</span>{" "}
                                    {selectedReq.replacementDetail?.salary || "-"}
                                  </p>
                                </div>
                              )}
                            </div>
                            <div className="space-y-5">
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
                                <InfoBlock
                                  label="Age"
                                  value={selectedReq.age || "-"}
                                />
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

                          {/* Description & Qualifications */}
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
                                <span className="text-gray-500">
                                  Professional:
                                </span>{" "}
                                {selectedReq.professionalQualification || "-"}
                              </p>
                              <p>
                                <span className="text-gray-500">
                                  Experience:
                                </span>{" "}
                                {selectedReq.experience || "-"}
                              </p>
                              <p className="mt-2">
                                <span className="text-gray-500">
                                  Soft Skills:
                                </span>{" "}
                                {(selectedReq.softSkills || []).join(", ") || "-"}
                              </p>
                              <p>
                                <span className="text-gray-500">
                                  Technical Skills:
                                </span>{" "}
                                {(selectedReq.technicalSkills || []).join(", ") ||
                                  "-"}
                              </p>
                            </div>
                          </div>

                          <hr className="my-6 border-gray-200" />

                          {/* Status + Comments */}
                          <div className="space-y-6">
                            <div className="flex flex-col-1 sm:flex-row items-center gap-4 justify-center">
                              {["HOD", "HR", "COO"].map((role, idx) => {
                                const approval =
                                  role === "HOD"
                                    ? selectedReq.approvals?.departmentHead
                                        ?.approval
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
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <CommentCard
                                title="Head of Department"
                                approver={
                                  selectedReq.approvals?.departmentHead?.approval
                                    ?.reviewer?.name ||
                                  selectedReq.assignedHod?.name
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
                                  selectedReq.approvals?.hr?.approval?.reviewer
                                    ?.name || "HR"
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
                                  selectedReq.approvals?.coo?.approval?.reviewer
                                    ?.name
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
                        </div>
                        {/* Footer */}
                        <div className="mt-8 flex justify-end p-6 bg-gray-100 border-t">
                          <button
                            onClick={() => setShowModal(false)}
                            className="rounded-full px-6 py-2 font-medium shadow-md hover:bg-[#BFBFBF] hover:text-black text-white bg-[#111] transition"
                          >
                            Close
                          </button>
                        </div>
                      </Dialog.Panel>
                    </div>
                  </Dialog>
                )}
              </div>
            )}
          </div>

          <Footer />
        </main>
      </div>
    </>
  );
}