import React, { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LabelList,
} from 'recharts';

const HiringFunnel = ({ applications }) => {
  const funnelData = useMemo(() => {
    // Define the stages of the funnel in order
    const stages = [
      { name: 'Hired', statuses: ['hired'] },
      { name: 'Offer Accepted', statuses: ['offer-accepted'] },
      { name: 'Offer Sent', statuses: ['offer', 'offer-accepted', 'offer-rejected'] },
      { name: 'Interview Stage', statuses: ['first-interview', 'second-interview', 'offer', 'offer-accepted', 'offer-rejected', 'hired'] },
      { name: 'Shortlisted', statuses: ['shortlisted', 'first-interview', 'second-interview', 'offer', 'offer-accepted', 'offer-rejected', 'hired'] },
      { name: 'Applied', statuses: [] }, // All applications are considered "Applied"
    ];

    // Calculate counts for each stage
    const counts = stages.map(stage => {
      let count;
      if (stage.name === 'Applied') {
        count = applications.length;
      } else {
        count = applications.filter(app => stage.statuses.includes(app.currentStatus.code)).length;
      }
      return {
        name: stage.name,
        candidates: count,
      };
    });

    return counts;
  }, [applications]);
  
  return (
    <div className="w-full h-96">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Candidate Pipeline Funnel</h3>
        <ResponsiveContainer width="100%" height="100%">
            <BarChart
                layout="vertical"
                data={funnelData}
                margin={{ top: 20, right: 30, left: 40, bottom: 5 }}
            >
                <XAxis type="number" hide />
                <YAxis
                    type="category"
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    width={120}
                />
                <Tooltip
                    cursor={{ fill: 'rgba(239, 246, 255, 0.7)' }}
                    formatter={(value) => [`${value} candidates`, 'Count']}
                />
                <Bar dataKey="candidates" fill="#6366F1" radius={[0, 10, 10, 0]}>
                    <LabelList 
                        dataKey="candidates" 
                        position="right" 
                        style={{ fill: '#374151', fontWeight: 'bold' }} 
                    />
                </Bar>
            </BarChart>
        </ResponsiveContainer>
    </div>
  );
};

export default HiringFunnel;