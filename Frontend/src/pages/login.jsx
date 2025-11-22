import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import api from "../api";
import MMCLLogo from "../assets/MMC-Logo.png";
import Footer from "../components/Footer";
import { Loader2 } from "lucide-react";

function Login() {
  const navigate = useNavigate();
  
  // View State: 'login' or 'otp'
  const [view, setView] = useState("login"); 
  
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [otp, setOtp] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  // --- LOGIN HANDLER ---
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post("/auth/login", formData);
      const result = res.data;

      if (result.success) {
        toast.success("Welcome back!", { duration: 1800 });

        const { user } = result;
        localStorage.setItem("token", result.token);
        window.dispatchEvent(new Event('auth:tokenChanged'));
        localStorage.setItem("role", user.role);
        localStorage.setItem("loggedInUser", JSON.stringify(user));

        setTimeout(() => {
          const role = user.role?.toLowerCase().trim();
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
        }, 1000);
      }
    } catch (err) {
      // Check if error is "Account not verified" (403)
      if (err.response && err.response.status === 403) {
        toast.error("Account not verified. Please enter OTP.");
        
        // Trigger OTP resend automatically so user has a fresh code
        try {
          await api.post("/auth/resend-otp", { email: formData.email });
          toast.success("New OTP sent to your email.");
        } catch (resendErr) {
          console.error(resendErr);
        }
        
        setView("otp"); // Switch to OTP view
      } else {
        toast.error(err.response?.data?.message || "Login failed");
      }
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
        email: formData.email,
        otp: otp,
      });
      
      if (res.data.success) {
        toast.success("Email Verified! Logging you in...");
        // After verification, try logging in again automatically
        const loginRes = await api.post("/auth/login", formData);
        const result = loginRes.data;
        
        if (result.success) {
           const { user } = result;
           localStorage.setItem("token", result.token);
           window.dispatchEvent(new Event('auth:tokenChanged'));
           localStorage.setItem("role", user.role);
           localStorage.setItem("loggedInUser", JSON.stringify(user));
           
           // Navigate based on role (same logic as handleLogin)
           const role = user.role?.toLowerCase().trim();
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
        }
      } else {
        toast.error(res.data.message || "Invalid OTP");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Verification failed");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setLoading(true);
    try {
      await api.post("/auth/resend-otp", { email: formData.email });
      toast.success("OTP resent successfully!");
    } catch (err) {
      toast.error("Failed to resend OTP");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <div className="flex-1 flex bg-gray-50 relative overflow-hidden">

        {/* Decorative Circles */}
        <div className="absolute top-[-4rem] right-[-4rem] w-80 h-80 bg-blue-100 rounded-full blur-3xl opacity-40"></div>
        <div className="absolute bottom-[-5rem] left-[-5rem] w-96 h-96 bg-blue-200 rounded-full blur-3xl opacity-30"></div>

        {/* Card */}
        <div className="flex flex-1 items-center justify-center px-6 py-12 relative z-10">
          <div className="w-full max-w-md bg-white/90 backdrop-blur-md border border-gray-200 shadow-2xl rounded-2xl p-10 transition-transform duration-300 hover:scale-[1.01]">
            
            <div className="flex flex-col items-center">
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900">
                TalentStream
              </h1>
              <p className="text-gray-500 text-sm mt-4">
                {view === "login" ? "Applicant Tracking System Login" : `Verify OTP for ${formData.email}`}
              </p>
            </div>

            {view === "login" ? (
              /* ================= LOGIN FORM ================= */
              <form onSubmit={handleLogin} className="space-y-5 mt-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                  <input
                    id="email"
                    type="email"
                    name="email"
                    placeholder="Your email address"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border rounded-full shadow-md focus:outline-none focus:ring-[#111] focus:border-[#111] transition"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    name="password"
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border rounded-full shadow-md focus:outline-none focus:ring-[#111] focus:border-[#111] transition"
                  />
                  <div className="flex justify-between items-center mt-4">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="showPassword"
                        checked={showPassword}
                        onChange={() => setShowPassword(!showPassword)}
                        className="accent-blue-600 cursor-pointer"
                      />
                      <label htmlFor="showPassword" class="text-sm text-gray-600 cursor-pointer">Show Password</label>
                    </div>
                    <Link to="/reset-password" class="text-sm text-[#e5383b] font-semibold hover:underline">Forgot Password?</Link>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full py-2 rounded-full font-semibold text-white transition-all duration-200 flex justify-center items-center ${
                    loading ? "bg-[#BFBFBF] text-[#161a1d] cursor-not-allowed" : "bg-[#e5383b] hover:bg-[#BFBFBF] hover:text-[#161a1d] shadow-lg"
                  }`}
                >
                  {loading ? <Loader2 className="animate-spin" /> : "Log In"}
                </button>

                <p className="text-center text-md text-gray-600">
                  Don’t have an account? <Link to="/signup" className="text-[#e5383b] hover:underline font-medium">Sign Up</Link>
                </p>
              </form>
            ) : (
              /* ================= OTP FORM ================= */
              <form onSubmit={handleVerifyOtp} className="space-y-6 mt-4 animate-fadeIn">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Enter OTP Code</label>
                  <input
                    type="text"
                    maxLength="6"
                    placeholder="123456"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ''))}
                    className="w-full px-4 py-3 border rounded-full shadow-md focus:outline-none focus:ring-[#111] focus:border-[#111] text-center text-lg tracking-widest"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2 rounded-full font-semibold text-white bg-[#111] hover:bg-gray-800 shadow-lg transition flex justify-center items-center disabled:opacity-70"
                >
                  {loading ? <Loader2 className="animate-spin" /> : "Verify & Login"}
                </button>

                <div className="text-center space-y-3">
                   <p className="text-sm text-gray-600">
                    Didn't receive code?{" "}
                    <button type="button" onClick={handleResendOtp} disabled={loading} className="text-[#e5383b] font-medium hover:underline disabled:text-gray-400">
                      Resend OTP
                    </button>
                  </p>
                  <button type="button" onClick={() => setView("login")} className="text-xs text-gray-400 hover:text-gray-600 underline">
                    Back to Login
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}

export default Login;