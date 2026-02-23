"use client";
import { useEffect, useState, useCallback } from "react";
import { api } from "../../../lib/api";

function ExerciseSearchModal({ onSelect, onClose }) {
  const [exerciseList, setExerciseList] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    api("/exercises?limit=200")
      .then((d) => setExerciseList(Array.isArray(d) ? d : d.data || []))
      .catch((e) => setError(e.message || "Failed to load exercises"))
      .finally(() => setLoading(false));
  }, []);

  const filtered = search
    ? exerciseList.filter(
        (ex) =>
          ex.name.toLowerCase().includes(search.toLowerCase()) ||
          (ex.muscle_group || "").toLowerCase().includes(search.toLowerCase())
      )
    : exerciseList;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-end sm:items-center justify-center z-50" onClick={onClose}>
      <div
        className="bg-gray-900 border border-gray-700 rounded-t-2xl sm:rounded-xl w-full max-w-md max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b border-gray-800">
          <h3 className="text-white font-bold text-sm mb-3">Add Exercise</h3>
          <input
            type="text"
            placeholder="Search by name or muscle group..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:border-brand-500 focus:outline-none"
            autoFocus
          />
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          {loading && <p className="text-gray-500 text-sm py-4 text-center">Loading...</p>}
          {!loading && error && (
            <p className="text-red-400 text-sm py-4 text-center">{error}</p>
          )}
          {!loading && !error && filtered.length === 0 && (
            <p className="text-gray-500 text-sm py-4 text-center">No exercises found.</p>
          )}
          {filtered.map((ex) => (
            <button
              key={ex.id}
              onClick={() => onSelect(ex)}
              className="w-full text-left px-3 py-2.5 hover:bg-gray-800 rounded-lg text-sm text-gray-300 flex justify-between items-center"
            >
              <span>{ex.name}</span>
              <span className="text-gray-600 text-xs">{ex.muscle_group}</span>
            </button>
          ))}
        </div>
        <div className="p-3 border-t border-gray-800">
          <button onClick={onClose} className="w-full py-2 text-gray-400 text-sm hover:text-white">Cancel</button>
        </div>
      </div>
    </div>
  );
}

