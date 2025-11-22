import './App.css'
import { Routes, Route } from "react-router-dom";

import Login from "./pages/login";
import Signup from "./pages/signup";
import RefreshHandler from "./RefreshHandler";
import ProtectedRoute from "./ProtectedRoute";
import Home from "./pages/home";
import NotificationPage from "./components/NotificationPage"
import GlobalNotifier from "./components/GlobalNotifier";
import HiringLifecycleReport from './pages/HiringLifecycleReport'; // <-- Import

// User
import JobsBoard from './user/JobsBoard';
import ApplyJob from './user/ApplyJob';
import TrackApplications from './user/TrackApplications';
import UserDashboard from "./user/userDashboard";
import StepForm from "./user/Profile/StepForm";
import ViewProfile from './user/Profile/ViewProfile';
import UpdateProfile from "./user/Profile/UpdateProfile";
import UserChat from './user/UserChat';

// Admin
import AdminDashboard from "./admin/adminDashboard";
import AdminJobsApproval from './admin/AdminJobsApproval';
import ApplicationsTracker from './admin/ApplicationsTracker';
//-----------------------------------------

// Recruiter
import RecruiterDashboard from "./recruiter/recruiterDashboard";
import CreateJob from './recruiter/CreateJob';
import MyJobs from './recruiter/MyJobs';
import ApplicantReview from './recruiter/ApplicantReview';
import JobApplications from "./recruiter/JobApplications";    // NEW
import ApplicantProfile from "./recruiter/ApplicantProfile";  // NEW
import JobInfo from "./recruiter/JobInfo";                    // NEW
import RequiisitionForm from './recruiter/RequisitionForm';
import RecruiterChat from "./recruiter/RecruiterChat";
//-----------------------------------------

// Super Admin
import SuperAdminDashboard from "./superAdmin/superAdminDashboard"; // Using Admin Dashboard for now
import HrRequisitionApproval from './superAdmin/HrRequisitionApproval';
import ManageUsersPage from './superAdmin/ManageUsersPage';
//-----------------------------------------

// HOD
import HodDashboard from "./hod/hodDashboard"; // Using Admin Dashboard for now
import HodRequisitionApproval from './hod/HodRequisitionApproval';
//-----------------------------------------

// COO
import CooDashboard from "./coo/cooDashboard"; // Using Admin Dashboard for now
import CooRequisitionApproval from './coo/CooRequisitionApproval';
import UserJobInfo from './user/userJobInfo';
import AdminProfile from './admin/AdminProfile';
import RequisitionView from './requisitions/RequisitionView';
import OpenJobsPage from './coo/OpenJobsPage';
import ClosedJobsPage from './coo/ClosedJobsPage';
import OfferApprovalsPage from './pages/OfferApprovalsPage';
//-----------------------------------------

// Interviewer
import InterviewerDashboard from './interviewer/interviewerDashboard';
//-----------------------------------------

import AssignInterviewers from './recruiter/AssignInterviewers';
import InterviewerJobs from './interviewer/InterviewerJobs';
import InterviewerJobApplications from './interviewer/InterviewerJobApplications';

import SubRecruiterDashboard from './subRecruiter/subRecruiterDashboard';

import OnboardingPage from './pages/OnboardingPage';
import OnboardingReviewPage from './recruiter/OnboardingReviewPage'; 

import SubmitDocumentsPage from './user/SubmitDocumentsPage';
import EmploymentFormPage from './components/EmploymentFormPage'; 
import SmartSearch from './pages/SmartSearch';
import UserResetPassword from './pages/forgotPassword/UserResetPassword';
import VerifyOtp from './pages/forgotPassword/VerifyOtp';
import UpdatePassword from './components/UpdatePassword';

