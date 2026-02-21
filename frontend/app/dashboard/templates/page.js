"use client";
import { useEffect, useState } from "react";
import { api } from "../../../lib/api";

function TemplateForm({ template, onSave, onClose }) {
  const [form, setForm] = useState({
    name: template?.name || "",
    description: template?.description || "",
    category: template?.category || "strength",
    difficulty: template?.difficulty || "intermediate",
    estimatedDurationMin: template?.estimated_duration_min || 45,
  });

  const save = async () => {
    try {
      if (template?.id) {
        await api(`/workout-templates/${template.id}`, { method: "PUT", body: form });
      } else {
        await api("/workout-templates", { method: "POST", body: form });
      }
      onSave();
    } catch {}
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-gray-900 border border-gray-700 rounded-xl w-full max-w-md p-5" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-white font-bold mb-4">{template ? "Edit" : "New"} Template</h2>
        <div className="space-y-3">
          <input
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="Template name"
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:border-brand-500 focus:outline-none"
          />
          <textarea
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            placeholder="Description"
            rows={2}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:border-brand-500 focus:outline-none resize-none"
          />
          <div className="grid grid-cols-2 gap-3">
            <select
              value={form.category}
              onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
              className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm"
            >
              <option value="strength">Strength</option>
              <option value="hypertrophy">Hypertrophy</option>
              <option value="cardio">Cardio</option>
              <option value="flexibility">Flexibility</option>
              <option value="hiit">HIIT</option>
              <option value="other">Other</option>
            </select>
            <select
              value={form.difficulty}
              onChange={(e) => setForm((f) => ({ ...f, difficulty: e.target.value }))}
              className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm"
            >
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </div>
          <input
            type="number"
            value={form.estimatedDurationMin}
            onChange={(e) => setForm((f) => ({ ...f, estimatedDurationMin: parseInt(e.target.value) }))}
            placeholder="Duration (min)"
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:border-brand-500 focus:outline-none"
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

export default function TemplatesPage() {
  const [templates, setTemplates] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);

  const load = () => {
    api("/workout-templates?limit=100").then((d) => setTemplates(d.data || [])).catch(() => {});
  };

  useEffect(() => { load(); }, []);

  const deleteTemplate = async (id) => {
    if (!confirm("Delete this template?")) return;
    try {
      await api(`/workout-templates/${id}`, { method: "DELETE" });
      load();
    } catch {}
  };

  const duplicate = async (id) => {
    try {
      await api(`/workout-templates/${id}/duplicate`, { method: "POST" });
      load();
    } catch {}
  };

  const diffColors = {
    beginner: "text-green-400 bg-green-400/10",
    intermediate: "text-yellow-400 bg-yellow-400/10",
    advanced: "text-red-400 bg-red-400/10",
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-white text-xl font-bold">Workout Templates</h1>
        <button
          onClick={() => { setEditing(null); setShowForm(true); }}
          className="px-4 py-2 bg-brand-500 text-white rounded-lg text-sm font-medium hover:bg-brand-600"
        >
          New Template
        </button>
      </div>

      {showForm && (
        <TemplateForm
          template={editing}
          onSave={() => { setShowForm(false); load(); }}
          onClose={() => setShowForm(false)}
        />
      )}

      <div className="grid md:grid-cols-2 gap-3">
        {templates.map((t) => (
          <div key={t.id} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <div className="flex justify-between items-start mb-2">
              <div>
                <h3 className="text-white font-semibold text-sm">{t.name}</h3>
                {t.description && <p className="text-gray-500 text-xs mt-0.5">{t.description}</p>}
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${diffColors[t.difficulty] || ""}`}>
                {t.difficulty}
              </span>
            </div>
            <div className="flex items-center gap-3 text-xs text-gray-500 mb-3">
              <span className="capitalize">{t.category}</span>
              {t.estimated_duration_min && <span>{t.estimated_duration_min}min</span>}
              {t.exercises_count != null && <span>{t.exercises_count} exercises</span>}
            </div>
            <div className="flex gap-2">
              <button onClick={() => { setEditing(t); setShowForm(true); }} className="text-xs text-gray-400 hover:text-white">Edit</button>
              <button onClick={() => duplicate(t.id)} className="text-xs text-gray-400 hover:text-blue-400">Duplicate</button>
              <button onClick={() => deleteTemplate(t.id)} className="text-xs text-gray-400 hover:text-red-400">Delete</button>
            </div>
          </div>
        ))}
      </div>

      {templates.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-600 text-sm">No templates yet. Create your first one!</p>
        </div>
      )}
    </div>
  );
}
