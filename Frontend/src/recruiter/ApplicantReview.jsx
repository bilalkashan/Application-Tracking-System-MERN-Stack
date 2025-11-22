import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../api";
import ResumeViewer from "../components/ResumeViewer";
import StatusBadge from "../components/StatusBadge";

const ACTIONS = [
  { code: "shortlisted", label: "Shortlist" },
  { code: "first-interview", label: "Mark 1st Interview" },
  { code: "rejected", label: "Reject" },
  { code: "second-interview", label: "Move to 2nd Interview" },
  { code: "offer", label: "Send Offer" },
  { code: "offer-accepted", label: "Offer Accepted" },
  { code: "medical", label: "Medical Done" },
  { code: "onboarding", label: "Onboarding" },
  { code: "hired", label: "Hire" },
];

export default function ApplicantReview() {
  const { jobId } = useParams();
  const [apps, setApps] = useState([]);
  const [note, setNote] = useState("");

  const load = async () => {
    try {
      const res = await api.get(`/auth/jobApplications/job/${jobId}`);
      setApps(res.data || []);
    } catch (e) {
      alert(e.response?.data?.message || e.message);
    }
  };

  useEffect(() => { load(); }, [jobId]);
  
  const act = async (appId, code) => {
    try {
      await api.patch(`/auth/updateStatus/${appId}/status`, { code, note });
      setNote("");
      load();
    } catch (e) {
      alert(e.response?.data?.message || e.message);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Applications</h1>
      <div className="grid gap-6">
        {apps.map((a) => (
          <div key={a._id} className="bg-white rounded-2xl shadow p-4">
            <div className="flex items-start justify-between gap-6">
              <div className="flex-1">
                <h3 className="text-lg font-semibold">{a.applicant?.name} <span className="ml-2"><StatusBadge status={a.currentStatus} /></span></h3>
                <p className="text-sm text-gray-600">{a.applicant?.email} {a.applicant?.phone ? `• ${a.applicant.phone}` : ""}</p>
                {a.applicant?.summary && <p className="mt-2 text-gray-700 text-sm">{a.applicant.summary}</p>}
                {a.applicant?.skills?.length ? (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {a.applicant.skills.map((s, i) => (
                      <span key={i} className="px-2 py-1 rounded bg-gray-100 text-xs">{s}</span>
                    ))}
                  </div>
                ) : null}
              </div>
              <div className="w-96">
                <ResumeViewer path={a.resumePath} />
              </div>
            </div>
            <div className="mt-3 flex items-center gap-2">
              <input className="input flex-1" placeholder="Add note / comments (optional)" value={note} onChange={(e) => setNote(e.target.value)} />
              {ACTIONS.map((actn) => (
                <button key={actn.code} className="btn-outline" onClick={() => act(a._id, actn.code)}>{actn.label}</button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
