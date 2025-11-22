import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import api from "../api";
import Sidebar from "../components/Sidebar";
import ProfileHeader from "../components/ProfileHeader";
import { FaSpinner } from "react-icons/fa";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { Dialog } from "@headlessui/react";

// --- Reusable Form Input (for non-password fields) ---
const FormInput = ({ label, name, type, value, onChange, placeholder }) => (
  <div>
    <label
      htmlFor={name}
      className="block text-sm font-semibold text-gray-700 mb-2"
    >
      {label}
    </label>
    <input
      id={name}
      name={name}
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      required
      className="border border-gray-300 p-3 w-full rounded-full shadow-md focus:ring-1 focus:ring-black"
    />
  </div>
);

// --- Reusable Password Input with Show/Hide Toggle ---
const PasswordInput = ({ label, name, value, onChange, placeholder, show, onToggle }) => (
  <div>
    <label
      htmlFor={name}
      className="block text-sm font-semibold text-gray-700 mb-2"
    >
      {label}
    </label>
    <div className="relative">
      <input
        id={name}
        name={name}
        type={show ? "text" : "password"}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required
        className="border border-gray-300 p-3 w-full rounded-full shadow-md focus:ring-1 focus:ring-black pr-10"
      />
      <button
        type="button"
        onClick={onToggle}
        className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-black"
        aria-label={show ? "Hide password" : "Show password"}
      >
        {show ? <EyeOff size={20} /> : <Eye size={20} />}
      </button>
    </div>
  </div>
);

