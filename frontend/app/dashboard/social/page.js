"use client";
import { useEffect, useState } from "react";
import { api } from "../../../lib/api";

function CreateChallengeModal({ onSave, onClose }) {
  const [form, setForm] = useState({
    title: "", description: "", type: "workout_count", targetValue: "10",
    unit: "workouts", startDate: new Date().toISOString().split("T")[0],
    endDate: new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0],
  });

  const update = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const save = async () => {
    try {
      await api("/social/challenges", {
        method: "POST",
        body: {
          title: form.title,
          description: form.description || undefined,
          type: form.type,
          targetValue: parseFloat(form.targetValue),
          unit: form.unit,
          startDate: new Date(form.startDate).toISOString(),
          endDate: new Date(form.endDate).toISOString(),
        },
      });
      onSave();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-gray-900 border border-gray-700 rounded-xl w-full max-w-md p-5 max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-white font-bold mb-4">Create Challenge</h2>
        <div className="space-y-3">
          <div>
            <label className="block text-gray-400 text-xs mb-1">Title</label>
            <input value={form.title} onChange={update("title")} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:border-brand-500 focus:outline-none" />
          </div>
          <div>
            <label className="block text-gray-400 text-xs mb-1">Description</label>
            <textarea value={form.description} onChange={update("description")} rows={2} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm resize-none focus:border-brand-500 focus:outline-none" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-gray-400 text-xs mb-1">Type</label>
              <select value={form.type} onChange={update("type")} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:border-brand-500 focus:outline-none">
                <option value="workout_count">Workout Count</option>
                <option value="total_volume">Total Volume</option>
                <option value="workout_days">Workout Days</option>
                <option value="calories_burned">Calories Burned</option>
              </select>
            </div>
            <div>
              <label className="block text-gray-400 text-xs mb-1">Target</label>
              <input type="number" value={form.targetValue} onChange={update("targetValue")} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:border-brand-500 focus:outline-none" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-gray-400 text-xs mb-1">Start Date</label>
              <input type="date" value={form.startDate} onChange={update("startDate")} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:border-brand-500 focus:outline-none" />
            </div>
            <div>
              <label className="block text-gray-400 text-xs mb-1">End Date</label>
              <input type="date" value={form.endDate} onChange={update("endDate")} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:border-brand-500 focus:outline-none" />
            </div>
          </div>
        </div>
        <div className="flex gap-2 mt-4">
          <button onClick={onClose} className="flex-1 px-4 py-2 bg-gray-800 text-gray-400 rounded-lg text-sm">Cancel</button>
          <button onClick={save} className="flex-1 px-4 py-2 bg-brand-500 text-white rounded-lg text-sm font-medium hover:bg-brand-600">Create</button>
        </div>
      </div>
    </div>
  );
}

