"use client";
import { useEffect, useState } from "react";
import { useAuth } from "../../../components/AuthProvider";
import { api } from "../../../lib/api";

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const [form, setForm] = useState({
    firstName: "", lastName: "", heightCm: "", weightKg: "",
    dateOfBirth: "", gender: "", fitnessLevel: "", timezone: "",
  });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    api("/users/me").then((d) => {
      const u = d.user || d;
      const p = u.profile || {};
      setForm({
        firstName: u.first_name || "",
        lastName: u.last_name || "",
        heightCm: p.height_cm || "",
        weightKg: p.weight_kg || "",
        dateOfBirth: p.date_of_birth || "",
        gender: p.gender || "",
        fitnessLevel: p.fitness_level || "",
        timezone: p.timezone || "",
      });
    }).catch(() => {});
  }, []);

  const update = (k) => (e) => { setForm((f) => ({ ...f, [k]: e.target.value })); setSaved(false); };

  const save = async () => {
    try {
      await api("/users/me/profile", { method: "PUT", body: form });
      await refreshUser();
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {}
  };

  return (
    <div>
      <h1 className="text-white text-xl font-bold mb-4">Profile</h1>

      <div className="max-w-lg space-y-4">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <h2 className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-3">Account</h2>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-gray-400 text-xs mb-1">First Name</label>
                <input value={form.firstName} onChange={update("firstName")} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:border-brand-500 focus:outline-none" />
              </div>
              <div>
                <label className="block text-gray-400 text-xs mb-1">Last Name</label>
                <input value={form.lastName} onChange={update("lastName")} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:border-brand-500 focus:outline-none" />
              </div>
            </div>
            <div>
              <label className="block text-gray-400 text-xs mb-1">Email</label>
              <input value={user?.email || ""} disabled className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-gray-500 text-sm" />
            </div>
            <div>
              <label className="block text-gray-400 text-xs mb-1">Role</label>
              <input value={user?.role || ""} disabled className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-gray-500 text-sm capitalize" />
            </div>
          </div>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <h2 className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-3">Physical</h2>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-gray-400 text-xs mb-1">Height (cm)</label>
              <input type="number" value={form.heightCm} onChange={update("heightCm")} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:border-brand-500 focus:outline-none" />
            </div>
            <div>
              <label className="block text-gray-400 text-xs mb-1">Weight (kg)</label>
              <input type="number" value={form.weightKg} onChange={update("weightKg")} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:border-brand-500 focus:outline-none" />
            </div>
            <div>
              <label className="block text-gray-400 text-xs mb-1">Date of Birth</label>
              <input type="date" value={form.dateOfBirth} onChange={update("dateOfBirth")} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:border-brand-500 focus:outline-none" />
            </div>
            <div>
              <label className="block text-gray-400 text-xs mb-1">Gender</label>
              <select value={form.gender} onChange={update("gender")} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm">
                <option value="">--</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-gray-400 text-xs mb-1">Fitness Level</label>
              <select value={form.fitnessLevel} onChange={update("fitnessLevel")} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm">
                <option value="">--</option>
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>
          </div>
        </div>

        <button
          onClick={save}
          className={`w-full py-2.5 rounded-lg text-sm font-medium transition-colors ${saved ? "bg-green-500 text-white" : "bg-brand-500 text-white hover:bg-brand-600"}`}
        >
          {saved ? "Saved!" : "Save Profile"}
        </button>
      </div>
    </div>
  );
}
