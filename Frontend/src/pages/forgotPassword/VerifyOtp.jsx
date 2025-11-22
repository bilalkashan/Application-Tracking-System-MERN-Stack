import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "react-hot-toast";
import api from "../../api";
import MMCLLogo from "../../assets/MMC-Logo.png";
import { Loader2 } from "lucide-react";

function VerifyOtp() {
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email; // Get email from previous page

  const [step, setStep] = useState(1); // 1 for OTP, 2 for Password
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [retypePassword, setRetypePassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(60);

  // Redirect to login if email is not present in state
  useEffect(() => {
    if (!email) {
      toast.error("No email provided. Please start over.");
      navigate("/userResetpassword");
    }
  }, [email, navigate]);

  // Timer logic
  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => {
        setTimer((t) => t - 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [timer]);

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // We need a NEW backend route for this
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
      await api.post("/auth/forgetPassword", { email });
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
    if (password !== retypePassword) {
      return toast.error("Passwords do not match!");
    }
    
    // Password regex from your signup controller
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/;
    if (!passwordRegex.test(password)) {
      return toast.error("Password must be 8+ chars with upper, lower, number & special char.");
    }

    setLoading(true);
    try {
      // This backend route already exists in your controller
      await api.post("/auth/resetPassword", { email, password });
      toast.success("Password reset successfully! Please log in.");
      navigate('/login');
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to reset password.");
    } finally {
      setLoading(false);
    }
  };

  const renderStepOne = () => (
    <form onSubmit={handleVerifyOtp} className="space-y-5 mt-6">
      <div>
        <label htmlFor="otp" className="block text-sm font-medium text-gray-700 mb-1">
          Enter OTP
        </label>
        <input
          id="otp"
          type="text"
          name="otp"
          placeholder="6-digit code"
          value={otp}
          onChange={(e) => setOtp(e.target.value)}
          required
          className="w-full px-4 py-2 border rounded-full shadow-md focus:outline-none focus:ring-[#111] focus:border-[#111] transition"
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        className={`w-full py-2 rounded-full font-semibold text-white transition-all duration-200 flex items-center justify-center ${
          loading
            ? "bg-[#BFBFBF] text-[#161a1d] cursor-not-allowed"
            : "hover:bg-[#BFBFBF] hover:text-[#161a1d] bg-[#e5383b] text-[#F5F5F5] shadow-lg hover:shadow-lg transition"
        }`}
      >
        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Verify OTP"}
      </button>
      <button
        type="button"
        disabled={timer > 0 || loading}
        onClick={handleResendOtp}
        className="w-full text-sm text-center font-medium text-[#111] disabled:text-gray-400 disabled:cursor-not-allowed"
      >
        {timer > 0 ? `Resend OTP in ${timer}s` : "Resend OTP"}
      </button>
    </form>
  );

  const renderStepTwo = () => (
    <form onSubmit={handleResetPassword} className="space-y-5 mt-6">
      <div>
        <label
          htmlFor="password"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          New Password
        </label>
        <input
          id="password"
          type="password"
          name="password"
          placeholder="Enter new password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="w-full px-4 py-2 border rounded-full shadow-md focus:outline-none focus:ring-[#111] focus:border-[#111] transition"
        />
      </div>
      <div>
        <label
          htmlFor="retypePassword"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Retype New Password
        </label>
        <input
          id="retypePassword"
          type="password"
          name="retypePassword"
          placeholder="Confirm new password"
          value={retypePassword}
          onChange={(e) => setRetypePassword(e.target.value)}
          required
          className="w-full px-4 py-2 border rounded-full shadow-md focus:outline-none focus:ring-[#111] focus:border-[#111] transition"
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        className={`w-full py-2 rounded-full font-semibold text-white transition-all duration-200 flex items-center justify-center ${
          loading
            ? "bg-[#BFBFBF] text-[#161a1d] cursor-not-allowed"
            : "hover:bg-[#BFBFBF] hover:text-[#161a1d] bg-[#e5383b] text-[#F5F5F5] shadow-lg hover:shadow-lg transition"
        }`}
      >
        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Reset Password"}
      </button>
    </form>
  );

  return (
    <div className="min-h-screen flex bg-gray-50 relative overflow-hidden">
      <div className="absolute top-[-4rem] right-[-4rem] w-80 h-80 bg-red-100 rounded-full blur-3xl opacity-40"></div>
      <div className="absolute bottom-[-5rem] left-[-5rem] w-96 h-96 bg-red-200 rounded-full blur-3xl opacity-30"></div>

      <div className="flex flex-1 items-center justify-center px-6 py-12 relative z-10">
        <div className="w-full max-w-md bg-white/90 backdrop-blur-md border border-gray-200 shadow-2xl rounded-2xl p-10">
          <div className="flex flex-col items-center">
            <img
              src={MMCLLogo}
              alt="Master Motor Logo"
              className="drop-shadow-sm"
            />
            <h2 className="text-xl font-bold text-gray-800 mt-4">
              {step === 1 ? "Verify Your Account" : "Set New Password"}
            </h2>
            <p className="text-gray-500 text-sm mt-2 text-center">
              {step === 1
                ? `An OTP has been sent to ${email}`
                : "Please enter your new password."}
            </p>
          </div>
          {step === 1 ? renderStepOne() : renderStepTwo()}
        </div>
      </div>
    </div>
  );
}

export default VerifyOtp;