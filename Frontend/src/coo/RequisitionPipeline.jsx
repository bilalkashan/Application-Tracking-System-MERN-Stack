import React, { useMemo } from 'react';
import { FaUserTie, FaBuilding, FaRegClock } from 'react-icons/fa';

// Helper function to format dates
const formatDate = (dateString) => {
  if (!dateString) return "-";
  return new Date(dateString).toLocaleDateString("en-US", { year: 'numeric', month: 'short', day: 'numeric' });
};

// Reusable card component for each requisition
const RequisitionCard = ({ requisition }) => (
  <div className="p-4 bg-white border rounded-lg shadow-sm hover:border-indigo-400 transition-all cursor-pointer">
    <h4 className="font-bold text-gray-800">{requisition.position}</h4>
    <p className="text-sm text-indigo-600 font-medium">{requisition.department}</p>
    <div className="mt-3 pt-3 border-t border-gray-200 text-xs text-gray-500 space-y-1">
      <div className="flex items-center gap-2">
        <FaUserTie />
        <span>Requested by: {requisition.createdBy?.name || 'N/A'}</span>
      </div>
      <div className="flex items-center gap-2">
        <FaBuilding />
        <span>Req ID: {requisition.reqId}</span>
      </div>
      <div className="flex items-center gap-2">
        <FaRegClock />
        <span>{formatDate(requisition.createdAt)}</span>
      </div>
    </div>
  </div>
);

// The main Kanban board component
const RequisitionPipeline = ({ requisitions }) => {
  const columns = useMemo(() => {
    const data = {
      'Pending HOD': [],
      'Pending HR': [],
      'Pending COO': [],
      'Approved': [],
      'Rejected': [],
    };

    requisitions.forEach(req => {
      const hodStatus = req.approvals?.departmentHead?.approval?.status;
      const hrStatus = req.approvals?.hr?.approval?.status;
      const cooStatus = req.approvals?.coo?.approval?.status;

      if (hodStatus === 'rejected' || hrStatus === 'rejected' || cooStatus === 'rejected') {
        data['Rejected'].push(req);
      } else if (hodStatus === 'pending') {
        data['Pending HOD'].push(req);
      } else if (hodStatus === 'approved' && hrStatus === 'pending') {
        data['Pending HR'].push(req);
      } else if (hrStatus === 'approved' && cooStatus === 'pending') {
        data['Pending COO'].push(req);
      } else if (cooStatus === 'approved') {
        data['Approved'].push(req);
      }
    });

    return data;
  }, [requisitions]);

  const columnStyles = {
    'Pending HOD': 'border-t-4 border-[#BFBFBF]',
    'Pending HR': 'border-t-4 border-red-500',
    'Pending COO': 'border-t-4 border-[#111]',
    'Approved': 'border-t-4 border-[#BFBFBF]',
    'Rejected': 'border-t-4 border-red-500',
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
      {Object.entries(columns).map(([title, reqs]) => (
        // CHANGE 1: Added 'flex' and 'flex-col' to make the column a flex container
        <div key={title} className={`bg-gray-100 rounded-xl p-4 flex flex-col ${columnStyles[title]}`}>
          {/* CHANGE 2: Added 'flex-shrink-0' to prevent the header from shrinking */}
          <h3 className="font-semibold text-gray-700 mb-4 flex justify-between items-center flex-shrink-0">
            {title}
            <span className="text-sm bg-gray-200 text-gray-600 font-bold px-2.5 py-1 rounded-full">
              {reqs.length}
            </span>
          </h3>
          {/* This scrollable div will now correctly fill the remaining space and scroll */}
          <div className="space-y-4 overflow-y-auto h-80 pr-2">
            {reqs.length > 0 ? (
              reqs.map(req => <RequisitionCard key={req._id} requisition={req} />)
              ) : (
                <p className="text-center text-sm text-gray-400 pt-8">No requisitions in this stage.</p>
              )
            }
          </div>
        </div>
      ))}
    </div>
  );
};

export default RequisitionPipeline;