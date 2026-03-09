"use client";
import { useEffect, useState, useRef } from "react";
import { api, getToken } from "../../../lib/api";

const CATEGORIES = ["front", "side", "back", "flexed", "custom"];
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "/api";

function PhotoUploadForm({ onSave, onClose }) {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [category, setCategory] = useState("front");
  const [notes, setNotes] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const inputRef = useRef();

  const handleFile = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setError(null);
    const reader = new FileReader();
    reader.onload = (ev) => setPreview(ev.target.result);
    reader.readAsDataURL(f);
  };

  const upload = async () => {
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("photo", file);
      formData.append("category", category);
      if (notes) formData.append("notes", notes);

      const token = getToken();
      const res = await fetch(`${API_BASE}/progress/photos/upload`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Upload failed (${res.status})`);
      }
      onSave();
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-gray-900 border border-gray-700 rounded-xl w-full max-w-md p-5" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-white font-bold mb-4">Upload Photo</h2>

        {!preview ? (
          <button
            onClick={() => inputRef.current?.click()}
            className="w-full h-48 border-2 border-dashed border-gray-700 rounded-xl flex flex-col items-center justify-center text-gray-500 hover:border-brand-500 hover:text-brand-400 transition-colors"
          >
            <svg className="w-10 h-10 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" /></svg>
            <span className="text-sm">Tap to select photo</span>
          </button>
        ) : (
          <div className="relative mb-3">
            <img src={preview} alt="Preview" className="w-full max-h-64 object-contain rounded-lg bg-black" />
            <button
              onClick={() => { setFile(null); setPreview(null); }}
              className="absolute top-2 right-2 bg-black/70 text-white rounded-full w-7 h-7 flex items-center justify-center text-sm"
            >X</button>
          </div>
        )}
        <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleFile} className="hidden" />

        <div className="mt-3">
          <label className="block text-gray-400 text-xs mb-1">Category</label>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((c) => (
              <button
                key={c}
                onClick={() => setCategory(c)}
                className={`px-3 py-1 rounded-full text-xs capitalize ${category === c ? "bg-brand-500 text-white" : "bg-gray-800 text-gray-400"}`}
              >{c}</button>
            ))}
          </div>
        </div>

        <div className="mt-3">
          <label className="block text-gray-400 text-xs mb-1">Notes (optional)</label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. Week 4 check-in"
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:border-brand-500 focus:outline-none"
          />
        </div>

        {error && <p className="text-red-400 text-xs mt-2">{error}</p>}

        <div className="flex gap-2 mt-4">
          <button onClick={onClose} className="flex-1 px-4 py-2 bg-gray-800 text-gray-400 rounded-lg text-sm">Cancel</button>
          <button
            onClick={upload}
            disabled={!file || uploading}
            className="flex-1 px-4 py-2 bg-brand-500 text-white rounded-lg text-sm font-medium hover:bg-brand-600 disabled:opacity-50"
          >{uploading ? "Uploading..." : "Upload"}</button>
        </div>
      </div>
    </div>
  );
}

function PhotoLightbox({ photo, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="relative max-w-3xl w-full" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute -top-10 right-0 text-white/70 hover:text-white text-sm">Close</button>
        <img src={photo.photo_url} alt={photo.category} className="w-full max-h-[80vh] object-contain rounded-lg" />
        <div className="mt-3 flex justify-between items-center">
          <div>
            <span className="text-brand-400 text-xs uppercase font-semibold">{photo.category}</span>
            {photo.notes && <p className="text-gray-400 text-sm mt-1">{photo.notes}</p>}
          </div>
          <span className="text-gray-600 text-xs">{new Date(photo.taken_at || photo.created_at).toLocaleDateString()}</span>
        </div>
      </div>
    </div>
  );
}

function PhotosTab() {
  const [photos, setPhotos] = useState([]);
  const [filter, setFilter] = useState("all");
  const [showUpload, setShowUpload] = useState(false);
  const [selected, setSelected] = useState(null);
  const [deleting, setDeleting] = useState(null);

  const loadPhotos = () => {
    const qs = filter !== "all" ? `?category=${filter}` : "";
    api(`/progress/photos${qs}`).then((d) => setPhotos(d.data || d || [])).catch(() => {});
  };

  useEffect(() => { loadPhotos(); }, [filter]);

  const deletePhoto = async (id) => {
    if (!confirm("Delete this photo?")) return;
    setDeleting(id);
    try {
      await api(`/progress/photos/${id}`, { method: "DELETE" });
      setPhotos((p) => p.filter((ph) => ph.id !== id));
      if (selected?.id === id) setSelected(null);
    } catch {}
    setDeleting(null);
  };

  return (
    <>
      <div className="flex items-center justify-between mb-3">
        <div className="flex gap-1.5 overflow-x-auto">
          {["all", ...CATEGORIES].map((c) => (
            <button
              key={c}
              onClick={() => setFilter(c)}
              className={`px-2.5 py-1 rounded-full text-xs capitalize whitespace-nowrap ${filter === c ? "bg-brand-500/20 text-brand-400 border border-brand-500/40" : "bg-gray-800 text-gray-500"}`}
            >{c}</button>
          ))}
        </div>
        <button
          onClick={() => setShowUpload(true)}
          className="ml-2 px-3 py-1.5 bg-brand-500 text-white rounded-lg text-xs font-medium hover:bg-brand-600 whitespace-nowrap"
        >+ Photo</button>
      </div>

      {photos.length > 0 ? (
        <div className="grid grid-cols-3 gap-2">
          {photos.map((p) => (
            <div key={p.id} className="relative group">
              <div
                className="aspect-square bg-gray-800 rounded-lg overflow-hidden cursor-pointer"
                onClick={() => setSelected(p)}
              >
                <img
                  src={p.thumbnail_url || p.photo_url}
                  alt={p.category}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-1.5 rounded-b-lg">
                <span className="text-white/80 text-[10px] capitalize">{p.category}</span>
                <span className="text-white/50 text-[10px] ml-1">{new Date(p.taken_at || p.created_at).toLocaleDateString()}</span>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); deletePhoto(p.id); }}
                className="absolute top-1.5 right-1.5 bg-black/60 text-white/70 hover:text-red-400 rounded-full w-6 h-6 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                disabled={deleting === p.id}
              >X</button>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-600 text-sm mb-3">No photos yet</p>
          <button
            onClick={() => setShowUpload(true)}
            className="px-4 py-2 bg-brand-500 text-white rounded-lg text-sm font-medium hover:bg-brand-600"
          >Upload your first photo</button>
        </div>
      )}

      {showUpload && <PhotoUploadForm onSave={() => { setShowUpload(false); loadPhotos(); }} onClose={() => setShowUpload(false)} />}
      {selected && <PhotoLightbox photo={selected} onClose={() => setSelected(null)} />}
    </>
  );
}

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
        {tab === "measurements" && (
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2 bg-brand-500 text-white rounded-lg text-sm font-medium hover:bg-brand-600"
          >
            Record
          </button>
        )}
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

      {tab === "photos" && <PhotosTab />}
    </div>
  );
}
