import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../api";

export default function RequisitionView() {
  const { id } = useParams();
  const [req, setReq] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get(`/requisitions/viewRequisitionInfo/${id}`);
        setReq(res.data.requisition);
      } catch (e) {
        console.error(e);
        alert(e.response?.data?.message || "Failed to load requisition");
      } finally {
        setLoading(false);
      }
    };
    if (id) load();
  }, [id]);

  if (loading) return <div className="p-6">Loading requisition...</div>;
  if (!req) return <div className="p-6">Requisition not found.</div>;

  return (
    <div className="max-w-4xl mx-auto p-6 bg-[#F5F5F5] rounded-xl shadow">
      <h1 className="text-2xl font-bold mb-4">Requisition Details</h1>
      <div className="space-y-3">
        <div>
          <strong>Position:</strong> <span>{req.position}</span>
        </div>
        <div>
          <strong>Department:</strong> <span>{req.department}</span>
        </div>
        <div>
          <strong>Requisition Type:</strong> <span>{req.requisitionType}</span>
        </div>
        {req.replacementDetail && (
          <div>
            <strong>Replacement For:</strong> <span>{req.replacementDetail}</span>
          </div>
        )}
        <div>
          <strong>Justification:</strong>
          <p className="mt-1 text-gray-700">{req.justification || "-"}</p>
        </div>
        <div>
          <strong>Status:</strong> <span>{req.status || "N/A"}</span>
        </div>
        <div>
          <strong>Created At:</strong> <span>{new Date(req.createdAt).toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
}
