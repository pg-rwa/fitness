"use client";
import { useEffect, useState, useCallback } from "react";
import { api } from "../../../lib/api";
import VideoModal from "../../../components/VideoModal";
import ExerciseThumbnail, { ExerciseBanner } from "../../../components/ExerciseThumbnail";

const RENDER_LIMIT = 50;

function ExerciseSearchModal({ onSelect, onClose }) {
  const [exerciseList, setExerciseList] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterGroup, setFilterGroup] = useState("");
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    api("/exercises?limit=2000")
      .then((d) => setExerciseList(Array.isArray(d) ? d : d.data || []))
      .catch((e) => setError(e.message || "Failed to load exercises"))
      .finally(() => setLoading(false));
  }, []);

  const filtered = exerciseList.filter((ex) => {
    const matchesSearch = !search ||
      ex.name.toLowerCase().includes(search.toLowerCase()) ||
      (ex.muscle_group || "").toLowerCase().includes(search.toLowerCase()) ||
      (ex.equipment || "").toLowerCase().includes(search.toLowerCase());
    const matchesGroup = !filterGroup || ex.muscle_group === filterGroup;
    return matchesSearch && matchesGroup;
  });

  const muscleGroups = [...new Set(exerciseList.map((ex) => ex.muscle_group).filter(Boolean))].sort();

  return (
    <div className="fixed inset-0 bg-black/70 flex items-end sm:items-center justify-center z-50" onClick={onClose}>
      <div
        className="bg-gray-900 border border-gray-700 rounded-t-2xl sm:rounded-xl w-full max-w-lg max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b border-gray-800">
          <h3 className="text-white font-bold text-sm mb-3">Add Exercise</h3>
          <input
            type="text"
            placeholder="Search by name, muscle group, or equipment..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:border-brand-500 focus:outline-none mb-2"
            autoFocus
          />
          <div className="flex gap-1.5 flex-wrap">
            <button
              onClick={() => setFilterGroup("")}
              className={`px-2 py-1 rounded-full text-xs ${!filterGroup ? "bg-brand-600 text-white" : "bg-gray-800 text-gray-400 hover:bg-gray-700"}`}
            >All</button>
            {muscleGroups.map((g) => (
              <button
                key={g}
                onClick={() => setFilterGroup(filterGroup === g ? "" : g)}
                className={`px-2 py-1 rounded-full text-xs capitalize ${filterGroup === g ? "bg-brand-600 text-white" : "bg-gray-800 text-gray-400 hover:bg-gray-700"}`}
              >{g}</button>
            ))}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-3">
          {loading && <p className="text-gray-500 text-sm py-4 text-center">Loading...</p>}
          {!loading && error && (
            <p className="text-red-400 text-sm py-4 text-center">{error}</p>
          )}
          {!loading && !error && filtered.length === 0 && (
            <p className="text-gray-500 text-sm py-4 text-center">No exercises found.</p>
          )}
          {!loading && !error && filtered.length > 0 && (
            <p className="text-gray-600 text-xs px-1 pb-2">{filtered.length} exercises</p>
          )}
          <div className="grid grid-cols-2 gap-2">
            {(showAll || search || filterGroup ? filtered : filtered.slice(0, RENDER_LIMIT)).map((ex) => (
              <button
                key={ex.id}
                onClick={() => onSelect(ex)}
                className="text-left bg-gray-800/60 border border-gray-700/50 rounded-xl overflow-hidden hover:border-brand-500/50 hover:bg-gray-800 transition group"
              >
                <ExerciseBanner muscleGroup={ex.muscle_group} className="h-16 rounded-t-xl rounded-b-none" />
                <div className="px-2.5 py-2">
                  <p className="text-white text-xs font-medium truncate group-hover:text-brand-300 transition">{ex.name}</p>
                  <p className="text-gray-500 text-[10px] capitalize mt-0.5 truncate">{ex.muscle_group}{ex.equipment ? ` · ${ex.equipment}` : ""}</p>
                </div>
              </button>
            ))}
          </div>
          {!showAll && !search && !filterGroup && filtered.length > RENDER_LIMIT && (
            <button onClick={() => setShowAll(true)} className="w-full py-3 text-brand-400 text-xs hover:text-brand-300 mt-2">
              Show all {filtered.length} exercises
            </button>
          )}
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
  const [videoExercise, setVideoExercise] = useState(null);
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
          <div key={ex.id} className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
            <ExerciseBanner muscleGroup={ex.muscle_group} />
            <div className="px-3 py-2.5 flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-gray-600 text-xs w-5 text-center shrink-0">{i + 1}</span>
                <div className="min-w-0">
                  <p className="text-white text-sm font-medium truncate">{ex.exercise_name}</p>
                  <p className="text-gray-500 text-xs">{ex.muscle_group || ex.category}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className="text-gray-500 text-xs">
                  {ex.target_sets}x{ex.target_reps}
                </span>
                <button
                  onClick={() => setVideoExercise({ id: ex.exercise_id, name: ex.exercise_name, muscle_group: ex.muscle_group, equipment: ex.equipment, video_url: ex.video_url, instructions: ex.instructions })}
                  className="text-gray-600 hover:text-brand-400 transition"
                  title="Watch demo"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </button>
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

      {videoExercise && (
        <VideoModal exercise={videoExercise} onClose={() => setVideoExercise(null)} />
      )}
    </div>
  );
}