function App() {

  return (
    <>
      <RefreshHandler />
      <GlobalNotifier />
      <Routes>

        {/* Home , Login , Signup */}
        <Route path="/login" element={<ProtectedRoute element={<Login />} />} />
        <Route path="/" element={<Home />} />
        <Route path="/signup" element={<ProtectedRoute element={<Signup />} />} />
        <Route path="/home" element={<Home />} />
        <Route path="/reset-password" element={<UserResetPassword />} />
        <Route path="/new-password" element={<VerifyOtp />} />
        <Route path="/my/update-password" element={<ProtectedRoute element={<UpdatePassword />} allowedRole={["user","recruiter","admin", "hod", "coo", "hr", "interviewer", "sub_recruiter"]} />} />
        <Route path="/my/notifications" element={<ProtectedRoute element={<NotificationPage />} allowedRole={["user","recruiter","admin", "hod", "coo", "hr", "interviewer", "sub_recruiter"]} />} />
        <Route path="/reports/lifecycle/:jobId" element={<ProtectedRoute element={<HiringLifecycleReport />} allowedRole={["recruiter","hod", "coo", "hr"]} />} />

        {/* Sub Recruiter */}
        <Route path="/subRecruiterDashboard" element={<ProtectedRoute element={<SubRecruiterDashboard />} allowedRole="sub_recruiter" />} />

        {/* User */}
        <Route path="/userDashboard" element={<ProtectedRoute element={<UserDashboard />} allowedRole="user" />} />
        <Route path="/jobs/:jobId/apply" element={<ProtectedRoute element={<ApplyJob />} allowedRole="user" />} />
        <Route path="/user/job-info/:jobId" element={<ProtectedRoute element={<UserJobInfo />} allowedRole="user" />} />
        <Route path="/me/applications" element={<ProtectedRoute element={<TrackApplications />} allowedRole="user" />} />
        <Route path="/jobsBoard" element={<ProtectedRoute element={<JobsBoard />} allowedRole="user" />} />
        <Route path="/me/profile" element={<ProtectedRoute element={<ViewProfile />} allowedRole="user" />} />
        <Route path="/profile/stepper" element={<ProtectedRoute element={<UpdateProfile />} allowedRole="user" />} />
        <Route path="/profile/step/:stepName" element={<ProtectedRoute element={<StepForm />} allowedRole="user" />} />
        <Route path="/chat/:applicationId" element={<ProtectedRoute element={<UserChat />} allowedRole="user" />} />
        <Route 
          path="/me/submit-documents" 
          element={<ProtectedRoute element={<SubmitDocumentsPage />} allowedRole="user" />} 
        />
        <Route 
          path="/me/applications/:appId/onboarding" 
          element={<ProtectedRoute element={<OnboardingPage />} allowedRole="user" />} 
        />
        <Route path="/me/applications/:appId/employment-form" element={<ProtectedRoute element={<EmploymentFormPage />} allowedRole="user" />} />

        {/* Recruiter */}
        <Route path="/recruiterDashboard" element={<ProtectedRoute element={<RecruiterDashboard />} allowedRole="recruiter" />} />
        <Route path="/recruiter/jobs/create" element={<ProtectedRoute element={<CreateJob />} allowedRole="recruiter" />} />
        <Route path="/recruiter/jobs" element={<ProtectedRoute element={<MyJobs />} allowedRole="recruiter" />} />
        <Route path="/recruiter/job/:jobId" element={<ProtectedRoute element={<ApplicantReview />} allowedRole="recruiter" />} />
        <Route path="/recruiter/job/:jobId/applications" element={<ProtectedRoute element={<JobApplications />} allowedRole="recruiter" />} />
        <Route path="/recruiter/applicant/:appId" element={<ProtectedRoute element={<ApplicantProfile />} allowedRole="recruiter" />} />
        <Route path="/recruiter/job-info/:jobId" element={<ProtectedRoute element={<JobInfo />} allowedRole="recruiter" />} />
        <Route path="/my/requisitionForm" element={<ProtectedRoute element={<RequiisitionForm />} allowedRole={["recruiter", "sub_recruiter", "admin"]} />} />
        <Route path="/recruiter/chat/:applicationId" element={<ProtectedRoute element={<RecruiterChat />} allowedRole="recruiter" />} />
        <Route 
          path="/recruiter/onboarding-review" 
          element={
            <ProtectedRoute 
              element={<OnboardingReviewPage />} 
              allowedRole={["recruiter", "hr", "admin", "superAdmin"]}
            />
          } 
        />
        <Route path="/recruiter/smart-search" element={<ProtectedRoute element={<SmartSearch />} allowedRole="recruiter" />} />


        {/* Admin */}
        <Route path="/adminDashboard" element={<ProtectedRoute element={<AdminDashboard />} allowedRole="admin" />} />
        <Route path="/admin/jobs/approvals" element={<ProtectedRoute element={<AdminJobsApproval />} allowedRole="admin" />} />
        <Route path="/admin/applications" element={<ProtectedRoute element={<ApplicationsTracker />} allowedRole="admin" />} />
        <Route path="/my/profile" element={<ProtectedRoute element={<AdminProfile />} allowedRole={["recruiter","admin", "hod", "coo", "hr", "interviewer", "sub_recruiter"]} />} />

        {/* Super Admin */}
        <Route path="/superAdminDashboard" element={<ProtectedRoute element={<SuperAdminDashboard />} allowedRole="hr" />} />
        <Route path="/superAdmin/requisitionForm" element={<ProtectedRoute element={<HrRequisitionApproval />} allowedRole="hr" />} />
        <Route path="/users" element={<ProtectedRoute element={<ManageUsersPage />} allowedRole={["hr", "admin"]} />} />
        <Route path="/offer-approvals" element={<ProtectedRoute element={<OfferApprovalsPage />} allowedRole={["hod", "coo"]} />} />

        {/* HOD */}
        <Route path="/hodDashboard" element={<ProtectedRoute element={<HodDashboard />} allowedRole="hod" />} />
        <Route path="/hod/requisitionForm" element={<ProtectedRoute element={<HodRequisitionApproval />} allowedRole="hod" />} />

        {/* COO */}
        <Route path="/cooDashboard" element={<ProtectedRoute element={<CooDashboard />} allowedRole="coo" />} />
        <Route path="/coo/requisitionForm" element={<ProtectedRoute element={<CooRequisitionApproval />} allowedRole="coo" />} />
        <Route path="/open-jobs" element={<ProtectedRoute element={<OpenJobsPage />} allowedRole={["coo","hr","recruiter", "admin" ]} />} />
        <Route path="/closed-jobs" element={<ProtectedRoute element={<ClosedJobsPage />} allowedRole={["coo","hr", "recruiter", "admin"]} />} />
        <Route path="/requisitions/view/:id" element={<ProtectedRoute element={<RequisitionView />} allowedRole={["recruiter","admin","hod","coo","hr"]} />} />

        {/* Interviewer */}
        <Route path="/interviewerDashboard" element={<ProtectedRoute element={<InterviewerDashboard />} allowedRole="interviewer" />} />
        
        <Route path="/recruiter/job/:jobId/interviewers" element={<ProtectedRoute element={<AssignInterviewers />} allowedRole="recruiter" />} /> 
        <Route path="/interviewer/job/:jobId/applications" element={<ProtectedRoute element={<InterviewerJobApplications />} allowedRole="interviewer" />} />

      </Routes>
    </>
  )
}

export default App
