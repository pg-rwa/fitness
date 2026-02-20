"use client";
import { useEffect, useState } from "react";
import { api } from "../../../lib/api";

const flagDescriptions = {
  auth: "Authentication & JWT tokens",
  users: "User management & profiles",
  exercises: "Exercise library",
  workouts: "Legacy workouts (v1)",
  goals: "User goals tracking",
  "custom-fields": "Custom fields on entities",
  equipment: "Equipment library",
  "workout-templates": "Workout template builder",
  "workout-sessions": "Live workout session logging",
  "assigned-workouts": "Trainer → client workout assignments",
  scheduling: "Session scheduling & availability",
  nutrition: "Food database & meal logging",
  progress: "Body measurements & progress photos",
  calendar: "Unified calendar view",
  "health-sync": "Apple Health / Google Fit sync",
  "ai-insights": "AI-powered training insights",
  notifications: "In-app notifications",
  admin: "Admin module routes",
};

const flagCategories = {
  Core: ["auth", "users", "exercises", "workouts", "goals", "custom-fields"],
  Training: ["equipment", "workout-templates", "workout-sessions", "assigned-workouts"],
  Lifestyle: ["nutrition", "progress", "calendar", "health-sync"],
  Platform: ["ai-insights", "notifications", "scheduling", "admin"],
};

export default function FeaturesPage() {
  const [flags, setFlags] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api("/admin/features")
      .then((data) => {
        setFlags(data.flags || data || {});
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const toggle = async (key) => {
    const newValue = !flags[key];
    setFlags((prev) => ({ ...prev, [key]: newValue }));
    try {
      await api(`/admin/features/${encodeURIComponent(key)}`, {
        method: "PUT",
        body: JSON.stringify({ enabled: newValue }),
      });
    } catch {
      setFlags((prev) => ({ ...prev, [key]: !newValue }));
    }
  };

  const enabledCount = Object.values(flags).filter(Boolean).length;
  const totalCount = Object.keys(flags).length;

  if (loading) {
    return <div className="text-gray-500 text-center py-12">Loading feature flags...</div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-white text-2xl font-bold">Feature Flags</h1>
          <p className="text-gray-500 text-sm mt-1">
            {enabledCount} of {totalCount} features enabled
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-green-400/10 text-green-400">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
            {enabledCount} Active
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-gray-400/10 text-gray-400">
            <span className="w-1.5 h-1.5 rounded-full bg-gray-500" />
            {totalCount - enabledCount} Disabled
          </span>
        </div>
      </div>

      <div className="space-y-6">
        {Object.entries(flagCategories).map(([category, keys]) => (
          <div key={category}>
            <h2 className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-3">{category}</h2>
            <div className="bg-gray-800 rounded-xl border border-gray-700 divide-y divide-gray-700">
              {keys.map((key) => (
                <div key={key} className="flex items-center justify-between px-5 py-4">
                  <div>
                    <p className="text-white font-medium text-sm">{key}</p>
                    <p className="text-gray-500 text-xs mt-0.5">{flagDescriptions[key] || ""}</p>
                  </div>
                  <button
                    onClick={() => toggle(key)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      flags[key] ? "bg-primary" : "bg-gray-600"
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        flags[key] ? "translate-x-6" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4">
        <div className="flex gap-3">
          <svg className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div>
            <p className="text-yellow-500 text-sm font-medium">Caution</p>
            <p className="text-yellow-500/70 text-xs mt-1">
              Disabling core features (auth, users) may cause errors. Changes take effect on next API request. A server restart may be required for some flags.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