function ExerciseDropdown({ onSelect, selectedIds = [] }) {
  const [allExercises, setAllExercises] = useState([]);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!loaded) {
      api("/exercises?limit=200")
        .then((d) => setAllExercises(Array.isArray(d) ? d : d.data || []))
        .catch(() => {})
        .finally(() => setLoaded(true));
    }
  }, [loaded]);

  const filtered = allExercises.filter((ex) => {
    if (selectedIds.includes(ex.id)) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      ex.name.toLowerCase().includes(q) ||
      (ex.muscle_group || "").toLowerCase().includes(q) ||
      (ex.equipment || "").toLowerCase().includes(q) ||
      (ex.category || "").toLowerCase().includes(q)
    );
  });

  return (
    <div className="relative mb-3">
      <label className="block text-gray-400 text-xs font-medium mb-1.5">Add Exercise</label>
      <input
        value={search}
        onChange={(e) => { setSearch(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        placeholder="Type to search exercises..."
        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:border-brand-500 focus:outline-none"
      />
      {open && (
        <div className="absolute z-20 w-full mt-1 bg-gray-800 border border-gray-700 rounded-lg max-h-52 overflow-y-auto shadow-xl">
          {!loaded ? (
            <p className="px-3 py-2 text-gray-500 text-sm">Loading exercises...</p>
          ) : filtered.length === 0 ? (
            <p className="px-3 py-2 text-gray-500 text-sm">No exercises found</p>
          ) : (
            filtered.map((ex) => (
              <button
                key={ex.id}
                onClick={() => { onSelect(ex); setSearch(""); setOpen(false); }}
                className="w-full text-left px-3 py-2 hover:bg-gray-700 text-sm border-b border-gray-700/50 last:border-0 flex items-center gap-2"
              >
                <ExerciseThumbnail muscleGroup={ex.muscle_group} size={32} />
                <div className="flex-1 min-w-0">
                  <span className="text-white truncate block">{ex.name}</span>
                  <span className="text-gray-500 text-xs capitalize">{ex.muscle_group}{ex.equipment ? ` · ${ex.equipment}` : ""}</span>
                </div>
              </button>
            ))
          )}
        </div>
      )}
      {open && <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />}
    </div>
  );
}

export default function TemplatesPage() {
  const [templates, setTemplates] = useState([]);
  const [editing, setEditing] = useState(null);
  const [creating, setCreating] = useState(false);
  const [formData, setFormData] = useState({ name: "", description: "", category: "", difficulty: "intermediate" });
  const [selectedExercises, setSelectedExercises] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(() => {
    api("/workout-templates?limit=100&ownOnly=true").then((d) => setTemplates(d.data || [])).catch(() => {});
  }, []);

  useEffect(() => { load(); }, [load]);

  const addExercise = (ex) => {
    if (!selectedExercises.find((e) => e.exerciseId === ex.id)) {
      setSelectedExercises([...selectedExercises, { exerciseId: ex.id, name: ex.name, targetSets: 3, targetReps: 10, restSeconds: 60 }]);
    }
  };
  const removeExercise = (idx) => setSelectedExercises(selectedExercises.filter((_, i) => i !== idx));
  const updateExercise = (idx, field, value) => {
    const updated = [...selectedExercises];
    updated[idx] = { ...updated[idx], [field]: parseInt(value) || 0 };
    setSelectedExercises(updated);
  };

  const createTemplate = async () => {
    if (!formData.name.trim()) return;
    setSubmitting(true); setError(null);
    try {
      // Create template
      const t = await api("/workout-templates", {
        method: "POST",
        body: { name: formData.name.trim(), description: formData.description, category: formData.category, difficulty: formData.difficulty },
      });
      // Add exercises
      for (const [idx, ex] of selectedExercises.entries()) {
        await api(`/workout-templates/${t.id}/exercises`, {
          method: "POST",
          body: { exerciseId: ex.exerciseId, sortOrder: idx + 1, targetSets: ex.targetSets, targetReps: ex.targetReps, restSeconds: ex.restSeconds },
        });
      }
      setCreating(false);
      setFormData({ name: "", description: "", category: "", difficulty: "intermediate" });
      setSelectedExercises([]);
      load();
    } catch (err) {
      setError(err.message || "Failed to create template");
    }
    setSubmitting(false);
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
          onClick={() => setCreating(!creating)}
          className="px-4 py-2 bg-brand-500 text-white rounded-lg text-sm font-medium hover:bg-brand-600"
        >
          {creating ? "Cancel" : "New Template"}
        </button>
      </div>

      {/* Create form */}
      {creating && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 mb-4">
          <h4 className="text-white font-semibold text-sm mb-3">Create New Template</h4>
          {error && <p className="text-red-400 text-sm mb-2">{error}</p>}

          <div className="grid grid-cols-2 gap-3 mb-3">
            <input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Template name *"
              className="col-span-2 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:border-brand-500 focus:outline-none"
              autoFocus
            />
            <input
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Description"
              className="col-span-2 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:border-brand-500 focus:outline-none"
            />
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:border-brand-500 focus:outline-none"
            >
              <option value="">Category</option>
              <option value="strength">Strength</option>
              <option value="hypertrophy">Hypertrophy</option>
              <option value="endurance">Endurance</option>
              <option value="flexibility">Flexibility</option>
              <option value="cardio">Cardio</option>
            </select>
            <select
              value={formData.difficulty}
              onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
              className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:border-brand-500 focus:outline-none"
            >
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </div>

          <ExerciseDropdown onSelect={addExercise} selectedIds={selectedExercises.map((e) => e.exerciseId)} />

          {selectedExercises.length > 0 && (
            <div className="space-y-2 mb-3">
              {selectedExercises.map((ex, idx) => (
                <div key={idx} className="flex items-center gap-2 bg-gray-800 rounded-lg p-2">
                  <span className="text-gray-400 text-xs w-5">{idx + 1}.</span>
                  <span className="text-white text-sm flex-1">{ex.name}</span>
                  <input type="number" value={ex.targetSets} onChange={(e) => updateExercise(idx, "targetSets", e.target.value)}
                    className="w-14 bg-gray-700 rounded px-2 py-1 text-white text-xs text-center" title="Sets" />
                  <span className="text-gray-600 text-xs">x</span>
                  <input type="number" value={ex.targetReps} onChange={(e) => updateExercise(idx, "targetReps", e.target.value)}
                    className="w-14 bg-gray-700 rounded px-2 py-1 text-white text-xs text-center" title="Reps" />
                  <button onClick={() => removeExercise(idx)} className="text-gray-500 hover:text-red-400 text-xs px-1">X</button>
                </div>
              ))}
            </div>
          )}

          <button onClick={createTemplate} disabled={!formData.name.trim() || submitting}
            className="w-full py-2 bg-brand-500 text-white rounded-lg text-sm font-medium hover:bg-brand-600 disabled:opacity-50">
            {submitting ? "Creating..." : "Create Template"}
          </button>
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
                  {t.difficulty && <span className="text-brand-400/60 text-xs capitalize">{t.difficulty}</span>}
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
