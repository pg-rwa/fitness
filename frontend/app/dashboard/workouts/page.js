"use client";
import { useEffect, useState } from "react";
import { useAuth } from "../../../components/AuthProvider";
import { api } from "../../../lib/api";

function StartWorkoutModal({ templates, onStart, onClose }) {
  const [name, setName] = useState("");
  const [templateId, setTemplateId] = useState("");

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-gray-900 border border-gray-700 rounded-xl w-full max-w-md p-5" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-white font-bold text-lg mb-4">Start Workout</h2>

        <div className="space-y-3 mb-4">
          <div>
            <label className="block text-gray-400 text-xs mb-1">Workout Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:border-brand-500 focus:outline-none"
              placeholder="e.g., Morning Push Day"
            />
          </div>

          {templates.length > 0 && (
            <div>
              <label className="block text-gray-400 text-xs mb-1">From Template (optional)</label>
              <select
                value={templateId}
                onChange={(e) => setTemplateId(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:border-brand-500 focus:outline-none"
              >
                <option value="">Blank workout</option>
                {templates.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 px-4 py-2 bg-gray-800 text-gray-400 rounded-lg text-sm hover:bg-gray-700">Cancel</button>
          <button
            onClick={() => onStart({ name: name || "Workout", templateId: templateId || undefined })}
            className="flex-1 px-4 py-2 bg-brand-500 text-white rounded-lg text-sm font-medium hover:bg-brand-600"
          >
            Start
          </button>
        </div>
      </div>
    </div>
  );
}

function SessionView({ session, onBack, onRefresh }) {
  const [exercises, setExercises] = useState(session.exercises || []);
  const [exerciseList, setExerciseList] = useState([]);
  const [showAddEx, setShowAddEx] = useState(false);
  const [setForm, setSetForm] = useState({});

  useEffect(() => {
    api("/exercises?limit=100").then((d) => setExerciseList(Array.isArray(d) ? d : (d.data || []))).catch(() => {});
    if (session.id) {
      api(`/workout-sessions/${session.id}`).then((d) => {
        setExercises(d.exercises || []);
      }).catch(() => {});
    }
  }, [session.id]);

  const addExercise = async (exerciseId) => {
    try {
      await api(`/workout-sessions/${session.id}/exercises`, {
        method: "POST",
        body: { exerciseId },
      });
      const d = await api(`/workout-sessions/${session.id}`);
      setExercises(d.exercises || []);
      setShowAddEx(false);
    } catch {}
  };

  const logSet = async (sessionExerciseId) => {
    const f = setForm[sessionExerciseId] || {};
    try {
      await api(`/workout-sessions/${session.id}/exercises/${sessionExerciseId}/sets`, {
        method: "POST",
        body: {
          reps: parseInt(f.reps) || 0,
          weightKg: parseFloat(f.weight) || 0,
          setType: f.type || "working",
          rpe: parseInt(f.rpe) || undefined,
        },
      });
      const d = await api(`/workout-sessions/${session.id}`);
      setExercises(d.exercises || []);
      setSetForm((p) => ({ ...p, [sessionExerciseId]: {} }));
    } catch {}
  };

  const completeWorkout = async () => {
    try {
      await api(`/workout-sessions/${session.id}/complete`, { method: "PUT", body: {} });
      onRefresh();
      onBack();
    } catch {}
  };

  const updateSetField = (seId, field, value) => {
    setSetForm((p) => ({
      ...p,
      [seId]: { ...(p[seId] || {}), [field]: value },
    }));
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="text-gray-400 hover:text-white">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          </button>
          <h1 className="text-white text-lg font-bold">{session.name || "Workout"}</h1>
        </div>
        {!session.ended_at && (
          <button onClick={completeWorkout} className="px-4 py-1.5 bg-green-500 text-white rounded-lg text-sm font-medium hover:bg-green-600">
            Finish
          </button>
        )}
      </div>

      <div className="space-y-4">
        {exercises.map((ex) => (
          <div key={ex.id} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <h3 className="text-white font-semibold text-sm mb-2">{ex.exercise_name || ex.name || `Exercise #${ex.exercise_id}`}</h3>
            {(ex.sets || []).length > 0 && (
              <div className="mb-3">
                <div className="grid grid-cols-4 gap-2 text-gray-500 text-xs mb-1 px-1">
                  <span>Set</span><span>Reps</span><span>Weight</span><span>RPE</span>
                </div>
                {ex.sets.map((s, i) => (
                  <div key={s.id || i} className="grid grid-cols-4 gap-2 text-sm px-1 py-0.5">
                    <span className="text-gray-400">{i + 1}</span>
                    <span className="text-white">{s.reps}</span>
                    <span className="text-white">{s.weight_kg}kg</span>
                    <span className="text-gray-400">{s.rpe || "-"}</span>
                  </div>
                ))}
              </div>
            )}

            {!session.ended_at && (
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

      {!session.ended_at && (
        <>
          <button
            onClick={() => setShowAddEx(true)}
            className="w-full mt-4 px-4 py-2.5 border border-dashed border-gray-700 rounded-xl text-gray-400 text-sm hover:border-brand-500 hover:text-brand-500 transition"
          >
            + Add Exercise
          </button>

          {showAddEx && (
            <div className="mt-3 bg-gray-900 border border-gray-800 rounded-xl p-4 max-h-60 overflow-y-auto">
              {exerciseList.map((ex) => (
                <button
                  key={ex.id}
                  onClick={() => addExercise(ex.id)}
                  className="w-full text-left px-3 py-2 hover:bg-gray-800 rounded text-sm text-gray-300"
                >
                  {ex.name} <span className="text-gray-600 text-xs ml-1">{ex.muscle_group}</span>
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function WorkoutsPage() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [showNew, setShowNew] = useState(false);
  const [activeSession, setActiveSession] = useState(null);
  const [page, setPage] = useState(1);

  const load = () => {
    api(`/workout-sessions?page=${page}&limit=20`).then((d) => setSessions(d.data || [])).catch(() => {});
    api("/workout-templates?limit=50").then((d) => setTemplates(d.data || [])).catch(() => {});
  };

  useEffect(() => { load(); }, [page]);

  const startWorkout = async ({ name, templateId }) => {
    try {
      const data = await api("/workout-sessions", {
        method: "POST",
        body: { name, templateId },
      });
      setShowNew(false);
      setActiveSession(data);
    } catch {}
  };

  if (activeSession) {
    return <SessionView session={activeSession} onBack={() => { setActiveSession(null); load(); }} onRefresh={load} />;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-white text-xl font-bold">Workouts</h1>
        <button
          onClick={() => setShowNew(true)}
          className="px-4 py-2 bg-brand-500 text-white rounded-lg text-sm font-medium hover:bg-brand-600"
        >
          Start Workout
        </button>
      </div>

      {showNew && <StartWorkoutModal templates={templates} onStart={startWorkout} onClose={() => setShowNew(false)} />}

      <div className="space-y-2">
        {sessions.map((s) => (
          <button
            key={s.id}
            onClick={() => setActiveSession(s)}
            className="w-full text-left bg-gray-900 border border-gray-800 rounded-xl p-4 hover:border-gray-700 transition"
          >
            <div className="flex justify-between items-start">
              <div>
                <p className="text-white font-medium text-sm">{s.name || "Workout"}</p>
                <p className="text-gray-500 text-xs mt-0.5">
                  {new Date(s.started_at || s.created_at).toLocaleDateString()} &middot;{" "}
                  {s.ended_at ? "Completed" : "In progress"}
                </p>
              </div>
              {s.ended_at && (
                <span className="text-green-400/80 text-xs bg-green-400/10 px-2 py-0.5 rounded-full">Done</span>
              )}
            </div>
          </button>
        ))}
        {sessions.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-600 text-sm">No workouts yet. Start your first one!</p>
          </div>
        )}
      </div>
    </div>
  );
}