// --- OTP Reset Modal Component ---
const OtpResetModal = ({ isOpen, onClose, email, role }) => { // Added role prop
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: OTP, 2: New Password
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(60);

  const [showPasswords, setShowPasswords] = useState({ new: false, confirm: false });

  const toggleShow = (field) => {
    setShowPasswords(prev => ({ ...prev, [field]: !prev[field] }));
  };

  // Timer logic
  useEffect(() => {
    if (timer > 0 && step === 1) {
      const interval = setInterval(() => {
        setTimer((t) => t - 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [timer, step]);

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post("/auth/verify-reset-otp", { email, otp });
      toast.success("OTP Verified!");
      setStep(2); // Move to password reset step
    } catch (err) {
      toast.error(err.response?.data?.message || "Invalid or expired OTP.");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setLoading(true);
    try {
      await api.post("/auth/send-reset-otp");
      toast.success("New OTP sent!");
      setTimer(60); // Restart timer
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to resend OTP.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      return toast.error("Passwords do not match!");
    }
    
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/;
    if (!passwordRegex.test(password)) {
      return toast.error("New password must be 8+ chars with upper, lower, number & special char.");
    }

    setLoading(true);
    try {
      await api.post("/auth/resetPassword", { email, password });
      toast.success("Password reset successfully!");

      // Navigate to the user's dashboard instead of logging out
      const routes = {
        admin: "/adminDashboard",
        user: "/userdashboard",
        recruiter: "/recruiterDashboard",
        coo: "/cooDashboard",
        hod: "/hodDashboard",
        hr: "/superAdminDashboard",
        interviewer: "/interviewerDashboard",
        sub_recruiter: "/subRecruiterDashboard",
      };
      navigate(routes[role] || "/");

    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to reset password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="w-full max-w-md rounded-2xl bg-white shadow-2xl overflow-hidden">

          {/* Header */}
          <div className="p-5 bg-[#BFBFBF] text-black border-b-2 border-[#1A1A1A]">
            <div className="flex items-center gap-4">
              <div className="w-1.5 h-8 rounded-full bg-[#E30613]" />
              <div>
                <h3 className="text-xl font-semibold">{step === 1 ? "Verify Your Identity" : "Set New Password"}</h3>
              </div>
            </div>
          </div>

          {step === 1 ? (
            <form onSubmit={handleVerifyOtp} className="p-6 space-y-4">
              <p className="text-sm text-gray-600">
                An OTP has been sent to your email: <strong>{email}</strong>
              </p>
              <FormInput
                name="otp"
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="Enter 6-digit OTP code"
              />
              <button
                type="submit"
                disabled={loading}
                className="w-full py-1 rounded-full font-semibold text-white bg-[#111] hover:bg-[#333] transition flex items-center justify-center disabled:bg-gray-400"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Verify OTP"}
              </button>
              <button
                type="button"
                disabled={timer > 0 || loading}
                onClick={handleResendOtp}
                className="w-full text-sm text-center font-medium text-[#E30613] hover:underline disabled:text-gray-400 disabled:cursor-not-allowed"
              >
                {timer > 0 ? `Resend OTP in ${timer}s` : "Resend OTP"}
              </button>
            </form>
          ) : (
            <form onSubmit={handleResetPassword} className="p-6 space-y-4">
              <p className="text-sm text-gray-600">Verification successful. Please set your new password.</p>
              <PasswordInput
                label="New Password"
                name="newPassword"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter new password"
                show={showPasswords.new}
                onToggle={() => toggleShow('new')}
              />
              <PasswordInput
                label="Confirm New Password"
                name="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Retype new password"
                show={showPasswords.confirm}
                onToggle={() => toggleShow('confirm')}
              />
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2 rounded-full font-semibold text-white bg-[#111] hover:bg-[#333] transition flex items-center justify-center disabled:bg-gray-400"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Update Password"}
              </button>
            </form>
          )}
        </Dialog.Panel>
      </div>
    </Dialog>
  );
};


export default function UpdatePassword() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  const [showOtpModal, setShowOtpModal] = useState(false);
  
  const user = JSON.parse(localStorage.getItem("loggedInUser"));
  const role = user?.role;
  const userEmail = user?.email;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };
  
  const toggleShow = (field) => {
    setShowPasswords(prev => ({ ...prev, [field]: !prev[field] }));
  };
  
  const handleForgotPasswordClick = async () => {
    setLoading(true); 
    try {
      await api.post("/auth/send-reset-otp"); 
      toast.success("OTP sent to your email!");
      setShowOtpModal(true); 
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to send OTP.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.newPassword !== formData.confirmPassword) {
      return toast.error("New passwords do not match.");
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/;
    if (!passwordRegex.test(formData.newPassword)) {
      return toast.error("New password must be 8+ chars with upper, lower, number & special char.");
    }

    setLoading(true);
    try {
      const payload = {
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword,
      };
      
      const res = await api.patch("/auth/update-password", payload); 
      
      toast.success(res.data.message || "Password updated successfully!");
      setFormData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      navigate("/my/profile"); 
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-[#F5F5F5]">
      <Sidebar
        role={role}
        active="Profile"
        setActive={() => {}}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
      />

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-auto">
        <ProfileHeader
          title="Update Password"
          subtitle="Change your account password"
          showMenuButton={true}
          onMenuClick={() => setSidebarOpen(true)}
        />

        <div className="p-4 md:p-8 max-w-2xl mx-auto w-full">
          <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
            <form onSubmit={handleSubmit}>
              {/* Header */}
              <div className="p-5 bg-[#BFBFBF] text-black border-b-2 border-[#1A1A1A]">
                <div className="flex items-center gap-4">
                  <div className="w-1.5 h-8 rounded-full bg-[#E30613]" />
                  <div>
                    <h3 className="text-xl font-semibold">Change Your Password</h3>
                  </div>
                </div>
              </div>

              {/* Form Inputs */}
              <div className="p-6 space-y-4">
                <PasswordInput
                  label="Current Password"
                  name="currentPassword"
                  value={formData.currentPassword}
                  onChange={handleChange}
                  placeholder="Enter your current password"
                  show={showPasswords.current}
                  onToggle={() => toggleShow('current')}
                />
                
                <PasswordInput
                  label="New Password"
                  name="newPassword"
                  value={formData.newPassword}
                  onChange={handleChange}
                  placeholder="Enter new password (min. 8 characters)"
                  show={showPasswords.new}
                  onToggle={() => toggleShow('new')}
                />
                <PasswordInput
                  label="Confirm New Password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Retype your new password"
                  show={showPasswords.confirm}
                  onToggle={() => toggleShow('confirm')}
                />
              </div>

              {/* Footer */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-6 bg-gray-50 border-t">
                {/* Forgot Password Button */}
                <button
                  type="button"
                  onClick={handleForgotPasswordClick}
                  disabled={loading}
                  className="text-sm font-medium text-[#E30613] hover:underline disabled:text-gray-400"
                >
                  Forgot current password?
                </button>
                
                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => navigate("/my/profile")}
                    className="px-6 py-1 rounded-full bg-[#BFBFBF] border border-gray-200 hover:bg-gray-100 shadow-md transition-all font-semibold w-full sm:w-auto"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="inline-flex items-center justify-center gap-2 px-6 py-1 rounded-full bg-[#111] text-white hover:bg-[#BFBFBF] hover:text-black shadow-lg hover:opacity-95 transition font-semibold disabled:bg-gray-400 w-full sm:w-auto"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      'Update Password'
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </main>
      
      {/* --- RENDER THE NEW MODAL --- */}
      {showOtpModal && (
        <OtpResetModal
          isOpen={showOtpModal}
          onClose={() => setShowOtpModal(false)}
          email={userEmail}
          role={role} // --- Pass the role here ---
        />
      )}
    </div>
  );
}