import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api";

const JobApplicants = () => {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const [job, setJob] = useState({});
  const [applications, setApplications] = useState([]);

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    const { data } = await api.get(`/auth/job/${jobId}/applications`);
    setJob(data.job);
    setApplications(data.applications);
  };

  const handleStatus = async (appId, status) => {
    await api.put(`/auth/updateStatus/${appId}/status`, { status });
    fetchApplications(); 
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">{job.title} - Applicants</h2>
      <table className="min-w-full bg-white shadow rounded">
        <thead>
          <tr className="bg-gray-100">
            <th className="p-2">Name</th>
            <th className="p-2">Email</th>
            <th className="p-2">Department</th>
            <th className="p-2">Status</th>
            <th className="p-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {applications.map(app => (
            <tr key={app._id} className="border-b">
              <td className="p-2">{app.applicant.name}</td>
              <td className="p-2">{app.applicant.email}</td>
              <td className="p-2">{app.applicant.department}</td>
              <td className="p-2">{app.status}</td>
              <td className="p-2 space-x-2">
                <button
                  onClick={() => navigate(`/recruiter/application/${app._id}`)}
                  className="bg-blue-600 text-white p-1 rounded"
                >
                  View Full
                </button>
                <button
                  onClick={() => handleStatus(app._id, "Interview")}
                  className="bg-green-600 text-white p-1 rounded"
                >
                  Approve
                </button>
                <button
                  onClick={() => handleStatus(app._id, "Rejected")}
                  className="bg-red-600 text-white p-1 rounded"
                >
                  Reject
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default JobApplicants;
