"use client";
import { useEffect, useState, useRef } from "react";
import { useAuth } from "../../../components/AuthProvider";
import { api, getToken } from "../../../lib/api";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "/api";

const inputCls =
  "w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:border-brand-500 focus:outline-none";
const disabledCls =
  "w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-gray-500 text-sm";
const labelCls = "block text-gray-400 text-xs mb-1";

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const fileRef = useRef(null);

  const [form, setForm] = useState({
    firstName: "", lastName: "",
    phone: "", bio: "", address: "", timezone: "",
    heightCm: "", weightKg: "", dateOfBirth: "", gender: "", fitnessLevel: "",
  });
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    api("/users/me")
      .then((d) => {
        const u = d.user || d;
        const p = u.profile || {};
        setForm({
          firstName: u.first_name || "",
          lastName: u.last_name || "",
          phone: p.phone || "",
          bio: p.bio || "",
          address: p.address || "",
          timezone: p.timezone || "",
          heightCm: p.height_cm || "",
          weightKg: p.weight_kg || "",
          dateOfBirth: p.date_of_birth || "",
          gender: p.gender || "",
          fitnessLevel: p.fitness_level || "",
        });
        setAvatarUrl(p.avatar_url || null);
      })
      .catch(() => {});
  }, []);

  const update = (k) => (e) => {
    setForm((f) => ({ ...f, [k]: e.target.value }));
    setSaved(false);
    setError("");
  };

  const save = async () => {
    setSaving(true);
    setError("");
    try {
      await api("/users/me/profile", { method: "PUT", body: form });
      await refreshUser();
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setError(err.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_FILE_SIZE) {
      setError(`File too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Max is 10MB.`);
      if (fileRef.current) fileRef.current.value = "";
      return;
    }

    setUploading(true);
    setError("");
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000); // 30s timeout
    try {
      const fd = new FormData();
      fd.append("avatar", file);
      const token = getToken();
      const res = await fetch(`${API_BASE}/users/me/avatar`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
        signal: controller.signal,
      });
      clearTimeout(timeout);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      setAvatarUrl(data.avatar_url);
      await refreshUser();
    } catch (err) {
      if (err.name === "AbortError") {
        setError("Upload timed out. Please try a smaller image.");
      } else {
        setError(err.message || "Upload failed");
      }
    } finally {
      clearTimeout(timeout);
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const removeAvatar = async () => {
    setError("");
    try {
      await api("/users/me/avatar", { method: "DELETE" });
      setAvatarUrl(null);
      await refreshUser();
    } catch (err) {
      setError(err.message || "Failed to remove avatar");
    }
  };

  const initials =
    ((form.firstName?.[0] || "") + (form.lastName?.[0] || "")).toUpperCase() || "?";

  return (
    <div>
      <h1 className="text-white text-xl font-bold mb-4">Profile</h1>

      <div className="max-w-lg space-y-4">
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2 text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* ── Avatar ────────────────────────────── */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <h2 className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-3">
            Profile Photo
          </h2>
          <div className="flex items-center gap-4">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt="Avatar"
                className="w-20 h-20 rounded-full object-cover border-2 border-gray-700"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-brand-500/20 border-2 border-gray-700 flex items-center justify-center text-brand-400 text-2xl font-bold">
                {initials}
              </div>
            )}
            <div className="flex flex-col gap-2">
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handleAvatarUpload}
              />
              <button
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="px-4 py-1.5 bg-brand-500 text-white text-xs font-medium rounded-lg hover:bg-brand-600 disabled:opacity-50 transition-colors flex items-center gap-2"
              >
                {uploading && (
                  <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                )}
                {uploading ? "Uploading..." : "Upload Photo"}
              </button>
              <p className="text-gray-600 text-xs">Max 10MB</p>
              {avatarUrl && (
                <button
                  onClick={removeAvatar}
                  className="px-4 py-1.5 bg-gray-800 text-gray-400 text-xs font-medium rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Remove
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ── Account ───────────────────────────── */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <h2 className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-3">
            Account
          </h2>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>First Name</label>
                <input value={form.firstName} onChange={update("firstName")} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Last Name</label>
                <input value={form.lastName} onChange={update("lastName")} className={inputCls} />
              </div>
            </div>
            <div>
              <label className={labelCls}>Email</label>
              <input value={user?.email || ""} disabled className={disabledCls} />
            </div>
            <div>
              <label className={labelCls}>Role</label>
              <input
                value={user?.role || ""}
                disabled
                className={`${disabledCls} capitalize`}
              />
            </div>
          </div>
        </div>

        {/* ── Contact ───────────────────────────── */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <h2 className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-3">
            Contact
          </h2>
          <div className="space-y-3">
            <div>
              <label className={labelCls}>Phone Number</label>
              <input
                type="tel"
                value={form.phone}
                onChange={update("phone")}
                placeholder="+1 (555) 000-0000"
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Address</label>
              <input
                value={form.address}
                onChange={update("address")}
                placeholder="Street, City, State, ZIP"
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Timezone</label>
              <select value={form.timezone} onChange={update("timezone")} className={inputCls}>
                <option value="">--</option>
                <option value="UTC">UTC</option>
                <option value="America/New_York">Eastern (ET)</option>
                <option value="America/Chicago">Central (CT)</option>
                <option value="America/Denver">Mountain (MT)</option>
                <option value="America/Los_Angeles">Pacific (PT)</option>
                <option value="Europe/London">London (GMT)</option>
                <option value="Europe/Berlin">Berlin (CET)</option>
                <option value="Asia/Tokyo">Tokyo (JST)</option>
                <option value="Asia/Kolkata">India (IST)</option>
                <option value="Australia/Sydney">Sydney (AEST)</option>
              </select>
            </div>
          </div>
        </div>

        {/* ── Bio ───────────────────────────────── */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <h2 className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-3">
            About
          </h2>
          <div>
            <label className={labelCls}>Bio</label>
            <textarea
              value={form.bio}
              onChange={update("bio")}
              rows={3}
              maxLength={500}
              placeholder="Tell us a little about yourself..."
              className={`${inputCls} resize-none`}
            />
            <p className="text-gray-600 text-xs mt-1 text-right">
              {form.bio.length}/500
            </p>
          </div>
        </div>

        {/* ── Physical ──────────────────────────── */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <h2 className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-3">
            Physical
          </h2>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Height (cm)</label>
              <input
                type="number"
                value={form.heightCm}
                onChange={update("heightCm")}
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Weight (kg)</label>
              <input
                type="number"
                value={form.weightKg}
                onChange={update("weightKg")}
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Date of Birth</label>
              <input
                type="date"
                value={form.dateOfBirth}
                onChange={update("dateOfBirth")}
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Gender</label>
              <select value={form.gender} onChange={update("gender")} className={inputCls}>
                <option value="">--</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="col-span-2">
              <label className={labelCls}>Fitness Level</label>
              <select
                value={form.fitnessLevel}
                onChange={update("fitnessLevel")}
                className={inputCls}
              >
                <option value="">--</option>
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>
          </div>
        </div>

        {/* ── Save ──────────────────────────────── */}
        <button
          onClick={save}
          disabled={saving}
          className={`w-full py-2.5 rounded-lg text-sm font-medium transition-colors ${
            saved
              ? "bg-green-500 text-white"
              : "bg-brand-500 text-white hover:bg-brand-600 disabled:opacity-50"
          }`}
        >
          {saving ? "Saving..." : saved ? "Saved!" : "Save Profile"}
        </button>
      </div>
    </div>
  );
}
