import React, { useState, useMemo } from 'react';
import { FaSort, FaSortUp, FaSortDown } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

// Helper function to calculate days open
const calculateDaysOpen = (dateString) => {
  if (!dateString) return 'N/A';
  const createdDate = new Date(dateString);
  const today = new Date();
  const diffTime = Math.abs(today - createdDate);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return `${diffDays} days`;
};

// Main Table Component
const JobPerformanceTable = ({ jobs, applications }) => {
  const navigate = useNavigate(); // Get navigate function
  
  const [sortConfig, setSortConfig] = useState({ key: 'createdAt', direction: 'descending' });

  // Memoize the job data combined with applicant counts
  const jobsWithApplicantCounts = useMemo(() => {
    const applicantCounts = applications.reduce((acc, app) => {
      // Ensure app.job exists before trying to access it
      if (app.job) {
          acc[app.job._id] = (acc[app.job._id] || 0) + 1;
      }
      return acc;
    }, {});
    
    return jobs.map(job => ({
      ...job,
      applicantCount: applicantCounts[job._id] || 0,
      daysOpen: calculateDaysOpen(job.createdAt),
    }));
  }, [jobs, applications]);
  
  // Memoize the sorting logic
  const sortedJobs = useMemo(() => {
    let sortableItems = [...jobsWithApplicantCounts];
    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [jobsWithApplicantCounts, sortConfig]);

  const requestSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };
  
  // Helper for rendering the sort icon
  const getSortIcon = (name) => {
    if (sortConfig.key !== name) {
      return <FaSort className="text-gray-400" />;
    }
    return sortConfig.direction === 'ascending' ? <FaSortUp /> : <FaSortDown />;
  };

  const getStatusChip = (job) => {
    // Prioritize the main 'status' field first
    if (job.status === 'Open') {
        return <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-600">Open</span>;
    }
    if (job.status === 'Closed') {
        return <span className="px-2 py-1 text-xs rounded-full bg-gray-200 text-gray-700">Closed</span>;
    }
    if (job.status === 'Draft') {
        return <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-600">Draft</span>;
    }

    // Fallback for other states like 'rejected' from the approval flow
    if (job.approval?.status === 'rejected') {
        return <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-600">Rejected</span>;
    }
    if (job.approval?.status === 'pending') {
        return <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-600">Pending</span>;
    }
    
    // Default fallback
    return <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-600">Unknown</span>;
  };
  
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm text-left text-gray-500">
        <thead className="text-xs text-gray-700 uppercase bg-[#BFBFBF]">
          <tr>
            <th scope="col" className="px-6 py-3 cursor-pointer" onClick={() => requestSort('title')}>
              <div className="flex items-center gap-2">Job Title {getSortIcon('title')}</div>
            </th>
            <th scope="col" className="px-6 py-3 cursor-pointer" onClick={() => requestSort('applicantCount')}>
              <div className="flex items-center gap-2">Applicants {getSortIcon('applicantCount')}</div>
            </th>
            <th scope="col" className="px-6 py-3 cursor-pointer" onClick={() => requestSort('daysOpen')}>
              <div className="flex items-center gap-2">Time Open {getSortIcon('daysOpen')}</div>
            </th>
            <th scope="col" className="px-6 py-3">Status</th>
            <th scope="col" className="px-6 py-3">Recruiter</th>
            <th scope="col" className="px-6 py-3">Report</th>
          </tr>
        </thead>
        <tbody>
          {sortedJobs.map((job) => (
            <tr key={job._id} className="bg-white border-b hover:bg-gray-50">
              <th scope="row" className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">
                <div className="font-bold">{job.title}</div>
                <div className="text-xs text-gray-500">{job.department}</div>
              </th>
              <td className="px-6 py-4 text-center">{job.applicantCount}</td>
              <td className="px-6 py-4">{job.daysOpen}</td>
              <td className="px-6 py-4">{getStatusChip(job)}</td>
              <td className="px-6 py-4">{job.createdBy?.name || 'N/A'}</td>
              <td className="px-6 py-4">
                <button 
                  onClick={() => navigate(`/reports/lifecycle/${job._id}`)}
                  className="font-medium text-green-600 hover:text-green-800"
                >
                  View Report
                </button>
              </td>
            </tr>
          ))}
          {sortedJobs.length === 0 && (
             <tr>
                <td colSpan="5" className="text-center py-10 text-gray-500">No jobs found for the selected department.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default JobPerformanceTable;