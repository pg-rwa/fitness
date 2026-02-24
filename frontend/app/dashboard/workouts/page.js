"use client";
import { useEffect, useState, useCallback } from "react";
import { useAuth } from "../../../components/AuthProvider";
import { api } from "../../../lib/api";
import VideoModal from "../../../components/VideoModal";

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
          <h3 className="text-white font-bold text-sm mb-3">Choose Exercise</h3>
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
              onClick={() => onSelect(ex.id)}
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
          <div key={ex.id} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <div className="flex items-start justify-between mb-1">
              <div className="flex items-center gap-2">
                <div>
                  <h3 className="text-white font-semibold text-sm">
                    {ex.exercise_name || ex.name || `Exercise #${ex.exercise_id}`}
                  </h3>
                  {ex.muscle_group && (
                    <span className="text-gray-500 text-xs">{ex.muscle_group}</span>
                  )}
                </div>
                <button
                  onClick={() => setVideoExercise({ name: ex.exercise_name || ex.name, muscle_group: ex.muscle_group, equipment: ex.equipment, video_url: ex.video_url, instructions: ex.instructions })}
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

      {/* Stop Workout button (sticky at bottom) */}
      {isActive && (
        <div className="fixed bottom-0 left-0 right-0 md:left-56 p-4 bg-gradient-to-t from-gray-950 via-gray-950/95 to-transparent">
          <button
            onClick={stopWorkout}
            disabled={stopping}
            className="w-full py-3 bg-red-500 text-white rounded-xl text-sm font-bold hover:bg-red-600 disabled:opacity-50 transition"
          >
            {stopping ? "Saving..." : "Stop Workout"}
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

  const load = useCallback(() => {
    api("/workout-templates?limit=50&ownOnly=true").then((d) => setTemplates(d.data || [])).catch(() => {});
    api("/workout-sessions?page=1&limit=20").then((d) => setSessions(d.data || [])).catch(() => {});
  }, []);

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
              <button
                key={s.id}
                onClick={() => resumeSession(s)}
                className="w-full text-left bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 hover:border-yellow-500/50 transition"
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
            <button
              key={s.id}
              onClick={() => resumeSession(s)}
              className="w-full text-left bg-gray-900 border border-gray-800 rounded-xl p-4 hover:border-gray-700 transition"
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
