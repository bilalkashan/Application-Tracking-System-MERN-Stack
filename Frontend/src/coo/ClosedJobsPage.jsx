import React, { useState, useEffect, useMemo } from "react";
import { useSearchParams, Link as RouterLink, useNavigate } from "react-router-dom";
import api from "../api";
import Sidebar from "../components/Sidebar";
import ProfileHeader from "../components/ProfileHeader";
import RequisitionDetailModal from "./RequisitionDetailModal"; // Assuming this path is correct
import { FaSpinner, FaBars } from "react-icons/fa"; // Added FaBars
import Footer from "../components/Footer";

const departmentList = [
  "All Departments", "Other", "Administration", "Administration Bus", "After Sales Bus", "After Sales Truck",
  "Assembly Shop", "Body Shop", "Brand Management", "Chassis & Deck Assembly", "Civil Projects",
  "Compliance & Risk Management", "Customer Relationship Management", "EDD", "Finance",
  "Health, Safety & Environment", "Human Resource", "Internal Audit", "M.I.S",
  "Maintenance & Utilities", "Management Group", "Marketing & Planning", "Paint Shop", "Production",
  "Protoshop", "QAHSE", "Sales & Marketing - BUS", "Sales & Marketing - Truck", "Sales Admin",
  "Secretarial", "Spare Parts", "Warehouse",
];

const ClosedJobsPage = () => {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false); // Set to false
  const [searchParams, setSearchParams] = useSearchParams();
  const initialDepartment = searchParams.get("department") || "All Departments";
  const [selectedDepartment, setSelectedDepartment] = useState(initialDepartment);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedRequisition, setSelectedRequisition] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const user = JSON.parse(localStorage.getItem("loggedInUser"));
  const role = user?.role || "coo";

  useEffect(() => {
    const fetchClosedJobs = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await api.get("/auth/allJobs", {
          params: { department: selectedDepartment, status: "Closed" },
        });
        setJobs(res.data.jobs || []);
      } catch (error) {
        console.error("Failed to fetch closed jobs:", error);
        setError("Failed to fetch closed jobs.");
      } finally {
        setLoading(false);
      }
    };
    fetchClosedJobs();
  }, [selectedDepartment]);

  const handleDepartmentChange = (e) => {
    const newDepartment = e.target.value;
    setSelectedDepartment(newDepartment);
    setSearchParams({ department: newDepartment });
  };

  const handleViewRequisition = (requisition) => {
    setSelectedRequisition(requisition);
    setIsModalOpen(true);
  };

  const renderLoading = () => (
    <div className="flex items-center justify-center h-[calc(100vh-200px)]">
      <FaSpinner className="animate-spin text-4xl text-gray-700" />
      <p className="ml-3 text-lg text-gray-600">Loading closed jobs...</p>
    </div>
  );

  const renderError = () => (
    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg m-6" role="alert">
      <strong className="font-bold">Error: </strong>
      <span className="block sm:inline">{error}</span>
    </div>
  );

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar
        role={role}
        active="Closed Jobs"
        setActive={() => {}}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
      />
      <main className="flex-1 flex flex-col overflow-auto">
        <ProfileHeader
          title="Closed Job Positions"
          subtitle="Review all concluded roles"
          showMenuButton={true}
          onMenuClick={() => setSidebarOpen(true)}
        />

        <div className="p-4 md:p-6 flex-1 overflow-auto">
          <div className="max-w-7xl mx-auto">
            <div className="my-4 p-4 bg-white rounded-lg shadow-sm flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <label
                htmlFor="departmentFilter"
                className="font-semibold text-gray-700 flex-shrink-0"
              >
                Filter by Department:
              </label>
              <select
                id="departmentFilter"
                value={selectedDepartment}
                onChange={handleDepartmentChange}
                className="p-2 border border-gray-300 rounded-full shadow-sm w-full sm:w-auto"
              >
                {departmentList.map((dep) => (
                  <option key={dep} value={dep}>
                    {dep}
                  </option>
                ))}
              </select>
            </div>
            <div className="bg-white shadow-md rounded-lg overflow-hidden">
              {loading ? (
                renderLoading()
              ) : error ? (
                renderError()
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[768px] text-sm text-left">
                    <thead className="text-[#0b090a] bg-[#BFBFBF]">
                      <tr>
                        <th className="px-6 py-3">Position</th>
                        <th className="px-6 py-3">Department</th>
                        <th className="px-6 py-3">Date Closed</th>
                        <th className="px-6 py-3">Recruiter</th>
                        <th className="px-6 py-3 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {jobs.length > 0 ? (
                        jobs.map((job) => (
                          <tr key={job._id} className="border-b hover:bg-gray-50">
                            <td className="px-6 py-4 font-medium text-gray-900">
                              {job.title}
                            </td>
                            <td className="px-6 py-4">{job.department}</td>
                            <td className="px-6 py-4">
                              {job.closedAt
                                ? new Date(job.closedAt).toLocaleDateString()
                                : "N/A"}
                            </td>
                            <td className="px-6 py-4">
                              {job.createdBy?.name || "N/A"}
                            </td>
                            <td className="px-6 py-4 text-center space-x-4">
                              <button
                                onClick={() => handleViewRequisition(job.requisition)}
                                disabled={!job.requisition}
                                className="font-medium text-indigo-600 hover:text-indigo-800 disabled:text-gray-400 disabled:cursor-not-allowed"
                              >
                                View Requisition
                              </button>
                              <button
                                onClick={() =>
                                  navigate(`/reports/lifecycle/${job._id}`)
                                }
                                className="font-medium text-green-600 hover:text-green-800"
                              >
                                View Report
                              </button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td
                            colSpan="5"
                            className="text-center py-10 text-gray-500"
                          >
                            No closed jobs found for this department.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>

        <Footer />
      </main>

      <RequisitionDetailModal
        requisition={selectedRequisition}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
};

export default ClosedJobsPage;