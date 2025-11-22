import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import { handleSuccess, handleError } from "../toast";
import api from "../api";
import MMCLLogo from "../assets/MMC-Logo.png";
import Footer from "../components/Footer";
import { toast } from "react-hot-toast";
import { Loader2 } from "lucide-react"; // Optional icon for loading state

function Signup() {
  const navigate = useNavigate();
  
  // --- STATE MANAGEMENT ---
  const [isOtpSent, setIsOtpSent] = useState(false); // Controls view (Signup vs OTP)
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false); // General loading state
  
  const [showPassword, setShowPassword] = useState(false);
  const [signupInfo, setSignupInfo] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  // --- VALIDATION LOGIC ---
  const validateField = (name, value) => {
    switch (name) {
      case "name":
        if (!/^[A-Za-z ]{3,}$/.test(value)) {
          return "Name must be at least 3 letters (alphabets only)";
        }
        return "";
      case "email":
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          return "Please enter a valid email address";
        }
        return "";
      case "password":
        if (
          !/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/.test(value)
        ) {
          return "Password must be 8+ chars, include upper, lower, number, special char";
        }
        return "";
      case "confirmPassword":
        if (value !== signupInfo.password) {
          return "Passwords do not match";
        }
        return "";
      default:
        return "";
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setSignupInfo((prev) => ({ ...prev, [name]: value }));
    const errorMsg = validateField(name, value);
    setErrors((prev) => ({ ...prev, [name]: errorMsg }));
  };

  // --- SIGNUP HANDLER ---
  const handleSignup = async (e) => {
    e.preventDefault();
    const newErrors = {};
    Object.keys(signupInfo).forEach(
      (field) => (newErrors[field] = validateField(field, signupInfo[field]))
    );
    setErrors(newErrors);

    if (Object.values(newErrors).some((msg) => msg))
      return toast.error("All fields are required or invalid");

    setLoading(true);
    try {
      const { name, email, password } = signupInfo;
      const res = await api.post("/auth/signup", {
        name,
        email,
        password,
        role: "user",
      });
      const result = res.data;

      if (!result.success) {
        toast.error(result.message);
      } else {
        toast.success("Signup successful! Check your email for OTP.");
        setIsOtpSent(true); // Switch to OTP view
      }
    } catch (err) {
      console.error("Signup Error:", err);
      if (err.response?.data) toast.error(err.response.data.message);
      else handleError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // --- OTP VERIFICATION HANDLER ---
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!otp || otp.length < 6) return toast.error("Please enter a valid OTP");

    setLoading(true);
    try {
      const res = await api.post("/auth/verify", {
        email: signupInfo.email, // Use email from state
        otp: otp,
      });
      const result = res.data;

      if (result.success) {
        toast.success("Email Verified Successfully! Redirecting...");
        setTimeout(() => navigate("/login"), 1500);
      } else {
        toast.error(result.message || "Invalid OTP");
      }
    } catch (err) {
      console.error("OTP Error:", err);
      toast.error(err.response?.data?.message || "Verification failed");
    } finally {
      setLoading(false);
    }
  };

  // --- RESEND OTP HANDLER ---
  const handleResendOtp = async () => {
    setLoading(true);
    try {
      const res = await api.post("/auth/resend-otp", {
        email: signupInfo.email,
      });
      if (res.data.success) {
        toast.success("OTP resent successfully!");
      } else {
        toast.error(res.data.message);
      }
    } catch (err) {
      toast.error("Failed to resend OTP");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex-1 flex bg-gray-50 relative overflow-hidden">
        {/* Decorative background circles */}
        <div className="absolute top-[-4rem] right-[-4rem] w-80 h-80 bg-blue-100 rounded-full blur-3xl opacity-40"></div>
        <div className="absolute bottom-[-5rem] left-[-5rem] w-96 h-96 bg-blue-200 rounded-full blur-3xl opacity-30"></div>

        {/* Card Container */}
        <div className="flex flex-1 items-center justify-center px-6 py-12 relative z-10">
          <div className="w-full max-w-lg bg-white/90 backdrop-blur-md border border-gray-200 shadow-2xl rounded-2xl p-12 transition-transform duration-300 hover:scale-[1.01]">
            
            {/* --- HEADER (Logo) --- */}
            <div className="flex flex-col items-center mb-6">
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900">
                TalentStream
              </h1>
              <p className="text-gray-500 text-sm text-center mt-4">
                {isOtpSent 
                  ? `We sent a code to ${signupInfo.email}` 
                  : "Create your account to get started"}
              </p>
            </div>

            {/* --- CONDITIONAL RENDERING --- */}
            {!isOtpSent ? (
              /* ================= SIGNUP FORM ================= */
              <form onSubmit={handleSignup} className="space-y-5 mt-4">
                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                  <input
                    id="name"
                    type="text"
                    name="name"
                    placeholder="Your full name"
                    value={signupInfo.name}
                    onChange={handleChange}
                    className={`w-full px-4 py-2 border rounded-full shadow-md focus:outline-none transition ${
                      errors.name ? "border-red-500 focus:ring-red-400" : "focus:ring-[#111] focus:border-[#111]"
                    }`}
                  />
                  {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                  <input
                    id="email"
                    type="email"
                    name="email"
                    placeholder="Your email address"
                    value={signupInfo.email}
                    onChange={handleChange}
                    className={`w-full px-4 py-2 border rounded-full shadow-md focus:outline-none transition ${
                      errors.email ? "border-red-500 focus:ring-red-400" : "focus:ring-[#111] focus:border-[#111]"
                    }`}
                  />
                  {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
                </div>

                {/* Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    name="password"
                    placeholder="Enter password"
                    value={signupInfo.password}
                    onChange={handleChange}
                    className={`w-full px-4 py-2 border rounded-full shadow-md focus:outline-none transition ${
                      errors.password ? "border-red-500 focus:ring-red-400" : "focus:ring-[#111] focus:border-[#111]"
                    }`}
                  />
                  {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
                  <input
                    id="confirmPassword"
                    type={showPassword ? "text" : "password"}
                    name="confirmPassword"
                    placeholder="Re-enter password"
                    value={signupInfo.confirmPassword}
                    onChange={handleChange}
                    className={`w-full px-4 py-2 border rounded-full shadow-md focus:outline-none transition ${
                      errors.confirmPassword ? "border-red-500 focus:ring-red-400" : "focus:ring-[#111] focus:border-[#111]"
                    }`}
                  />
                  {errors.confirmPassword && <p className="text-red-500 text-sm mt-1">{errors.confirmPassword}</p>}
                </div>

                {/* Show Password Checkbox */}
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="showPassword"
                    checked={showPassword}
                    onChange={() => setShowPassword(!showPassword)}
                    className="accent-blue-600 cursor-pointer"
                  />
                  <label htmlFor="showPassword" class="text-sm text-gray-600 cursor-pointer">
                    Show Passwords
                  </label>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex justify-center items-center hover:bg-[#BFBFBF] hover:text-[#161a1d] bg-[#e5383b] text-[#F5F5F5] shadow-lg hover:shadow-lg font-semibold py-2 rounded-full transition-all duration-200 disabled:opacity-70"
                >
                  {loading ? <Loader2 className="animate-spin" /> : "Sign Up"}
                </button>

                {/* Redirect to Login */}
                <p className="text-center text-md text-gray-600">
                  Already have an account?{" "}
                  <Link to="/login" className="text-[#e5383b] hover:underline font-medium">
                    Log In
                  </Link>
                </p>
              </form>
            ) : (
              /* ================= OTP VERIFICATION FORM ================= */
              <form onSubmit={handleVerifyOtp} className="space-y-6 mt-4 animate-fadeIn">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Enter One-Time Password (OTP)
                  </label>
                  <input
                    type="text"
                    name="otp"
                    maxLength="6"
                    placeholder="123456"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ''))} // Only allow numbers
                    className="w-full px-4 py-3 border rounded-full shadow-md focus:outline-none focus:ring-[#111] focus:border-[#111] text-center text-lg tracking-widest"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex justify-center items-center bg-[#111] text-white shadow-lg hover:bg-gray-800 font-semibold py-2 rounded-full transition-all duration-200 disabled:opacity-70"
                >
                  {loading ? <Loader2 className="animate-spin" /> : "Verify Email"}
                </button>

                <div className="text-center space-y-3">
                  <p className="text-sm text-gray-600">
                    Didn't receive the code?{" "}
                    <button
                      type="button"
                      onClick={handleResendOtp}
                      disabled={loading}
                      className="text-[#e5383b] font-medium hover:underline disabled:text-gray-400"
                    >
                      Resend OTP
                    </button>
                  </p>
                  
                  <button
                    type="button"
                    onClick={() => setIsOtpSent(false)}
                    className="text-xs text-gray-400 hover:text-gray-600 underline"
                  >
                    Change Email Address
                  </button>
                </div>
              </form>
            )}

          </div>
        </div>
      </div>

      <Footer />
      <ToastContainer />
    </div>
  );
}

export default Signup;