"use client";
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "../../components/AuthProvider";
import { api } from "../../lib/api";

/* ─── Icon Components ─── */
function Icon({ d, className = "w-5 h-5", strokeWidth = 1.5 }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={strokeWidth}>
      <path strokeLinecap="round" strokeLinejoin="round" d={d} />
    </svg>
  );
}

const ICONS = {
  dumbbell: "M6.5 6.5h11M4 10h1.5m13 0H20M5.5 6.5v7m13-7v7M4 13.5h1.5m13 0H20M7 10a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zm13 0a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z",
  fire: "M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z",
  utensils: "M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z",
  scale: "M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3",
  bolt: "M13 10V3L4 14h7v7l9-11h-7z",
  calendar: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z",
  chart: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z",
  bell: "M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9",
  clock: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z",
  clipboard: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2",
  user: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z",
  logout: "M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1",
  play: "M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
  plus: "M12 4v16m8-8H4",
  target: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z",
  heart: "M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z",
  star: "M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z",
  sparkles: "M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z",
  check: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",
  arrow: "M13 7l5 5m0 0l-5 5m5-5H6",
};

const INSIGHT_STYLES = {
  trend: { color: "text-blue-400", bg: "bg-blue-500/20", border: "border-blue-500/20" },
  habit: { color: "text-green-400", bg: "bg-green-500/20", border: "border-green-500/20" },
  tip: { color: "text-yellow-400", bg: "bg-yellow-500/20", border: "border-yellow-500/20" },
  milestone: { color: "text-brand-500", bg: "bg-brand-500/20", border: "border-brand-500/20" },
  warning: { color: "text-red-400", bg: "bg-red-500/20", border: "border-red-500/20" },
  recommendation: { color: "text-purple-400", bg: "bg-purple-500/20", border: "border-purple-500/20" },
};

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

/* ─── Stat Card ─── */
function StatCard({ icon, label, value, sub, gradient, href }) {
  const inner = (
    <div className={`relative overflow-hidden rounded-2xl p-4 ${gradient} border border-white/5`}>
      <div className="flex items-center justify-between mb-2">
        <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
          <Icon d={icon} className="w-4 h-4 text-white/80" />
        </div>
        {href && <Icon d={ICONS.arrow} className="w-4 h-4 text-white/30" />}
      </div>
      <p className="text-2xl font-bold text-white">{value}</p>
      <p className="text-white/50 text-xs mt-0.5">{label}</p>
      {sub && <p className="text-white/30 text-[10px] mt-0.5">{sub}</p>}
    </div>
  );
  return href ? <Link href={href}>{inner}</Link> : inner;
}

/* ─── Quick Action Button ─── */
function QuickAction({ href, icon, label, color }) {
  return (
    <Link href={href} className="flex flex-col items-center gap-2 group">
      <div className={`w-14 h-14 rounded-2xl ${color} flex items-center justify-center group-hover:scale-105 transition-transform shadow-lg`}>
        <Icon d={icon} className="w-6 h-6 text-white" strokeWidth={2} />
      </div>
      <span className="text-gray-400 text-[11px] font-medium text-center leading-tight group-hover:text-white transition-colors">{label}</span>
    </Link>
  );
}

