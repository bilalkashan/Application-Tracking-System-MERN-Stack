import React, { useEffect, useState } from "react";
import api from "../../api";
import { useNavigate } from "react-router-dom";
import { CheckCircle, XCircle } from "lucide-react";
import StepForm from "./StepForm";

export default function ProfileStepper() {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [steps, setSteps] = useState([]);
  const [completedSteps, setCompletedSteps] = useState([]);
  const [progress, setProgress] = useState(0);
  const [activeStep, setActiveStep] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get("/profile/getProfile");
        setProfile(res.data.profile);
        setSteps(res.data.steps);
        setCompletedSteps(res.data.completedSteps);
        setProgress(res.data.progress);
        setActiveStep(res.data.steps[0]); // default open first step
      } catch (err) {
        console.error("Error fetching profile:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const refreshProfile = async () => {
    const res = await api.get("/profile/getProfile");
    setProfile(res.data.profile);
    setCompletedSteps(res.data.completedSteps);
    setProgress(res.data.progress);
  };

  if (loading) return <p>Loading profile...</p>;

  return (
    <div className="grid grid-cols-4 gap-6 p-6">
      {/* LEFT SIDE */}
      <div className="col-span-3 space-y-6">
        {/* Progress bar */}
        <div className="p-4 bg-white rounded-xl shadow">
          <p className="font-semibold mb-2">Profile Completion</p>
          <div className="w-full bg-gray-200 h-3 rounded-full">
            <div
              className="h-3 rounded-full bg-blue-600 transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="mt-2 text-sm text-gray-600">{progress}% completed</p>
        </div>

        {/* Step list */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {steps.map((s) => (
            <div
              key={s}
              onClick={() => setActiveStep(s)}
              className={`p-4 rounded-xl cursor-pointer transition border 
                ${activeStep === s ? "bg-blue-50 border-blue-400" : "bg-white hover:bg-gray-50"}
              `}
            >
              <p className="font-medium">{s}</p>
            </div>
          ))}
        </div>

        {/* Step form */}
        {activeStep && (
          <div className="bg-white p-6 rounded-xl shadow">
            <StepForm
              stepName={activeStep}
              onCompleted={refreshProfile}
            />
          </div>
        )}
      </div>

      {/* RIGHT SIDE */}
      <div className="col-span-1">
        <div className="p-4 bg-white rounded-xl shadow sticky top-6">
          <h3 className="font-semibold mb-4">Step Status</h3>
          <div className="space-y-2">
            {steps.map((s) => (
              <div key={s} className="flex items-center justify-between text-sm p-2 border-b">
                <span>{s}</span>
                {completedSteps.includes(s) ? (
                  <CheckCircle className="w-4 h-4 text-green-500" />
                ) : (
                  <XCircle className="w-4 h-4 text-gray-400" />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
