import React from 'react';

const ScoreCircle = ({ score }) => {
  const radius = 50;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  let colorClass = 'text-green-500';
  if (score < 75) colorClass = 'text-yellow-500';
  if (score < 50) colorClass = 'text-red-500';

  return (
    <div className="relative flex items-center justify-center w-24 h-24">
      <svg className="w-full h-full" viewBox="0 0 120 120">
        <circle
          className="text-gray-200"
          strokeWidth="10"
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx="60"
          cy="60"
        />
        <circle
          className={colorClass}
          strokeWidth="10"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx="60"
          cy="60"
          transform="rotate(-90 60 60)"
        />
      </svg>
      <span className={`absolute text-2xl font-bold ${colorClass}`}>
        {score}%
      </span>
    </div>
  );
};

export default ScoreCircle;