function TemplateEditor({ template, onBack, onRefresh }) {
  const [detail, setDetail] = useState(null);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(template.name);
  const [description, setDescription] = useState(template.description || "");
  const [showAddEx, setShowAddEx] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadDetail = useCallback(() => {
    setLoading(true);
    api(`/workout-templates/${template.id}`)
      .then((d) => {
        setDetail(d);
        setName(d.name);
        setDescription(d.description || "");
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [template.id]);

  useEffect(() => { loadDetail(); }, [loadDetail]);

  const saveName = async () => {
    try {
      await api(`/workout-templates/${template.id}`, {
        method: "PUT",
        body: { name, description },
      });
      setEditing(false);
      loadDetail();
      onRefresh();
    } catch {}
  };

  const addExercise = async (exercise) => {
    try {
      const exercises = detail?.exercises || [];
      await api(`/workout-templates/${template.id}/exercises`, {
        method: "POST",
        body: {
          exerciseId: exercise.id,
          sortOrder: exercises.length + 1,
          targetSets: 3,
          targetReps: 10,
        },
      });
      loadDetail();
      setShowAddEx(false);
    } catch {}
  };

  const removeExercise = async (teId) => {
    try {
      await api(`/workout-templates/${template.id}/exercises/${teId}`, {
        method: "DELETE",
      });
      loadDetail();
    } catch {}
  };

  const deleteTemplate = async () => {
    if (!confirm("Delete this template? This cannot be undone.")) return;
    try {
      await api(`/workout-templates/${template.id}`, { method: "DELETE" });
      onRefresh();
      onBack();
    } catch {}
  };

  if (loading && !detail) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const exercises = detail?.exercises || [];

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <button onClick={onBack} className="text-gray-400 hover:text-white">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        {!editing ? (
          <div className="flex-1 flex items-center justify-between">
            <div>
              <h1 className="text-white text-lg font-bold">{detail?.name || template.name}</h1>
              {detail?.description && <p className="text-gray-500 text-xs mt-0.5">{detail.description}</p>}
            </div>
            <button
              onClick={() => setEditing(true)}
              className="text-gray-400 hover:text-white text-xs px-3 py-1.5 border border-gray-700 rounded-lg"
            >
              Edit
            </button>
          </div>
        ) : (
          <div className="flex-1 space-y-2">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:border-brand-500 focus:outline-none"
              placeholder="Template name"
              autoFocus
            />
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:border-brand-500 focus:outline-none"
              placeholder="Description (optional)"
            />
            <div className="flex gap-2">
              <button onClick={() => setEditing(false)} className="px-3 py-1.5 text-gray-400 text-xs">Cancel</button>
              <button onClick={saveName} className="px-3 py-1.5 bg-brand-500 text-white rounded-lg text-xs font-medium">Save</button>
            </div>
          </div>
        )}
      </div>

      {/* Exercise list */}
      <div className="space-y-2">
        {exercises.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-500 text-sm mb-1">No exercises yet.</p>
            <p className="text-gray-600 text-xs">Add exercises to build your workout template.</p>
          </div>
        )}
        {exercises.map((ex, i) => (
          <div key={ex.id} className="bg-gray-900 border border-gray-800 rounded-xl p-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-gray-600 text-xs w-5 text-center">{i + 1}</span>
              <div>
                <p className="text-white text-sm font-medium">{ex.exercise_name}</p>
                <p className="text-gray-500 text-xs">{ex.muscle_group || ex.category}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-gray-500 text-xs">
                {ex.target_sets}x{ex.target_reps}
              </span>
              <button
                onClick={() => removeExercise(ex.id)}
                className="text-gray-600 hover:text-red-400 transition"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add exercise button */}
      <button
        onClick={() => setShowAddEx(true)}
        className="w-full mt-4 px-4 py-2.5 border border-dashed border-gray-700 rounded-xl text-gray-400 text-sm hover:border-brand-500 hover:text-brand-500 transition"
      >
        + Add Exercise
      </button>

      {/* Delete template */}
      <div className="mt-8 pt-4 border-t border-gray-800">
        <button
          onClick={deleteTemplate}
          className="text-red-400/60 hover:text-red-400 text-xs transition"
        >
          Delete this template
        </button>
      </div>

      {showAddEx && (
        <ExerciseSearchModal
          onSelect={addExercise}
          onClose={() => setShowAddEx(false)}
        />
      )}
    </div>
  );
}

export default function TemplatesPage() {
  const [templates, setTemplates] = useState([]);
  const [editing, setEditing] = useState(null);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");

  const load = useCallback(() => {
    api("/workout-templates?limit=100&ownOnly=true").then((d) => setTemplates(d.data || [])).catch(() => {});
  }, []);

  useEffect(() => { load(); }, [load]);

  const createTemplate = async () => {
    if (!newName.trim()) return;
    try {
      const t = await api("/workout-templates", {
        method: "POST",
        body: { name: newName.trim() },
      });
      setCreating(false);
      setNewName("");
      load();
      setEditing(t);
    } catch {}
  };

  if (editing) {
    return (
      <TemplateEditor
        template={editing}
        onBack={() => { setEditing(null); load(); }}
        onRefresh={load}
      />
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-white text-xl font-bold">My Templates</h1>
        <button
          onClick={() => setCreating(true)}
          className="px-4 py-2 bg-brand-500 text-white rounded-lg text-sm font-medium hover:bg-brand-600"
        >
          New Template
        </button>
      </div>

      {/* Create form */}
      {creating && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 mb-4">
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Template name (e.g., Workout A - Push Day)"
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:border-brand-500 focus:outline-none mb-3"
            autoFocus
            onKeyDown={(e) => e.key === "Enter" && createTemplate()}
          />
          <div className="flex gap-2">
            <button onClick={() => { setCreating(false); setNewName(""); }} className="px-4 py-2 text-gray-400 text-sm">Cancel</button>
            <button onClick={createTemplate} className="px-4 py-2 bg-brand-500 text-white rounded-lg text-sm font-medium hover:bg-brand-600">Create</button>
          </div>
        </div>
      )}

      {/* Templates list */}
      <div className="space-y-2">
        {templates.map((t) => (
          <button
            key={t.id}
            onClick={() => setEditing(t)}
            className="w-full text-left bg-gray-900 border border-gray-800 rounded-xl p-4 hover:border-gray-700 transition"
          >
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-white font-semibold text-sm">{t.name}</h3>
                {t.description && (
                  <p className="text-gray-500 text-xs mt-0.5 line-clamp-1">{t.description}</p>
                )}
                <div className="flex items-center gap-2 mt-1">
                  {t.category && <span className="text-gray-600 text-xs capitalize">{t.category}</span>}
                  {t.estimated_duration_min > 0 && <span className="text-gray-600 text-xs">{t.estimated_duration_min}min</span>}
                </div>
              </div>
              <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </button>
        ))}
      </div>

      {templates.length === 0 && !creating && (
        <div className="text-center py-12">
          <p className="text-gray-500 text-sm mb-2">No templates yet.</p>
          <p className="text-gray-600 text-xs mb-4">Create a template to organize your weekly workouts.</p>
          <button
            onClick={() => setCreating(true)}
            className="px-4 py-2 bg-brand-500 text-white rounded-lg text-sm font-medium hover:bg-brand-600"
          >
            Create Your First Template
          </button>
        </div>
      )}
    </div>
  );
}
