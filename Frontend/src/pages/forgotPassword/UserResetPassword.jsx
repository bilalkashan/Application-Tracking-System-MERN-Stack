import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import api from "../../api";
import MMCLLogo from "../../assets/MMC-Logo.png";
import { Loader2 } from "lucide-react";

function UserResetPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // This backend route already exists in your controller
      await api.post("/auth/forgetPassword", { email });
      toast.success("OTP sent! Please check your email.");
      // Navigate to the next step, passing the email along
      navigate('/new-password', { state: { email } });
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to send OTP.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-gray-50 relative overflow-hidden">
      {/* Decorative Circles */}
      <div className="absolute top-[-4rem] right-[-4rem] w-80 h-80 bg-red-100 rounded-full blur-3xl opacity-40"></div>
      <div className="absolute bottom-[-5rem] left-[-5rem] w-96 h-96 bg-red-200 rounded-full blur-3xl opacity-30"></div>

      {/* Card */}
      <div className="flex flex-1 items-center justify-center px-6 py-12 relative z-10">
        <div className="w-full max-w-md bg-white/90 backdrop-blur-md border border-gray-200 shadow-2xl rounded-2xl p-10">
          <div className="flex flex-col items-center">
            <img
              src={MMCLLogo}
              alt="Master Motor Logo"
              className="drop-shadow-sm"
            />
            <h2 className="text-xl font-bold text-gray-800 mt-4">Reset Your Password</h2>
            <p className="text-gray-500 text-sm mt-2 text-center">
              Enter your email and we'll send you an OTP to reset your password.
            </p>
          </div>

          <form onSubmit={handleSendOtp} className="space-y-5 mt-6">
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
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-2 border rounded-full shadow-md focus:outline-none focus:ring-[#111] focus:border-[#111] transition"
              />
            </div>

            {/* Send OTP Button */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-2 rounded-full font-semibold text-white transition-all duration-200 flex items-center justify-center ${
                loading
                  ? "bg-[#BFBFBF] text-[#161a1d] cursor-not-allowed"
                  : "hover:bg-[#BFBFBF] hover:text-[#161a1d] bg-[#e5383b] text-[#F5F5F5] shadow-lg hover:shadow-lg transition"
              }`}
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  Sending OTP...
                </>
              ) : (
                "Send OTP"
              )}
            </button>
            
            <p className="text-center text-md text-gray-600">
              Remember your password?{" "}
              <a
                href="/login"
                className="text-[#e5383b] hover:underline font-medium"
              >
                Log In
              </a>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}

export default UserResetPassword;