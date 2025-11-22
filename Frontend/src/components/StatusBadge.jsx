const COLORS = {
  applied: "bg-gray-100 text-gray-700",
  shortlisted: "bg-blue-100 text-blue-700",
  "first-interview": "bg-indigo-100 text-indigo-700",
  rejected: "bg-red-100 text-red-700",
  "second-interview": "bg-purple-100 text-purple-700",
  offer: "bg-amber-100 text-amber-700",
  "offer-accepted": "bg-green-100 text-green-700",
  medical: "bg-sky-100 text-sky-700",
  onboarding: "bg-teal-100 text-teal-700",
  hired: "bg-emerald-100 text-emerald-700",
};

export default function StatusBadge({ status }) {
  let display = "";

  if (!status) {
    display = "pending";
  } else if (typeof status === "string") {
    display = status;
  } else if (typeof status === "object" && status.status) {
    display = status.status; 
  } else {
    display = String(status); 
  }

  const cls = COLORS[display] || "bg-gray-100 text-gray-700";

  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${cls}`}>
      {display}
    </span>
  );
}
