import React, { useState, useEffect } from 'react';
import { useParams, Link as RouterLink, useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaFilePdf, FaRegClock, FaSpinner } from 'react-icons/fa';
import api, { fileUrl } from '../api';
import Sidebar from '../components/Sidebar';
import ProfileHeader from '../components/ProfileHeader';
import Footer from '../components/Footer';
import { Loader2 } from 'lucide-react';
import { PDFDownloadLink } from '@react-pdf/renderer';
import ReportDocument from '../components/ReportDocument';
import defaultAvatar from "../assets/MMC-Logo.png";

// --- Corrected formatCurrency to handle 0 and NaN ---
const formatCurrency = (value) => {
    const numValue = Number(value);
    if (isNaN(numValue) || numValue === 0) return '-';
    return `Rs. ${numValue.toLocaleString()}/-`;
};

const formatSalaryRange = (min, max) => {
    if (typeof min !== 'number' || typeof max !== 'number') return '-';
    return `Rs. ${min.toLocaleString()} - ${max.toLocaleString()}`;
}

const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-GB'); // DD/MM/YYYY
}

// --- Helper to format status codes ---
const formatStatusCode = (code) => {
    if (!code) return "Unknown";
    return code.split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

const DetailCard = ({ title, data }) => (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 break-inside-avoid">
        <h3 className="text-lg font-bold text-gray-900 border-b border-gray-200 pb-3 mb-4">{title}</h3>
        <div className="space-y-3 text-sm">
            {Object.entries(data).map(([key, value]) => (
                <div key={key} className="flex justify-between items-start gap-4">
                    <span className="text-gray-500 whitespace-nowrap">{key}:</span>
                    <span className="font-medium text-gray-800 text-right">{value || '-'}</span>
                </div>
            ))}
        </div>
    </div>
);

const SkillTags = ({ skills }) => {
    if (!skills || skills.length === 0) return <span className="font-medium text-gray-800 text-right">-</span>;
    return (
        <div className="flex flex-wrap justify-end gap-1.5">
            {skills.map(skill => (
                <span key={skill} className="text-xs bg-indigo-100 text-indigo-800 px-2.5 py-0.5 rounded-full font-medium">
                    {skill}
                </span>
            ))}
        </div>
    )
}

const TimelineItem = ({ title, subtitle, date, children, isLast = false }) => (
    <div className="relative pl-12 break-inside-avoid">
        {!isLast && <div className="absolute left-4 top-10 -bottom-4 w-0.5 bg-gray-300"></div>}
        
        <div className="absolute left-0 top-2 flex items-center justify-center w-8 h-8 bg-white rounded-full ring-4 ring-white">
            <div className="w-4 h-4 bg-red-600 rounded-full"></div>
        </div>

        <p className="text-sm text-gray-500 mb-0.5">{date ? new Date(date).toLocaleString() : '...'}</p>
        <h4 className="font-semibold text-lg text-gray-800">{title}</h4>
        <p className="text-sm text-gray-600 mb-3">{subtitle}</p>
        {children && <div className="bg-slate-50 p-4 rounded-md">{children}</div>}
    </div>
);

const RemarkCard = ({ remark }) => (
    <div className="mt-2 p-4 bg-gray-100 rounded-lg border break-inside-avoid">
        <div className="flex justify-between items-center mb-2">
            <p className="font-semibold text-xs">{remark.interviewer?.name || 'N/A'} ({remark.interviewType}):</p>
            <p className="text-xs text-gray-500">{new Date(remark.createdAt).toLocaleDateString()}</p>
        </div>
        {remark.evaluations && remark.evaluations.length > 0 && (
            <table className="w-full text-sm my-2">
                <tbody>
                    {remark.evaluations.map((ev, i) => (
                        <tr key={i} className="border-b">
                            <td className="py-2 pr-4 text-gray-600">{ev.competency}</td>
                            <td className="py-2 text-right font-medium text-indigo-700">⭐ {ev.rating}/5</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        )}
        <p className="text-xs font-semibold mt-2">Recommendation: <span className="font-normal italic text-gray-700">{remark.recommendation || 'N/A'}</span></p>
        {remark.comment && <p className="text-xs mt-1">Comment: <span className="font-normal italic text-gray-700">"{remark.comment}"</span></p>}
    </div>
);

const HiringLifecycleReport = () => {
    const { jobId } = useParams();
    const navigate = useNavigate();
    const [report, setReport] = useState(null);
    const [loading, setLoading] = useState(true);
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const user = JSON.parse(localStorage.getItem("loggedInUser"));
    const role = user?.role || "coo";

    useEffect(() => {
        const fetchReport = async () => {
            setLoading(true);
            try {
                const res = await api.get(`/reports/lifecycle/${jobId}`); 
                setReport(res.data);
            } catch (error) {
                console.error("Failed to fetch report", error);
            } finally {
                setLoading(false);
            }
        };
        fetchReport();
    }, [jobId]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[calc(100vh-200px)]">
                <FaSpinner className="animate-spin text-4xl text-gray-700" />
                <p className="ml-3 text-lg text-gray-600">Loading Hiring Lifecycle...</p>
            </div>
        );
    }

    if (!report) {
        return (
            <div className="p-8 text-center text-red-600">
                Report not found or could not be loaded.
            </div>
        );
    }

    const { job, stats, hiredApplication } = report;
    const requisition = job.requisition;
    const allReqSkills = [...(requisition?.technicalSkills || []), ...(requisition?.softSkills || [])];
    const allJobSkills = [...(job.requisition?.technicalSkills || []), ...(job.requisition?.softSkills || [])];

    // --- Helper function for approval line ---
    const getApprovalLine = (approval) => {
        const status = approval?.status || 'pending';
        const name = approval?.reviewer?.name;
        const date = formatDate(approval?.reviewedAt);

        if (status === 'pending') return '...';
        if (!name) return `N/A on ${date}`;
        return `${name} on ${date}`;
    };

    return (
        <div className="flex h-screen bg-gray-100">
            <Sidebar role={role} active="Dashboard" setActive={() => { }} sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
            <main className="flex-1 overflow-auto">
                <ProfileHeader title="Hiring Lifecycle Report" subtitle={`Tracking the complete journey for ${job.title}`} />
                <div className="p-6 max-w-5xl mx-auto">
                    <div className="flex justify-between items-center mb-6">
                        <button onClick={() => navigate(-1)} className="inline-flex items-center gap-2 text-sm px-4 py-2 bg-white border border-gray-300 rounded-full shadow-sm hover:bg-gray-50 transition text-gray-700">
                            <FaArrowLeft /> Back
                        </button>

                        <PDFDownloadLink
                            document={<ReportDocument report={report} />}
                            fileName={`Hiring-Report-${report.job.jobId}.pdf`}
                        >
                            {({ loading, error }) => (
                                <button
                                    disabled={loading}
                                    className="inline-flex items-center gap-2 px-4 py-2 bg-black text-white rounded-full hover:bg-[#BFBFBF] hover:text-black transition disabled:bg-black shadow-md"
                                >
                                    {loading ? <Loader2 className="animate-spin" size={16} /> : <FaFilePdf />}
                                    {loading ? 'Generating...' : 'Generate PDF'}
                                </button>
                            )}
                        </PDFDownloadLink>
                    </div>

                    <div className="p-8 sm:p-12 bg-white rounded-xl shadow-lg">
                        <div className="space-y-12">

                            {requisition && <TimelineItem title="Requisition Created" subtitle={`Req ID: ${requisition.reqId}`} date={requisition.createdAt}>
                                <DetailCard title="Requisition Details" data={{
                                    "Position": requisition.position,
                                    "Department": requisition.department,
                                    "Requested By": requisition.createdBy?.name || 'N/A',
                                    "Type": requisition.requisitionType,
                                    "Experience": requisition.experience,
                                    "Qualification": requisition.academicQualification,
                                    "Budgeted Salary": formatCurrency(requisition.salary),
                                    "Required Skills": <SkillTags skills={allReqSkills} />
                                }} />
                                <div className="mt-4">
                                    <h4 className="font-semibold text-gray-600 mb-2 text-sm">Approval Timeline:</h4>
                                    <ul className="text-xs space-y-1 text-gray-500">
                                        {/* --- FIX #1: Using the new helper function --- */}
                                        <li>HOD ({requisition.approvals?.departmentHead?.approval?.status || 'pending'}): {getApprovalLine(requisition.approvals?.departmentHead?.approval)}</li>
                                        <li>HR ({requisition.approvals?.hr?.approval?.status || 'pending'}): {getApprovalLine(requisition.approvals?.hr?.approval)}</li>
                                        <li>COO ({requisition.approvals?.coo?.approval?.status || 'pending'}): {getApprovalLine(requisition.approvals?.coo?.approval)}</li>
                                    </ul>
                                </div>
                            </TimelineItem>}

                            <TimelineItem title="Job Posted" subtitle={`Job ID: ${job.jobId}`} date={job.createdAt}>
                                <DetailCard title="Job Details" data={{
                                    "Job Title": job.title,
                                    "Designation": job.designation,
                                    "Location": job.location,
                                    "Type": job.type,
                                    "Experience": job.experienceRequired,
                                    "Qualification": job.qualificationRequired,
                                    "Salary Range": formatSalaryRange(job.salaryRange?.min, job.salaryRange?.max),
                                    "Deadline": formatDate(job.deadline),
                                    "Posted By": job.createdBy?.name || 'N/A',
                                    "Budget": job.budget,
                                    "Total Applicants": stats.totalApplicants,
                                    "Skills": <SkillTags skills={allJobSkills} />
                                }} />
                            </TimelineItem>

                            {hiredApplication ? (
                                <TimelineItem title="Candidate Hired" subtitle={hiredApplication.applicant?.name} date={job.closedAt} isLast={true}>
                                    <div className="flex flex-col sm:flex-row gap-4 items-center mb-6">
                                        <img
                                            src={hiredApplication.applicantProfile?.profilePicture ? fileUrl(hiredApplication.applicantProfile.profilePicture) : defaultAvatar}
                                            alt="Profile"
                                            className="w-24 h-24 rounded-full object-cover border-4 border-indigo-100 flex-shrink-0"
                                            onError={(e) => { e.currentTarget.src = defaultAvatar; }}
                                        />
                                        <div className="flex-1 w-full">
                                            <DetailCard title="Hired Candidate Profile" data={{
                                                "Email": <a href={`mailto:${hiredApplication.applicant.email}`} className="text-indigo-600 hover:underline">{hiredApplication.applicant.email}</a>,
                                                "Contact": hiredApplication.applicantProfile?.contactNumber,
                                                "Applied On": formatDate(hiredApplication.createdAt),
                                            }} />
                                        </div>
                                    </div>

                                    <div className="mt-4">
                                        <h4 className="font-semibold text-gray-600 mb-2 text-sm">Candidate Journey:</h4>
                                        <ul className="text-xs space-y-2 text-gray-500 border-l-2 border-gray-200 pl-4">
                                            {hiredApplication.history?.map((event, index) => (
                                                <li key={index} className="flex gap-2">
                                                    <FaRegClock className="mt-0.5 text-gray-400" />
                                                    {/* --- Using the new formatter --- */}
                                                    <span><span className="font-semibold capitalize text-gray-700">{formatStatusCode(event.code)}</span> on {new Date(event.at).toLocaleString()}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>

                                    {hiredApplication.remarks?.length > 0 && <div className="mt-6">
                                        <h4 className="font-semibold text-gray-600 mb-2 text-sm">Interview Remarks:</h4>
                                        <div className="space-y-3">
                                            {hiredApplication.remarks.map((remark, index) => <RemarkCard key={index} remark={remark} />)}
                                        </div>
                                    </div>}

                                    <div className="mt-8 border-t border-gray-200 pt-8 break-inside-avoid">
                                        <h3 className="text-2xl font-bold text-gray-900 border-b pb-4 mb-6">Employment Note</h3>
                                        <p className="text-base text-gray-700 leading-relaxed mb-6">
                                            Reference to the subsequent interviews for the position of <strong>{job.title}</strong>
                                            for MMCL, we have selected <strong>{hiredApplication.applicant?.name}</strong>.
                                        </p>

                                        {/* --- Salary and Hiring Status --- */}
                                        <DetailCard title="Final Offer Details" data={{
                                            "Designation": hiredApplication.offer?.designation,
                                            "Grade": hiredApplication.offer?.grade,
                                            "Department": hiredApplication.offer?.department,
                                            "Location": hiredApplication.offer?.location,
                                            "Current Salary": formatCurrency(hiredApplication.employmentFormData?.currentSalary),
                                            "Expected Salary": formatCurrency(hiredApplication.employmentFormData?.expectedSalary),
                                            "Offered Salary": formatCurrency(hiredApplication.offer?.offeredSalary),
                                            "Vehicle Entitlement": hiredApplication.offer?.vehicleEntitlement,
                                            "System Requirement": hiredApplication.offer?.systemRequirement,
                                            "Mobile Allowance": hiredApplication.offer?.mobileAllowance,
                                            "Fuel Allowance": `${hiredApplication.offer?.fuelAllowance || 0} Liter`,
                                            "Requisition Type": requisition?.requisitionType || 'New'
                                        }} />
                                        
                                        <div className="mt-24 grid grid-cols-2 gap-x-12 gap-y-12 text-sm">
                                            <div className="border-t-2 border-gray-500 pt-3">
                                                <p className="font-bold text-gray-900">Prepared By:</p>
                                                <p>Syed Pervaiz Ahmed</p>
                                                <p className="text-gray-600">HR</p>
                                            </div>
                                            <div className="border-t-2 border-gray-500 pt-3">
                                                <p className="font-bold text-gray-900">Reviewed By:</p>
                                                <p>Kashif Qurban</p>
                                                <p className="text-gray-600">Assistant General Human Resource</p>
                                            </div>
                                            <div className="border-t-2 border-gray-500 pt-3">
                                                <p className="font-bold text-gray-900">Reviewed By:</p>
                                                <p>Muhammad Shoeb Khan</p>
                                                <p className="text-gray-600">Head of Human Resource</p>
                                            </div>
                                            <div className="border-t-2 border-gray-500 pt-3">
                                                <p className="font-bold text-gray-900">Approved By:</p>
                                                <p>Raza Ansari</p>
                                                <p className="text-gray-600">COO</p>
                                            </div>
                                        </div>
                                    </div>
                                </TimelineItem>
                            ) : (
                                <TimelineItem title="Hiring In Progress..." subtitle={`${stats.totalApplicants} applicants are in the pipeline.`} isLast={true} />
                            )}
                        </div>
                    </div>
                </div>
                <Footer />
            </main>
        </div>
    );
};

export default HiringLifecycleReport;