"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "../../../../components/AuthProvider";
import { api } from "../../../../lib/api";
import Link from "next/link";

const TABS = [
  { key: "overview", label: "Overview" },
  { key: "workouts", label: "Workouts" },
  { key: "templates", label: "Templates" },
  { key: "nutrition", label: "Nutrition" },
  { key: "measurements", label: "Measurements" },
];

export default function ClientViewPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [client, setClient] = useState(null);
  const [tab, setTab] = useState("overview");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api("/users/my-clients")
      .then((clients) => {
        const c = (Array.isArray(clients) ? clients : []).find((c) => c.id === parseInt(id));
        if (c) setClient(c);
        else router.push("/dashboard/clients");
      })
      .catch(() => router.push("/dashboard/clients"))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="text-gray-500 text-center py-8">Loading...</div>;
  if (!client) return null;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <button onClick={() => router.push("/dashboard/clients")} className="text-gray-500 hover:text-white">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="w-10 h-10 bg-brand-500/20 rounded-full flex items-center justify-center">
          <span className="text-brand-500 font-bold text-sm">{client.first_name?.[0]}{client.last_name?.[0]}</span>
        </div>
        <div>
          <h1 className="text-white text-lg font-bold">{client.first_name} {client.last_name}</h1>
          <p className="text-gray-500 text-xs">{client.email}</p>
        </div>
        {client.fitness_level && (
          <span className="ml-auto text-xs px-2 py-1 rounded-full bg-brand-500/10 text-brand-400">{client.fitness_level}</span>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-900 rounded-xl p-1 mb-4 overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition ${
              tab === t.key ? "bg-brand-500 text-white" : "text-gray-400 hover:text-white hover:bg-gray-800"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {tab === "overview" && <OverviewTab clientId={id} client={client} />}
      {tab === "workouts" && <WorkoutsTab clientId={id} />}
      {tab === "templates" && <TemplatesTab clientId={id} />}
      {tab === "nutrition" && <NutritionTab clientId={id} />}
      {tab === "measurements" && <MeasurementsTab clientId={id} />}
    </div>
  );
}

// ─── Overview Tab ───────────────────────────────────────────

function OverviewTab({ clientId, client }) {
  const [stats, setStats] = useState({});
  const [records, setRecords] = useState([]);
  const [assignments, setAssignments] = useState([]);

  useEffect(() => {
    Promise.all([
      api(`/workout-sessions/client/${clientId}?limit=1`).catch(() => ({ pagination: { total: 0 } })),
      api(`/progress/measurements/client/${clientId}?limit=1`).catch(() => ({ pagination: { total: 0 } })),
      api(`/progress/records/client/${clientId}`).catch(() => []),
      api(`/assigned-workouts/client/${clientId}`).catch(() => []),
    ]).then(([sessions, measurements, prs, assigned]) => {
      setStats({
        totalWorkouts: sessions.pagination?.total || 0,
        totalMeasurements: measurements.pagination?.total || 0,
      });
      setRecords(Array.isArray(prs) ? prs.slice(0, 5) : []);
      setAssignments(Array.isArray(assigned) ? assigned : []);
    });
  }, [clientId]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <p className="text-gray-500 text-xs">Total Workouts</p>
          <p className="text-2xl font-bold text-brand-500">{stats.totalWorkouts || 0}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <p className="text-gray-500 text-xs">Measurements</p>
          <p className="text-2xl font-bold text-blue-400">{stats.totalMeasurements || 0}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <p className="text-gray-500 text-xs">Weight</p>
          <p className="text-2xl font-bold text-green-400">{client.weight_kg ? `${client.weight_kg}kg` : "--"}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <p className="text-gray-500 text-xs">PRs</p>
          <p className="text-2xl font-bold text-purple-400">{records.length}</p>
        </div>
      </div>

      {/* Assigned Workouts */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
        <h3 className="text-white font-semibold text-sm mb-3">Assigned Workouts</h3>
        {assignments.length === 0 ? (
          <p className="text-gray-600 text-sm">No workouts assigned yet</p>
        ) : (
          <div className="space-y-2">
            {assignments.map((a) => (
              <div key={a.id} className="flex justify-between items-center px-3 py-2 bg-gray-800 rounded-lg">
                <span className="text-gray-300 text-sm">{a.template_name}</span>
                <span className="text-gray-500 text-xs">{a.day_of_week !== null ? ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][a.day_of_week] : "Any day"}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent PRs */}
      {records.length > 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <h3 className="text-white font-semibold text-sm mb-3">Recent Personal Records</h3>
          <div className="space-y-2">
            {records.map((r) => (
              <div key={r.id} className="flex justify-between items-center px-3 py-2 bg-gray-800 rounded-lg">
                <div>
                  <span className="text-gray-300 text-sm">{r.exercise_name}</span>
                  <span className="text-gray-600 text-xs ml-2">{r.record_type === "max_weight" ? "Max Weight" : "Max Volume"}</span>
                </div>
                <span className="text-brand-400 font-medium text-sm">
                  {r.value}{r.record_type === "max_weight" ? " kg" : ""}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Workouts Tab ───────────────────────────────────────────

function WorkoutsTab({ clientId }) {
  const [sessions, setSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api(`/workout-sessions/client/${clientId}?limit=30`)
      .then((d) => setSessions(d.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [clientId]);

  const viewSession = async (id) => {
    try {
      const session = await api(`/workout-sessions/${id}`);
      setSelectedSession(session);
    } catch {}
  };

  if (loading) return <p className="text-gray-500 text-sm">Loading workouts...</p>;

  if (selectedSession) {
    return (
      <div>
        <button onClick={() => setSelectedSession(null)} className="text-brand-400 text-sm mb-3 flex items-center gap-1">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          Back to list
        </button>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-white font-semibold">{selectedSession.name || "Workout"}</h3>
              <p className="text-gray-500 text-xs">{new Date(selectedSession.started_at).toLocaleString()}</p>
            </div>
            <div className="text-right">
              {selectedSession.total_volume > 0 && <p className="text-brand-400 text-sm font-medium">{selectedSession.total_volume.toLocaleString()} kg volume</p>}
              {selectedSession.ended_at && <span className="text-green-400 text-xs">Completed</span>}
            </div>
          </div>
          {selectedSession.notes && <p className="text-gray-400 text-sm mb-3">{selectedSession.notes}</p>}

          <div className="space-y-3">
            {(selectedSession.exercises || []).map((ex) => (
              <div key={ex.id} className="bg-gray-800 rounded-lg p-3">
                <p className="text-white text-sm font-medium mb-2">{ex.exercise_name}</p>
                <div className="space-y-1">
                  {(ex.sets || []).map((set) => (
                    <div key={set.id} className="flex gap-4 text-xs text-gray-400">
                      <span className="text-gray-600 w-12">Set {set.set_number}</span>
                      <span>{set.reps || 0} reps</span>
                      <span>{set.weight_kg || 0} kg</span>
                      {set.rpe && <span>RPE {set.rpe}</span>}
                      <span className={set.completed ? "text-green-400" : "text-gray-600"}>
                        {set.completed ? "Done" : "Skipped"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      {sessions.length === 0 ? (
        <p className="text-gray-600 text-sm text-center py-8">No workout sessions yet</p>
      ) : (
        <div className="space-y-2">
          {sessions.map((s) => (
            <button
              key={s.id}
              onClick={() => viewSession(s.id)}
              className="w-full text-left bg-gray-900 border border-gray-800 rounded-xl p-4 hover:border-brand-500/50 transition"
            >
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-white text-sm font-medium">{s.name || "Workout"}</p>
                  <p className="text-gray-500 text-xs">{new Date(s.started_at || s.created_at).toLocaleString()}</p>
                </div>
                <div className="text-right">
                  {s.total_volume > 0 && <p className="text-brand-400 text-sm">{Math.round(s.total_volume).toLocaleString()} kg</p>}
                  <span className={`text-xs ${s.ended_at ? "text-green-400" : "text-yellow-400"}`}>
                    {s.ended_at ? "Completed" : "In progress"}
                  </span>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Exercise Dropdown (shared) ─────────────────────────────

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
                className="w-full text-left px-3 py-2 hover:bg-gray-700 text-sm border-b border-gray-700/50 last:border-0 flex justify-between items-center"
              >
                <div>
                  <span className="text-white">{ex.name}</span>
                  <span className="text-gray-500 text-xs ml-2">{ex.muscle_group}</span>
                </div>
                {ex.equipment && <span className="text-gray-600 text-xs">{ex.equipment}</span>}
              </button>
            ))
          )}
        </div>
      )}
      {open && <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />}
    </div>
  );
}

// ─── Templates Tab ──────────────────────────────────────────

function TemplatesTab({ clientId }) {
  const [templates, setTemplates] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [showAssign, setShowAssign] = useState(false);
  const [formData, setFormData] = useState({ name: "", description: "", category: "", difficulty: "intermediate" });
  const [selectedExercises, setSelectedExercises] = useState([]);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  // Assign existing template
  const [myTemplates, setMyTemplates] = useState([]);
  const [assignResult, setAssignResult] = useState(null);

  const loadTemplates = () => {
    api(`/workout-templates/client/${clientId}`)
      .then((d) => setTemplates(Array.isArray(d) ? d : d.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadTemplates();
  }, [clientId]);

  const loadMyTemplates = () => {
    api("/workout-templates?ownOnly=true&limit=100")
      .then((d) => setMyTemplates(d.data || []))
      .catch(() => {});
  };

  const addExercise = (ex) => {
    if (!selectedExercises.find((e) => e.exerciseId === ex.id)) {
      setSelectedExercises([...selectedExercises, {
        exerciseId: ex.id,
        name: ex.name,
        targetSets: 3,
        targetReps: 10,
        restSeconds: 60,
      }]);
    }
  };

  const removeExercise = (idx) => {
    setSelectedExercises(selectedExercises.filter((_, i) => i !== idx));
  };

  const updateExercise = (idx, field, value) => {
    const updated = [...selectedExercises];
    updated[idx] = { ...updated[idx], [field]: parseInt(value) || 0 };
    setSelectedExercises(updated);
  };

  const createTemplate = async () => {
    if (!formData.name.trim()) return;
    setCreating(true);
    setError(null);
    try {
      await api(`/users/clients/${clientId}/templates`, {
        method: "POST",
        body: { ...formData, exercises: selectedExercises },
      });
      setShowCreate(false);
      setFormData({ name: "", description: "", category: "", difficulty: "intermediate" });
      setSelectedExercises([]);
      loadTemplates();
    } catch (err) {
      setError(err.message || "Failed to create template");
    }
    setCreating(false);
  };

  const assignTemplate = async (templateId) => {
    setAssignResult(null);
    try {
      await api(`/assigned-workouts/client/${clientId}`, {
        method: "POST",
        body: { templateId },
      });
      setAssignResult({ success: true });
      loadTemplates();
    } catch (err) {
      setAssignResult({ error: err.message || "Failed to assign" });
    }
  };

  if (loading) return <p className="text-gray-500 text-sm">Loading templates...</p>;

  return (
    <div>
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-gray-400 text-xs font-semibold uppercase tracking-wider">Client Templates & Assignments</h3>
        <div className="flex gap-2">
          <button
            onClick={() => { setShowAssign(!showAssign); setShowCreate(false); if (!showAssign) loadMyTemplates(); }}
            className="px-3 py-1.5 bg-gray-800 text-white rounded-lg text-xs font-medium hover:bg-gray-700 border border-gray-700"
          >
            {showAssign ? "Cancel" : "Assign Existing"}
          </button>
          <button
            onClick={() => { setShowCreate(!showCreate); setShowAssign(false); }}
            className="px-3 py-1.5 bg-brand-500 text-white rounded-lg text-xs font-medium hover:bg-brand-600"
          >
            {showCreate ? "Cancel" : "Create New"}
          </button>
        </div>
      </div>

      {/* Assign Existing Template */}
      {showAssign && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 mb-4">
          <h4 className="text-white font-semibold text-sm mb-3">Assign Your Template to Client</h4>
          {assignResult?.success && <p className="text-green-400 text-sm mb-2">Template assigned!</p>}
          {assignResult?.error && <p className="text-red-400 text-sm mb-2">{assignResult.error}</p>}
          {myTemplates.length === 0 ? (
            <p className="text-gray-600 text-sm">You have no templates to assign. Create one first.</p>
          ) : (
            <div className="space-y-2">
              {myTemplates.map((t) => {
                const alreadyAssigned = templates.some((ct) => ct.id === t.id);
                return (
                  <div key={t.id} className="flex items-center justify-between bg-gray-800 rounded-lg px-3 py-2.5">
                    <div>
                      <p className="text-white text-sm">{t.name}</p>
                      <p className="text-gray-500 text-xs">{[t.category, t.difficulty].filter(Boolean).join(" / ")}</p>
                    </div>
                    {alreadyAssigned ? (
                      <span className="text-green-400 text-xs px-2 py-1 bg-green-400/10 rounded-full">Assigned</span>
                    ) : (
                      <button
                        onClick={() => assignTemplate(t.id)}
                        className="px-3 py-1.5 bg-brand-500 text-white rounded-lg text-xs font-medium hover:bg-brand-600"
                      >
                        Assign
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Create Template Form */}
      {showCreate && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 mb-4">
          <h4 className="text-white font-semibold text-sm mb-3">Create Template for Client</h4>
          {error && <p className="text-red-400 text-sm mb-2">{error}</p>}

          <div className="grid grid-cols-2 gap-3 mb-3">
            <input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Template name *"
              className="col-span-2 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:border-brand-500 focus:outline-none"
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

          {/* Exercise Dropdown */}
          <ExerciseDropdown
            onSelect={addExercise}
            selectedIds={selectedExercises.map((e) => e.exerciseId)}
          />

          {/* Selected Exercises */}
          {selectedExercises.length > 0 && (
            <div className="space-y-2 mb-3">
              {selectedExercises.map((ex, idx) => (
                <div key={idx} className="flex items-center gap-2 bg-gray-800 rounded-lg p-2">
                  <span className="text-gray-400 text-xs w-5">{idx + 1}.</span>
                  <span className="text-white text-sm flex-1">{ex.name}</span>
                  <input
                    type="number"
                    value={ex.targetSets}
                    onChange={(e) => updateExercise(idx, "targetSets", e.target.value)}
                    className="w-14 bg-gray-700 rounded px-2 py-1 text-white text-xs text-center"
                    title="Sets"
                  />
                  <span className="text-gray-600 text-xs">x</span>
                  <input
                    type="number"
                    value={ex.targetReps}
                    onChange={(e) => updateExercise(idx, "targetReps", e.target.value)}
                    className="w-14 bg-gray-700 rounded px-2 py-1 text-white text-xs text-center"
                    title="Reps"
                  />
                  <button onClick={() => removeExercise(idx)} className="text-gray-500 hover:text-red-400 text-xs px-1">X</button>
                </div>
              ))}
            </div>
          )}

          <button
            onClick={createTemplate}
            disabled={!formData.name.trim() || creating}
            className="w-full py-2 bg-brand-500 text-white rounded-lg text-sm font-medium hover:bg-brand-600 disabled:opacity-50"
          >
            {creating ? "Creating..." : "Create & Assign to Client"}
          </button>
        </div>
      )}

      {/* Template List */}
      {templates.length === 0 && !showCreate && !showAssign ? (
        <p className="text-gray-600 text-sm text-center py-8">No templates yet. Create one or assign an existing template.</p>
      ) : (
        <div className="space-y-2">
          {templates.map((t) => (
            <div key={t.id} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-white text-sm font-medium">{t.name}</p>
                  {t.description && <p className="text-gray-500 text-xs mt-0.5">{t.description}</p>}
                </div>
                <div className="flex gap-2">
                  {t.category && <span className="text-xs px-2 py-0.5 rounded-full bg-gray-800 text-gray-400">{t.category}</span>}
                  {t.difficulty && <span className="text-xs px-2 py-0.5 rounded-full bg-brand-500/10 text-brand-400">{t.difficulty}</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Nutrition Tab ──────────────────────────────────────────

function NutritionTab({ clientId }) {
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [meals, setMeals] = useState([]);
  const [summary, setSummary] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api(`/nutrition/meals/client/${clientId}?date=${date}`).catch(() => []),
      api(`/nutrition/summary/client/${clientId}?date=${date}`).catch(() => ({})),
    ]).then(([m, s]) => {
      setMeals(Array.isArray(m) ? m : m.data || m.meals || []);
      setSummary({
        calories: s.total_calories || s.totalCalories || 0,
        protein: s.total_protein_g || s.totalProtein || 0,
        carbs: s.total_carbs_g || s.totalCarbs || 0,
        fat: s.total_fat_g || s.totalFat || 0,
      });
      setLoading(false);
    });
  }, [clientId, date]);

  return (
    <div>
      {/* Date Picker */}
      <div className="flex items-center gap-3 mb-4">
        <button onClick={() => { const d = new Date(date); d.setDate(d.getDate() - 1); setDate(d.toISOString().split("T")[0]); }} className="text-gray-400 hover:text-white">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        </button>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-white text-sm"
        />
        <button onClick={() => { const d = new Date(date); d.setDate(d.getDate() + 1); setDate(d.toISOString().split("T")[0]); }} className="text-gray-400 hover:text-white">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
        </button>
      </div>

      {/* Macros Summary */}
      <div className="grid grid-cols-4 gap-3 mb-4">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-3 text-center">
          <p className="text-gray-500 text-xs">Calories</p>
          <p className="text-lg font-bold text-white">{Math.round(summary.calories)}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-3 text-center">
          <p className="text-gray-500 text-xs">Protein</p>
          <p className="text-lg font-bold text-blue-400">{Math.round(summary.protein)}g</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-3 text-center">
          <p className="text-gray-500 text-xs">Carbs</p>
          <p className="text-lg font-bold text-green-400">{Math.round(summary.carbs)}g</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-3 text-center">
          <p className="text-gray-500 text-xs">Fat</p>
          <p className="text-lg font-bold text-yellow-400">{Math.round(summary.fat)}g</p>
        </div>
      </div>

      {/* Meals */}
      {loading ? (
        <p className="text-gray-500 text-sm">Loading...</p>
      ) : meals.length === 0 ? (
        <p className="text-gray-600 text-sm text-center py-8">No meals logged for this date</p>
      ) : (
        <div className="space-y-3">
          {meals.map((meal) => (
            <div key={meal.id} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-white text-sm font-medium capitalize">{meal.meal_type || "Meal"}</span>
                <span className="text-gray-500 text-xs">{new Date(meal.logged_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
              </div>
              {(meal.items || []).map((item, idx) => (
                <div key={idx} className="flex justify-between text-xs text-gray-400 py-0.5">
                  <span>{item.name || item.food_name || `Item ${idx + 1}`}</span>
                  <span>{Math.round(item.calories || 0)} cal</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Measurements Tab ───────────────────────────────────────

function MeasurementsTab({ clientId }) {
  const [measurements, setMeasurements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api(`/progress/measurements/client/${clientId}?limit=20`)
      .then((d) => setMeasurements(d.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [clientId]);

  if (loading) return <p className="text-gray-500 text-sm">Loading measurements...</p>;

  return (
    <div>
      {measurements.length === 0 ? (
        <p className="text-gray-600 text-sm text-center py-8">No measurements recorded yet</p>
      ) : (
        <div className="space-y-2">
          {measurements.map((m) => (
            <div key={m.id} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
              <div className="flex justify-between items-start mb-2">
                <p className="text-white text-sm font-medium">{new Date(m.recorded_at).toLocaleDateString()}</p>
                <p className="text-gray-500 text-xs">{new Date(m.recorded_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p>
              </div>
              <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
                {m.weight_kg && (
                  <div>
                    <p className="text-gray-500 text-xs">Weight</p>
                    <p className="text-white text-sm">{m.weight_kg} kg</p>
                  </div>
                )}
                {m.body_fat_pct && (
                  <div>
                    <p className="text-gray-500 text-xs">Body Fat</p>
                    <p className="text-white text-sm">{m.body_fat_pct}%</p>
                  </div>
                )}
                {m.chest_cm && (
                  <div>
                    <p className="text-gray-500 text-xs">Chest</p>
                    <p className="text-white text-sm">{m.chest_cm} cm</p>
                  </div>
                )}
                {m.waist_cm && (
                  <div>
                    <p className="text-gray-500 text-xs">Waist</p>
                    <p className="text-white text-sm">{m.waist_cm} cm</p>
                  </div>
                )}
                {m.hips_cm && (
                  <div>
                    <p className="text-gray-500 text-xs">Hips</p>
                    <p className="text-white text-sm">{m.hips_cm} cm</p>
                  </div>
                )}
                {m.bicep_left_cm && (
                  <div>
                    <p className="text-gray-500 text-xs">Bicep L</p>
                    <p className="text-white text-sm">{m.bicep_left_cm} cm</p>
                  </div>
                )}
                {m.bicep_right_cm && (
                  <div>
                    <p className="text-gray-500 text-xs">Bicep R</p>
                    <p className="text-white text-sm">{m.bicep_right_cm} cm</p>
                  </div>
                )}
                {m.thigh_left_cm && (
                  <div>
                    <p className="text-gray-500 text-xs">Thigh L</p>
                    <p className="text-white text-sm">{m.thigh_left_cm} cm</p>
                  </div>
                )}
                {m.thigh_right_cm && (
                  <div>
                    <p className="text-gray-500 text-xs">Thigh R</p>
                    <p className="text-white text-sm">{m.thigh_right_cm} cm</p>
                  </div>
                )}
                {m.neck_cm && (
                  <div>
                    <p className="text-gray-500 text-xs">Neck</p>
                    <p className="text-white text-sm">{m.neck_cm} cm</p>
                  </div>
                )}
              </div>
              {m.notes && <p className="text-gray-500 text-xs mt-2">{m.notes}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
