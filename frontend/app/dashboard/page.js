"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "../../components/AuthProvider";
import { api } from "../../lib/api";

function StatCard({ label, value, sub, color = "brand" }) {
  const colors = {
    brand: "bg-brand-500/10 text-brand-500",
    green: "bg-green-500/10 text-green-400",
    blue: "bg-blue-500/10 text-blue-400",
    purple: "bg-purple-500/10 text-purple-400",
  };
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
      <p className="text-gray-500 text-xs font-medium mb-1">{label}</p>
      <p className={`text-2xl font-bold ${colors[color]?.split(" ")[1] || "text-white"}`}>{value}</p>
      {sub && <p className="text-gray-600 text-xs mt-1">{sub}</p>}
    </div>
  );
}

function TrainerDashboard() {
  const [stats, setStats] = useState({});
  const [recentSessions, setRecentSessions] = useState([]);

  useEffect(() => {
    Promise.all([
      api("/workout-sessions?limit=5").catch(() => ({ data: [] })),
      api("/workout-templates?limit=1&ownOnly=true").catch(() => ({ pagination: { total: 0 } })),
      api("/scheduling/sessions?limit=5").catch(() => ({ data: [] })),
    ]).then(([sessions, templates, scheduled]) => {
      setRecentSessions(sessions.data || []);
      setStats({
        templates: templates.pagination?.total || 0,
        scheduled: (scheduled.data || []).length,
      });
    });
  }, []);

  return (
    <div>
      <h1 className="text-white text-xl font-bold mb-4">Trainer Dashboard</h1>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <StatCard label="Templates" value={stats.templates || 0} color="blue" />
        <StatCard label="Upcoming" value={stats.scheduled || 0} sub="sessions" color="green" />
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-white font-semibold text-sm">Quick Actions</h2>
          </div>
          <div className="space-y-2">
            <Link href="/dashboard/templates" className="block px-3 py-2.5 bg-gray-800 rounded-lg hover:bg-gray-700 transition text-gray-300 text-sm">
              Create Workout Template
            </Link>
            <Link href="/dashboard/clients" className="block px-3 py-2.5 bg-gray-800 rounded-lg hover:bg-gray-700 transition text-gray-300 text-sm">
              Manage Clients
            </Link>
            <Link href="/dashboard/schedule" className="block px-3 py-2.5 bg-gray-800 rounded-lg hover:bg-gray-700 transition text-gray-300 text-sm">
              View Schedule
            </Link>
          </div>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <h2 className="text-white font-semibold text-sm mb-3">Recent Sessions</h2>
          {recentSessions.length === 0 ? (
            <p className="text-gray-600 text-sm">No sessions yet</p>
          ) : (
            <div className="space-y-2">
              {recentSessions.map((s) => (
                <div key={s.id} className="flex justify-between items-center px-3 py-2 bg-gray-800 rounded-lg">
                  <span className="text-gray-300 text-sm">{s.name || "Workout"}</span>
                  <span className="text-gray-500 text-xs">{new Date(s.started_at || s.created_at).toLocaleDateString()}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ClientDashboard() {
  const { user } = useAuth();
  const [today, setToday] = useState({ sessions: [], meals: 0 });
  const [measurements, setMeasurements] = useState(null);
  const [trainerRequests, setTrainerRequests] = useState([]);

  const loadRequests = () => {
    api("/users/client-requests").then((d) => setTrainerRequests(Array.isArray(d) ? d : [])).catch(() => {});
  };

  useEffect(() => {
    const todayStr = new Date().toISOString().split("T")[0];
    Promise.all([
      api("/workout-sessions?limit=3").catch(() => ({ data: [] })),
      api(`/nutrition/meals?date=${todayStr}`).catch(() => ({ data: [] })),
      api("/progress/measurements/latest").catch(() => null),
      api("/workout-templates?limit=1&ownOnly=true").catch(() => ({ pagination: { total: 0 } })),
    ]).then(([sessions, meals, meas, templates]) => {
      setToday({
        sessions: sessions.data || [],
        meals: (meals.data || meals.meals || []).length,
        templates: templates.pagination?.total || 0,
      });
      setMeasurements(meas);
    });
    loadRequests();
  }, []);

  const respondToRequest = async (id, action) => {
    try {
      await api(`/users/trainer-requests/${id}/respond`, {
        method: "PUT",
        body: { action },
      });
      loadRequests();
    } catch {}
  };

  return (
    <div>
      <h1 className="text-white text-xl font-bold mb-4">Dashboard</h1>

      {/* My Trainer Card */}
      {user?.trainer_id && user?.trainer_name && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-brand-500/10 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div>
                <p className="text-gray-500 text-[10px] uppercase tracking-wider font-semibold">Your Trainer</p>
                <p className="text-white text-sm font-medium">{user.trainer_name}</p>
                {user.trainer_email && <p className="text-gray-500 text-xs">{user.trainer_email}</p>}
              </div>
            </div>
            <Link href="/dashboard/schedule"
              className="flex items-center gap-1.5 px-3 py-2 bg-brand-500 text-white rounded-lg text-xs font-medium hover:bg-brand-600 transition">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Book Appointment
            </Link>
          </div>
        </div>
      )}

      {/* No trainer assigned */}
      {!user?.trainer_id && trainerRequests.length === 0 && (
        <div className="bg-gray-900 border border-dashed border-gray-700 rounded-xl p-4 mb-4">
          <p className="text-gray-500 text-sm">No trainer assigned yet. Ask your trainer to send you an invitation.</p>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <StatCard label="Workouts" value={today.sessions.length} sub="recent" color="brand" />
        <StatCard label="Meals Today" value={today.meals} color="green" />
        <StatCard label="Weight" value={measurements?.weight_kg ? `${measurements.weight_kg}kg` : "--"} color="blue" />
        <Link href="/dashboard/templates" className="bg-gray-900 border border-gray-800 rounded-xl p-4 hover:border-purple-500/50 transition">
          <p className="text-gray-500 text-xs font-medium mb-1">Templates</p>
          <p className="text-2xl font-bold text-purple-400">{today.templates || 0}</p>
          <p className="text-gray-600 text-xs mt-1">my workouts</p>
        </Link>
      </div>

      {/* Trainer Request Approval */}
      {trainerRequests.length > 0 && (
        <div className="mb-4">
          <div className="space-y-2">
            {trainerRequests.map((req) => (
              <div key={req.id} className="bg-gray-900 border border-brand-500/30 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white text-sm font-medium">Trainer Request</p>
                    <p className="text-gray-400 text-xs mt-0.5">
                      <span className="text-brand-400">{req.trainer_name}</span> ({req.trainer_email}) wants to add you as a client
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => respondToRequest(req.id, "approve")}
                      className="px-3 py-1.5 bg-green-500 text-white rounded-lg text-xs font-medium hover:bg-green-600"
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => respondToRequest(req.id, "decline")}
                      className="px-3 py-1.5 bg-gray-700 text-gray-300 rounded-lg text-xs font-medium hover:bg-gray-600"
                    >
                      Decline
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <h2 className="text-white font-semibold text-sm mb-3">Quick Actions</h2>
          <div className="space-y-2">
            <Link href="/dashboard/workouts" className="block px-3 py-2.5 bg-brand-500/10 text-brand-500 rounded-lg hover:bg-brand-500/20 transition text-sm font-medium">
              Start Workout
            </Link>
            <Link href="/dashboard/nutrition" className="block px-3 py-2.5 bg-gray-800 rounded-lg hover:bg-gray-700 transition text-gray-300 text-sm">
              Log Meal
            </Link>
            <Link href="/dashboard/progress" className="block px-3 py-2.5 bg-gray-800 rounded-lg hover:bg-gray-700 transition text-gray-300 text-sm">
              Record Measurements
            </Link>
            {user?.trainer_id && (
              <Link href="/dashboard/schedule" className="block px-3 py-2.5 bg-gray-800 rounded-lg hover:bg-gray-700 transition text-gray-300 text-sm">
                Book Appointment
              </Link>
            )}
          </div>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <h2 className="text-white font-semibold text-sm mb-3">Recent Workouts</h2>
          {today.sessions.length === 0 ? (
            <p className="text-gray-600 text-sm">No recent workouts</p>
          ) : (
            <div className="space-y-2">
              {today.sessions.map((s) => (
                <Link key={s.id} href={`/dashboard/workouts?session=${s.id}`} className="flex justify-between items-center px-3 py-2 bg-gray-800 rounded-lg hover:bg-gray-700 transition">
                  <span className="text-gray-300 text-sm">{s.name || "Workout"}</span>
                  <span className="text-gray-500 text-xs">{s.ended_at ? "Completed" : "In progress"}</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const isTrainer = user?.role === "trainer" || user?.role === "admin";
  return isTrainer ? <TrainerDashboard /> : <ClientDashboard />;
}
