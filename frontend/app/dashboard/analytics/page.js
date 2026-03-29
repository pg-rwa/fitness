"use client";
import { useEffect, useState } from "react";
import { api } from "../../../lib/api";

function StatCard({ label, value, sub }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
      <p className="text-gray-500 text-xs">{label}</p>
      <p className="text-white text-2xl font-bold mt-1">{value}</p>
      {sub && <p className="text-gray-500 text-[10px] mt-1">{sub}</p>}
    </div>
  );
}

function BarChart({ data, labelKey, valueKey, color = "bg-brand-500" }) {
  if (!data || data.length === 0) return <p className="text-gray-500 text-sm">No data</p>;
  const max = Math.max(...data.map((d) => d[valueKey] || 0), 1);

  return (
    <div className="space-y-1.5">
      {data.map((d, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="text-gray-500 text-[10px] w-20 text-right truncate">{d[labelKey]}</span>
          <div className="flex-1 bg-gray-800 rounded-full h-5 overflow-hidden">
            <div className={`${color} h-full rounded-full transition-all flex items-center justify-end pr-2`} style={{ width: `${Math.max(2, ((d[valueKey] || 0) / max) * 100)}%` }}>
              <span className="text-white text-[10px] font-medium">{typeof d[valueKey] === "number" ? Math.round(d[valueKey]).toLocaleString() : d[valueKey]}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function AnalyticsPage() {
  const [stats, setStats] = useState(null);
  const [workoutData, setWorkoutData] = useState([]);
  const [muscleData, setMuscleData] = useState([]);
  const [nutritionData, setNutritionData] = useState([]);
  const [period, setPeriod] = useState("90");
  const [groupBy, setGroupBy] = useState("week");
  const [exporting, setExporting] = useState(null);

  const start = new Date(Date.now() - parseInt(period) * 86400000).toISOString();
  const end = new Date().toISOString();

  const load = () => {
    api("/analytics/stats").then(setStats).catch(() => {});
    api(`/analytics/workouts?start=${start}&end=${end}&groupBy=${groupBy}`).then((d) => setWorkoutData(d.data || [])).catch(() => {});
    api(`/analytics/workouts/muscle-groups?start=${start}&end=${end}`).then((d) => setMuscleData(d.data || [])).catch(() => {});
    api(`/analytics/nutrition?start=${start}&end=${end}`).then((d) => setNutritionData(d.data || [])).catch(() => {});
  };

  useEffect(() => { load(); }, [period, groupBy]);

  const exportCSV = async (type) => {
    setExporting(type);
    try {
      const token = localStorage.getItem("ft_token");
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "/api";
      const res = await fetch(`${baseUrl}/analytics/export/${type}?start=${start}&end=${end}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${type}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {} finally {
      setExporting(null);
    }
  };

  const avgCalories = nutritionData.length > 0
    ? Math.round(nutritionData.reduce((s, d) => s + (d.total_calories || 0), 0) / nutritionData.length)
    : 0;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-white">Analytics</h1>
        <div className="flex gap-2">
          <select value={period} onChange={(e) => setPeriod(e.target.value)} className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-white text-xs focus:border-brand-500 focus:outline-none">
            <option value="30">30 Days</option>
            <option value="90">90 Days</option>
            <option value="180">6 Months</option>
            <option value="365">1 Year</option>
          </select>
        </div>
      </div>

      {/* Overall Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <StatCard label="Total Workouts" value={stats.total_workouts} />
          <StatCard label="Personal Records" value={stats.total_prs} />
          <StatCard label="Meals Logged" value={stats.total_meals} />
          <StatCard label="Workout Days (30d)" value={stats.workout_days_last_30} />
        </div>
      )}

      {/* Workout Volume Chart */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 mb-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-white font-semibold text-sm">Workout Activity</h2>
          <select value={groupBy} onChange={(e) => setGroupBy(e.target.value)} className="bg-gray-800 border border-gray-700 rounded-lg px-2 py-1 text-white text-xs focus:border-brand-500 focus:outline-none">
            <option value="week">Weekly</option>
            <option value="month">Monthly</option>
          </select>
        </div>
        <BarChart data={workoutData} labelKey="period" valueKey="workout_count" />
        {workoutData.length > 0 && (
          <div className="mt-3 pt-3 border-t border-gray-800">
            <p className="text-gray-500 text-[10px] mb-1">Volume (kg)</p>
            <BarChart data={workoutData} labelKey="period" valueKey="total_volume" color="bg-purple-500" />
          </div>
        )}
      </div>

      {/* Muscle Group Breakdown */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 mb-4">
        <h2 className="text-white font-semibold text-sm mb-3">Muscle Group Breakdown</h2>
        <BarChart data={muscleData} labelKey="muscle_group" valueKey="total_volume" color="bg-green-500" />
      </div>

      {/* Nutrition Trend */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 mb-4">
        <h2 className="text-white font-semibold text-sm mb-1">Nutrition</h2>
        <p className="text-gray-500 text-xs mb-3">Avg daily calories: {avgCalories} kcal</p>
        <BarChart data={nutritionData.slice(-14)} labelKey="date" valueKey="total_calories" color="bg-orange-500" />
      </div>

      {/* CSV Export */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
        <h2 className="text-white font-semibold text-sm mb-3">Export Data</h2>
        <div className="flex gap-2 flex-wrap">
          {["workouts", "nutrition", "measurements"].map((type) => (
            <button
              key={type}
              onClick={() => exportCSV(type)}
              disabled={exporting === type}
              className="px-4 py-2 bg-gray-800 text-gray-300 rounded-lg text-xs hover:bg-gray-700 disabled:opacity-50 capitalize"
            >
              {exporting === type ? "Exporting..." : `Export ${type}`}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
