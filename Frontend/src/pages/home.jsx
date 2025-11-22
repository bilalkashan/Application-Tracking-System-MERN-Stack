import React from "react";
import { Link } from "react-router-dom";
import MMCLLogo from "../assets/MMC-Logo.png";
import atsIllustration from "../assets/MMCL-ATS.png"; 
import Footer from "../components/Footer";
import { ArrowRightIcon, UserPlusIcon } from "@heroicons/react/24/solid";

function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 via-white to-gray-100 text-gray-800 font-sans">
      
      {/* --- UPDATED HEADER --- */}
      <header className="flex items-center justify-between px-6 md:px-12 py-5 bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-50">
        <div className="flex items-center gap-3">
          {/* <img src={MMCLLogo} alt="MM Logo" className="w-60 h-10" /> */}
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900">
            TalentStream
          </h1>
        </div>

        {/* --- Login and Sign Up are now grouped --- */}
        <nav className="flex items-center gap-3 text-sm md:text-base font-medium">
          <Link
            to="/login"
            className="text-gray-700 hover:text-[#E30613] transition-colors duration-200"
          >
            Login
          </Link>
          <Link
            to="/signup"
            className="flex items-center gap-2 px-3 py-2 bg-[#E30613] text-white rounded-lg shadow-md hover:bg-red-700 transition-all duration-200"
          >
            {/* <UserPlus className="w-4 h-4" /> */}
            Sign Up
          </Link>
        </nav>
      </header>

        {/* Hero Section */}
      <main className="flex-1 container mx-auto grid md:grid-cols-2 items-center px-6 py-16 md:py-24 relative overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-red-100 rounded-full blur-3xl opacity-40 animate-pulse-slow"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-gray-200 rounded-full blur-3xl opacity-30 animate-pulse-slow"></div>

        <div className="z-10 text-center md:text-left animate-fade-in-left">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-gray-900 mb-6 leading-tight">
            {/* --- FIX: Use exact theme red --- */}
            Welcome to <span className="text-[#E30613]">TalentStream</span>
          </h1>

          <p className="text-lg md:text-xl text-gray-700 mb-10 max-w-xl mx-auto md:mx-0 leading-relaxed">
            Welcome to TalentStream, A hiring platform. Streamline your recruitment, track applicants efficiently, and accelerate your hiring process, all in one modern, secure, and user-friendly system.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
            <Link
              to="/login"
              // NEW: Updated gradient button
              className="flex items-center justify-center gap-2 px-8 py-3.5 bg-red-600 text-white rounded-xl font-semibold shadow-lg hover:scale-105 hover:shadow-xl transition-all duration-200"
            >
              <span>Get Started</span>
              <ArrowRightIcon className="w-5 h-5" />
            </Link>
            <Link
              to="/signup"
              // NEW: Updated outline button
              className="flex items-center justify-center gap-2 px-8 py-3.5 bg-white border-2 border-gray-900 text-gray-900 rounded-xl font-semibold shadow-lg hover:bg-primary-50 hover:scale-105 transition-all duration-200"
            >
              <span>Create Account</span>
            </Link>
          </div>
        </div>

        <div className="z-10 mt-12 md:mt-0 flex justify-center items-center animate-fade-in-right">
          <img
            src={atsIllustration}
            alt="Applicant Tracking System Illustration"
            className="w-full max-w-lg h-auto"
          />
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default Home;