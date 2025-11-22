import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import Sidebar from "../components/Sidebar";
import { toast } from "react-hot-toast";
import ProfileHeader from "../components/ProfileHeader";
import { CheckCircle, Loader2 } from "lucide-react";
import { FaSpinner, FaBars } from "react-icons/fa"; // Added FaBars
import Footer from "../components/Footer";

const FormInput = ({ label, ...props }) => (
  <div>
    <label className="block text-xs font-medium text-gray-600 mb-1 uppercase">
      {label}
    </label>
    <input
      {...props}
      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg shadow-sm bg-gray-50 focus:ring-1 focus:ring-[#111] focus:outline-none transition disabled:bg-gray-200 disabled:cursor-not-allowed"
    />
  </div>
);

const FormSelect = ({ label, children, ...props }) => (
  <div>
    <label className="block text-xs font-medium text-gray-600 mb-1 uppercase">
      {label}
    </label>
    <select
      {...props}
      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg shadow-sm bg-gray-50 focus:ring-1 focus:ring-[#111] focus:outline-none transition disabled:bg-gray-200 disabled:cursor-not-allowed"
    >
      {children}
    </select>
  </div>
);

const FormTextArea = ({ label, ...props }) => (
  <div>
    <label className="block text-xs font-medium text-gray-600 mb-1 uppercase">
      {label}
    </label>
    <textarea
      {...props}
      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg shadow-sm bg-gray-50 focus:ring-1 focus:ring-[#111] focus:outline-none transition disabled:bg-gray-200 disabled:cursor-not-allowed"
    />
  </div>
);
// --- End Form Components ---

export default function CreateJob() {
  const navigate = useNavigate();
  const [reqNo, setReqNo] = useState("");
  const [requisition, setRequisition] = useState(null);
  const [checking, setChecking] = useState(false);
  const [loading, setLoading] = useState(false); // This is for the main submit
  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState(null);

  const [form, setForm] = useState({
    title: "",
    department: "",
    designation: "",
    description: "",
    experienceRequired: "",
    location: "",
    type: "full-time",
    qualificationRequired: "",
    deadline: "",
    comments: "",
    min: "",
    max: "",
    budget: "Budgeted",
  });

  const [sidebarOpen, setSidebarOpen] = useState(false); // Set to false for mobile
  const [active, setActive] = useState("Create Job");

  const user = JSON.parse(localStorage.getItem("loggedInUser"));
  const role = user?.role || "recruiter";

  const departmentList = [
    "Other", "Administration", "Administration Bus", "After Sales Bus", "After Sales Truck",
    "Assembly Shop", "Body Shop", "Brand Management", "Chassis & Deck Assembly", "Civil Projects",
    "Compliance & Risk Management", "Customer Relationship Management", "EDD", "Finance",
    "Health, Safety & Environment", "Human Resource", "Internal Audit", "M.I.S",
    "Maintenance & Utilities", "Management Group", "Marketing & Planning", "Paint Shop", "Production",
    "Protoshop", "QAHSE", "Sales & Marketing - BUS", "Sales & Marketing - Truck", "Sales Admin",
    "Secretarial", "Spare Parts", "Warehouse",
  ];

  const designationList = [
    "Other", "Assistant General Manager", "Assistant Manager", "Associate Manager", "Deputy General Manager",
    "Deputy Manager", "Director Marketing", "Director Sales & Marketing", "Executive", "General Manager",
    "Graduate Trainee Officer", "Head of Department", "Junior Manager", "Junior Technical Assistant",
    "Management Trainee Officer", "Manager", "Officer", "Security Incharge", "Senior Executive",
    "Senior General Manager", "Senior Manager", "Senior Officer", "Trainee Engineer",
  ];

  const locationList = [
    "Master House", "Korangi", "Port Qasim", "Lahore Multan Road", "Peshawar",
    "Rawalpindi", "Faisalabad", "Multan", "Islamabad", "SITE Showroom"
  ];

  useEffect(() => {
    // This just simulates the page loading, as there's no initial data fetch
    setPageLoading(false);
  }, []);

  const checkRequisition = async () => {
    if (!reqNo) return toast.error("Please enter a requisition form number.");
    setChecking(true);
    setError(null);
    setRequisition(null);
    
    try {
      const formattedReqId = `MMCL-Req-${reqNo.padStart(5, "0")}`;
      const res = await api.get(`/requisitions/checkApproval/${formattedReqId}`);

      if (res.data.success) {
        toast.success("Requisition fully approved! Details loaded.");
        const r = res.data.requisition;
        setRequisition(r);
        setForm((prev) => ({
          ...prev,
          title: r.position || "",
          department: r.department || "",
          designation: r.designation || "",
          description: r.description || "",
          experienceRequired: r.experience || "",
          qualificationRequired: r.academicQualification || "",
          location: r.location || "",
          min: r.salary || "",
          max: r.salary || "",
          deadline: "",
          comments: "",
          type: "full-time",
          budget: "Budgeted",
        }));
      }
    } catch (e) {
      const errorMsg = e.response?.data?.message || "Requisition not approved or not found ❌";
      
      if (errorMsg.includes("job has already been created")) {
        toast.error(errorMsg);
      } else {
        toast.error(errorMsg);
        setError(errorMsg);
      }
      setRequisition(null);
    } finally {
      setChecking(false);
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!requisition)
      return toast.error("Please verify a fully approved requisition before creating a job.");

    setLoading(true);
    try {
      const payload = {
        reqNo,
        title: form.title,
        department: form.department,
        designation: form.designation,
        description: form.description,
        experienceRequired: form.experienceRequired,
        location: form.location,
        type: form.type,
        qualificationRequired: form.qualificationRequired,
        deadline: form.deadline,
        comments: form.comments,
        salaryRange: {
          min: Number(form.min),
          max: Number(form.max),
        },
        budget: form.budget,
      };

      await api.post("/auth/createJob", payload);
      toast.success("Job created successfully!");
      setTimeout(() => navigate("/recruiter/jobs"), 1500);
    } catch (e) {
      toast.error(e.response?.data?.message || "Failed to create job");
    } finally {
      setLoading(false);
    }
  };

  // --- ADDED: Standardized Loading Spinner ---
  const renderLoading = () => (
    <div className="flex items-center justify-center h-[calc(100vh-200px)]">
      <FaSpinner className="animate-spin text-4xl text-gray-700" />
      <p className="ml-3 text-lg text-gray-600">Loading...</p>
    </div>
  );
  
  const renderError = () => (
    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg m-8" role="alert">
      <strong className="font-bold">Error: </strong>
      <span className="block sm:inline">{error}</span>
    </div>
  );

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar
        role={role}
        active={active}
        setActive={setActive}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
      />

      {/* --- REMOVED FIXED HAMBURGER BUTTON --- */}

      <main className="flex-1 flex flex-col overflow-auto">
        <ProfileHeader
          title="Create Job"
          subtitle="Post new job openings based on approved requisitions"
          showMenuButton={true} // --- HAMBURGER FIX ---
          onMenuClick={() => setSidebarOpen(true)} // --- HAMBURGER FIX ---
        />

        <div className="p-4 md:p-6 flex-1 overflow-auto">
          {pageLoading ? (
            renderLoading()
          ) : (
            <div className="max-w-5xl mx-auto bg-white rounded-xl shadow-lg p-6 md:p-8">
              
              {/* --- RESPONSIVE HEADER --- */}
              <div className="flex flex-col md:flex-row items-start justify-between gap-4 mb-6">
                <div className="flex items-center gap-3 flex-shrink-0 w-full md:w-auto">
                  <div className="text-sm text-gray-600">Status</div>
                  <div
                    className={`px-3 py-1 rounded-full text-sm font-medium ${
                      requisition
                        ? "bg-green-100 text-green-700"
                        : "bg-yellow-100 text-yellow-700"
                    }`}
                  >
                    {requisition
                      ? "Requisition Verified"
                      : "Verification Required"}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6">
                {/* Requisition Check Card */}
                <section className="p-5 rounded-xl bg-white border border-gray-200 shadow-sm">
                  <label className="font-semibold text-gray-800 block mb-2">
                    Requisition Form Number{" "}
                    <span className="text-gray-400 text-sm">(e.g. 00001)</span>
                  </label>
                  
                  {/* --- RESPONSIVE INPUT/BUTTON --- */}
                  <div className="flex flex-col sm:flex-row gap-3 items-center">
                    <input
                      className="flex-1 border border-gray-300 bg-gray-50 px-4 py-2 rounded-full focus:ring-1 focus:ring-[#111] outline-none w-full"
                      placeholder="Enter requisition form number"
                      value={reqNo}
                      onChange={(e) => setReqNo(e.target.value)}
                    />
                    <button
                      onClick={checkRequisition}
                      disabled={checking}
                      className={`inline-flex items-center justify-center gap-2 px-5 py-2 rounded-full font-semibold transition w-full sm:w-auto ${
                        checking
                          ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                          : "bg-[#111111] text-white hover:bg-[#6B6F73] shadow-md"
                      }`}
                    >
                      {checking ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <CheckCircle className="w-4 h-4" />
                      )}
                      {checking ? "Checking..." : "Verify"}
                    </button>
                  </div>

                  {requisition && (
                    <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-4 text-sm text-green-800">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 font-semibold text-green-700">
                          <CheckCircle size={16} /> Requisition Approved
                        </div>
                        <div className="text-xs text-gray-600 font-medium">
                          {requisition.reqId}
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-x-4 gap-y-1 mt-3 text-gray-700">
                        <div>
                          <span className="font-medium">Department:</span>{" "}
                          {requisition.department}
                        </div>
                        <div>
                          <span className="font-medium">Position:</span>{" "}
                          {requisition.position}
                        </div>
                        <div>
                          <span className="font-medium">Location:</span>{" "}
                          {requisition.location}
                        </div>
                      </div>
                    </div>
                  )}
                  {error && !checking && (
                    <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-800">
                      <p>{error}</p>
                    </div>
                  )}
                </section>

                {/* Form Card */}
                <section className="p-6 rounded-xl bg-white border border-gray-200 shadow-sm">
                  <form onSubmit={submit} className="grid gap-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormInput
                        label="Job Title"
                        placeholder="Job Title"
                        value={form.title}
                        onChange={(e) => setForm({ ...form, title: e.target.value })}
                        required
                        disabled={!requisition}
                      />
                      <FormSelect
                        label="Department"
                        name="department"
                        value={form.department}
                        onChange={(e) => setForm({ ...form, department: e.target.value })}
                        disabled={!requisition}
                        required
                      >
                        <option value="" disabled>Select Department</option>
                        {departmentList.map((dept) => (
                          <option key={dept} value={dept}>
                            {dept}
                          </option>
                        ))}
                      </FormSelect>
                    </div>

                    <FormSelect
                      label="Designation"
                      name="designation"
                      value={form.designation}
                      onChange={(e) => setForm({ ...form, designation: e.target.value })}
                      disabled={!requisition}
                      required
                    >
                      <option value="" disabled>Select Designation</option>
                      {designationList.map((desig) => (
                        <option key={desig} value={desig}>
                          {desig}
                        </option>
                      ))}
                    </FormSelect>

                    <FormTextArea
                      label="Job Description"
                      placeholder="Job Description"
                      value={form.description}
                      onChange={(e) => setForm({ ...form, description: e.target.value })}
                      required
                      disabled={!requisition}
                      rows={6}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormInput
                        label="Experience Required"
                        placeholder="e.g., 3-5 Years"
                        value={form.experienceRequired}
                        onChange={(e) => setForm({ ...form, experienceRequired: e.target.value })}
                        required
                        disabled={!requisition}
                      />
                      <FormInput
                        label="Qualification Required"
                        placeholder="e.g., BSCS or equivalent"
                        value={form.qualificationRequired}
                        onChange={(e) => setForm({ ...form, qualificationRequired: e.target.value })}
                        required
                        disabled={!requisition}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <FormInput
                        label="Deadline"
                        type="date"
                        value={form.deadline}
                        onChange={(e) => setForm({ ...form, deadline: e.target.value })}
                        disabled={!requisition}
                        required
                      />
                      <FormSelect
                        label="Location"
                        value={form.location}
                        onChange={(e) => setForm({ ...form, location: e.target.value })}
                        disabled={!requisition}
                        required
                      >
                        <option value="" disabled>Select Location</option>
                        {locationList.map((loc) => (
                          <option key={loc} value={loc}>
                            {loc}
                          </option>
                        ))}
                      </FormSelect>
                      <FormSelect
                        label="Budget Type"
                        value={form.budget}
                        onChange={(e) => setForm({ ...form, budget: e.target.value })}
                        disabled={!requisition}
                        required
                      >
                        <option value="Budgeted">Budgeted</option>
                        <option value="Non budgeted">Non Budgeted</option>
                      </FormSelect>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <FormSelect
                        label="Job Type"
                        value={form.type}
                        onChange={(e) => setForm({ ...form, type: e.target.value })}
                        disabled={!requisition}
                        required
                      >
                        <option value="full-time">Full-time</option>
                        <option value="part-time">Part-time</option>
                        <option value="contract">Contract</option>
                        <option value="internship">Internship</option>
                      </FormSelect>
                      <FormInput
                        label="Min Salary"
                        type="number"
                        placeholder="Salary Min"
                        value={form.min}
                        onChange={(e) => setForm({ ...form, min: e.target.value })}
                        disabled={!requisition}
                        required
                      />
                      <FormInput
                        label="Max Salary"
                        type="number"
                        placeholder="Salary Max"
                        value={form.max}
                        onChange={(e) => setForm({ ...form, max: e.target.value })}
                        disabled={!requisition}
                        required
                      />
                    </div>

                    <FormTextArea
                      label="Additional Comments (Optional)"
                      placeholder="Additional Comments"
                      value={form.comments}
                      onChange={(e) => setForm({ ...form, comments: e.target.value })}
                      disabled={!requisition}
                      rows={3}
                    />

                    <div>
                      <button
                        disabled={loading || !requisition}
                        className={`w-full py-2 rounded-full font-semibold shadow-md flex items-center justify-center gap-3 transition ${
                          loading || !requisition
                            ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                            : "bg-[#111] text-white hover:bg-red-700"
                        }`}
                      >
                        {loading && <Loader2 className="w-5 h-5 animate-spin" />}
                        <span>
                          {loading ? "Saving Job..." : "Create Job"}
                        </span>
                      </button>
                    </div>
                  </form>
                </section>
              </div>
            </div>
          )}

        <Footer />
        </div>

      </main>
    </div>
  );
}