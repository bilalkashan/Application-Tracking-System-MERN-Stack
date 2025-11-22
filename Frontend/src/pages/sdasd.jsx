import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import api from "../api";
import MMCLLogo from "../assets/MMC-Logo.png";
import Footer from "../components/Footer";

function Login() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

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
        // notify socket listener to pick up new token and reconnect
         window.dispatchEvent(new Event('auth:tokenChanged'));
        localStorage.setItem("role", user.role);
        localStorage.setItem(
          "loggedInUser",
          JSON.stringify({
            _id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            success: result.success,
          })
        );

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
      } else toast.error(result.message || "Login failed");
    } catch (err) {
      toast.error(err.response?.data?.message || "Login failed");
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

        {/* Login Card */}
        <div className="flex flex-1 items-center justify-center px-6 py-12 relative z-10">
        <div className="w-full max-w-md bg-white/90 backdrop-blur-md border border-gray-200 shadow-2xl rounded-2xl p-10 transition-transform duration-300 hover:scale-[1.01]">
          <div className="flex flex-col items-center">

            <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900">
              TalentStream
            </h1>
            <p className="text-gray-500 text-sm mt-4">
              Applicant Tracking System Login
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5 mt-4">
            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Email Address
              </label>
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

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Password
              </label>
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
                  <label
                    htmlFor="showPassword"
                    className="text-sm text-gray-600 cursor-pointer"
                  >
                    Show Password
                  </label>
                </div>
                <Link
                  to="/reset-password"
                  className="text-sm text-[#e5383b] font-semibold hover:underline"
                >
                  Forgot Password?
                </Link>
              </div>
            </div>

            {/* Login Button */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-2 rounded-full font-semibold text-white transition-all duration-200 ${
                loading
                  ? "bg-[#BFBFBF] text-[#161a1d] cursor-not-allowed"
                  : "hover:bg-[#BFBFBF] hover:text-[#161a1d] bg-[#e5383b] text-[#F5F5F5] shadow-lg hover:shadow-lg transition"
              }`}
            >
              {loading ? "Signing In..." : "Log In"}
            </button>

            {/* Sign Up */}
            <p className="text-center text-md text-gray-600">
              Don’t have an account?{" "}
              <Link
                to="/signup"
                className="text-[#e5383b] hover:underline font-medium"
              >
                Sign Up
              </Link>
            </p>
          </form>
        </div>
      </div>
      </div>
      <Footer />
    </div>
  );
}

export default Login;
