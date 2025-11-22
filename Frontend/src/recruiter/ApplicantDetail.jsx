import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../api";

const ApplicationDetail = () => {
  const { appId } = useParams();
  const [application, setApplication] = useState(null);

  useEffect(() => {
    const fetchApplication = async () => {
      const { data } = await api.get(`/auth/application/${appId}`);
      setApplication(data);
    };
    fetchApplication();
  }, [appId]);

  if (!application) return <p>Loading...</p>;

  return (
    <div className="p-6 max-w-2xl mx-auto bg-white shadow rounded">
      <h2 className="text-2xl font-bold mb-4">{application.applicant.name}'s Application</h2>
      <p><strong>Email:</strong> {application.applicant.email}</p>
      <p><strong>Department:</strong> {application.applicant.department}</p>
      <p><strong>Resume:</strong> <a href={application.resume} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">View Resume</a></p>
      <p><strong>Status:</strong> {application.status}</p>
      <p><strong>Applied At:</strong> {new Date(application.appliedAt).toLocaleString()}</p>
      <p><strong>Job:</strong> {application.job.title}</p>
    </div>
  );
};

export default ApplicationDetail;
