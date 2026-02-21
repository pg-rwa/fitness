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
      api("/workout-templates?limit=1").catch(() => ({ pagination: { total: 0 } })),
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
  const [today, setToday] = useState({ sessions: [], meals: 0 });
  const [measurements, setMeasurements] = useState(null);

  useEffect(() => {
    const todayStr = new Date().toISOString().split("T")[0];
    Promise.all([
      api("/workout-sessions?limit=3").catch(() => ({ data: [] })),
      api(`/nutrition/meals?date=${todayStr}`).catch(() => ({ data: [] })),
      api("/progress/measurements/latest").catch(() => null),
    ]).then(([sessions, meals, meas]) => {
      setToday({
        sessions: sessions.data || [],
        meals: (meals.data || meals.meals || []).length,
      });
      setMeasurements(meas);
    });
  }, []);

  return (
    <div>
      <h1 className="text-white text-xl font-bold mb-4">Dashboard</h1>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <StatCard label="Workouts" value={today.sessions.length} sub="recent" color="brand" />
        <StatCard label="Meals Today" value={today.meals} color="green" />
        <StatCard label="Weight" value={measurements?.weight_kg ? `${measurements.weight_kg}kg` : "--"} color="blue" />
      </div>

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