/* ─── AI Insights Widget ─── */
function InsightsWidget() {
  const [insights, setInsights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    api("/insights?limit=3")
      .then((d) => setInsights(d.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  // Auto-generate if no insights exist
  useEffect(() => {
    if (!loading && insights.length === 0 && !generating) {
      setGenerating(true);
      api("/insights/generate", { method: "POST" })
        .then((newInsights) => {
          if (Array.isArray(newInsights)) {
            setInsights(newInsights.slice(0, 3));
          }
        })
        .catch(() => {})
        .finally(() => setGenerating(false));
    }
  }, [loading, insights.length, generating]);

  if (loading || generating) {
    return (
      <div className="bg-gradient-to-br from-gray-900 to-gray-900/50 border border-gray-800 rounded-2xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-lg bg-brand-500/20 flex items-center justify-center">
            <Icon d={ICONS.sparkles} className="w-4 h-4 text-brand-400" />
          </div>
          <h2 className="text-white font-semibold text-sm">AI Insights</h2>
        </div>
        <div className="flex items-center justify-center py-6 gap-2">
          <div className="w-5 h-5 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-gray-500 text-sm">{generating ? "Generating insights..." : "Loading..."}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-gray-900 to-gray-900/50 border border-gray-800 rounded-2xl p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-brand-500/20 flex items-center justify-center">
            <Icon d={ICONS.sparkles} className="w-4 h-4 text-brand-400" />
          </div>
          <h2 className="text-white font-semibold text-sm">AI Insights</h2>
        </div>
        <Link href="/dashboard/insights" className="text-brand-500 text-xs font-medium hover:text-brand-400 transition flex items-center gap-1">
          View all <Icon d={ICONS.arrow} className="w-3 h-3" />
        </Link>
      </div>
      {insights.length === 0 ? (
        <p className="text-gray-600 text-sm py-4 text-center">Log some workouts and meals to get personalized AI insights</p>
      ) : (
        <div className="space-y-2">
          {insights.map((insight) => {
            const style = INSIGHT_STYLES[insight.type] || INSIGHT_STYLES.tip;
            return (
              <div key={insight.id} className={`flex items-start gap-3 p-3 rounded-xl bg-gray-800/50 border ${style.border}`}>
                <div className={`${style.bg} p-1.5 rounded-lg shrink-0 mt-0.5`}>
                  <Icon d={ICONS.sparkles} className={`w-3.5 h-3.5 ${style.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-xs font-medium leading-snug">{insight.title}</p>
                  <p className="text-gray-500 text-[11px] mt-0.5 line-clamp-2">{insight.body}</p>
                </div>
                {!insight.is_read && <div className="w-1.5 h-1.5 rounded-full bg-brand-500 shrink-0 mt-1.5" />}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ─── Feature Section Card ─── */
function FeatureCard({ href, icon, iconBg, label, description, badge }) {
  return (
    <Link href={href} className="flex items-center gap-3 bg-gray-900 border border-gray-800 rounded-xl p-3.5 hover:border-gray-700 hover:bg-gray-800/50 transition group">
      <div className={`w-10 h-10 rounded-xl ${iconBg} flex items-center justify-center shrink-0`}>
        <Icon d={icon} className="w-5 h-5 text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-white text-sm font-medium">{label}</p>
        <p className="text-gray-500 text-xs mt-0.5">{description}</p>
      </div>
      <div className="flex items-center gap-2">
        {badge && (
          <span className="bg-brand-500/20 text-brand-500 text-[10px] font-bold px-2 py-0.5 rounded-full">{badge}</span>
        )}
        <Icon d={ICONS.arrow} className="w-4 h-4 text-gray-600 group-hover:text-gray-400 transition" />
      </div>
    </Link>
  );
}

/* ═══ Client Dashboard ═══ */
function ClientDashboard() {
  const { user, logout } = useAuth();
  const [stats, setStats] = useState({ sessions: [], meals: 0, templates: 0 });
  const [measurements, setMeasurements] = useState(null);
  const [trainerRequests, setTrainerRequests] = useState([]);
  const [notifCount, setNotifCount] = useState(0);

  const loadRequests = () => {
    api("/users/client-requests").then((d) => setTrainerRequests(Array.isArray(d) ? d : [])).catch(() => {});
  };

  useEffect(() => {
    const todayStr = new Date().toISOString().split("T")[0];
    Promise.all([
      api("/workout-sessions?limit=5").catch(() => ({ data: [] })),
      api(`/nutrition/meals?date=${todayStr}`).catch(() => ({ data: [] })),
      api("/progress/measurements/latest").catch(() => null),
      api("/workout-templates?limit=1&ownOnly=true").catch(() => ({ pagination: { total: 0 } })),
      api("/notifications?unread=true&limit=1").catch(() => ({ pagination: { total: 0 } })),
    ]).then(([sessions, meals, meas, templates, notifs]) => {
      setStats({
        sessions: sessions.data || [],
        meals: (meals.data || meals.meals || []).length,
        templates: templates.pagination?.total || 0,
      });
      setMeasurements(meas);
      setNotifCount(notifs.pagination?.total || 0);
    });
    loadRequests();
  }, []);

  const respondToRequest = async (id, action) => {
    try {
      await api(`/users/trainer-requests/${id}/respond`, { method: "PUT", body: { action } });
      loadRequests();
    } catch {}
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* ─ Header ─ */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-white text-xl font-bold">{getGreeting()}, {user?.first_name || "there"}</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
          </p>
        </div>
        <button onClick={logout}
          className="w-9 h-9 rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center hover:bg-gray-700 hover:border-red-500/50 transition group">
          <Icon d={ICONS.logout} className="w-4 h-4 text-gray-500 group-hover:text-red-400 transition" />
        </button>
      </div>

      {/* ─ Trainer Card ─ */}
      {user?.trainer_id && user?.trainer_name && (
        <div className="bg-gradient-to-r from-brand-500/10 to-purple-500/10 border border-brand-500/20 rounded-2xl p-4 mb-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-brand-500/20 rounded-full flex items-center justify-center">
                <Icon d={ICONS.user} className="w-5 h-5 text-brand-400" />
              </div>
              <div>
                <p className="text-gray-500 text-[10px] uppercase tracking-wider font-semibold">Your Trainer</p>
                <p className="text-white text-sm font-medium">{user.trainer_name}</p>
              </div>
            </div>
            <Link href="/dashboard/schedule"
              className="flex items-center gap-1.5 px-3 py-2 bg-brand-500 text-white rounded-lg text-xs font-medium hover:bg-brand-600 transition">
              <Icon d={ICONS.calendar} className="w-3.5 h-3.5" strokeWidth={2} />
              Book
            </Link>
          </div>
        </div>
      )}

      {/* Trainer Requests */}
      {trainerRequests.length > 0 && (
        <div className="mb-5 space-y-2">
          {trainerRequests.map((req) => (
            <div key={req.id} className="bg-gray-900 border border-brand-500/30 rounded-2xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white text-sm font-medium">Trainer Request</p>
                  <p className="text-gray-400 text-xs mt-0.5">
                    <span className="text-brand-400">{req.trainer_name}</span> wants to add you as a client
                  </p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => respondToRequest(req.id, "approve")}
                    className="px-3 py-1.5 bg-green-500 text-white rounded-lg text-xs font-medium hover:bg-green-600">
                    Accept
                  </button>
                  <button onClick={() => respondToRequest(req.id, "decline")}
                    className="px-3 py-1.5 bg-gray-700 text-gray-300 rounded-lg text-xs font-medium hover:bg-gray-600">
                    Decline
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* No trainer */}
      {!user?.trainer_id && trainerRequests.length === 0 && (
        <div className="bg-gray-900/50 border border-dashed border-gray-700 rounded-2xl p-4 mb-5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gray-800 flex items-center justify-center shrink-0">
            <Icon d={ICONS.user} className="w-5 h-5 text-gray-600" />
          </div>
          <p className="text-gray-500 text-sm">No trainer assigned yet. Ask your trainer to send an invitation.</p>
        </div>
      )}

      {/* ─ Stats Grid ─ */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        <StatCard
          icon={ICONS.dumbbell}
          label="Workouts"
          value={stats.sessions.length}
          sub="recent sessions"
          gradient="bg-gradient-to-br from-orange-500/20 to-orange-900/20"
          href="/dashboard/workouts"
        />
        <StatCard
          icon={ICONS.utensils}
          label="Meals Today"
          value={stats.meals}
          sub="logged today"
          gradient="bg-gradient-to-br from-green-500/20 to-green-900/20"
          href="/dashboard/nutrition"
        />
        <StatCard
          icon={ICONS.scale}
          label="Weight"
          value={measurements?.weight_kg ? `${measurements.weight_kg}kg` : "--"}
          sub={measurements?.weight_kg ? "current" : "not tracked"}
          gradient="bg-gradient-to-br from-blue-500/20 to-blue-900/20"
          href="/dashboard/progress"
        />
        <StatCard
          icon={ICONS.clipboard}
          label="Templates"
          value={stats.templates}
          sub="my workouts"
          gradient="bg-gradient-to-br from-purple-500/20 to-purple-900/20"
          href="/dashboard/templates"
        />
      </div>

      {/* ─ Quick Actions ─ */}
      <div className="mb-5">
        <h2 className="text-white font-semibold text-sm mb-3 px-1">Quick Actions</h2>
        <div className="grid grid-cols-4 gap-4">
          <QuickAction href="/dashboard/workouts" icon={ICONS.play} label="Start Workout" color="bg-gradient-to-br from-brand-500 to-brand-600" />
          <QuickAction href="/dashboard/nutrition" icon={ICONS.utensils} label="Log Meal" color="bg-gradient-to-br from-green-500 to-green-600" />
          <QuickAction href="/dashboard/progress" icon={ICONS.chart} label="Progress" color="bg-gradient-to-br from-blue-500 to-blue-600" />
          <QuickAction href="/dashboard/templates" icon={ICONS.clipboard} label="Templates" color="bg-gradient-to-br from-purple-500 to-purple-600" />
        </div>
      </div>

      {/* ─ AI Insights ─ */}
      <div className="mb-5">
        <InsightsWidget />
      </div>

      {/* ─ Feature Sections ─ */}
      <div className="mb-5">
        <h2 className="text-white font-semibold text-sm mb-3 px-1">Explore</h2>
        <div className="space-y-2">
          <FeatureCard
            href="/dashboard/nutrition"
            icon={ICONS.utensils}
            iconBg="bg-green-500/20"
            label="Nutrition"
            description="Track meals, macros & targets"
          />
          <FeatureCard
            href="/dashboard/calendar"
            icon={ICONS.calendar}
            iconBg="bg-blue-500/20"
            label="Calendar"
            description="View your workout schedule"
          />
          <FeatureCard
            href="/dashboard/progress"
            icon={ICONS.chart}
            iconBg="bg-cyan-500/20"
            label="Progress"
            description="Measurements, PRs & analytics"
          />
          <FeatureCard
            href="/dashboard/insights"
            icon={ICONS.sparkles}
            iconBg="bg-brand-500/20"
            label="AI Insights"
            description="Personalized fitness analysis"
          />
          <FeatureCard
            href="/dashboard/notifications"
            icon={ICONS.bell}
            iconBg="bg-yellow-500/20"
            label="Notifications"
            description="Alerts & updates"
            badge={notifCount > 0 ? `${notifCount}` : undefined}
          />
          <FeatureCard
            href="/dashboard/schedule"
            icon={ICONS.clock}
            iconBg="bg-pink-500/20"
            label="Schedule"
            description="Sessions & appointments"
          />
        </div>
      </div>

      {/* ─ Recent Activity ─ */}
      {stats.sessions.length > 0 && (
        <div className="mb-5">
          <div className="flex items-center justify-between mb-3 px-1">
            <h2 className="text-white font-semibold text-sm">Recent Workouts</h2>
            <Link href="/dashboard/workouts" className="text-brand-500 text-xs font-medium hover:text-brand-400 transition flex items-center gap-1">
              See all <Icon d={ICONS.arrow} className="w-3 h-3" />
            </Link>
          </div>
          <div className="space-y-2">
            {stats.sessions.map((s) => (
              <Link key={s.id} href={`/dashboard/workouts?session=${s.id}`}
                className="flex items-center gap-3 bg-gray-900 border border-gray-800 rounded-xl p-3 hover:border-gray-700 transition">
                <div className="w-9 h-9 rounded-lg bg-brand-500/10 flex items-center justify-center shrink-0">
                  <Icon d={ICONS.dumbbell} className="w-4 h-4 text-brand-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium truncate">{s.name || "Workout"}</p>
                  <p className="text-gray-500 text-xs">{new Date(s.started_at || s.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full ${s.ended_at ? "bg-green-500/10 text-green-400" : "bg-yellow-500/10 text-yellow-400"}`}>
                  {s.ended_at ? "Done" : "Active"}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══ Trainer Dashboard ═══ */
function TrainerDashboard() {
  const { user, logout } = useAuth();
  const [stats, setStats] = useState({});
  const [recentSessions, setRecentSessions] = useState([]);

  useEffect(() => {
    Promise.all([
      api("/workout-sessions?limit=5").catch(() => ({ data: [] })),
      api("/workout-templates?limit=1&ownOnly=true").catch(() => ({ pagination: { total: 0 } })),
      api("/scheduling/sessions?limit=5").catch(() => ({ data: [] })),
    ]).then(([sessions, templates, scheduled]) => {
      setRecentSessions(sessions.data || []);
      setStats({
        templates: templates.pagination?.total || 0,
        scheduled: (scheduled.data || []).length,
      });
    });
  }, []);

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-white text-xl font-bold">{getGreeting()}, {user?.first_name || "Trainer"}</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
          </p>
        </div>
        <button onClick={logout}
          className="w-9 h-9 rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center hover:bg-gray-700 hover:border-red-500/50 transition group">
          <Icon d={ICONS.logout} className="w-4 h-4 text-gray-500 group-hover:text-red-400 transition" />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-5">
        <StatCard
          icon={ICONS.clipboard}
          label="Templates"
          value={stats.templates || 0}
          gradient="bg-gradient-to-br from-blue-500/20 to-blue-900/20"
          href="/dashboard/templates"
        />
        <StatCard
          icon={ICONS.calendar}
          label="Upcoming"
          value={stats.scheduled || 0}
          sub="sessions"
          gradient="bg-gradient-to-br from-green-500/20 to-green-900/20"
          href="/dashboard/schedule"
        />
      </div>

      <div className="mb-5">
        <h2 className="text-white font-semibold text-sm mb-3 px-1">Quick Actions</h2>
        <div className="grid grid-cols-4 gap-4">
          <QuickAction href="/dashboard/templates" icon={ICONS.plus} label="Create Template" color="bg-gradient-to-br from-brand-500 to-brand-600" />
          <QuickAction href="/dashboard/clients" icon={ICONS.user} label="Clients" color="bg-gradient-to-br from-blue-500 to-blue-600" />
          <QuickAction href="/dashboard/schedule" icon={ICONS.clock} label="Schedule" color="bg-gradient-to-br from-green-500 to-green-600" />
          <QuickAction href="/dashboard/calendar" icon={ICONS.calendar} label="Calendar" color="bg-gradient-to-br from-purple-500 to-purple-600" />
        </div>
      </div>

      <div className="mb-5">
        <InsightsWidget />
      </div>

      <div className="mb-5">
        <h2 className="text-white font-semibold text-sm mb-3 px-1">Explore</h2>
        <div className="space-y-2">
          <FeatureCard href="/dashboard/clients" icon={ICONS.user} iconBg="bg-blue-500/20" label="Clients" description="Manage your clients" />
          <FeatureCard href="/dashboard/calendar" icon={ICONS.calendar} iconBg="bg-green-500/20" label="Calendar" description="View scheduled sessions" />
          <FeatureCard href="/dashboard/schedule" icon={ICONS.clock} iconBg="bg-purple-500/20" label="Schedule" description="Upcoming appointments" />
          <FeatureCard href="/dashboard/notifications" icon={ICONS.bell} iconBg="bg-yellow-500/20" label="Notifications" description="Alerts & updates" />
        </div>
      </div>

      {recentSessions.length > 0 && (
        <div className="mb-5">
          <h2 className="text-white font-semibold text-sm mb-3 px-1">Recent Sessions</h2>
          <div className="space-y-2">
            {recentSessions.map((s) => (
              <div key={s.id} className="flex items-center gap-3 bg-gray-900 border border-gray-800 rounded-xl p-3">
                <div className="w-9 h-9 rounded-lg bg-brand-500/10 flex items-center justify-center shrink-0">
                  <Icon d={ICONS.dumbbell} className="w-4 h-4 text-brand-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium truncate">{s.name || "Workout"}</p>
                  <p className="text-gray-500 text-xs">{new Date(s.started_at || s.created_at).toLocaleDateString()}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const isTrainer = user?.role === "trainer" || user?.role === "admin";
  return isTrainer ? <TrainerDashboard /> : <ClientDashboard />;
}
