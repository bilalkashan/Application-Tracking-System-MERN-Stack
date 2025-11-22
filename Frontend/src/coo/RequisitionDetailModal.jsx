import React from 'react';
import { Dialog } from '@headlessui/react';

// Reusable micro-components to keep the main component clean
const InfoBlock = ({ label, value, children }) => (
  <div>
    <h4 className="text-xs text-gray-400 uppercase tracking-wide">{label}</h4>
    <p className="text-base text-gray-800 font-medium">{value || children || "-"}</p>
  </div>
);

const CommentCard = ({ title, approver, date, comments }) => (
  <div className="bg-gray-50 border rounded-xl p-4 shadow-sm">
    <div>
      <div className="text-sm font-semibold text-gray-800">{title}</div>
      <div className="text-xs text-gray-500">
        {approver || "-"}
        {date && <span> • {new Date(date).toLocaleDateString()}</span>}
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

const RequisitionDetailModal = ({ requisition, isOpen, onClose }) => {
  if (!requisition) return null;

  const selectedReq = requisition; // Use a consistent variable name
  const formatDate = (dateString) => dateString ? new Date(dateString).toLocaleDateString() : "-";

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full p-8 overflow-hidden flex flex-col max-h-[90vh] border border-gray-100">
          {/* Header */}
          <div className="flex-shrink-0 flex items-start justify-between mb-6">
            <div>
              <Dialog.Title className="text-2xl font-bold text-gray-900">{selectedReq.position}</Dialog.Title>
              <p className="text-sm text-gray-500 mt-1">
                {selectedReq.department} • {selectedReq.location}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-400">Requested by</p>
              <p className="text-lg font-medium text-gray-700">{selectedReq.createdBy?.name || "-"}</p>
              <p className="text-sm font-medium text-gray-400">Form No: {selectedReq.reqId}</p>
              <p className="text-sm font-medium text-gray-400">{formatDate(selectedReq.createdAt)}</p>
            </div>
          </div>

          {/* Scrollable Body */}
          <div className="flex-grow overflow-y-auto pr-4 -mr-4 space-y-6">
            {/* Job Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-gray-700">
              <div className="space-y-4">
                <InfoBlock label="Nature" value={selectedReq.natureOfEmployment} />
                <InfoBlock label="Company" value={selectedReq.company} />
                <InfoBlock label="Requisition Type">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-indigo-50 text-indigo-700">
                    {selectedReq.requisitionType}
                  </span>
                </InfoBlock>
                {selectedReq.requisitionType === "Replacement" && (
                  <div className="mt-3 p-4 bg-gray-50 rounded-xl border">
                    <h5 className="text-sm font-semibold text-indigo-700 mb-2">Replacement Details</h5>
                    <p><span className="text-gray-500">Name:</span> {selectedReq.replacementDetail?.name || "-"}</p>
                    <p><span className="text-gray-500">Reason:</span> {selectedReq.replacementDetail?.reason || "-"}</p>
                  </div>
                )}
              </div>
              <div className="space-y-4">
                <InfoBlock
                  label="Reports To"
                  value={`${selectedReq.reportedTo?.name || "-"} (${selectedReq.reportedTo?.desig || "-"})`}
                />
                <div className="grid grid-cols-3 gap-3">
                  <InfoBlock label="Grade" value={selectedReq.grade || "-"} />
                  <InfoBlock label="Salary" value={selectedReq.salary || "-"} />
                  <InfoBlock label="Age" value={selectedReq.age || "-"} />
                </div>
                <InfoBlock label="Gender" value={selectedReq.gender || "-"} />
              </div>
            </div>

            <hr className="border-gray-200" />

            {/* Description & Qualifications */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-gray-700">
              <div>
                <h4 className="text-sm font-semibold text-gray-800 mb-2">Job Description</h4>
                <p className="leading-relaxed whitespace-pre-wrap">{selectedReq.description}</p>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-gray-800 mb-2">Qualifications & Experience</h4>
                <p><span className="text-gray-500">Academic:</span> {selectedReq.academicQualification || "-"}</p>
                <p><span className="text-gray-500">Professional:</span> {selectedReq.professionalQualification || "-"}</p>
                <p className="mt-2"><span className="text-gray-500">Soft Skills:</span> {(selectedReq.softSkills || []).join(", ") || "-"}</p>
                <p><span className="text-gray-500">Technical Skills:</span> {(selectedReq.technicalSkills || []).join(", ") || "-"}</p>
              </div>
            </div>

            <hr className="border-gray-200" />

            {/* Status and Approval Comments */}
            <div>
              <div className="flex items-center gap-4 justify-center">
                {["HOD", "HR", "COO"].map((role, idx) => {
                                            const approval =
                                              role === "HOD"
                                                ? selectedReq.approvals?.departmentHead?.approval
                                                : role === "HR"
                                                ? selectedReq.approvals?.hr?.approval
                                                : selectedReq.approvals?.coo?.approval;
                                            const status =
                                              approval?.status ||
                                              (role === "HR" && approval?.signedAt ? "approved" : "pending");
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
                                                {role}: {status?.charAt(0).toUpperCase() + status?.slice(1) || "Pending"}
                                              </div>
                                            );
                })}
              </div>

              <hr className="border-gray-200 mt-6"/>
                                          
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Approval History</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <CommentCard
                  title="Head of Department"
                  approver={selectedReq.approvals?.departmentHead?.approval?.name}
                  date={selectedReq.approvals?.departmentHead?.approval?.reviewedAt}
                  comments={selectedReq.approvals?.departmentHead?.approval?.comments}
                />
                <CommentCard
                  title="Human Resource"
                  approver={selectedReq.approvals?.hr?.approval?.reviewer?.name}
                  date={selectedReq.approvals?.hr?.approval?.reviewedAt}
                  comments={selectedReq.approvals?.hr?.approval?.comments}
                />
                <CommentCard
                  title="Chief Operating Officer"
                  approver={selectedReq.approvals?.coo?.approval?.name}
                  date={selectedReq.approvals?.coo?.approval?.reviewedAt}
                  comments={selectedReq.approvals?.coo?.approval?.comments}
                />
              </div>
            </div>
          </div>
          
          {/* Footer */}
          <div className="flex-shrink-0 mt-6 flex justify-end">
            <button
              onClick={onClose}
              className="px-5 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition"
            >
              Close
            </button>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
};

export default RequisitionDetailModal;