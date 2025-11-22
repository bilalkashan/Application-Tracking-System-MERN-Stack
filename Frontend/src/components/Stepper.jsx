import React from "react";

const Stepper = ({ steps, activeStep, setActiveStep }) => (
  <div className="flex space-x-2 mb-6 overflow-x-auto">
    {steps.map((step, idx)=>(
      <button
        key={idx}
        onClick={()=>setActiveStep(idx)}
        className={`flex-1 min-w-max px-4 py-2 rounded-full text-sm font-medium transition ${
          activeStep===idx ? "bg-indigo-600 text-white" : "bg-gray-200 text-gray-700 hover:bg-indigo-100"
        }`}
      >
        {step}
      </button>
    ))}
  </div>
);

export default Stepper;