function ChallengeCard({ challenge, onJoin, onLeave, onView }) {
  const progress = challenge.my_participation_id
    ? Math.min(100, Math.round(((challenge.current_value || 0) / challenge.target_value) * 100))
    : null;

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
      <div className="flex items-start justify-between mb-2">
        <div>
          <h3 className="text-white font-semibold text-sm">{challenge.title}</h3>
          <p className="text-gray-500 text-xs mt-0.5">by {challenge.creator_name}</p>
        </div>
        <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
          challenge.status === "active" ? "bg-green-500/20 text-green-400" : "bg-gray-700 text-gray-400"
        }`}>
          {challenge.status}
        </span>
      </div>
      {challenge.description && <p className="text-gray-400 text-xs mb-3">{challenge.description}</p>}
      <div className="flex items-center gap-3 text-xs text-gray-500 mb-3">
        <span>{challenge.participant_count} participants</span>
        <span>Target: {challenge.target_value} {challenge.unit}</span>
      </div>
      {progress !== null && (
        <div className="mb-3">
          <div className="w-full bg-gray-800 rounded-full h-2">
            <div className="bg-brand-500 h-2 rounded-full transition-all" style={{ width: `${progress}%` }} />
          </div>
          <p className="text-gray-500 text-[10px] mt-1">{progress}% complete</p>
        </div>
      )}
      <div className="flex gap-2">
        <button onClick={() => onView(challenge.id)} className="flex-1 px-3 py-1.5 bg-gray-800 text-gray-300 rounded-lg text-xs hover:bg-gray-700">View</button>
        {challenge.my_participation_id ? (
          <button onClick={() => onLeave(challenge.id)} className="px-3 py-1.5 bg-red-500/20 text-red-400 rounded-lg text-xs hover:bg-red-500/30">Leave</button>
        ) : (
          <button onClick={() => onJoin(challenge.id)} className="px-3 py-1.5 bg-brand-500 text-white rounded-lg text-xs hover:bg-brand-600">Join</button>
        )}
      </div>
    </div>
  );
}

export default function SocialPage() {
  const [tab, setTab] = useState("challenges");
  const [challenges, setChallenges] = useState([]);
  const [leaderboard, setLeaderboard] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [selectedChallenge, setSelectedChallenge] = useState(null);
  const [lbPeriod, setLbPeriod] = useState("week");
  const [lbMetric, setLbMetric] = useState("workouts");
  const [filter, setFilter] = useState("all");

  const loadChallenges = () => {
    const params = filter === "joined" ? "?joined=true" : "?status=active";
    api(`/social/challenges${params}`).then((d) => setChallenges(d.data || [])).catch(() => {});
  };

  const loadLeaderboard = () => {
    api(`/social/leaderboard?period=${lbPeriod}&metric=${lbMetric}`).then(setLeaderboard).catch(() => {});
  };

  const loadChallengeDetail = (id) => {
    api(`/social/challenges/${id}`).then(setSelectedChallenge).catch(() => {});
  };

  useEffect(() => { loadChallenges(); }, [filter]);
  useEffect(() => { if (tab === "leaderboard") loadLeaderboard(); }, [tab, lbPeriod, lbMetric]);

  const joinChallenge = async (id) => {
    try { await api(`/social/challenges/${id}/join`, { method: "POST" }); loadChallenges(); } catch {}
  };
  const leaveChallenge = async (id) => {
    try { await api(`/social/challenges/${id}/leave`, { method: "DELETE" }); loadChallenges(); setSelectedChallenge(null); } catch {}
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-white">Social</h1>
        <button onClick={() => setShowCreate(true)} className="px-4 py-2 bg-brand-500 text-white rounded-lg text-sm font-medium hover:bg-brand-600">
          New Challenge
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-900 rounded-lg p-1 mb-6">
        {["challenges", "leaderboard"].map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === t ? "bg-brand-500 text-white" : "text-gray-400 hover:text-white"}`}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {tab === "challenges" && (
        <>
          <div className="flex gap-2 mb-4">
            {["all", "joined"].map((f) => (
              <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1 rounded-full text-xs font-medium ${filter === f ? "bg-brand-500/20 text-brand-400" : "bg-gray-800 text-gray-400"}`}>
                {f === "all" ? "All Active" : "My Challenges"}
              </button>
            ))}
          </div>
          {challenges.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p className="text-lg mb-1">No challenges yet</p>
              <p className="text-sm">Create one to get started!</p>
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {challenges.map((c) => (
                <ChallengeCard key={c.id} challenge={c} onJoin={joinChallenge} onLeave={leaveChallenge} onView={loadChallengeDetail} />
              ))}
            </div>
          )}
        </>
      )}

      {tab === "leaderboard" && (
        <>
          <div className="flex gap-2 mb-4 flex-wrap">
            <select value={lbPeriod} onChange={(e) => setLbPeriod(e.target.value)} className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-white text-xs focus:border-brand-500 focus:outline-none">
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="year">This Year</option>
            </select>
            <select value={lbMetric} onChange={(e) => setLbMetric(e.target.value)} className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-white text-xs focus:border-brand-500 focus:outline-none">
              <option value="workouts">Workouts</option>
              <option value="volume">Volume (kg)</option>
              <option value="streak">Workout Days</option>
            </select>
          </div>
          {leaderboard?.leaderboard?.length > 0 ? (
            <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
              {leaderboard.leaderboard.map((entry) => (
                <div key={entry.user_id} className="flex items-center gap-3 px-4 py-3 border-b border-gray-800 last:border-0">
                  <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    entry.rank === 1 ? "bg-yellow-500/20 text-yellow-400" :
                    entry.rank === 2 ? "bg-gray-400/20 text-gray-300" :
                    entry.rank === 3 ? "bg-orange-500/20 text-orange-400" :
                    "bg-gray-800 text-gray-500"
                  }`}>
                    {entry.rank}
                  </span>
                  <span className="flex-1 text-white text-sm">{entry.name}</span>
                  <span className="text-brand-400 font-semibold text-sm">
                    {lbMetric === "volume" ? `${Math.round(entry.score).toLocaleString()} kg` : entry.score}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <p className="text-sm">No activity this period</p>
            </div>
          )}
        </>
      )}

      {/* Challenge Detail Modal */}
      {selectedChallenge && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setSelectedChallenge(null)}>
          <div className="bg-gray-900 border border-gray-700 rounded-xl w-full max-w-lg p-5 max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-white font-bold text-lg mb-1">{selectedChallenge.title}</h2>
            <p className="text-gray-500 text-xs mb-3">by {selectedChallenge.creator_name}</p>
            {selectedChallenge.description && <p className="text-gray-400 text-sm mb-4">{selectedChallenge.description}</p>}
            <div className="text-xs text-gray-500 mb-4">
              Target: {selectedChallenge.target_value} {selectedChallenge.unit} &middot;{" "}
              {new Date(selectedChallenge.start_date).toLocaleDateString()} - {new Date(selectedChallenge.end_date).toLocaleDateString()}
            </div>
            <h3 className="text-white font-semibold text-sm mb-2">Leaderboard</h3>
            <div className="space-y-1">
              {(selectedChallenge.participants || []).map((p, i) => (
                <div key={p.user_id} className="flex items-center gap-3 bg-gray-800 rounded-lg px-3 py-2">
                  <span className="text-gray-500 text-xs font-bold w-5">{i + 1}</span>
                  <span className="flex-1 text-white text-sm">{p.name}</span>
                  <span className="text-brand-400 text-sm font-medium">{p.current_value || 0}</span>
                  {p.completed_at && <span className="text-green-400 text-[10px]">Completed</span>}
                </div>
              ))}
            </div>
            <button onClick={() => setSelectedChallenge(null)} className="w-full mt-4 px-4 py-2 bg-gray-800 text-gray-400 rounded-lg text-sm">Close</button>
          </div>
        </div>
      )}

      {showCreate && <CreateChallengeModal onSave={() => { setShowCreate(false); loadChallenges(); }} onClose={() => setShowCreate(false)} />}
    </div>
  );
}
