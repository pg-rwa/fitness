"use client";
import { useEffect, useState, useCallback } from "react";
import { useAuth } from "../../../components/AuthProvider";
import { api } from "../../../lib/api";
import VideoModal from "../../../components/VideoModal";
const MUSCLE_COLORS = {
  chest: "#991b1b", back: "#1e3a5f", shoulders: "#713f12", legs: "#14532d",
  arms: "#581c87", core: "#831843", cardio: "#7c2d12", "full body": "#312e81",
};

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

  const getBannerColor = (mg) => MUSCLE_COLORS[(mg || "").toLowerCase()] || "#312e81";

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999 }} onClick={onClose}>
      <div
        style={{ background: "#111827", border: "1px solid #374151", borderRadius: 12, width: "100%", maxWidth: 500, maxHeight: "85vh", display: "flex", flexDirection: "column" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ padding: 16, borderBottom: "1px solid #1f2937" }}>
          <h3 style={{ color: "#fff", fontWeight: 700, fontSize: 14, marginBottom: 12 }}>Choose Exercise</h3>
          <input
            type="text"
            placeholder="Search by name or muscle group..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: "100%", background: "#1f2937", border: "1px solid #374151", borderRadius: 8, padding: "8px 12px", color: "#fff", fontSize: 14, outline: "none", boxSizing: "border-box" }}
            autoFocus
          />
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 8 }}>
            <button
              onClick={() => setFilterGroup("")}
              style={{ padding: "4px 10px", borderRadius: 20, fontSize: 11, border: "none", cursor: "pointer", background: !filterGroup ? "#ea580c" : "#1f2937", color: !filterGroup ? "#fff" : "#9ca3af" }}
            >All</button>
            {muscleGroups.map((g) => (
              <button
                key={g}
                onClick={() => setFilterGroup(filterGroup === g ? "" : g)}
                style={{ padding: "4px 10px", borderRadius: 20, fontSize: 11, border: "none", cursor: "pointer", textTransform: "capitalize", background: filterGroup === g ? "#ea580c" : "#1f2937", color: filterGroup === g ? "#fff" : "#9ca3af" }}
              >{g}</button>
            ))}
          </div>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: 12 }}>
          {loading && <p style={{ color: "#6b7280", fontSize: 13, textAlign: "center", padding: "16px 0" }}>Loading...</p>}
          {!loading && error && <p style={{ color: "#f87171", fontSize: 13, textAlign: "center", padding: "16px 0" }}>{error}</p>}
          {!loading && !error && filtered.length === 0 && <p style={{ color: "#6b7280", fontSize: 13, textAlign: "center", padding: "16px 0" }}>No exercises found.</p>}
          {!loading && !error && filtered.length > 0 && (
            <p style={{ color: "#4b5563", fontSize: 11, paddingBottom: 8 }}>{filtered.length} exercises</p>
          )}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {(showAll || search || filterGroup ? filtered : filtered.slice(0, RENDER_LIMIT)).map((ex) => (
              <button
                key={ex.id}
                onClick={() => onSelect(ex.id)}
                style={{ textAlign: "left", background: "rgba(31,41,55,0.6)", border: "1px solid rgba(55,65,81,0.5)", borderRadius: 12, overflow: "hidden", cursor: "pointer", padding: 0, display: "block", width: "100%" }}
              >
                <div style={{ width: "100%", height: 80, background: getBannerColor(ex.muscle_group), display: "flex", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden" }}>
                  {ex.photo_url ? (
                    <img src={ex.photo_url} alt={ex.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} loading="lazy" />
                  ) : (
                    <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 }}>{ex.muscle_group || "exercise"}</span>
                  )}
                  <span style={{ position: "absolute", top: 4, right: 4, background: "rgba(0,0,0,0.6)", color: "#fff", fontSize: 8, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, padding: "2px 6px", borderRadius: 4 }}>{ex.muscle_group || "exercise"}</span>
                </div>
                <div style={{ padding: "8px 10px" }}>
                  <p style={{ color: "#fff", fontSize: 12, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", margin: 0 }}>{ex.name}</p>
                  <p style={{ color: "#6b7280", fontSize: 10, textTransform: "capitalize", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{ex.muscle_group}{ex.equipment ? ` · ${ex.equipment}` : ""}</p>
                </div>
              </button>
            ))}
          </div>
          {!showAll && !search && !filterGroup && filtered.length > RENDER_LIMIT && (
            <button onClick={() => setShowAll(true)} style={{ width: "100%", padding: "12px 0", color: "#fb923c", fontSize: 12, background: "none", border: "none", cursor: "pointer", marginTop: 8 }}>
              Show all {filtered.length} exercises
            </button>
          )}
        </div>
        <div style={{ padding: 12, borderTop: "1px solid #1f2937" }}>
          <button onClick={onClose} style={{ width: "100%", padding: "8px 0", color: "#9ca3af", fontSize: 14, background: "none", border: "none", cursor: "pointer" }}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

function ExerciseHistory({ exerciseId }) {
  const [history, setHistory] = useState(null);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (exerciseId) {
      api(`/workout-sessions/exercise-history/${exerciseId}`)
        .then((d) => setHistory(d))
        .catch(() => setHistory([]));
    }
  }, [exerciseId]);

  if (!history || history.length === 0) return null;

  return (
    <div className="mb-3">
      <button
        onClick={() => setExpanded(!expanded)}
        className="text-xs text-brand-400 hover:text-brand-300 flex items-center gap-1"
      >
        <svg className={`w-3 h-3 transition-transform ${expanded ? "rotate-90" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
        Previous sessions ({history.length})
      </button>
      {expanded && (
        <div className="mt-2 space-y-2">
          {history.slice(0, 5).map((h, i) => (
            <div key={i} className="bg-gray-800/50 rounded-lg px-3 py-2">
              <p className="text-gray-400 text-xs mb-1">
                {new Date(h.date).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
              </p>
              <div className="flex flex-wrap gap-2">
                {h.sets.map((s, si) => (
                  <span key={si} className="text-xs text-gray-300 bg-gray-700/50 px-2 py-0.5 rounded">
                    {s.reps}x{s.weight_kg}kg
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ActiveWorkout({ session: initialSession, onDone }) {
  const [session, setSession] = useState(initialSession);
  const [exercises, setExercises] = useState(initialSession.exercises || []);
  const [setForm, setSetForm] = useState({});
  const [showAddEx, setShowAddEx] = useState(false);
  const [replacingExId, setReplacingExId] = useState(null);
  const [videoExercise, setVideoExercise] = useState(null);
  const [elapsed, setElapsed] = useState(0);
  const [stopping, setStopping] = useState(false);

  const isActive = !session.ended_at;
  const startTime = new Date(session.started_at || session.created_at).getTime();

  // Timer
  useEffect(() => {
    if (!isActive) return;
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [isActive, startTime]);

  const refreshSession = useCallback(async () => {
    try {
      const d = await api(`/workout-sessions/${session.id}`);
      setSession(d);
      setExercises(d.exercises || []);
    } catch {}
  }, [session.id]);

  useEffect(() => {
    refreshSession();
  }, [refreshSession]);

  const formatTime = (secs) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
    return `${m}:${String(s).padStart(2, "0")}`;
  };

  const updateSetField = (seId, field, value) => {
    setSetForm((p) => ({
      ...p,
      [seId]: { ...(p[seId] || {}), [field]: value },
    }));
  };

  const logSet = async (sessionExerciseId) => {
    const f = setForm[sessionExerciseId] || {};
    if (!f.reps && !f.weight) return;
    try {
      await api(`/workout-sessions/${session.id}/exercises/${sessionExerciseId}/sets`, {
        method: "POST",
        body: {
          reps: parseInt(f.reps) || 0,
          weightKg: parseFloat(f.weight) || 0,
          rpe: parseInt(f.rpe) || undefined,
        },
      });
      await refreshSession();
      setSetForm((p) => ({ ...p, [sessionExerciseId]: {} }));
    } catch {}
  };

  const addExercise = async (exerciseId) => {
    try {
      await api(`/workout-sessions/${session.id}/exercises`, {
        method: "POST",
        body: { exerciseId },
      });
      await refreshSession();
      setShowAddEx(false);
    } catch {}
  };

  const replaceExercise = async (newExerciseId) => {
    try {
      await api(`/workout-sessions/${session.id}/exercises/${replacingExId}/replace`, {
        method: "PUT",
        body: { newExerciseId, updateTemplate: true },
      });
      await refreshSession();
      setReplacingExId(null);
    } catch {}
  };

  const stopWorkout = async () => {
    setStopping(true);
    try {
      await api(`/workout-sessions/${session.id}/complete`, { method: "PUT", body: {} });
      onDone();
    } catch {
      setStopping(false);
    }
  };

  return (
    <div className="pb-24">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <button onClick={onDone} className="text-gray-400 hover:text-white">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h1 className="text-white text-lg font-bold">{session.name || "Workout"}</h1>
            {isActive && (
              <p className="text-brand-400 text-xs font-mono">{formatTime(elapsed)}</p>
            )}
            {!isActive && (
              <p className="text-green-400 text-xs">Completed</p>
            )}
          </div>
        </div>
      </div>

      {/* Exercises */}
      <div className="space-y-4">
        {exercises.map((ex) => (
          <div key={ex.id} className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
            <div style={{ width: "100%", height: 48, background: MUSCLE_COLORS[(ex.muscle_group || "").toLowerCase()] || "#312e81", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 }}>{ex.muscle_group || "exercise"}</span>
            </div>
            <div className="p-4">
            <div className="flex items-start justify-between mb-1">
              <div className="flex items-center gap-2">
                <div>
                  <h3 className="text-white font-semibold text-sm">
                    {ex.exercise_name || ex.name || `Exercise #${ex.exercise_id}`}
                  </h3>
                  {ex.muscle_group && (
                    <span className="text-gray-500 text-xs capitalize">{ex.muscle_group}</span>
                  )}
                </div>
                <button
                  onClick={() => setVideoExercise({ id: ex.exercise_id || ex.id, name: ex.exercise_name || ex.name, muscle_group: ex.muscle_group, equipment: ex.equipment, video_url: ex.video_url, instructions: ex.instructions })}
                  className="text-gray-600 hover:text-brand-400 transition p-1"
                  title="Watch demo"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </button>
              </div>
              {isActive && (
                <button
                  onClick={() => setReplacingExId(ex.id)}
                  className="text-gray-500 hover:text-brand-400 text-xs px-2 py-1 border border-gray-700 rounded-lg hover:border-brand-500 transition"
                >
                  Replace
                </button>
              )}
            </div>

            {/* Exercise history from previous sessions */}
            <ExerciseHistory exerciseId={ex.exercise_id} />

            {/* Logged sets */}
            {(ex.sets || []).length > 0 && (
              <div className="mb-3">
                <div className="grid grid-cols-4 gap-2 text-gray-500 text-xs mb-1 px-1">
                  <span>Set</span><span>Reps</span><span>Weight</span><span>RPE</span>
                </div>
                {ex.sets.map((s, i) => (
                  <div key={s.id || i} className="grid grid-cols-4 gap-2 text-sm px-1 py-0.5">
                    <span className="text-gray-400">{i + 1}</span>
                    <span className="text-white">{s.reps || "-"}</span>
                    <span className="text-white">{s.weight_kg ? `${s.weight_kg}kg` : "-"}</span>
                    <span className="text-gray-400">{s.rpe || "-"}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Log set form */}
            {isActive && (
              <div className="flex gap-2 items-end">
                <div className="flex-1">
                  <input
                    type="number"
                    placeholder="Reps"
                    value={setForm[ex.id]?.reps || ""}
                    onChange={(e) => updateSetField(ex.id, "reps", e.target.value)}
                    className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-white text-xs focus:border-brand-500 focus:outline-none"
                  />
                </div>
                <div className="flex-1">
                  <input
                    type="number"
                    placeholder="kg"
                    value={setForm[ex.id]?.weight || ""}
                    onChange={(e) => updateSetField(ex.id, "weight", e.target.value)}
                    className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-white text-xs focus:border-brand-500 focus:outline-none"
                  />
                </div>
                <div className="w-14">
                  <input
                    type="number"
                    placeholder="RPE"
                    min="1"
                    max="10"
                    value={setForm[ex.id]?.rpe || ""}
                    onChange={(e) => updateSetField(ex.id, "rpe", e.target.value)}
                    className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-white text-xs focus:border-brand-500 focus:outline-none"
                  />
                </div>
                <button
                  onClick={() => logSet(ex.id)}
                  className="px-3 py-1.5 bg-brand-500 text-white rounded text-xs font-medium hover:bg-brand-600"
                >
                  Log
                </button>
              </div>
            )}
            </div>
          </div>
        ))}
      </div>

      {/* Add exercise */}
      {isActive && (
        <button
          onClick={() => setShowAddEx(true)}
          className="w-full mt-4 px-4 py-2.5 border border-dashed border-gray-700 rounded-xl text-gray-400 text-sm hover:border-brand-500 hover:text-brand-500 transition"
        >
          + Add Exercise
        </button>
      )}

      {/* Stop Workout button (sticky at bottom, above mobile nav) */}
      {isActive && (
        <div className="fixed bottom-16 md:bottom-0 left-0 right-0 md:left-56 p-4 bg-gradient-to-t from-gray-950 via-gray-950/95 to-transparent z-50">
          <button
            onClick={stopWorkout}
            disabled={stopping}
            className="w-full py-3 bg-red-500 text-white rounded-xl text-sm font-bold hover:bg-red-600 disabled:opacity-50 transition"
          >
            {stopping ? "Saving..." : "End Workout"}
          </button>
        </div>
      )}

      {/* Exercise search modals */}
      {showAddEx && (
        <ExerciseSearchModal
          onSelect={addExercise}
          onClose={() => setShowAddEx(false)}
        />
      )}
      {replacingExId && (
        <ExerciseSearchModal
          onSelect={replaceExercise}
          onClose={() => setReplacingExId(null)}
        />
      )}

      {videoExercise && (
        <VideoModal exercise={videoExercise} onClose={() => setVideoExercise(null)} />
      )}
    </div>
  );
}

export default function WorkoutsPage() {
  const { user } = useAuth();
  const [templates, setTemplates] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [activeSession, setActiveSession] = useState(null);
  const [tab, setTab] = useState("templates");

  const [deleting, setDeleting] = useState(null);

  const load = useCallback(() => {
    api("/workout-templates?limit=50&ownOnly=true").then((d) => setTemplates(d.data || [])).catch(() => {});
    api("/workout-sessions?page=1&limit=20").then((d) => setSessions(d.data || [])).catch(() => {});
  }, []);

  const deleteSession = async (id, e) => {
    e.stopPropagation();
    if (!confirm("Delete this workout? This cannot be undone.")) return;
    setDeleting(id);
    try {
      await api(`/workout-sessions/${id}`, { method: "DELETE" });
      load();
    } catch {}
    setDeleting(null);
  };

  useEffect(() => { load(); }, [load]);

  const startFromTemplate = async (template) => {
    try {
      const data = await api("/workout-sessions", {
        method: "POST",
        body: { name: template.name, templateId: template.id },
      });
      setActiveSession(data);
    } catch {}
  };

  const startBlank = async () => {
    try {
      const data = await api("/workout-sessions", {
        method: "POST",
        body: { name: "Quick Workout" },
      });
      setActiveSession(data);
    } catch {}
  };

  // Resume an in-progress session
  const resumeSession = (session) => {
    setActiveSession(session);
  };

  if (activeSession) {
    return (
      <ActiveWorkout
        session={activeSession}
        onDone={() => {
          setActiveSession(null);
          load();
        }}
      />
    );
  }

  const inProgressSessions = sessions.filter((s) => !s.ended_at);
  const completedSessions = sessions.filter((s) => s.ended_at);

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-white text-xl font-bold">Workouts</h1>
        <button
          onClick={startBlank}
          className="px-4 py-2 bg-gray-800 text-gray-300 rounded-lg text-sm hover:bg-gray-700 border border-gray-700"
        >
          Quick Workout
        </button>
      </div>

      {/* In-progress sessions */}
      {inProgressSessions.length > 0 && (
        <div className="mb-6">
          <h2 className="text-yellow-400 text-xs font-semibold uppercase tracking-wider mb-2">In Progress</h2>
          <div className="space-y-2">
            {inProgressSessions.map((s) => (
              <div
                key={s.id}
                className="flex items-center gap-2"
              >
                <button
                  onClick={() => resumeSession(s)}
                  className="flex-1 text-left bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 hover:border-yellow-500/50 transition"
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-white font-medium text-sm">{s.name || "Workout"}</p>
                      <p className="text-yellow-400/70 text-xs mt-0.5">
                        Started {new Date(s.started_at || s.created_at).toLocaleString()}
                      </p>
                    </div>
                    <span className="text-yellow-400 text-xs font-medium px-3 py-1 bg-yellow-400/10 rounded-full">
                      Resume
                    </span>
                  </div>
                </button>
                <button
                  onClick={(e) => deleteSession(s.id, e)}
                  disabled={deleting === s.id}
                  className="p-2 text-gray-500 hover:text-red-400 transition shrink-0"
                  title="Delete workout"
                >
                  {deleting === s.id ? (
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  )}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-900 rounded-lg p-1 mb-4">
        <button
          onClick={() => setTab("templates")}
          className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition ${
            tab === "templates" ? "bg-brand-500 text-white" : "text-gray-400 hover:text-white"
          }`}
        >
          My Templates
        </button>
        <button
          onClick={() => setTab("history")}
          className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition ${
            tab === "history" ? "bg-brand-500 text-white" : "text-gray-400 hover:text-white"
          }`}
        >
          History
        </button>
      </div>

      {/* Templates tab */}
      {tab === "templates" && (
        <div>
          {templates.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500 text-sm mb-2">No workout templates yet.</p>
              <p className="text-gray-600 text-xs">Go to Templates to create your first workout template, then come back to start it.</p>
            </div>
          )}
          <div className="grid gap-3">
            {templates.map((t) => (
              <div key={t.id} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="text-white font-semibold text-sm">{t.name}</h3>
                    {t.description && (
                      <p className="text-gray-500 text-xs mt-0.5 line-clamp-1">{t.description}</p>
                    )}
                    <div className="flex items-center gap-2 mt-1.5">
                      {t.category && (
                        <span className="text-gray-500 text-xs capitalize">{t.category}</span>
                      )}
                      {t.estimated_duration_min && (
                        <span className="text-gray-500 text-xs">{t.estimated_duration_min}min</span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => startFromTemplate(t)}
                    className="px-4 py-2 bg-brand-500 text-white rounded-lg text-sm font-medium hover:bg-brand-600 ml-3 whitespace-nowrap"
                  >
                    Start
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* History tab */}
      {tab === "history" && (
        <div className="space-y-2">
          {completedSessions.map((s) => (
            <div key={s.id} className="flex items-center gap-2">
              <button
                onClick={() => resumeSession(s)}
                className="flex-1 text-left bg-gray-900 border border-gray-800 rounded-xl p-4 hover:border-gray-700 transition"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-white font-medium text-sm">{s.name || "Workout"}</p>
                    <p className="text-gray-500 text-xs mt-0.5">
                      {new Date(s.started_at || s.created_at).toLocaleDateString(undefined, {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                      })}
                      {s.total_volume > 0 && ` \u00b7 ${Math.round(s.total_volume).toLocaleString()}kg total`}
                    </p>
                  </div>
                  <span className="text-green-400/80 text-xs bg-green-400/10 px-2 py-0.5 rounded-full">Done</span>
                </div>
              </button>
              <button
                onClick={(e) => deleteSession(s.id, e)}
                disabled={deleting === s.id}
                className="p-2 text-gray-500 hover:text-red-400 transition shrink-0"
                title="Delete workout"
              >
                {deleting === s.id ? (
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                )}
              </button>
            </div>
          ))}
          {completedSessions.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-600 text-sm">No completed workouts yet.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
