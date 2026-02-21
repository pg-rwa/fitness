"use client";
import { useEffect, useState } from "react";
import { useAuth } from "../../../components/AuthProvider";
import { api } from "../../../lib/api";

const statusColors = {
  requested: "text-yellow-400 bg-yellow-400/10",
  approved: "text-green-400 bg-green-400/10",
  declined: "text-red-400 bg-red-400/10",
  completed: "text-blue-400 bg-blue-400/10",
  cancelled: "text-gray-400 bg-gray-400/10",
};

export default function SchedulePage() {
  const { user } = useAuth();
  const isTrainer = user?.role === "trainer" || user?.role === "admin";
  const [sessions, setSessions] = useState([]);
  const [availability, setAvailability] = useState([]);

  useEffect(() => {
    api("/scheduling/sessions?limit=50").then((d) => setSessions(d.data || [])).catch(() => {});
    if (isTrainer) {
      api("/scheduling/availability").then((d) => setAvailability(d.data || d.availability || [])).catch(() => {});
    }
  }, [isTrainer]);

  const updateStatus = async (id, status) => {
    try {
      await api(`/scheduling/sessions/${id}/${status}`, { method: "PUT", body: {} });
      const d = await api("/scheduling/sessions?limit=50");
      setSessions(d.data || []);
    } catch {}
  };

  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div>
      <h1 className="text-white text-xl font-bold mb-4">Schedule</h1>

      {isTrainer && availability.length > 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 mb-4">
          <h2 className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-2">Your Availability</h2>
          <div className="flex flex-wrap gap-2">
            {availability.filter((a) => a.is_active).map((a, i) => (
              <span key={i} className="text-xs bg-green-400/10 text-green-400 px-2.5 py-1 rounded-full">
                {days[a.day_of_week]} {a.start_time}-{a.end_time}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-2">
        {sessions.map((s) => (
          <div key={s.id} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-white font-medium text-sm">{s.title || "Session"}</p>
                <p className="text-gray-500 text-xs mt-0.5">
                  {s.scheduled_start ? new Date(s.scheduled_start).toLocaleString() : "TBD"}
                  {s.location && ` · ${s.location}`}
                </p>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${statusColors[s.status] || ""}`}>
                {s.status}
              </span>
            </div>

            {isTrainer && s.status === "requested" && (
              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => updateStatus(s.id, "approve")}
                  className="px-3 py-1.5 bg-green-500/10 text-green-400 rounded-lg text-xs hover:bg-green-500/20"
                >
                  Approve
                </button>
                <button
                  onClick={() => updateStatus(s.id, "decline")}
                  className="px-3 py-1.5 bg-red-500/10 text-red-400 rounded-lg text-xs hover:bg-red-500/20"
                >
                  Decline
                </button>
              </div>
            )}

            {!isTrainer && s.status === "approved" && (
              <button
                onClick={() => updateStatus(s.id, "cancel")}
                className="mt-2 px-3 py-1.5 bg-gray-800 text-gray-400 rounded-lg text-xs hover:text-red-400"
              >
                Cancel Session
              </button>
            )}
          </div>
        ))}

        {sessions.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-600 text-sm">No scheduled sessions</p>
          </div>
        )}
      </div>
    </div>
  );
}
