import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import api from '../api';
import Sidebar from '../components/Sidebar'; // Assuming paths are correct
import ProfileHeader from '../components/ProfileHeader';
import Footer from '../components/Footer';
import { FaSpinner } from 'react-icons/fa';

const AdminJobApprovalPage = () => {
  const [pendingJobs, setPendingJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [reviewComments, setReviewComments] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const user = JSON.parse(localStorage.getItem("loggedInUser"));
  const role = user?.role || "admin";

  const fetchPendingJobs = async () => {
    setLoading(true);
    try {
      const res = await api.get('/auth/pending');
      setPendingJobs(res.data.jobs || []);
    } catch (error) {
      toast.error('Failed to fetch pending jobs.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingJobs();
  }, []);

  const handleReview = async (jobId, action, comments = '') => {
    try {
      setActionLoading(true);
      await api.patch(`/auth/${jobId}/review`, { action, comments });
      toast.success(`Job has been ${action}d!`);
      // reset modal state
      setShowModal(false);
      setSelectedJob(null);
      setReviewComments('');
      fetchPendingJobs();
    } catch (error) {
      toast.error(`Failed to ${action} job.`);
      console.error(error);
    } finally {
      setActionLoading(false);
    }
  };

  const openReview = (job) => {
    setSelectedJob(job);
    setReviewComments('');
    setShowModal(true);
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar
        role={role}
        active="Jobs Approval"
        setActive={() => {}}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
      />
      <main className="flex-1 overflow-auto">
        <ProfileHeader 
          title="Job Approvals" 
          subtitle="Review and approve newly created jobs" 
          showMenuButton={true} 
          onMenuClick={() => setSidebarOpen(true)} 
        />
        <div className="p-6">
          <div className="max-w-7xl mx-auto bg-white shadow-md rounded-lg overflow-hidden">
            <h2 className="text-xl font-bold p-4 border-b">Pending Job Requests</h2>
            {loading ? (
              <div className="flex items-center justify-center h-[calc(100vh-200px)]">
                <FaSpinner className="animate-spin text-4xl text-gray-700" />
                <p className="ml-3 text-lg text-gray-600">Loading...</p>
              </div>
            ) : (
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-gray-700 uppercase bg-gray-100">
                  <tr>
                    <th className="px-6 py-3">Position</th>
                    <th className="px-6 py-3">Department</th>
                    <th className="px-6 py-3">Requested By</th>
                    <th className="px-6 py-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingJobs.length > 0 ? pendingJobs.map(job => (
                    <tr key={job._id} className="border-b hover:bg-gray-50">
                      <td className="px-6 py-4 font-medium text-gray-900">{job.title}</td>
                      <td className="px-6 py-4">{job.department}</td>
                      <td className="px-6 py-4">{job.createdBy.name}</td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => openReview(job)}
                          className="font-medium text-white bg-indigo-600 hover:bg-indigo-700 px-3 py-1 rounded"
                        >
                          View & Review
                        </button>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan="4" className="text-center py-10 text-gray-500">No jobs are currently pending approval.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {showModal && selectedJob && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="fixed inset-0 bg-black/40" onClick={() => setShowModal(false)} />
            <div className="relative bg-white rounded-xl shadow-2xl max-w-4xl w-full mx-4 p-6 z-50 overflow-auto max-h-[90vh]">
              <div className="flex justify-between items-start">
                <h3 className="text-xl font-bold">Review Job: {selectedJob.title}</h3>
                <button onClick={() => setShowModal(false)} className="text-gray-500">Close</button>
              </div>

              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="p-4 border rounded-lg bg-gray-50">
                  <h4 className="font-semibold mb-2">Job Details</h4>
                  <p><strong>Department:</strong> {selectedJob.department || '-'}</p>
                  <p><strong>Designation:</strong> {selectedJob.designation || '-'}</p>
                  <p><strong>Job ID:</strong> {selectedJob.jobId || '-'}</p>
                  <p><strong>Req No:</strong> {selectedJob.reqId || '-'}</p>
                  <p><strong>Type:</strong> {selectedJob.type || '-'}</p>
                  <p><strong>Location:</strong> {selectedJob.location || '-'}</p>
                  <p className="mt-2"><strong>Description:</strong><br/><span className="whitespace-pre-wrap">{selectedJob.description || '-'}</span></p>
                </div>

                <div className="p-4 border rounded-lg bg-gray-50">
                  <h4 className="font-semibold mb-2">Requisition Details</h4>
                  <p><strong>Requisition Type:</strong> {selectedJob.requisition?.requisitionType || '-'}</p>
                  <p><strong>Grade:</strong> {selectedJob.requisition?.grade || '-'}</p>
                  <p><strong>Experience:</strong> {selectedJob.requisition?.experience || '-'}</p>
                  <p><strong>Nature:</strong> {selectedJob.requisition?.natureOfEmployment || '-'}</p>
                  <p><strong>Salary:</strong> {selectedJob.requisition?.salary || '-'}</p>
                  <p className="mt-2"><strong>Technical Skills:</strong> {(selectedJob.requisition?.technicalSkills || []).join(', ') || '-'}</p>
                  <p className="mt-1"><strong>Soft Skills:</strong> {(selectedJob.requisition?.softSkills || []).join(', ') || '-'}</p>
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700">Comments (required when rejecting)</label>
                <textarea value={reviewComments} onChange={(e)=> setReviewComments(e.target.value)} className="mt-1 w-full border rounded p-2" rows={4} />
              </div>

              <div className="mt-4 flex justify-end gap-3">
                <button onClick={()=> setShowModal(false)} className="px-4 py-2 bg-gray-200 rounded">Cancel</button>
                <button disabled={actionLoading} onClick={()=> handleReview(selectedJob._id, 'reject', reviewComments)} className="px-4 py-2 bg-red-600 text-white rounded disabled:opacity-50">Reject</button>
                <button disabled={actionLoading} onClick={()=> handleReview(selectedJob._id, 'approve')} className="px-4 py-2 bg-green-600 text-white rounded disabled:opacity-50">Approve</button>
              </div>
            </div>
          </div>
        )}

        <Footer />
      </main>
    </div>
  );
};

export default AdminJobApprovalPage;