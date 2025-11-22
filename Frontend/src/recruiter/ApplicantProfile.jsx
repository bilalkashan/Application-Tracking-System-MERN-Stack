import { useEffect, useState } from "react";
import { useRef } from "react";
import { clearIndicator } from "../utils/indicators";
import { useParams } from "react-router-dom";
import api, { fileUrl } from "../api";
import StatusBadge from "../components/StatusBadge";
import ResumeViewer from "../components/ResumeViewer";

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

export default function ApplicantProfile() {
  const { appId } = useParams();
  const [app, setApp] = useState(null);
  const [note, setNote] = useState("");
  const [chatIndicator, setChatIndicator] = useState(false);

  const load = async () => {
    try {
      const res = await api.get(`/auth/application/${appId}`);
      setApp(res.data);
    } catch (e) {
      alert(e.response?.data?.message || e.message);
    }
  };

  const updateStatus = async (code) => {
    try {
      await api.patch(`/auth/updateStatus/${appId}/status`, { code, note });
      setNote("");
      load();
    } catch (e) {
      alert(e.response?.data?.message || e.message);
    }
  };

  useEffect(() => { load(); }, [appId]);

  useEffect(() => {
    const onIndicator = (e) => {
      const { key } = e.detail || {};
      if (!key) return;
      if (key === `chat:application:${appId}`) setChatIndicator(true);
    };
    const onClear = (e) => {
      const { key } = e.detail || {};
      if (!key) return;
      if (key === `chat:application:${appId}`) setChatIndicator(false);
    };
    window.addEventListener('app:indicator', onIndicator);
    window.addEventListener('app:indicator:clear', onClear);
    return () => {
      window.removeEventListener('app:indicator', onIndicator);
      window.removeEventListener('app:indicator:clear', onClear);
    };
  }, [appId]);

  if (!app) return <p className="p-6">Loading...</p>;

  const resumeHref = app.resumePath ? fileUrl(app.resumePath) : null;

  return (
    <div className="max-w-4xl mx-auto p-6 bg-[#F5F5F5] rounded-xl shadow">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <span className="flex items-center gap-3">
              {app.applicant?.name}
              {chatIndicator && (
                <span className="w-3 h-3 bg-red-600 rounded-full inline-block" />
              )}
            </span>
            <span className="ml-2"><StatusBadge status={app.currentStatus} /></span>
          </h1>
          <p className="text-gray-600">
            {app.applicant?.email} {app.applicant?.phone ? `• ${app.applicant.phone}` : ""}
          </p>
          {app.applicant?.summary && <p className="mt-2 text-gray-800">{app.applicant.summary}</p>}
          {Array.isArray(app.applicant?.skills) && app.applicant.skills.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {app.applicant.skills.map((s, i) => (
                <span key={i} className="px-2 py-1 rounded bg-gray-100 text-xs">{s}</span>
              ))}
            </div>
          )}
        </div>

        {resumeHref && (
          <a
            href={resumeHref}
            target="_blank"
            rel="noreferrer"
            className="px-3 py-1 bg-gray-100 rounded hover:bg-gray-200 transition h-fit"
          >
            Open Resume (new tab)
          </a>
        )}
      </div>

      {/* Inline viewer (optional) */}
      {resumeHref && <div className="mt-4"><ResumeViewer path={app.resumePath} /></div>}

      {/* Status Actions */}
      <div className="mt-6 flex flex-wrap gap-2">
        <input
          className="input flex-1"
          placeholder="Add note (optional)"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
        {ACTIONS.map((a) => (
          <button
            key={a.code}
            className="btn-outline"
            onClick={() => updateStatus(a.code)}
          >
            {a.label}
          </button>
        ))}
      </div>

      {/* History */}
      <div className="mt-6">
        <h2 className="font-semibold">History</h2>
        <ul className="space-y-1 text-sm">
          {app.history?.length ? app.history.map((h, i) => (
            <li key={i}>
              <span className="font-medium">{h.code}</span>
              {h.note ? ` — ${h.note}` : ""} • {new Date(h.at).toLocaleString()}
            </li>
          )) : <li className="text-gray-500">No history yet.</li>}
        </ul>
      </div>
    </div>
  );
}
