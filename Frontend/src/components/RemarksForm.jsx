import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import api from "../api";

const competencies = [
    { name: "Communication Skills", guideline: "Clarity of speech, articulation, listening skills, confidence" },
    { name: "Job Knowledge / Technical Competence", guideline: "Understanding of role, tools, and technical expertise" },
    { name: "Analytical & Problem-Solving Ability", guideline: "Logical reasoning, decision-making, and approach to challenges" },
    { name: "Adaptability & Learning Agility", guideline: "Openness to feedback, ability to learn new concepts quickly" },
    { name: "Teamwork & Collaboration", guideline: "Cooperation, respectfulness, ability to work within a team" },
    { name: "Work Ethics & Dependability", guideline: "Punctuality, honesty, accountability, and commitment" },
    { name: "Interpersonal & Behavioral Conduct", guideline: "Professionalism, maturity, and relationship management" },
    { name: "Cultural Fit", guideline: "Alignment with organizational values, attitude, and temperament" },
    { name: "Presentation & Grooming", guideline: "Personal appearance, confidence, and professional demeanor" },
];

export default function RemarksForm({ appId, onClose, onSuccess, existingRemarks, userRole }) { // Pass userRole as prop
    const [ratings, setRatings] = useState(Array(competencies.length).fill(''));
    const [summary, setSummary] = useState({
        strengths: "", improvements: "", motivation: "",
        compensation: "", notice: "", impression: "",
        recommendation: "", comment: "" // Include comment in state
    });
    const [interviewType, setInterviewType] = useState("");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (existingRemarks) {
            const initialRatings = competencies.map(comp => {
                const existingEval = existingRemarks.evaluations?.find(ev => ev.competency === comp.name);
                return existingEval ? String(existingEval.rating) : ''; // Use string for select value
            });
            setRatings(initialRatings);

            setSummary({
                strengths: existingRemarks.keyStrengths || "",
                improvements: existingRemarks.areasForImprovement || "",
                motivation: existingRemarks.motivationCareerAspiration || "",
                compensation: existingRemarks.expectedCompensation || "",
                notice: existingRemarks.availabilityNoticePeriod || "",
                impression: existingRemarks.generalImpression || "",
                recommendation: existingRemarks.recommendation || "",
                comment: existingRemarks.comment || "", // Populate comment
            });
            setInterviewType(existingRemarks.interviewType || "");
        } else {
             setRatings(Array(competencies.length).fill(''));
             setSummary({
                strengths: "", improvements: "", motivation: "",
                compensation: "", notice: "", impression: "",
                recommendation: "", comment: ""
             });
             setInterviewType("");
        }
    }, [existingRemarks]); // Dependency array includes existingRemarks

    const handleRatingChange = (index, value) => {
        const updated = [...ratings];
        updated[index] = value; // Store the string value ('', '1', '2', etc.)
        setRatings(updated);
    };

    const validRatings = ratings.filter(r => r !== '' && !isNaN(Number(r))).map(Number);
    const averageScore = validRatings.length > 0
        ? (validRatings.reduce((a, b) => a + b, 0) / validRatings.length).toFixed(1)
        : 0;

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!interviewType) return toast.error("Please select interview type");
        if (ratings.some(r => r === '')) return toast.error("Please provide a rating for all competencies.");
        if (!summary.impression) return toast.error("Please select General Impression.");
        if (!summary.recommendation) return toast.error("Please select Recommendation.");

        setLoading(true);
        try {
            const evaluations = competencies.map((c, i) => ({
                competency: c.name,
                rating: Number(ratings[i]), // Send as number
            }));

            const payload = {
                interviewType,
                evaluations,
                keyStrengths: summary.strengths,
                areasForImprovement: summary.improvements,
                motivationCareerAspiration: summary.motivation,
                expectedCompensation: summary.compensation,
                availabilityNoticePeriod: summary.notice,
                overallAverageScore: Number(averageScore),
                generalImpression: summary.impression,
                recommendation: summary.recommendation,
                comment: summary.comment,
            };

            const response = await api.post(`/applications/${appId}/remarks`, payload);
            toast.success("Remarks submitted successfully");

            if (onSuccess) {
                 onSuccess(response.data.remark); // Pass the remark data back
            }

        } catch (err) {
            console.error("Error submitting remarks:", err.response?.data || err.message || err);
            toast.error(err.response?.data?.message || "Failed to submit remarks. Check console.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <form
            id="remarksForm" 
            onSubmit={handleSubmit}
            className="p-6 space-y-8" 
        >
            <div>
                <label className="block font-semibold text-gray-700 mb-2">
                    Select Interview Type <span className="text-red-500">*</span>
                </label>
                <select
                    value={interviewType}
                    onChange={(e) => setInterviewType(e.target.value)}
                    className="border border-gray-300 rounded-lg p-2 w-full focus:ring-1 focus:ring-black focus:outline-none bg-white"
                    required
                >
                    <option value="">-- Select --</option>
                    <option value="first-interview">First Interview</option>
                    <option value="second-interview">Second Interview</option>
                </select>
            </div>

            {/* Competency Table */}
            <div className="border rounded-xl shadow-sm overflow-hidden bg-white">
                 <div className="overflow-x-auto"> {/* Allow horizontal scroll */}
                    <table className="w-full border-collapse text-sm min-w-[600px]">
                        <thead className="bg-[#BFBFBF] text-black sticky top-0 z-10">
                            <tr>
                                <th className="px-3 py-2 text-left w-8">S.No</th>
                                <th className="px-4 py-2 text-left">Competency Area</th>
                                <th className="px-4 py-2 text-left">Assessment Guidelines</th>
                                <th className="px-4 py-2 text-center w-32">Rating (1–5)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {competencies.map((c, i) => (
                                <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-gray-50 hover:bg-gray-100 transition"}>
                                    <td className="text-center px-2 py-3 font-medium text-gray-600 border-b border-gray-200">{i + 1}</td>
                                    <td className="px-4 py-3 font-medium text-gray-800 border-b border-gray-200">{c.name}</td>
                                    <td className="px-4 py-3 text-gray-600 border-b border-gray-200">{c.guideline}</td>
                                    <td className="text-center px-4 py-3 border-b border-gray-200">
                                        <select
                                            value={ratings[i]}
                                            onChange={(e) => handleRatingChange(i, e.target.value)}
                                            className="border rounded-md p-1.5 w-16 text-center focus:ring-1 focus:ring-black focus:outline-none bg-white"
                                            required // Make rating mandatory
                                        >
                                            <option value="">--</option>
                                            {[1, 2, 3, 4, 5].map((r) => (
                                                <option key={r} value={r}>{r}</option>
                                            ))}
                                        </select>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Summary Section */}
             <h3 className="text-lg font-semibold text-gray-800 pt-4 border-t">Summary & Recommendation</h3>
             <div className="grid md:grid-cols-2 gap-x-6 gap-y-4">
                 {[
                     ["Key Strengths", "strengths", "Enter candidate's key strengths..."],
                     ["Areas for Improvement", "improvements", "Mention improvement areas..."],
                     ["Motivation & Career Aspiration", "motivation", "Describe motivation and goals..."],
                     ["Expected Compensation", "compensation", "Expected compensation details..."],
                     ["Availability / Notice Period", "notice", "Mention candidate's availability..."],
                     ["Overall Comment", "comment", "Add any final comments..."], // Added Comment field here
                 ].map(([label, key, placeholder]) => (
                     <div key={key} className="flex flex-col">
                         <label className="text-sm font-semibold text-gray-700 mb-1">{label}</label>
                         <textarea
                             placeholder={placeholder}
                             value={summary[key]}
                             onChange={(e) => setSummary({ ...summary, [key]: e.target.value })}
                             className="border border-gray-300 rounded-lg p-2 h-24 focus:ring-1 focus:ring-black focus:outline-none bg-white"
                             rows={3}
                         />
                     </div>
                 ))}
             </div>

            {/* Overall Section */}
             <div className="border-t pt-6 space-y-4">
                 <div className="flex items-center justify-between bg-gray-100 p-3 rounded-lg">
                     <span className="font-semibold text-gray-800">Overall Average Score:</span>
                     <span className="text-xl font-bold text-black">{averageScore} / 5</span>
                 </div>

                 <div className="grid md:grid-cols-2 gap-4">
                     <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">
                            General Impression <span className="text-red-500">*</span>
                         </label>
                         <select
                             value={summary.impression}
                             onChange={(e) => setSummary({ ...summary, impression: e.target.value })}
                             className="border border-gray-300 rounded-lg p-2 w-full focus:ring-1 focus:ring-black focus:outline-none bg-white"
                             required
                         >
                             <option value="">-- Select --</option>
                             {["Excellent", "Good", "Average", "Below Average", "Poor"].map((opt) => (
                                 <option key={opt} value={opt}>{opt}</option>
                             ))}
                         </select>
                     </div>
                    <div>
                         <label className="block text-sm font-semibold text-gray-700 mb-1">
                             Recommendation <span className="text-red-500">*</span>
                         </label>
                         <select
                             value={summary.recommendation}
                             onChange={(e) => setSummary({ ...summary, recommendation: e.target.value })}
                             className="border border-gray-300 rounded-lg p-2 w-full focus:ring-1 focus:ring-black focus:outline-none bg-white"
                             required
                         >
                             <option value="">-- Select --</option>
                             {["Strongly Recommend", "Recommend", "Consider with Reservations", "Not Suitable"].map((opt) => (
                                 <option key={opt} value={opt}>{opt}</option>
                             ))}
                         </select>
                    </div>
                 </div>
             </div>
             {/* Submit button should be rendered by the parent Modal */}
        </form>
    );
}