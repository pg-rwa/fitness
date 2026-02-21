"use client";
import { useEffect, useState } from "react";
import { api } from "../../../lib/api";

function MeasurementForm({ onSave, onClose }) {
  const [form, setForm] = useState({
    weightKg: "", bodyFatPct: "", chestCm: "", waistCm: "", hipsCm: "",
    bicepLeftCm: "", bicepRightCm: "", thighLeftCm: "", thighRightCm: "", neckCm: "", notes: "",
  });

  const update = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const save = async () => {
    const body = {};
    Object.entries(form).forEach(([k, v]) => {
      if (v !== "" && v != null) body[k] = k === "notes" ? v : parseFloat(v);
    });
    try {
      await api("/progress/measurements", { method: "POST", body });
      onSave();
    } catch {}
  };

  const fields = [
    ["weightKg", "Weight (kg)"], ["bodyFatPct", "Body Fat %"], ["chestCm", "Chest (cm)"],
    ["waistCm", "Waist (cm)"], ["hipsCm", "Hips (cm)"], ["neckCm", "Neck (cm)"],
    ["bicepLeftCm", "L Bicep (cm)"], ["bicepRightCm", "R Bicep (cm)"],
    ["thighLeftCm", "L Thigh (cm)"], ["thighRightCm", "R Thigh (cm)"],
  ];

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-gray-900 border border-gray-700 rounded-xl w-full max-w-md p-5 max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-white font-bold mb-4">Record Measurements</h2>
        <div className="grid grid-cols-2 gap-3">
          {fields.map(([k, label]) => (
            <div key={k}>
              <label className="block text-gray-400 text-xs mb-1">{label}</label>
              <input
                type="number"
                step="0.1"
                value={form[k]}
                onChange={update(k)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:border-brand-500 focus:outline-none"
              />
            </div>
          ))}
        </div>
        <div className="mt-3">
          <label className="block text-gray-400 text-xs mb-1">Notes</label>
          <textarea
            value={form.notes}
            onChange={update("notes")}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm resize-none focus:border-brand-500 focus:outline-none"
            rows={2}
          />
        </div>
        <div className="flex gap-2 mt-4">
          <button onClick={onClose} className="flex-1 px-4 py-2 bg-gray-800 text-gray-400 rounded-lg text-sm">Cancel</button>
          <button onClick={save} className="flex-1 px-4 py-2 bg-brand-500 text-white rounded-lg text-sm font-medium hover:bg-brand-600">Save</button>
        </div>
      </div>
    </div>
  );
}

export default function ProgressPage() {
  const [measurements, setMeasurements] = useState([]);
  const [latest, setLatest] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [tab, setTab] = useState("measurements");

  const load = () => {
    api("/progress/measurements?limit=20").then((d) => setMeasurements(d.data || [])).catch(() => {});
    api("/progress/measurements/latest").then((d) => setLatest(d)).catch(() => setLatest(null));
  };

  useEffect(() => { load(); }, []);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-white text-xl font-bold">Progress</h1>
        <button
          onClick={() => setShowForm(true)}
          className="px-4 py-2 bg-brand-500 text-white rounded-lg text-sm font-medium hover:bg-brand-600"
        >
          Record
        </button>
      </div>

      {showForm && <MeasurementForm onSave={() => { setShowForm(false); load(); }} onClose={() => setShowForm(false)} />}

      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setTab("measurements")}
          className={`px-3 py-1.5 rounded-lg text-sm ${tab === "measurements" ? "bg-brand-500 text-white" : "bg-gray-800 text-gray-400"}`}
        >
          Measurements
        </button>
        <button
          onClick={() => setTab("photos")}
          className={`px-3 py-1.5 rounded-lg text-sm ${tab === "photos" ? "bg-brand-500 text-white" : "bg-gray-800 text-gray-400"}`}
        >
          Photos
        </button>
      </div>

      {tab === "measurements" && (
        <>
          {latest && (
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 mb-4">
              <h3 className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-3">Latest</h3>
              <div className="grid grid-cols-3 gap-3">
                {latest.weight_kg && (
                  <div>
                    <p className="text-gray-500 text-xs">Weight</p>
                    <p className="text-white font-bold">{latest.weight_kg}kg</p>
                  </div>
                )}
                {latest.body_fat_pct && (
                  <div>
                    <p className="text-gray-500 text-xs">Body Fat</p>
                    <p className="text-white font-bold">{latest.body_fat_pct}%</p>
                  </div>
                )}
                {latest.chest_cm && (
                  <div>
                    <p className="text-gray-500 text-xs">Chest</p>
                    <p className="text-white font-bold">{latest.chest_cm}cm</p>
                  </div>
                )}
                {latest.waist_cm && (
                  <div>
                    <p className="text-gray-500 text-xs">Waist</p>
                    <p className="text-white font-bold">{latest.waist_cm}cm</p>
                  </div>
                )}
                {latest.hips_cm && (
                  <div>
                    <p className="text-gray-500 text-xs">Hips</p>
                    <p className="text-white font-bold">{latest.hips_cm}cm</p>
                  </div>
                )}
                {latest.bicep_left_cm && (
                  <div>
                    <p className="text-gray-500 text-xs">Biceps</p>
                    <p className="text-white font-bold">{latest.bicep_left_cm}/{latest.bicep_right_cm}cm</p>
                  </div>
                )}
              </div>
              <p className="text-gray-600 text-xs mt-2">
                Recorded {new Date(latest.recorded_at || latest.created_at).toLocaleDateString()}
              </p>
            </div>
          )}

          <div className="space-y-2">
            {measurements.map((m) => (
              <div key={m.id} className="bg-gray-900 border border-gray-800 rounded-xl p-3">
                <div className="flex justify-between items-center">
                  <div className="flex gap-4 text-sm">
                    {m.weight_kg && <span className="text-white">{m.weight_kg}kg</span>}
                    {m.body_fat_pct && <span className="text-gray-400">{m.body_fat_pct}% BF</span>}
                    {m.waist_cm && <span className="text-gray-400">{m.waist_cm}cm waist</span>}
                  </div>
                  <span className="text-gray-600 text-xs">{new Date(m.recorded_at || m.created_at).toLocaleDateString()}</span>
                </div>
                {m.notes && <p className="text-gray-500 text-xs mt-1">{m.notes}</p>}
              </div>
            ))}
          </div>

          {measurements.length === 0 && !latest && (
            <div className="text-center py-12">
              <p className="text-gray-600 text-sm">No measurements recorded yet</p>
            </div>
          )}
        </>
      )}

      {tab === "photos" && (
        <div className="text-center py-12">
          <p className="text-gray-600 text-sm">Photo upload available in the mobile app</p>
        </div>
      )}
    </div>
  );
}
